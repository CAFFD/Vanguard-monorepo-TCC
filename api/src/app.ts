import Fastify from "fastify";

import {
    equipmentRoutes
} from "./routes/equipment-routes.js";
import {
    sectorRoutes
} from "./routes/sector-routes.js";
import {
    telemetryRoutes
} from "./routes/telemetry-routes.js";

/**
 * Cria e configura a instância Fastify sem iniciar nenhum listener de porta.
 *
 * Isso permite que a mesma instância seja reutilizada em dois contextos:
 * - Local: `server.ts` chama `.listen()` para desenvolvimento contínuo.
 * - Vercel: `api/index.ts` exporta um handler serverless via `.ready()`.
 */
export function buildApp() {
    const app = Fastify({
        logger: true,
    });

    app.register(telemetryRoutes);
    app.register(sectorRoutes);
    app.register(equipmentRoutes);

    return app;
}
