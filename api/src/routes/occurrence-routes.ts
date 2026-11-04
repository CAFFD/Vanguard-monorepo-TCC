import type { FastifyInstance } from 'fastify';
import { OccurrenceController } from '../controllers/occurrence-controller.js';
import { authenticate } from '../middlewares/auth.js';

const occurrenceController = new OccurrenceController();

export async function occurrenceRoutes(app: FastifyInstance) {
  // Fila de chamados e prontuário: acessíveis a GESTOR e TECNICO.
  app.addHook('preHandler', authenticate);

  app.get('/', occurrenceController.getAll);
  app.post('/', occurrenceController.create);
  // Rotas aninhadas de ocorrência no equipamento (registradas no root ou com prefixo)
  app.get('/equipment/:id', occurrenceController.getByEquipmentId);
}
