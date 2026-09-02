import type { FastifyInstance } from "fastify";

import {
    createTelemetry
} from "../controllers/telemetry-controller.js";

export async function telemetryRoutes(
    app: FastifyInstance
) {

    app.post(
        "/telemetry",
        createTelemetry
    );
}