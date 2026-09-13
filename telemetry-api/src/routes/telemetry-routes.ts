import type { FastifyInstance } from "fastify";

import {
    createTelemetry,
    getTelemetryHistory,
} from "../controllers/telemetry-controller.js";

export async function telemetryRoutes(
    app: FastifyInstance
) {
    app.post(
        "/telemetry",
        createTelemetry
    );

    app.get(
        "/telemetry/:equipamento_id",
        getTelemetryHistory
    );
}