import type { FastifyInstance } from "fastify";
import { createUser, deleteUser, getUsers } from "../controllers/user-controller.js";
import { authenticated, gestorOnly } from "../middlewares/auth.js";

export async function userRoutes(app: FastifyInstance) {
    // Administração de contas: exclusivo do GESTOR.
    app.post("/users", { preHandler: gestorOnly }, createUser);
    app.delete("/users/:id", { preHandler: gestorOnly }, deleteUser);

    // Leitura (sem hash) liberada a ambos — usada para atribuir técnicos a chamados.
    app.get("/users", { preHandler: authenticated }, getUsers);
}
