import type { FastifyReply, FastifyRequest, preHandlerAsyncHookHandler } from "fastify";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";
import { safeCompare } from "../lib/password.js";
import { isUserRole, type UserRole } from "../lib/roles.js";

/**
 * preHandler: exige sessão válida (JWT HS256 lido do cookie HttpOnly).
 * Assinatura, expiração, emissor (iss) e audiência (aud) são verificados
 * pelo @fastify/jwt; o algoritmo é fixado em HS256 (bloqueia "alg: none").
 */
export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
    try {
        await request.jwtVerify();
    } catch {
        throw new UnauthorizedError("Sessão inválida ou expirada. Faça login novamente.");
    }

    if (!request.user?.sub || !isUserRole(request.user.role)) {
        throw new UnauthorizedError("Sessão inválida ou expirada. Faça login novamente.");
    }
}

/**
 * preHandler (RBAC): permite apenas os perfis informados.
 * Deve ser encadeado APÓS `authenticate`.
 */
export function requireRole(...allowed: UserRole[]): preHandlerAsyncHookHandler {
    return async function roleGuard(request) {
        if (!request.user || !allowed.includes(request.user.role)) {
            throw new ForbiddenError("Acesso restrito ao perfil: " + allowed.join(", ") + ".");
        }
    };
}

/**
 * preHandler: autenticação máquina-a-máquina do Agente de Borda.
 * Compara o header `x-api-key` com AGENT_API_KEY em tempo constante.
 */
export async function requireAgentKey(request: FastifyRequest, _reply: FastifyReply) {
    const provided = request.headers["x-api-key"];

    if (typeof provided !== "string" || provided.length === 0 ||
        !safeCompare(provided, request.server.config.agentApiKey)) {
        throw new UnauthorizedError("Chave de agente inválida ou ausente.");
    }
}

/** Atalhos de composição usados nas rotas. */
export const authenticated = [authenticate];
export const gestorOnly = [authenticate, requireRole("GESTOR")];

