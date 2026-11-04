import { createHash } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";

// Dublê do repositório: nenhum teste toca o banco real.
const repo = vi.hoisted(() => ({
    findByEmail: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    updatePasswordHash: vi.fn(),
    deleteById: vi.fn(),
}));
vi.mock("../repositories/user-repository.js", () => ({ userRepository: repo }));

import { hashPassword, safeCompare, verifyPassword } from "../lib/password.js";
import { AGENT_KEY, buildTestApp, sessionCookie } from "./helpers.js";

const GESTOR_ID = "11111111-1111-4111-8111-111111111111";
const TECNICO_ID = "22222222-2222-4222-8222-222222222222";
const PASSWORD = "Vanguard@2026";

let app: FastifyInstance;
let gestorRecord: Record<string, unknown>;

beforeAll(async () => {
    app = buildTestApp();
    await app.ready();
    gestorRecord = {
        id: GESTOR_ID,
        name: "Gestora Teste",
        email: "gestor@vanguard.local",
        role: "GESTOR",
        password_hash: await hashPassword(PASSWORD),
    };
});

afterAll(async () => {
    await app.close();
});

beforeEach(() => {
    vi.clearAllMocks();
});

function getSetCookie(headers: Record<string, unknown>): string {
    const raw = headers["set-cookie"];
    return Array.isArray(raw) ? raw.join("; ") : String(raw ?? "");
}

// ---------------------------------------------------------------------------
describe("Criptografia: hash de senhas (scrypt)", () => {
    it("gera hash irreversível no formato scrypt$N$r$p$salt$hash, sem conter a senha", async () => {
        const hash = await hashPassword(PASSWORD);
        expect(hash).toMatch(/^scrypt\$32768\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
        expect(hash).not.toContain(PASSWORD);
    });

    it("usa sal aleatório: a mesma senha gera hashes diferentes", async () => {
        const [a, b] = await Promise.all([hashPassword(PASSWORD), hashPassword(PASSWORD)]);
        expect(a).not.toBe(b);
    });

    it("verifica a senha correta e rejeita a incorreta", async () => {
        const hash = await hashPassword(PASSWORD);
        expect((await verifyPassword(PASSWORD, hash)).valid).toBe(true);
        expect((await verifyPassword("senha-errada-123", hash)).valid).toBe(false);
        expect((await verifyPassword(PASSWORD, null)).valid).toBe(false);
        expect((await verifyPassword(PASSWORD, "scrypt$corrompido")).valid).toBe(false);
    });

    it("aceita hash legado SHA-256 e sinaliza necessidade de migração (rehash)", async () => {
        const legacy = createHash("sha256").update(PASSWORD).digest("hex");
        expect(await verifyPassword(PASSWORD, legacy)).toEqual({ valid: true, needsRehash: true });
        expect((await verifyPassword("outra", legacy)).valid).toBe(false);
    });

    it("safeCompare compara segredos de tamanhos diferentes sem lançar exceção", () => {
        expect(safeCompare("abc", "abc")).toBe(true);
        expect(safeCompare("abc", "abcd")).toBe(false);
        expect(safeCompare("", "abc")).toBe(false);
    });
});

// ---------------------------------------------------------------------------
describe("POST /auth/login", () => {
    it("autentica com sucesso e entrega o JWT em cookie HttpOnly + SameSite", async () => {
        repo.findByEmail.mockResolvedValue(gestorRecord);

        const res = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: { email: "GESTOR@vanguard.local", password: PASSWORD },
        });

        expect(res.statusCode).toBe(200);
        expect(repo.findByEmail).toHaveBeenCalledWith("gestor@vanguard.local");

        const cookie = getSetCookie(res.headers);
        expect(cookie).toContain("vanguard_session=");
        expect(cookie).toMatch(/HttpOnly/i);
        expect(cookie).toMatch(/SameSite=Lax/i);
        expect(cookie).toMatch(/Path=\//);
        expect(res.headers["cache-control"]).toBe("no-store");

        const body = res.json();
        expect(body.data.user).toEqual({
            id: GESTOR_ID,
            name: "Gestora Teste",
            email: "gestor@vanguard.local",
            role: "GESTOR",
        });
        // O token não é exposto ao JavaScript do frontend.
        expect(res.body).not.toContain("password_hash");
        expect(body.token).toBeUndefined();
    });

    it("bloqueia senha incorreta com 401 genérico e sem cookie", async () => {
        repo.findByEmail.mockResolvedValue(gestorRecord);

        const res = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: { email: "gestor@vanguard.local", password: "SenhaErrada123" },
        });

        expect(res.statusCode).toBe(401);
        expect(res.json()).toMatchObject({ success: false, error: "UNAUTHORIZED", message: "E-mail ou senha inválidos." });
        expect(res.headers["set-cookie"]).toBeUndefined();
    });

    it("bloqueia e-mail inexistente com a MESMA mensagem (anti user-enumeration)", async () => {
        repo.findByEmail.mockResolvedValue(undefined);

        const res = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: { email: "naoexiste@vanguard.local", password: PASSWORD },
        });

        expect(res.statusCode).toBe(401);
        expect(res.json().message).toBe("E-mail ou senha inválidos.");
    });

    it("rejeita payload inválido (Zod) com 400", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: { email: "nao-e-email", password: "" },
        });

        expect(res.statusCode).toBe(400);
        expect(res.json().error).toBe("VALIDATION_ERROR");
        expect(repo.findByEmail).not.toHaveBeenCalled();
    });

    it("migra hash legado SHA-256 para scrypt após login bem-sucedido", async () => {
        repo.findByEmail.mockResolvedValue({
            ...gestorRecord,
            password_hash: createHash("sha256").update(PASSWORD).digest("hex"),
        });

        const res = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: { email: "gestor@vanguard.local", password: PASSWORD },
        });

        expect(res.statusCode).toBe(200);
        expect(repo.updatePasswordHash).toHaveBeenCalledWith(GESTOR_ID, expect.stringMatching(/^scrypt\$/));
    });

    it("aplica rate limit contra força bruta (HTTP 429)", async () => {
        const limited = buildTestApp({ LOGIN_RATE_LIMIT_MAX: "2" });
        await limited.ready();
        repo.findByEmail.mockResolvedValue(undefined);

        const attempt = () => limited.inject({
            method: "POST",
            url: "/auth/login",
            payload: { email: "x@vanguard.local", password: "qualquer1" },
        });

        expect((await attempt()).statusCode).toBe(401);
        expect((await attempt()).statusCode).toBe(401);
        const blocked = await attempt();
        expect(blocked.statusCode).toBe(429);
        expect(blocked.json().error).toBe("TOO_MANY_REQUESTS");
        await limited.close();
    });
});

