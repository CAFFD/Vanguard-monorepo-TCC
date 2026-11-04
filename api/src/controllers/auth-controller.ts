import type { CookieSerializeOptions } from "@fastify/cookie";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";
import { burnPasswordVerification, hashPassword, verifyPassword } from "../lib/password.js";
import { isUserRole } from "../lib/roles.js";
import { toPublicUser } from "../lib/sanitize.js";
import { userRepository } from "../repositories/user-repository.js";
import { loginSchema } from "../schemas/auth-schemas.js";

const INVALID_CREDENTIALS = "E-mail ou senha inválidos.";

function sessionCookieOptions(app: FastifyInstance): CookieSerializeOptions {
    const { cookie, sessionTtlSeconds } = app.config;
    return {
        httpOnly: true, // inacessível a JavaScript (mitiga roubo via XSS)
        secure: cookie.secure, // trafega apenas sobre HTTPS em produção
        sameSite: cookie.sameSite, // mitiga CSRF
        path: "/",
        maxAge: sessionTtlSeconds,
    };
}

/**
 * POST /auth/login
 * Valida credenciais, emite JWT assinado e o entrega em cookie HttpOnly.
 * O token NUNCA é devolvido no corpo da resposta.
 */
export async function login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = loginSchema.parse(request.body);

    const user = await userRepository.findByEmail(email);

    if (!user || !user.password_hash) {
        // Mesmo custo computacional de uma verificação real (anti user-enumeration).
        await burnPasswordVerification(password);
        throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    const { valid, needsRehash } = await verifyPassword(password, user.password_hash);
    if (!valid) {
        throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    if (!isUserRole(user.role)) {
        throw new ForbiddenError("Usuário sem perfil de acesso válido. Contate um gestor.");
    }

    // Migração transparente de hashes legados (SHA-256) ou de custo antigo.
    if (needsRehash) {
        try {
            await userRepository.updatePasswordHash(user.id, await hashPassword(password));
        } catch (err) {
            request.log.warn({ err }, "Falha ao atualizar hash legado de senha");
        }
    }

    const token = await reply.jwtSign({ sub: user.id, role: user.role });

    reply
        .setCookie(request.server.config.cookie.name, token, sessionCookieOptions(request.server))
        .header("Cache-Control", "no-store");

    return reply.status(200).send({
        success: true,
        data: { user: toPublicUser(user) },
    });
}

/**
 * POST /auth/logout
 * Remove o cookie de sessão (idempotente).
 */
export async function logout(request: FastifyRequest, reply: FastifyReply) {
    const { maxAge: _maxAge, ...options } = sessionCookieOptions(request.server);
    reply
        .clearCookie(request.server.config.cookie.name, options)
        .header("Cache-Control", "no-store");

    return reply.status(200).send({ success: true, message: "Sessão encerrada." });
}

/**
 * GET /auth/me
 * Retorna o usuário da sessão atual, consultando o banco para garantir que
 * a conta ainda existe e refletir alterações de nome/perfil.
 */
export async function me(request: FastifyRequest, reply: FastifyReply) {
    const user = await userRepository.findById(request.user.sub);

    if (!user || !isUserRole(user.role)) {
        const { maxAge: _maxAge, ...options } = sessionCookieOptions(request.server);
        reply.clearCookie(request.server.config.cookie.name, options);
        throw new UnauthorizedError("Sessão inválida ou expirada. Faça login novamente.");
    }

    reply.header("Cache-Control", "no-store");
    return reply.status(200).send({
        success: true,
        data: { user: toPublicUser(user) },
    });
}

