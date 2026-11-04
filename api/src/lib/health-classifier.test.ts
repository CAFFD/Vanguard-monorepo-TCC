import { describe, it, expect } from "vitest";
import { classifyHealth, type TelemetryRow } from "./health-classifier.js";

describe("classifyHealth", () => {
    const nowMs = new Date("2026-10-06T12:00:00Z").getTime();
    
    const baseRow: TelemetryRow = {
        created_at: new Date(nowMs - 1000), // 1 second ago
        collection_status: "ok",
        schema_version: 2,
        smart_passed: true,
        critical_warnings: 0,
        media_errors: 0,
        life_remaining_pct: 100,
        disk_usage_percent: "45.0",
        smart_197: 0,
        smart_198: 0,
    };

    it("retorna NORMAL para um equipamento perfeitamente saudável", () => {
        const result = classifyHealth(baseRow, undefined, nowMs);
        expect(result.status).toBe("NORMAL");
    });

    it("retorna OFFLINE se não houver telemetria (undefined)", () => {
        const result = classifyHealth(undefined, undefined, nowMs);
        expect(result.status).toBe("OFFLINE");
    });

    it("retorna OFFLINE se a última telemetria for mais antiga que 2 horas", () => {
        const row = { ...baseRow, created_at: new Date(nowMs - 3 * 60 * 60 * 1000) };
        const result = classifyHealth(row, undefined, nowMs);
        expect(result.status).toBe("OFFLINE");
    });

    it("retorna SEM_LEITURA se a coleta falhou (agent cego)", () => {
        const row = { ...baseRow, collection_status: "failed" };
        const result = classifyHealth(row, undefined, nowMs);
        expect(result.status).toBe("SEM_LEITURA");
    });

    it("retorna CRÍTICO se smart_passed = false", () => {
        const row = { ...baseRow, smart_passed: false };
        const result = classifyHealth(row, undefined, nowMs);
        expect(result.status).toBe("CRÍTICO");
        expect(result.reasons.some(r => r.includes("smart_passed = false"))).toBe(true);
    });

    it("retorna CRÍTICO se houver critical_warnings > 0", () => {
        const row = { ...baseRow, critical_warnings: 2 };
        const result = classifyHealth(row, undefined, nowMs);
        expect(result.status).toBe("CRÍTICO");
        expect(result.reasons.some(r => r.includes("2 aviso(s) crítico(s)"))).toBe(true);
    });

    it("retorna CRÍTICO se life_remaining_pct <= 10%", () => {
        const row = { ...baseRow, life_remaining_pct: 5 };
        const result = classifyHealth(row, undefined, nowMs);
        expect(result.status).toBe("CRÍTICO");
        expect(result.reasons.some(r => r.includes("apenas 5%"))).toBe(true);
    });

    it("retorna CRÍTICO se novos erros de mídia (media_errors) aparecerem", () => {
        const previous = { ...baseRow, media_errors: 2 };
        const current = { ...baseRow, media_errors: 5 };
        const result = classifyHealth(current, previous, nowMs);
        expect(result.status).toBe("CRÍTICO");
        expect(result.reasons.some(r => r.includes("Novos erros de mídia detectados"))).toBe(true);
    });

    it("retorna ATENÇÃO se o disco está quase cheio (> 90%)", () => {
        const row = { ...baseRow, disk_usage_percent: "95.5" };
        const result = classifyHealth(row, undefined, nowMs);
        expect(result.status).toBe("ATENÇÃO");
        expect(result.reasons.some(r => r.includes("Armazenamento quase cheio"))).toBe(true);
    });

    it("retorna ATENÇÃO para erros de mídia históricos (> 0) sem novos erros", () => {
        // media_errors = 5 no previous e no current
        const previous = { ...baseRow, media_errors: 5 };
        const current = { ...baseRow, media_errors: 5 };
        const result = classifyHealth(current, previous, nowMs);
        expect(result.status).toBe("ATENÇÃO");
        expect(result.reasons.some(r => r.includes("O disco acumula 5 erro(s)"))).toBe(true);
    });

    it("retorna ATENÇÃO se life_remaining_pct está entre 10% e 20%", () => {
        const row = { ...baseRow, life_remaining_pct: 15 };
        const result = classifyHealth(row, undefined, nowMs);
        expect(result.status).toBe("ATENÇÃO");
        expect(result.reasons.some(r => r.includes("baixa: 15%"))).toBe(true);
    });

    it("retorna ATENÇÃO se a coleta foi parcial", () => {
        const row = { ...baseRow, collection_status: "partial" };
        const result = classifyHealth(row, undefined, nowMs);
        expect(result.status).toBe("ATENÇÃO");
        expect(result.reasons.some(r => r.includes("Leitura parcial"))).toBe(true);
    });

    // Testes de Legado (HDDs antigos via smart_197 e 198)
    it("retorna CRÍTICO se bad blocks aumentarem (Legado)", () => {
        const previous = { ...baseRow, smart_197: 1, smart_198: 1 };
        const current = { ...baseRow, smart_197: 2, smart_198: 2 };
        const result = classifyHealth(current, previous, nowMs);
        expect(result.status).toBe("CRÍTICO");
    });

    it("retorna ATENÇÃO se tiver bad blocks pendentes mas sem novos (Legado)", () => {
        const previous = { ...baseRow, smart_197: 1, smart_198: 1 };
        const current = { ...baseRow, smart_197: 1, smart_198: 1 };
        const result = classifyHealth(current, previous, nowMs);
        expect(result.status).toBe("ATENÇÃO");
    });
});
