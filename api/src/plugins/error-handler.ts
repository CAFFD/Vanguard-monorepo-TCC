import type { FastifyError, FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";

/**
 * Tratamento global de exceções.
 *
 * Contrato de erro padronizado:
 *   { success: false, error: <CÓDIGO>, message: <texto seguro>, errors?: [...] }
 *
 * Regras de Data Leak Prevention:
 * - Stack traces, mensagens do driver PostgreSQL/Drizzle, SQL, hosts e
 *   variáveis de ambiente NUNCA são enviados ao cliente.
 * - Erros 5xx são registrados integralmente no log do servidor e o cliente
 *   recebe apenas uma mensagem genérica + requestId para correlação.
 */

const PG_ERROR_MAP: Record<string, { status: number; code: string; message: string }> = {
    "23505": { status: 409, code: "CONFLICT", message: "Registro duplicado: já existe um item com estes dados." },
    "23503": { status: 409, code: "CONFLICT", message: "Operação não permitida: o registro está vinculado a outros dados." },
    "23502": { status: 400, code: "VALIDATION_ERROR", message: "Campo obrigatório ausente." },
    "22P02": { status: 400, code: "VALIDATION_ERROR", message: "Formato de dado inválido." },
};

function isZodError(error: unknown): error is ZodError {
    return error instanceof ZodError ||
        (error instanceof Error && error.name === "ZodError" && Array.isArray((error as ZodError).issues));
}

/** Drizzle encapsula o erro do driver em `cause`; procuramos o SQLSTATE nos dois níveis. */
function getPgCode(error: unknown): string | undefined {
    const candidates = [error, (error as { cause?: unknown })?.cause];
    for (const candidate of candidates) {
        const code = (candidate as { code?: unknown })?.code;
        if (typeof code === "string" && code in PG_ERROR_MAP) return code;
    }
    return undefined;
}

export function registerErrorHandler(app: FastifyInstance) {
    app.setErrorHandler((error: FastifyError | Error, request, reply) => {
        // 1. Validação de contrato (Zod) → 400 estruturado
        if (isZodError(error)) {
            return reply.status(400).send({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Dados inválidos.",
                errors: error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }

        // 2. Validação nativa do Fastify (JSON schema)
        if ("validation" in error && error.validation) {
            return reply.status(400).send({
                success: false,
                error: "VALIDATION_ERROR",
                message: "Dados inválidos.",
            });
        }

        // 3. Erros de domínio (401, 403, 404, 409...) — mensagens seguras por definição
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send({
                success: false,
                error: error.code,
                message: error.message,
            });
        }

        // 4. Violações de integridade do PostgreSQL → status semântico, sem detalhes do banco
        const pgCode = getPgCode(error);
        if (pgCode) {
            const mapped = PG_ERROR_MAP[pgCode]!;
            request.log.warn({ pgCode }, "Violação de integridade no banco");
            return reply.status(mapped.status).send({
                success: false,
                error: mapped.code,
                message: mapped.message,
            });
        }

        // 5. Erros 4xx do próprio Fastify/plugins (JSON malformado, 415, 429, payload grande...)
        const statusCode = "statusCode" in error && typeof error.statusCode === "number"
            ? error.statusCode
            : 500;

        if (statusCode >= 400 && statusCode < 500) {
            return reply.status(statusCode).send({
                success: false,
                error: statusCode === 429 ? "TOO_MANY_REQUESTS" : "BAD_REQUEST",
                message: statusCode === 429
                    ? "Muitas tentativas. Aguarde um minuto e tente novamente."
                    : error.message,
            });
        }

        // 6. Inesperado → 500 genérico (detalhes apenas no log do servidor)
        request.log.error({ err: error }, "Erro interno não tratado");
        return reply.status(500).send({
            success: false,
            error: "INTERNAL_SERVER_ERROR",
            message: "Erro interno do servidor. Tente novamente mais tarde.",
            requestId: request.id,
        });
    });

    app.setNotFoundHandler((request, reply) => {
        return reply.status(404).send({
            success: false,
            error: "NOT_FOUND",
            message: `Rota ${request.method} ${request.url.split("?")[0]} não encontrada.`,
        });
    });
}

