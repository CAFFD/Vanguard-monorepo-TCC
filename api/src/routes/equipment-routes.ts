import type { FastifyInstance } from "fastify";
import {
    createEquipment,
    getEquipments,
    updateEquipment,
    getEquipmentById,
} from "../controllers/equipment-controller.js";
import { authenticated, gestorOnly } from "../middlewares/auth.js";

export async function equipmentRoutes(
    app: FastifyInstance
) {
    // Inventário de ativos: cadastro/alteração exclusivos do GESTOR.
    app.post(
        "/equipments",
        { preHandler: gestorOnly },
        createEquipment
    );

    // Dashboard e prontuário: ambos os perfis.
    app.get(
        "/equipments",
        { preHandler: authenticated },
        getEquipments
    );
    
    app.get<{ Params: { id: string } }>(
        "/equipments/:id",
        { preHandler: authenticated },
        getEquipmentById
    );

    app.put<{ Params: { id: string } }>(
        "/equipments/:id",
        { preHandler: gestorOnly },
        updateEquipment
    );
}
