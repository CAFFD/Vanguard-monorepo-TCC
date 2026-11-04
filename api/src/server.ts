import "dotenv/config";
import { buildApp } from "./app.js";

/**
 * Entrypoint para desenvolvimento local.
 * Usa a factory `buildApp()` e inicia o listener de porta.
 * Este arquivo NÃO é usado pela Vercel — veja `api/index.ts`.
 */
const app = buildApp();

app.listen({
    port: 3000,
    host: "0.0.0.0",
}).then(() => {
    console.log("Servidor rodando na porta 3000");
});