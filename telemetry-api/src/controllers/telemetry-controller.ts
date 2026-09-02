import type { FastifyReply, FastifyRequest } from "fastify";

import {
    telemetrySchema
} from "../schemas/telemetry-schemas.js";

export async function createTelemetry(
    request: FastifyRequest,
    reply: FastifyReply
) {

    const result =
        telemetrySchema.safeParse(request.body);

    if (!result.success) {

        return reply.status(400).send({
            success: false,

            message:
                "Dados de telemetria inválidos",

            errors: result.error.issues.map(
                (issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })
            ),
        });
    }

    const telemetry = result.data;

    console.log(
        "Telemetria recebida:",
        telemetry
    );

    return reply.status(200).send({
        success: true,

        message:
            "Telemetria recebida com sucesso",
    });
}