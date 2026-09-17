import type { FastifyInstance } from "fastify";

import {
    createTelemetry,
    getTelemetryHistory,
    getTelemetryStatus,
} from "../controllers/telemetry-controller.js";

export async function telemetryRoutes(
    app: FastifyInstance
) {
    app.post(
        "/telemetry",
        createTelemetry
    );

    app.get(
        "/telemetry/status",
        getTelemetryStatus
    );

    app.get(
        "/telemetry/:equipamento_id",
        getTelemetryHistory
    );
}