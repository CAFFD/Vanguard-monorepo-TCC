/**
 * Data Leak Prevention: remoção de campos sensíveis das respostas.
 *
 * Duas camadas de defesa:
 * 1. `toPublicUser` — projeção explícita (allow-list) usada pelos controllers.
 * 2. `stripSensitiveFields` — rede de segurança global (deny-list), executada
 *    no hook `preSerialization` para TODA resposta JSON da API.
 */

const SENSITIVE_KEYS = new Set([
    "password",
    "password_hash",
    "passwordHash",
    "token",
    "jwt",
]);

export interface PublicUser {
    id: string;
    name: string | null;
    email: string | null;
    role: string | null;
}

export function toPublicUser(user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string | null;
}): PublicUser {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (value === null || typeof value !== "object") return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

/**
 * Percorre o payload e remove chaves sensíveis em qualquer profundidade.
 * Copy-on-write: só aloca novos objetos quando algo precisa ser removido.
 */
export function stripSensitiveFields<T>(value: T): T {
    if (Array.isArray(value)) {
        let changed = false;
        const result = value.map((item) => {
            const cleaned = stripSensitiveFields(item);
            if (cleaned !== item) changed = true;
            return cleaned;
        });
        return (changed ? result : value) as T;
    }

    if (isPlainObject(value)) {
        let changed = false;
        const result: Record<string, unknown> = {};
        for (const [key, child] of Object.entries(value)) {
            if (SENSITIVE_KEYS.has(key)) {
                changed = true;
                continue;
            }
            const cleaned = stripSensitiveFields(child);
            if (cleaned !== child) changed = true;
            result[key] = cleaned;
        }
        return (changed ? result : value) as T;
    }

    return value;
}

