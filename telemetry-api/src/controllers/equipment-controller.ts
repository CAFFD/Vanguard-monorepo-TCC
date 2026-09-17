import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { equipments } from "../db/schema.js";
import {
    createEquipmentSchema,
    updateEquipmentSchema,
} from "../schemas/equipment-schemas.js";

interface UpdateEquipmentParams {
    id: string;
}

export async function createEquipment(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const result = createEquipmentSchema.safeParse(request.body);

    if (!result.success) {
        return reply.status(400).send({
            success: false,
            message: "Dados de equipamento inválidos",
            errors: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    const { id, sector_id, mac_address, patrimony_tag, hostname, health_status } = result.data;

    const [createdEquipment] = await db
        .insert(equipments)
        .values({
            id,
            sector_id,
            mac_address,
            patrimony_tag,
            hostname,
            health_status,
        })
        .returning();

    return reply.status(201).send({
        success: true,
        data: createdEquipment,
    });
}

export async function getEquipments(
    _request: FastifyRequest,
    reply: FastifyReply
) {
    const allEquipments = await db.select().from(equipments);

    return reply.status(200).send(allEquipments);
}

export async function updateEquipment(
    request: FastifyRequest<{
        Params: UpdateEquipmentParams;
    }>,
    reply: FastifyReply
) {
    const result = updateEquipmentSchema.safeParse(request.body);

    if (!result.success) {
        return reply.status(400).send({
            success: false,
            message: "Dados de equipamento inválidos",
            errors: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    const { id } = request.params;
    const { sector_id, mac_address, patrimony_tag, hostname, health_status } = result.data;

    const [updatedEquipment] = await db
        .update(equipments)
        .set({
            sector_id,
            mac_address,
            patrimony_tag,
            hostname,
            health_status,
        })
        .where(eq(equipments.id, id))
        .returning();

    if (!updatedEquipment) {
        return reply.status(404).send({
            success: false,
            message: "Equipamento não encontrado",
        });
    }

    return reply.status(200).send({
        success: true,
        data: updatedEquipment,
    });
}
