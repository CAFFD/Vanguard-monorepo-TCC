import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db/index.js";
import { sectors } from "../db/schema.js";
import { createSectorSchema } from "../schemas/sector-schemas.js";

export async function createSector(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const result = createSectorSchema.safeParse(request.body);

    if (!result.success) {
        return reply.status(400).send({
            success: false,
            message: "Dados de setor inválidos",
            errors: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    const { id, name, description } = result.data;

    const [createdSector] = await db
        .insert(sectors)
        .values({
            id,
            name,
            description,
        })
        .returning();

    return reply.status(201).send({
        success: true,
        data: createdSector,
    });
}

export async function getSectors(
    _request: FastifyRequest,
    reply: FastifyReply
) {
    const allSectors = await db.select().from(sectors);

    return reply.status(200).send(allSectors);
}
