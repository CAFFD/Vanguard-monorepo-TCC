import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import { stripSensitiveFields } from "../lib/sanitize.js";

const JWT_ISSUER = "vanguard-api";
const JWT_AUDIENCE = "vanguard-web";

/**
 * Registra a camada de segurança HTTP no escopo raiz da aplicação.
 * (Chamado diretamente — sem encapsulamento — para valer em todas as rotas.)
 */
export function registerSecurity(app: FastifyInstance) {
    const { config } = app;

    // Cabeçalhos de segurança (HSTS, X-Content-Type-Options, X-Frame-Options,
    // Referrer-Policy, CSP restritiva — a API só serve JSON).
    app.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'none'"],
                frameAncestors: ["'none'"],
            },
        },
        crossOriginResourcePolicy: { policy: "same-site" },
    });

    // CORS restritivo: apenas origens explicitamente autorizadas, com credenciais.
    const allowed = new Set(config.corsOrigins);
    app.register(cors, {
        origin: (origin, cb) => {
            // Sem header Origin = chamada não-navegador (Agente Go, curl, health check).
            if (!origin || allowed.has(origin)) return cb(null, true);
            return cb(null, false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
        maxAge: 600,
    });

    app.register(cookie);

    app.register(jwt, {
        secret: config.jwtSecret,
        cookie: { cookieName: config.cookie.name, signed: false },
        sign: {
            algorithm: "HS256",
            expiresIn: `${config.sessionTtlSeconds}s`,
            iss: JWT_ISSUER,
            aud: JWT_AUDIENCE,
        },
        verify: {
            algorithms: ["HS256"], // fixa o algoritmo (bloqueia "alg: none"/confusão de chaves)
            allowedIss: JWT_ISSUER,
            allowedAud: JWT_AUDIENCE,
            onlyCookie: true, // o token só é aceito via cookie HttpOnly
        },
    });

    // Rate limit desligado globalmente; ativado por rota (ex.: /auth/login).
    app.register(rateLimit, { global: false });

    // Rede de segurança: remove password_hash & cia. de QUALQUER resposta JSON.
    app.addHook("preSerialization", async (_request, _reply, payload) =>
        stripSensitiveFields(payload)
    );
}