// ---------------------------------------------------------------------------
describe("Sessão: GET /auth/me e POST /auth/logout", () => {
    it("bloqueia acesso sem token (401)", async () => {
        const res = await app.inject({ method: "GET", url: "/auth/me" });
        expect(res.statusCode).toBe(401);
        expect(res.json().error).toBe("UNAUTHORIZED");
    });

    it("retorna o usuário da sessão com cookie válido", async () => {
        repo.findById.mockResolvedValue(gestorRecord);

        const res = await app.inject({
            method: "GET",
            url: "/auth/me",
            cookies: sessionCookie(app, GESTOR_ID, "GESTOR"),
        });

        expect(res.statusCode).toBe(200);
        expect(res.json().data.user.role).toBe("GESTOR");
        expect(res.body).not.toContain("password_hash");
    });

    it("rejeita token adulterado (assinatura inválida)", async () => {
        const token = app.jwt.sign({ sub: TECNICO_ID, role: "TECNICO" });
        const [header, , signature] = token.split(".");
        const forgedPayload = Buffer.from(JSON.stringify({ sub: TECNICO_ID, role: "GESTOR" })).toString("base64url");

        const res = await app.inject({
            method: "GET",
            url: "/auth/me",
            cookies: { vanguard_session: `${header}.${forgedPayload}.${signature}` },
        });

        expect(res.statusCode).toBe(401);
    });

    it("rejeita token assinado com outro segredo", async () => {
        const other = buildTestApp({ JWT_SECRET: "outro-segredo-totalmente-diferente-com-32+chars" });
        await other.ready();
        const foreign = other.jwt.sign({ sub: GESTOR_ID, role: "GESTOR" });
        await other.close();

        const res = await app.inject({ method: "GET", url: "/auth/me", cookies: { vanguard_session: foreign } });
        expect(res.statusCode).toBe(401);
    });

    it("rejeita token expirado", async () => {
        const expired = app.jwt.sign({ sub: GESTOR_ID, role: "GESTOR" }, { expiresIn: "1ms" });
        await new Promise((r) => setTimeout(r, 20));

        const res = await app.inject({ method: "GET", url: "/auth/me", cookies: { vanguard_session: expired } });
        expect(res.statusCode).toBe(401);
    });

    it("ignora token enviado via header Authorization (somente cookie HttpOnly)", async () => {
        const token = app.jwt.sign({ sub: GESTOR_ID, role: "GESTOR" });
        const res = await app.inject({
            method: "GET",
            url: "/auth/me",
            headers: { authorization: `Bearer ${token}` },
        });
        expect(res.statusCode).toBe(401);
    });

    it("logout invalida o cookie no navegador", async () => {
        const res = await app.inject({ method: "POST", url: "/auth/logout" });
        expect(res.statusCode).toBe(200);
        const cookie = getSetCookie(res.headers);
        expect(cookie).toContain("vanguard_session=;");
        expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/i);
    });
});

