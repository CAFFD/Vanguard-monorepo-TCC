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

const OFFLINE_TIMEOUT_REASON = "Ativo offline há mais de 2 horas";
const NO_READING_DEFAULT_REASON = "O agente local não possui permissão para ler o disco ou o formato não é suportado";

function normalizeStoredStatus(rawStatus?: string | null): HealthStatus | null {
    if (!rawStatus) return null;
    const normalized = rawStatus
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/\s+/g, "_");

    if (normalized === "SEM_LEITURA") return "SEM_LEITURA";
    if (normalized === "CRITICO") return "CRÍTICO";
    if (normalized === "ATENCAO") return "ATENÇÃO";
    if (normalized === "NORMAL") return "NORMAL";
    if (normalized === "OFFLINE") return "OFFLINE";
    return null;
}

export function classifyHealth(
    latest: TelemetryRow | undefined,
    previous: TelemetryRow | undefined,
    nowMs: number = Date.now(),
    fallbackStoredStatus?: string | null
): HealthResult {
    const storedStatus = normalizeStoredStatus(fallbackStoredStatus);

    if (!latest || !latest.created_at) {
        if (storedStatus === "SEM_LEITURA") {
            return {
                status: "SEM_LEITURA",
                reasons: [NO_READING_DEFAULT_REASON, OFFLINE_TIMEOUT_REASON],
            };
        }
        if (storedStatus === "CRÍTICO") {
            return {
                status: "CRÍTICO",
                reasons: ["Estado crítico registrado no banco de dados", OFFLINE_TIMEOUT_REASON],
            };
        }
        return { status: "OFFLINE", reasons: ["Nenhuma telemetria recebida recentemente"] };
    }

    const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;
    const isTimedOut = nowMs - latest.created_at.getTime() > TWO_HOURS_IN_MS;

    if (latest.collection_status === "failed") {
        const reasons = [NO_READING_DEFAULT_REASON];
        if (isTimedOut) {
            reasons.push(OFFLINE_TIMEOUT_REASON);
        }
        return { status: "SEM_LEITURA", reasons };
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

    if (isCritical) {
        if (isTimedOut) {
            reasons.push(OFFLINE_TIMEOUT_REASON);
        }
        return { status: "CRÍTICO", reasons };
    }

    // Se expirou o timeout de 2h e o último estado persistido no banco era SEM_LEITURA ou CRÍTICO, preserva a prioridade de erro
    if (isTimedOut) {
        if (storedStatus === "SEM_LEITURA") {
            return {
                status: "SEM_LEITURA",
                reasons: [NO_READING_DEFAULT_REASON, OFFLINE_TIMEOUT_REASON],
            };
        }
        if (storedStatus === "CRÍTICO") {
            return {
                status: "CRÍTICO",
                reasons: ["Estado crítico registrado no banco de dados", OFFLINE_TIMEOUT_REASON],
            };
        }
        return { status: "OFFLINE", reasons: ["Dispositivo inativo há mais de 2 horas"] };
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

    if (isWarning) {
        return { status: "ATENÇÃO", reasons };
    }

    return { status: "NORMAL", reasons: ["O disco está operando em condições normais de saúde e espaço."] };
}
