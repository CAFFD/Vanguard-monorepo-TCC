import type { AppConfig } from "../config/env.js";
import type { UserRole } from "../lib/roles.js";

/**
 * Augmentations de tipos do Fastify / @fastify/jwt.
 */
declare module "@fastify/jwt" {
    interface FastifyJWT {
        /** Claims mínimas: nada sensível trafega dentro do token. */
        payload: { sub: string; role: UserRole };
        user: { sub: string; role: UserRole; iat?: number; exp?: number };
    }
}

declare module "fastify" {
    interface FastifyInstance {
        config: AppConfig;
    }
}