// ---------------------------------------------------------------------------
describe("RBAC: controle de acesso por perfil", () => {
    it.each([
        ["GET", "/equipments"],
        ["GET", "/equipments/abc"],
        ["GET", "/telemetry/status"],
        ["GET", "/telemetry/abc"],
        ["GET", "/occurrences"],
        ["POST", "/occurrences"],
        ["GET", "/users"],
        ["GET", "/sectors"],
        ["POST", "/users"],
        ["POST", "/sectors"],
    ] as const)("bloqueia %s %s sem token (401)", async (method, url) => {
        const res = await app.inject({
            method,
            url,
            ...(method === "POST" ? { payload: {} } : {}),
        });
        expect(res.statusCode).toBe(401);
    });

    it.each([
        ["POST", "/users"],
        ["DELETE", `/users/${GESTOR_ID}`],
        ["POST", "/sectors"],
        ["DELETE", "/sectors/setor-1"],
        ["POST", "/equipments"],
        ["PUT", "/equipments/eq-1"],
    ] as const)("bloqueia TECNICO em rota exclusiva de GESTOR: %s %s (403)", async (method, url) => {
        const res = await app.inject({
            method,
            url,
            cookies: sessionCookie(app, TECNICO_ID, "TECNICO"),
            ...(method === "POST" || method === "PUT" ? { payload: {} } : {}),
        });
        expect(res.statusCode).toBe(403);
        expect(res.json().error).toBe("FORBIDDEN");
        expect(repo.create).not.toHaveBeenCalled();
        expect(repo.deleteById).not.toHaveBeenCalled();
    });

    it("permite GESTOR criar usuário e aplica hash scrypt antes de persistir", async () => {
        repo.findByEmail.mockResolvedValue(undefined);
        repo.create.mockImplementation(async (values: Record<string, unknown>) => values);

        const res = await app.inject({
            method: "POST",
            url: "/users",
            cookies: sessionCookie(app, GESTOR_ID, "GESTOR"),
            payload: { name: "Novo Técnico", email: "Tecnico2@Vanguard.local", role: "TECNICO", password: "Tecnico2026" },
        });

        expect(res.statusCode).toBe(201);
        const persisted = repo.create.mock.calls[0]![0] as Record<string, string>;
        expect(persisted.email).toBe("tecnico2@vanguard.local");
        expect(persisted.password_hash).toMatch(/^scrypt\$/);
        expect(persisted.password_hash).not.toContain("Tecnico2026");
        expect(persisted).not.toHaveProperty("password");
        expect(res.body).not.toContain("password_hash");
        expect(res.body).not.toContain("Tecnico2026");
    });

    it("descarta password_hash enviado pelo cliente (não permite injetar hash)", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/users",
            cookies: sessionCookie(app, GESTOR_ID, "GESTOR"),
            payload: { name: "Atacante", email: "a@vanguard.local", role: "GESTOR", password_hash: "scrypt$fake" },
        });
        expect(res.statusCode).toBe(400);
        expect(repo.create).not.toHaveBeenCalled();
    });

    it("impede GESTOR de excluir a própria conta", async () => {
        const res = await app.inject({
            method: "DELETE",
            url: `/users/${GESTOR_ID}`,
            cookies: sessionCookie(app, GESTOR_ID, "GESTOR"),
        });
        expect(res.statusCode).toBe(403);
        expect(repo.deleteById).not.toHaveBeenCalled();
    });

    it("GESTOR atravessa o RBAC em /sectors (chega à validação de contrato → 400)", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/sectors",
            cookies: sessionCookie(app, GESTOR_ID, "GESTOR"),
            payload: { name: "" },
        });
        expect(res.statusCode).toBe(400);
    });

    it("TECNICO acessa rotas operacionais compartilhadas (GET /users para atribuição)", async () => {
        repo.list.mockResolvedValue([gestorRecord]);
        const res = await app.inject({
            method: "GET",
            url: "/users",
            cookies: sessionCookie(app, TECNICO_ID, "TECNICO"),
        });
        expect(res.statusCode).toBe(200);
    });
});

