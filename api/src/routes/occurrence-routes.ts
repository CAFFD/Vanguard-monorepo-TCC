import type { FastifyInstance } from 'fastify';
import { OccurrenceController } from '../controllers/occurrence-controller.js';

const occurrenceController = new OccurrenceController();

export async function occurrenceRoutes(app: FastifyInstance) {
  app.post('/', occurrenceController.create);
  // Rotas aninhadas de ocorrência no equipamento (registradas no root ou com prefixo)
  app.get('/equipment/:id', occurrenceController.getByEquipmentId);
}
