import type { FastifyReply, FastifyRequest } from "fastify";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { equipments, telemetryHistory } from "../db/schema.js";
import {
    createEquipmentSchema,
    updateEquipmentSchema,
} from "../schemas/equipment-schemas.js";
import { classifyHealth } from "../lib/health-classifier.js";

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

    try {
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
    } catch (error: any) {
        if (error.code === '23505') {
            return reply.status(409).send({
                success: false,
                message: "Já existe um equipamento cadastrado com este Endereço MAC ou Número de Patrimônio.",
            });
        }
        console.error("Erro ao cadastrar equipamento:", error);
        return reply.status(500).send({
            success: false,
            message: "Erro interno ao cadastrar o equipamento.",
        });
    }
}

export async function getEquipments(
    _request: FastifyRequest,
    reply: FastifyReply
) {
    const allEquipments = await db.select().from(equipments);
    
    // Motor de Regras: Calcular status ao vivo baseado no histórico
    const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;
    const now = Date.now();
    
    const equipmentsWithLiveStatus = await Promise.all(
        allEquipments.map(async (eqData) => {
            const recentTelemetries = await db
                .select()
                .from(telemetryHistory)
                .where(eq(telemetryHistory.equipment_id, eqData.id))
                .orderBy(desc(telemetryHistory.created_at))
                .limit(2);
                
            const { status: liveStatus, reasons } = classifyHealth(recentTelemetries[0], recentTelemetries[1], now);
            
            return {
                ...eqData,
                health_status: liveStatus,
                health_reasons: reasons
            };
        })
    );

    return reply.status(200).send(equipmentsWithLiveStatus);
}

export async function getEquipmentById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    
    const [eqData] = await db.select().from(equipments).where(eq(equipments.id, id));
    if (!eqData) {
        return reply.status(404).send({ success: false, message: "Equipamento não encontrado" });
    }

    // Calcula status ao vivo (mesma lógica simplificada do getEquipments)
    const recentTelemetries = await db
        .select()
        .from(telemetryHistory)
        .where(eq(telemetryHistory.equipment_id, eqData.id))
        .orderBy(desc(telemetryHistory.created_at))
        .limit(2);
        
    const { status: liveStatus, reasons } = classifyHealth(recentTelemetries[0], recentTelemetries[1]);
    
    return reply.status(200).send({
        ...eqData,
        health_status: liveStatus,
        health_reasons: reasons
    });
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
