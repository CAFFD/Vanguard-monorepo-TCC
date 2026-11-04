import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["src/**/*.test.ts"],
        // Variáveis fictícias: os testes NUNCA tocam o banco real
        // (repositórios são substituídos por mocks e o cliente postgres é lazy).
        env: {
            NODE_ENV: "test",
            DATABASE_URL: "postgres://test:test@127.0.0.1:5432/vanguard_test",
            JWT_SECRET: "test-only-jwt-secret-with-at-least-32-characters!!",
            AGENT_API_KEY: "test-only-agent-api-key-0123456789abcdef0123456789",
            CORS_ORIGINS: "http://localhost:5173",
        },
    },
});

