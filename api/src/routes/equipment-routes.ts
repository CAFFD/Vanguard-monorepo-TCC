import type { FastifyInstance } from "fastify";
import {
    createEquipment,
    getEquipments,
    updateEquipment,
    getEquipmentById,
} from "../controllers/equipment-controller.js";

export async function equipmentRoutes(
    app: FastifyInstance
) {
    app.post(
        "/equipments",
        createEquipment
    );

    app.get(
        "/equipments",
        getEquipments
    );
    
    app.get(
        "/equipments/:id",
        getEquipmentById
    );

    app.put(
        "/equipments/:id",
        updateEquipment
    );
}

