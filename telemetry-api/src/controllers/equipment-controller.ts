import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { equipments } from "../db/schema.js";

interface CreateEquipmentBody {
    id: string;
    sector_id: string;
    mac_address: string;
    patrimony_tag: string;
    hostname: string;
    health_status: string;
}

interface UpdateEquipmentParams {
    id: string;
}

interface UpdateEquipmentBody {
    sector_id?: string;
    mac_address?: string;
    patrimony_tag?: string;
    hostname?: string;
    health_status?: string;
}

export async function createEquipment(
    request: FastifyRequest<{ Body: CreateEquipmentBody }>,
    reply: FastifyReply
) {
    const { id, sector_id, mac_address, patrimony_tag, hostname, health_status } = request.body;

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
        Body: UpdateEquipmentBody;
    }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const { sector_id, mac_address, patrimony_tag, hostname, health_status } = request.body;

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
