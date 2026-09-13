import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db/index.js";
import { sectors } from "../db/schema.js";

interface CreateSectorBody {
    id: string;
    name: string;
    description: string;
}

export async function createSector(
    request: FastifyRequest<{ Body: CreateSectorBody }>,
    reply: FastifyReply
) {
    const { id, name, description } = request.body;

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
