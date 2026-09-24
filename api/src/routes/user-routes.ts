import type { FastifyInstance } from "fastify";
import { createUser, getUsers } from "../controllers/user-controller.js";

export async function userRoutes(app: FastifyInstance) {
    app.post("/users", createUser);
    app.get("/users", getUsers);
}
