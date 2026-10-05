import { randomUUID } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { equipments, telemetryHistory } from "../db/schema.js";
import {
    telemetrySchema
} from "../schemas/telemetry-schemas.js";

interface GetTelemetryHistoryParams {
    equipamento_id: string;
}

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
                "Dados de telemetria inv├ílidos",
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

    const isLegacy = !telemetry.schema_version;
    const finalStatus = isLegacy ? 'legacy' : (telemetry.collection_status || 'legacy');

    const diskUsageVal = telemetry.disk_usage_percent ?? telemetry.disk_usage;

    await db.insert(telemetryHistory).values({
        id: randomUUID(),
        created_at: new Date(),
        equipment_id: equipment.id,
        
        schema_version: telemetry.schema_version ?? null,
        collection_status: finalStatus,
        collection_error: telemetry.collection_error ?? null,

        protocol: telemetry.protocol ?? null,
        media_type: telemetry.media_type ?? null,
        device_model: telemetry.device_model ?? null,
        device_serial: telemetry.device_serial ?? null,

        disk_usage_percent: diskUsageVal != null ? String(diskUsageVal) : null,
        temperature_c: telemetry.temperature_c ?? null,
        power_on_hours: telemetry.power_on_hours ?? null,
        life_remaining_pct: telemetry.life_remaining_pct ?? null,
        media_errors: telemetry.media_errors ?? null,
        critical_warnings: telemetry.critical_warnings ?? null,
        smart_passed: telemetry.smart_passed ?? null,
        
        raw_payload: telemetry.raw_payload ?? telemetry,

        // Legado
        smart_5: telemetry.smart_5 ?? null,
        smart_187: telemetry.smart_187 ?? null,
        smart_188: telemetry.smart_188 ?? null,
        smart_197: telemetry.smart_197 ?? null,
        smart_198: telemetry.smart_198 ?? null,
    });

    console.log(
        `[TELEMETRY V2] Gravado equipamento ${equipment.id} | Host: ${telemetry.hostname} | Status: ${finalStatus} | Protocol: ${telemetry.protocol || 'N/A'}`
    );

    return reply.status(200).send({
        success: true,
        message:
            "Telemetria recebida com sucesso",
    });
}

export async function getTelemetryStatus(
    _request: FastifyRequest,
    reply: FastifyReply
) {
    const allEquipments = await db
        .select({ id: equipments.id })
        .from(equipments);

    const counts = {
        normal: 0,
        atencao: 0,
        critico: 0,
        offline: 0,
    };

    const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;
    const now = Date.now();

    for (const equipment of allEquipments) {
        const recentTelemetries = await db
            .select()
            .from(telemetryHistory)
            .where(eq(telemetryHistory.equipment_id, equipment.id))
            .orderBy(desc(telemetryHistory.created_at))
            .limit(2);

        const latest = recentTelemetries[0];

        // 1. Offline: sem telemetria ou sem resposta mais de 2 horas
        if (!latest || !latest.created_at) {
            counts.offline++;
            continue;
        }

        const telemetryTime = new Date(latest.created_at).getTime();
        if (now - telemetryTime > TWO_HOURS_IN_MS) {
            counts.offline++;
            continue;
        }

        // 2. Crítico: SMART_197 e SMART_198 aumentaram em relação à leitura anterior
        const previous = recentTelemetries[1];
        if (
            previous &&
            (latest.smart_197 ?? 0) > (previous.smart_197 ?? 0) &&
            (latest.smart_198 ?? 0) > (previous.smart_198 ?? 0)
        ) {
            counts.critico++;
            continue;
        }

        // 3. Atenção: disk_usage > 90 ou SMART_197 > 0
        const diskUsage = Number(latest.disk_usage_percent);
        const smart197 = latest.smart_197 ?? 0;
        if (diskUsage > 90 || smart197 > 0) {
            counts.atencao++;
            continue;
        }

        // 4. Normal: nenhuma das condições acima
        counts.normal++;
    }

    return reply.status(200).send(counts);
}

export async function getTelemetryHistory(
    request: FastifyRequest<{ Params: GetTelemetryHistoryParams }>,
    reply: FastifyReply
) {
    const { equipamento_id } = request.params;

    const history = await db
        .select()
        .from(telemetryHistory)
        .where(eq(telemetryHistory.equipment_id, equipamento_id))
        .orderBy(desc(telemetryHistory.created_at));

    return reply.status(200).send(history);
}
