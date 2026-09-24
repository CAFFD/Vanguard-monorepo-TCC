import { randomUUID } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { createUserSchema } from "../schemas/user-schemas.js";

/**
 * POST /users
 * Cadastra um novo usuário (Gestor ou Técnico).
 * A senha deve chegar já hasheada pelo frontend — nunca texto puro.
 */
export async function createUser(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const result = createUserSchema.safeParse(request.body);

    if (!result.success) {
        return reply.status(400).send({
            success: false,
            message: "Dados de usuário inválidos",
            errors: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    const { id, name, email, role, password_hash } = result.data;

    const [createdUser] = await db
        .insert(users)
        .values({ id, name, email, role, password_hash })
        .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            // Nunca retornar o hash da senha
        });

    return reply.status(201).send({
        success: true,
        data: createdUser,
    });
}

/**
 * GET /users
 * Lista todos os usuários cadastrados (sem expor password_hash).
 */
export async function getUsers(
    _request: FastifyRequest,
    reply: FastifyReply
) {
    const allUsers = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
        })
        .from(users);

    return reply.status(200).send(allUsers);
}