// ---------------------------------------------------------------------------
describe("Autenticação M2M: x-api-key em POST /telemetry", () => {
    const validPayloadShape = { hostname: "" }; // inválido no Zod, mas só é avaliado após a auth

    it("bloqueia requisição sem x-api-key (401)", async () => {
        const res = await app.inject({ method: "POST", url: "/telemetry", payload: validPayloadShape });
        expect(res.statusCode).toBe(401);
        expect(res.json().message).toBe("Chave de agente inválida ou ausente.");
    });

    it("bloqueia x-api-key incorreta (401)", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/telemetry",
            headers: { "x-api-key": "chave-errada" },
            payload: validPayloadShape,
        });
        expect(res.statusCode).toBe(401);
    });

    it("bloqueia x-api-key de mesmo tamanho diferindo em 1 caractere (401)", async () => {
        const almost = AGENT_KEY.slice(0, -1) + (AGENT_KEY.endsWith("0") ? "1" : "0");
        const res = await app.inject({
            method: "POST",
            url: "/telemetry",
            headers: { "x-api-key": almost },
            payload: validPayloadShape,
        });
        expect(res.statusCode).toBe(401);
    });

    it("não aceita sessão de usuário no lugar da chave do agente (401)", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/telemetry",
            cookies: sessionCookie(app, GESTOR_ID, "GESTOR"),
            payload: validPayloadShape,
        });
        expect(res.statusCode).toBe(401);
    });

    it("aceita a chave correta e prossegue para a validação do contrato (400 por payload vazio)", async () => {
        const res = await app.inject({
            method: "POST",
            url: "/telemetry",
            headers: { "x-api-key": AGENT_KEY },
            payload: validPayloadShape,
        });
        expect(res.statusCode).toBe(400);
        expect(res.json().success).toBe(false);
    });
});


