import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import type { FastifyReply, FastifyRequest } from "fastify";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { equipments, telemetryHistory } from "../db/schema.js";
import {
    telemetrySchema
} from "../schemas/telemetry-schemas.js";
import { classifyHealth } from "../lib/health-classifier.js";

interface GetTelemetryHistoryParams {
    equipamento_id: string;
}

export async function createTelemetry(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const telemetry = telemetrySchema.parse(request.body);

    const matchingEquipments = await db
        .select({ id: equipments.id })
        .from(equipments)
        .where(eq(equipments.hostname, telemetry.hostname));

    if (matchingEquipments.length === 0) {
        try {
            const logPath = path.resolve(process.cwd(), 'unregistered_agents.log');
            // Formata o log: data/hora, hostname e o schema version para facilitar
            const logLine = `[${new Date().toISOString()}] HOSTNAME NÃO CADASTRADO: ${telemetry.hostname} | Agente v${telemetry.agent_version}\n`;
            if (!fs.existsSync(logPath) || !fs.readFileSync(logPath, 'utf8').includes(telemetry.hostname)) {
                 fs.appendFileSync(logPath, logLine);
            }
        } catch {
            // Ignora erro de arquivo
        }

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

    request.log.info(
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
        sem_leitura: 0,
    };

    const now = Date.now();

    for (const equipment of allEquipments) {
        const recentTelemetries = await db
            .select()
            .from(telemetryHistory)
            .where(eq(telemetryHistory.equipment_id, equipment.id))
            .orderBy(desc(telemetryHistory.created_at))
            .limit(2);

        const { status } = classifyHealth(recentTelemetries[0], recentTelemetries[1], now);

        if (status === "OFFLINE") counts.offline++;
        else if (status === "SEM_LEITURA") counts.sem_leitura++;
        else if (status === "CRÍTICO") counts.critico++;
        else if (status === "ATENÇÃO") counts.atencao++;
        else counts.normal++;
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
