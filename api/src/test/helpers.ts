import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.js";
import { loadConfig } from "../config/env.js";
import type { UserRole } from "../lib/roles.js";

export function buildTestApp(overrides: NodeJS.ProcessEnv = {}): FastifyInstance {
    return buildApp({
        config: loadConfig({ ...process.env, ...overrides }),
        logger: false,
    });
}

/** Gera um cookie de sessão válido, assinado com o mesmo segredo da app. */
export function sessionCookie(app: FastifyInstance, sub: string, role: UserRole) {
    const token = app.jwt.sign({ sub, role });
    return { [app.config.cookie.name]: token };
}

export const AGENT_KEY = process.env.AGENT_API_KEY!;

