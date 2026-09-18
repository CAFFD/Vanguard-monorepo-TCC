import "dotenv/config";
import type {
    IncomingMessage,
    ServerResponse,
} from "node:http";

import { buildApp } from "../src/app.js";

/**
 * Handler Serverless para a Vercel.
 *
 * A instância do Fastify é criada uma única vez por cold start
 * (o módulo Node é cacheado pelo runtime da Vercel entre requests),
 * garantindo performance adequada para o MVP.
 *
 * Fluxo:
 * 1. `buildApp()` registra todas as rotas e plugins.
 * 2. `app.ready()` aguarda a inicialização completa (evita race conditions).
 * 3. `app.server.emit('request', ...)` delega req/res ao Fastify
 *    sem abrir nenhuma porta de rede.
 */
const app = buildApp();

export default async function handler(
    req: IncomingMessage,
    res: ServerResponse
): Promise<void> {
    await app.ready();
    app.server.emit("request", req, res);
}
