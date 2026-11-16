import type { FastifyInstance } from "fastify";

import {
    createTelemetry,
    getTelemetryHistory,
    getTelemetryStatus,
} from "../controllers/telemetry-controller.js";
import { authenticated, requireAgentKey } from "../middlewares/auth.js";

export async function telemetryRoutes(
    app: FastifyInstance
) {
    // Ingestão M2M: somente o Agente de Borda (header x-api-key).
    // Suporta tanto /telemetry quanto o alias /api/telemetry.
    app.post(
        "/telemetry",
        { preHandler: [requireAgentKey] },
        createTelemetry
    );

    app.post(
        "/api/telemetry",
        { preHandler: [requireAgentKey] },
        createTelemetry
    );

    // Consulta: usuários autenticados (dashboard / prontuário).
    app.get(
        "/telemetry/status",
        { preHandler: authenticated },
        getTelemetryStatus
    );

    app.get<{ Params: { equipamento_id: string } }>(
        "/telemetry/:equipamento_id",
        { preHandler: authenticated },
        getTelemetryHistory
    );
}
