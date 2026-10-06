export type TelemetryRow = {
    created_at: Date | null;
    collection_status: string | null;
    schema_version: number | null;
    
    smart_passed: boolean | null;
    critical_warnings: number | null;
    media_errors: number | null;
    life_remaining_pct: number | null;
    disk_usage_percent: string | null;
    
    // Legacy support
    smart_197: number | null;
    smart_198: number | null;
};

export type HealthStatus = "NORMAL" | "ATENÇÃO" | "CRÍTICO" | "OFFLINE" | "SEM_LEITURA";

export type HealthResult = {
    status: HealthStatus;
    reasons: string[];
};

export function classifyHealth(latest: TelemetryRow | undefined, previous: TelemetryRow | undefined, nowMs: number = Date.now()): HealthResult {
    if (!latest || !latest.created_at) {
        return { status: "OFFLINE", reasons: ["Nenhuma telemetria recebida recentemente"] };
    }

    const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;
    if (nowMs - latest.created_at.getTime() > TWO_HOURS_IN_MS) {
        return { status: "OFFLINE", reasons: ["Dispositivo inativo há mais de 2 horas"] };
    }

    if (latest.collection_status === "failed") {
        return { status: "SEM_LEITURA", reasons: ["O agente local não possui permissão para ler o disco ou o formato não é suportado"] };
    }

    const reasons: string[] = [];
    let isCritical = false;
    let isWarning = false;

    // 1. Critical Checks
    if (latest.smart_passed === false) {
        isCritical = true;
        reasons.push("Falha crítica global reportada pelo S.M.A.R.T. (smart_passed = false)");
    }

    if (latest.critical_warnings !== null && latest.critical_warnings > 0) {
        isCritical = true;
        reasons.push(`O disco reportou ${latest.critical_warnings} aviso(s) crítico(s) de hardware`);
    }

    if (latest.life_remaining_pct !== null && latest.life_remaining_pct <= 10) {
        isCritical = true;
        reasons.push(`Vida útil restante crítica: apenas ${latest.life_remaining_pct}%`);
    }

    if (latest.media_errors !== null && previous && previous.media_errors !== null) {
        if (latest.media_errors > previous.media_errors) {
            isCritical = true;
            reasons.push(`Novos erros de mídia detectados (subiu de ${previous.media_errors} para ${latest.media_errors})`);
        }
    }

    // Legacy Critical Check
    if (previous && (latest.smart_197 ?? 0) > (previous.smart_197 ?? 0) && (latest.smart_198 ?? 0) > (previous.smart_198 ?? 0)) {
        isCritical = true;
        reasons.push("Aumento na contagem de setores pendentes e incorrigíveis (SATA/Legado)");
    }

    // 2. Warning Checks
    if (latest.collection_status === "partial") {
        isWarning = true;
        reasons.push("Leitura parcial: algumas métricas não puderam ser extraídas pelo agente");
    }

    const diskUsage = Number(latest.disk_usage_percent);
    if (!isNaN(diskUsage) && diskUsage > 90) {
        isWarning = true;
        reasons.push(`Armazenamento quase cheio: uso em ${diskUsage}%`);
    }

    if (latest.media_errors !== null && latest.media_errors > 0) {
        isWarning = true;
        // Evita duplicar se já entrou no CRÍTICO
        if (!reasons.some(r => r.includes("erros de mídia"))) {
            reasons.push(`O disco acumula ${latest.media_errors} erro(s) de mídia históricos`);
        }
    }

    if (latest.life_remaining_pct !== null && latest.life_remaining_pct > 10 && latest.life_remaining_pct <= 20) {
        isWarning = true;
        reasons.push(`Vida útil restante baixa: ${latest.life_remaining_pct}%`);
    }

    // Legacy Warning Check
    const smart197 = latest.smart_197 ?? 0;
    if (smart197 > 0) {
        isWarning = true;
        if (!reasons.some(r => r.includes("setores pendentes"))) {
            reasons.push(`Existem ${smart197} setor(es) pendente(s) de realocação (SATA/Legado)`);
        }
    }

    if (isCritical) {
        return { status: "CRÍTICO", reasons };
    }

    if (isWarning) {
        return { status: "ATENÇÃO", reasons };
    }

    return { status: "NORMAL", reasons: ["O disco está operando em condições normais de saúde e espaço."] };
}
