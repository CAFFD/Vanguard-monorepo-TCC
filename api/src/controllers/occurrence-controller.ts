import type { FastifyReply, FastifyRequest } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { occurrences } from '../db/schema.js';
import { createOccurrenceSchema } from '../schemas/occurrence-schemas.js';
import { randomUUID } from 'crypto';

export class OccurrenceController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createOccurrenceSchema.parse(request.body);

    const newOccurrence = await db
      .insert(occurrences)
      .values({
        id: randomUUID(),
        equipment_id: data.equipment_id,
        // Sem técnico explícito, o chamado é atribuído ao usuário autenticado.
        technician_id: data.technician_id ?? request.user?.sub ?? null,
        created_at: new Date(),
        origin: data.origin,
        priority: data.priority,
        description: data.description,
        diagnosis: data.diagnosis,
        action_taken: data.action_taken,
        closure_date: new Date(), // As occurrence implies an action taken, it's considered closed
      })
      .returning();

    return reply.status(201).send(newOccurrence[0]);
  }

  async getByEquipmentId(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const history = await db
      .select()
      .from(occurrences)
      .where(eq(occurrences.equipment_id, id))
      .orderBy(desc(occurrences.created_at));

    return reply.send(history);
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const history = await db
      .select()
      .from(occurrences)
      .orderBy(desc(occurrences.created_at));

    return reply.send(history);
  }
}
