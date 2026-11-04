import Fastify, { type FastifyServerOptions } from "fastify";
import "./types/fastify.js";

import { loadConfig, type AppConfig } from "./config/env.js";
import { registerErrorHandler } from "./plugins/error-handler.js";
import { registerSecurity } from "./plugins/security.js";
import {
    authRoutes
} from "./routes/auth-routes.js";
import {
    equipmentRoutes
} from "./routes/equipment-routes.js";
import {
    sectorRoutes
} from "./routes/sector-routes.js";
import {
    telemetryRoutes
} from "./routes/telemetry-routes.js";
import {
    userRoutes
} from "./routes/user-routes.js";
import {
    occurrenceRoutes
} from "./routes/occurrence-routes.js";

export interface BuildAppOptions {
    /** Configuração explícita (testes). Por padrão é lida de process.env. */
    config?: AppConfig;
    /** Sobrescreve o logger (ex.: `false` nos testes). */
    logger?: FastifyServerOptions["logger"];
}

/**
 * Cria e configura a instância Fastify sem iniciar nenhum listener de porta.
 *
 * Isso permite que a mesma instância seja reutilizada em dois contextos:
 * - Local: `server.ts` chama `.listen()` para desenvolvimento contínuo.
 * - Vercel: `api/index.ts` exporta um handler serverless via `.ready()`.
 */
export function buildApp(options: BuildAppOptions = {}) {
    // Fail-fast: DATABASE_URL, JWT_SECRET e AGENT_API_KEY são obrigatórias.
    const config = options.config ?? loadConfig();

    const app = Fastify({
        logger: options.logger ?? {
            level: config.isProduction ? "info" : "debug",
            // Defesa em profundidade: segredos nunca chegam aos logs.
            redact: {
                paths: [
                    "req.headers.authorization",
                    "req.headers.cookie",
                    'req.headers["x-api-key"]',
                    'res.headers["set-cookie"]',
                ],
                censor: "[REDACTED]",
            },
        },
        trustProxy: config.trustProxy,
        bodyLimit: 1024 * 1024, // 1 MiB
    });

    app.decorate("config", config);

    registerErrorHandler(app);
    registerSecurity(app);

    // Rota raiz (Health Check)
    app.get("/", async () => {
        return { status: "ok", message: "Vanguard API is running!" };
    });

    app.register(authRoutes);
    app.register(telemetryRoutes);
    app.register(sectorRoutes);
    app.register(equipmentRoutes);
    app.register(userRoutes);
    app.register(occurrenceRoutes, { prefix: '/occurrences' });

    return app;
}
