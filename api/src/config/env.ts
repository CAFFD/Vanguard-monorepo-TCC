import "dotenv/config";
import * as z from "zod";

/**
 * Configuração da aplicação validada com Zod (fail-fast).
 *
 * Se qualquer variável obrigatória estiver ausente ou fraca, a API se recusa
 * a iniciar. A mensagem de erro cita apenas o NOME da variável — nunca o valor,
 * para não vazar segredos em logs de deploy.
 */
const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),

    // HS256 exige chave com no mínimo 256 bits de entropia (32 bytes).
    JWT_SECRET: z
        .string()
        .min(32, "JWT_SECRET deve ter no mínimo 32 caracteres (gere com: openssl rand -base64 48)"),

    // Tempo de vida da sessão (token + cookie), em horas.
    SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(8),

    // Chave compartilhada do Agente de Borda (header x-api-key).
    AGENT_API_KEY: z
        .string()
        .min(32, "AGENT_API_KEY deve ter no mínimo 32 caracteres (gere com: openssl rand -hex 32)"),

    // Lista de origens permitidas no CORS, separadas por vírgula.
    CORS_ORIGINS: z
        .string()
        .default("http://localhost:5173,http://127.0.0.1:5173"),

    // Política SameSite do cookie de sessão. "none" só é necessário quando o
    // frontend roda em OUTRO site sem proxy (exige HTTPS / Secure).
    COOKIE_SAMESITE: z.enum(["strict", "lax", "none"]).default("lax"),
    COOKIE_SECURE: z.enum(["true", "false"]).optional(),

    // Confiar em X-Forwarded-For (necessário atrás do proxy da Vercel).
    TRUST_PROXY: z.enum(["true", "false"]).optional(),

    // Proteção contra força bruta no login (tentativas por minuto por IP).
    LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
});

export interface AppConfig {
    nodeEnv: "development" | "test" | "production";
    isProduction: boolean;
    databaseUrl: string;
    jwtSecret: string;
    sessionTtlSeconds: number;
    agentApiKey: string;
    corsOrigins: string[];
    cookie: {
        name: string;
        secure: boolean;
        sameSite: "strict" | "lax" | "none";
    };
    trustProxy: boolean;
    loginRateLimitMax: number;
}

export const SESSION_COOKIE_NAME = "vanguard_session";

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
    const parsed = envSchema.safeParse(source);

    if (!parsed.success) {
        const problems = parsed.error.issues
            .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
            .join("\n");
        throw new Error(`FATAL: configuração de ambiente inválida:\n${problems}`);
    }

    const env = parsed.data;
    const isProduction = env.NODE_ENV === "production";

    // SameSite=None obriga Secure (regra dos navegadores).
    const secure =
        env.COOKIE_SAMESITE === "none"
            ? true
            : env.COOKIE_SECURE !== undefined
                ? env.COOKIE_SECURE === "true"
                : isProduction;

    return {
        nodeEnv: env.NODE_ENV,
        isProduction,
        databaseUrl: env.DATABASE_URL,
        jwtSecret: env.JWT_SECRET,
        sessionTtlSeconds: env.SESSION_TTL_HOURS * 60 * 60,
        agentApiKey: env.AGENT_API_KEY,
        corsOrigins: env.CORS_ORIGINS.split(",")
            .map((origin) => origin.trim().replace(/\/$/, ""))
            .filter(Boolean),
        cookie: {
            name: SESSION_COOKIE_NAME,
            secure,
            sameSite: env.COOKIE_SAMESITE,
        },
        trustProxy:
            env.TRUST_PROXY !== undefined ? env.TRUST_PROXY === "true" : isProduction,
        loginRateLimitMax: env.LOGIN_RATE_LIMIT_MAX,
    };
}

