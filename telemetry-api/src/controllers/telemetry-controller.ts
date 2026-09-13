import { randomUUID } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { equipments, telemetryHistory } from "../db/schema.js";
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

    const equipment = matchingEquipments[0]!;

    await db.insert(telemetryHistory).values({
        id: randomUUID(),
        created_at: new Date(),
        disk_usage_percent: String(telemetry.disk_usage),
        smart_5: telemetry.smart_5,
        equipment_id: equipment.id,
        smart_187: telemetry.smart_187,
        smart_188: telemetry.smart_188,
        smart_197: telemetry.smart_197,
        smart_198: telemetry.smart_198,
        raw_payload: telemetry,
    });

    console.log(
        "Telemetria persistida para equipamento:",
        equipment.id,
        telemetry
    );

    return reply.status(200).send({
        success: true,
        message:
            "Telemetria recebida com sucesso",
    });
}