import { randomUUID } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ConflictError, ForbiddenError, NotFoundError } from "../lib/errors.js";
import { hashPassword } from "../lib/password.js";
import { toPublicUser } from "../lib/sanitize.js";
import { userRepository } from "../repositories/user-repository.js";
import { createUserSchema, userIdParamsSchema } from "../schemas/user-schemas.js";

/**
 * POST /users  (somente GESTOR)
 * Cadastra um novo usuário (Gestor ou Técnico).
 * A senha é recebida via HTTPS e armazenada apenas como hash scrypt.
 * Erros de validação do Zod são capturados pelo setErrorHandler global.
 */
export async function createUser(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id, name, email, role, password } = createUserSchema.parse(request.body);

    if (await userRepository.findByEmail(email)) {
        throw new ConflictError("Já existe um usuário cadastrado com este e-mail.");
    }

    const createdUser = await userRepository.create({
        id: id ?? randomUUID(),
        name,
        email,
        role,
        password_hash: await hashPassword(password),
    });

    return reply.status(201).send({
        success: true,
        data: toPublicUser(createdUser), // Nunca retornar o hash da senha
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
    const allUsers = await userRepository.list();

    return reply.status(200).send(allUsers.map(toPublicUser));
}

/**
 * DELETE /users/:id  (somente GESTOR)
 * Remove um usuário. Um gestor não pode excluir a própria conta.
 */
export async function deleteUser(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id } = userIdParamsSchema.parse(request.params);

    if (id === request.user.sub) {
        throw new ForbiddenError("Você não pode excluir a sua própria conta.");
    }

    const deleted = await userRepository.deleteById(id);
    if (!deleted) {
        throw new NotFoundError("Usuário não encontrado.");
    }

    return reply.status(200).send({ success: true, data: toPublicUser(deleted) });
}
