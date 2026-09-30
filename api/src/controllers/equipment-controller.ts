import type { FastifyReply, FastifyRequest } from "fastify";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { equipments, telemetryHistory } from "../db/schema.js";
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
                
            let liveStatus = "NORMAL";
            const latest = recentTelemetries[0];
            
            if (!latest || !latest.created_at) {
                liveStatus = "OFFLINE";
            } else {
                const telemetryTime = new Date(latest.created_at).getTime();
                if (now - telemetryTime > TWO_HOURS_IN_MS) {
                    liveStatus = "OFFLINE";
                } else {
                    const previous = recentTelemetries[1];
                    if (
                        previous &&
                        (latest.smart_197 ?? 0) > (previous.smart_197 ?? 0) &&
                        (latest.smart_198 ?? 0) > (previous.smart_198 ?? 0)
                    ) {
                        liveStatus = "CRÍTICO";
                    } else {
                        const diskUsage = Number(latest.disk_usage_percent);
                        const smart197 = latest.smart_197 ?? 0;
                        if (diskUsage > 90 || smart197 > 0) {
                            liveStatus = "ATENÇÃO";
                        }
                    }
                }
            }
            
            return {
                ...eqData,
                health_status: liveStatus
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
        
    let liveStatus = "NORMAL";
    const latest = recentTelemetries[0];
    
    if (!latest || !latest.created_at) {
        liveStatus = "OFFLINE";
    } else {
        const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;
        const telemetryTime = new Date(latest.created_at).getTime();
        if (Date.now() - telemetryTime > TWO_HOURS_IN_MS) {
            liveStatus = "OFFLINE";
        } else {
            const previous = recentTelemetries[1];
            if (previous && (latest.smart_197 ?? 0) > (previous.smart_197 ?? 0) && (latest.smart_198 ?? 0) > (previous.smart_198 ?? 0)) {
                liveStatus = "CRÍTICO";
            } else {
                const diskUsage = Number(latest.disk_usage_percent);
                const smart197 = latest.smart_197 ?? 0;
                if (diskUsage > 90 || smart197 > 0) {
                    liveStatus = "ATENÇÃO";
                }
            }
        }
    }
    
    return reply.status(200).send({
        ...eqData,
        health_status: liveStatus
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
