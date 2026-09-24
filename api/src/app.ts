import Fastify from "fastify";
import cors from "@fastify/cors";

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

/**
 * Cria e configura a instância Fastify sem iniciar nenhum listener de porta.
 *
 * Isso permite que a mesma instância seja reutilizada em dois contextos:
 * - Local: `server.ts` chama `.listen()` para desenvolvimento contínuo.
 * - Vercel: `api/index.ts` exporta um handler serverless via `.ready()`.
 */
export function buildApp() {
    if (!process.env.DATABASE_URL) {
        throw new Error("FATAL: DATABASE_URL environment variable is missing.");
    }

    const app = Fastify({
        logger: true,
    });

    app.register(cors, {
        origin: "*", // testes (frontend local e Vercel)
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    });

    // Rota raiz (Health Check)
    app.get("/", async () => {
        return { status: "ok", message: "Vanguard API is running!" };
    });

    app.register(telemetryRoutes);
    app.register(sectorRoutes);
    app.register(equipmentRoutes);
    app.register(userRoutes);

    return app;
}
