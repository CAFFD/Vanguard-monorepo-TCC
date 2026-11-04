import type { FastifyInstance } from "fastify";
import { login, logout, me } from "../controllers/auth-controller.js";
import { authenticated } from "../middlewares/auth.js";

export async function authRoutes(app: FastifyInstance) {
    app.post(
        "/auth/login",
        {
            config: {
                // Proteção contra força bruta / credential stuffing.
                rateLimit: {
                    max: app.config.loginRateLimitMax,
                    timeWindow: "1 minute",
                },
            },
        },
        login
    );

    app.post("/auth/logout", logout);

    app.get("/auth/me", { preHandler: authenticated }, me);
}

