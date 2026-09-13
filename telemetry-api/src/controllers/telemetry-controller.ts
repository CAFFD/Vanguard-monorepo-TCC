import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { equipments } from "../db/schema.js";
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

    const matchingEquipments = await db
        .select({ id: equipments.id })
        .from(equipments)
        .where(eq(equipments.hostname, telemetry.hostname));

    if (matchingEquipments.length === 0) {
        return reply.status(404).send({
            success: false,
            message: `Nenhum equipamento encontrado para o hostname: ${telemetry.hostname}`,
        });
    }

    if (matchingEquipments.length > 1) {
        return reply.status(409).send({
            success: false,
            message: `Mais de um equipamento encontrado para o hostname: ${telemetry.hostname}`,
        });
    }

    const equipment = matchingEquipments[0];

    console.log(
        "Telemetria recebida para equipamento:",
        equipment?.id,
        telemetry
    );

    return reply.status(200).send({
        success: true,
        message:
            "Telemetria recebida com sucesso",
    });
}