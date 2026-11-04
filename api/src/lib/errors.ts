/**
 * Erros de domínio com status HTTP explícito.
 * O error handler global converte-os em respostas JSON padronizadas.
 * As mensagens destas classes são SEMPRE seguras para exibir ao cliente.
 */
export class AppError extends Error {
    readonly statusCode: number;
    readonly code: string;

    constructor(statusCode: number, code: string, message: string) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Autenticação necessária.") {
        super(401, "UNAUTHORIZED", message);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Você não tem permissão para executar esta ação.") {
        super(403, "FORBIDDEN", message);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Recurso não encontrado.") {
        super(404, "NOT_FOUND", message);
    }
}

export class ConflictError extends AppError {
    constructor(message = "Conflito com o estado atual do recurso.") {
        super(409, "CONFLICT", message);
    }
}

