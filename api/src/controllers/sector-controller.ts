import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { sectors } from "../db/schema.js";
import { NotFoundError } from "../lib/errors.js";
import { createSectorSchema, sectorIdParamsSchema } from "../schemas/sector-schemas.js";

export async function createSector(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id, name, description } = createSectorSchema.parse(request.body);

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

/**
 * DELETE /sectors/:id  (somente GESTOR)
 * Setores vinculados a equipamentos não podem ser excluídos (FK → HTTP 409
 * tratado pelo error handler global).
 */
export async function deleteSector(
    request: FastifyRequest,
    reply: FastifyReply
) {
    const { id } = sectorIdParamsSchema.parse(request.params);

    const [deletedSector] = await db
        .delete(sectors)
        .where(eq(sectors.id, id))
        .returning();

    if (!deletedSector) {
        throw new NotFoundError("Setor não encontrado.");
    }

    return reply.status(200).send({ success: true, data: deletedSector });
}