// ---------------------------------------------------------------------------
describe("Passo 2: Tratamento Global de Exceções, Blindagem de Dados e Headers", () => {
    it("retorna HTTP 400 limpo e estruturado para payloads inválidos no Zod em /users, /sectors, /equipments e /occurrences", async () => {
        const cookies = sessionCookie(app, GESTOR_ID, "GESTOR");

        const userRes = await app.inject({
            method: "POST",
            url: "/users",
            cookies,
            payload: { name: "A", email: "invalido", role: "ADMIN", password: "123" },
        });
        expect(userRes.statusCode).toBe(400);
        expect(userRes.json()).toMatchObject({
            success: false,
            error: "VALIDATION_ERROR",
            message: "Dados inválidos.",
        });
        expect(Array.isArray(userRes.json().errors)).toBe(true);
        expect(userRes.json().errors.length).toBeGreaterThanOrEqual(3);

        const sectorRes = await app.inject({
            method: "POST",
            url: "/sectors",
            cookies,
            payload: { id: "", name: "", description: "" },
        });
        expect(sectorRes.statusCode).toBe(400);
        expect(sectorRes.json()).toMatchObject({
            success: false,
            error: "VALIDATION_ERROR",
        });

        const eqRes = await app.inject({
            method: "POST",
            url: "/equipments",
            cookies,
            payload: { hostname: "" },
        });
        expect(eqRes.statusCode).toBe(400);
        expect(eqRes.json()).toMatchObject({
            success: false,
            error: "VALIDATION_ERROR",
        });

        const occRes = await app.inject({
            method: "POST",
            url: "/occurrences",
            cookies,
            payload: { equipment_id: "nao-uuid", priority: "INVALIDA", description: "curto" },
        });
        expect(occRes.statusCode).toBe(400);
        expect(occRes.json()).toMatchObject({
            success: false,
            error: "VALIDATION_ERROR",
        });
    });

    it("omite 100% o campo password_hash na listagem GET /users e em todas as rotas de usuário", async () => {
        repo.list.mockResolvedValue([
            gestorRecord,
            {
                id: TECNICO_ID,
                name: "Técnico Teste",
                email: "tecnico@vanguard.local",
                role: "TECNICO",
                password_hash: "scrypt$32768$8$1$segredo$hashsecreto",
            },
        ]);

        const res = await app.inject({
            method: "GET",
            url: "/users",
            cookies: sessionCookie(app, GESTOR_ID, "GESTOR"),
        });

        expect(res.statusCode).toBe(200);
        const list = res.json() as Array<Record<string, unknown>>;
        expect(list).toHaveLength(2);
        for (const item of list) {
            expect(item).not.toHaveProperty("password_hash");
            expect(item).not.toHaveProperty("password");
            expect(Object.keys(item).sort()).toEqual(["email", "id", "name", "role"]);
        }
        expect(res.body).not.toContain("password_hash");
        expect(res.body).not.toContain("scrypt$");
    });

    it("blindagem em erros 500: oculta stack traces, strings de conexão do Supabase/Drizzle e SQL", async () => {
        const sensitiveDbError = new Error(
            'connection to server at "db.supabase.co" (postgresql://postgres:SuperSecretPass@db.supabase.co:5432/postgres) failed: SELECT password_hash FROM users'
        );
        repo.list.mockRejectedValueOnce(sensitiveDbError);

        const res = await app.inject({
            method: "GET",
            url: "/users",
            cookies: sessionCookie(app, GESTOR_ID, "GESTOR"),
        });

        expect(res.statusCode).toBe(500);
        const body = res.json();
        expect(body).toMatchObject({
            success: false,
            error: "INTERNAL_SERVER_ERROR",
            message: "Erro interno do servidor. Tente novamente mais tarde.",
        });
        expect(body.stack).toBeUndefined();
        expect(res.body).not.toContain("supabase.co");
        expect(res.body).not.toContain("SuperSecretPass");
        expect(res.body).not.toContain("SELECT");
        expect(res.body).not.toContain("password_hash");
    });

    it("converte violações de integridade do PostgreSQL (23505 / 23503) em HTTP 409 sem expor detalhes internos", async () => {
        const fkError = Object.assign(new Error('update or delete on table "users" violates foreign key constraint "occurrences_technician_id_users_id_fk"'), {
            code: "23503",
        });
        repo.deleteById.mockRejectedValueOnce(fkError);

        const res = await app.inject({
            method: "DELETE",
            url: `/users/${TECNICO_ID}`,
            cookies: sessionCookie(app, GESTOR_ID, "GESTOR"),
        });

        expect(res.statusCode).toBe(409);
        expect(res.json()).toEqual({
            success: false,
            error: "CONFLICT",
            message: "Operação não permitida: o registro está vinculado a outros dados.",
        });
        expect(res.body).not.toContain("occurrences_technician_id_users_id_fk");
    });

    it("aplica CORS restritivo e cabeçalhos de segurança (Helmet)", async () => {
        const allowedRes = await app.inject({
            method: "GET",
            url: "/",
            headers: { origin: "http://localhost:5173" },
        });
        expect(allowedRes.statusCode).toBe(200);
        expect(allowedRes.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
        expect(allowedRes.headers["access-control-allow-credentials"]).toBe("true");
        expect(allowedRes.headers["x-content-type-options"]).toBe("nosniff");
        expect(allowedRes.headers["x-frame-options"]).toBe("SAMEORIGIN");
        expect(allowedRes.headers["content-security-policy"]).toContain("default-src 'none'");

        const blockedRes = await app.inject({
            method: "GET",
            url: "/",
            headers: { origin: "https://evil-attacker.example.com" },
        });
        expect(blockedRes.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("retorna 404 padronizado para rotas inexistentes", async () => {
        const res = await app.inject({ method: "GET", url: "/rota-que-nao-existe" });
        expect(res.statusCode).toBe(404);
        expect(res.json()).toEqual({
            success: false,
            error: "NOT_FOUND",
            message: "Rota GET /rota-que-nao-existe não encontrada.",
        });
    });
});
