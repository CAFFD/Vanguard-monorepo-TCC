import type { FastifyInstance } from "fastify";
import {
    createEquipment,
    getEquipments,
    updateEquipment,
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

    app.put(
        "/equipments/:id",
        updateEquipment
    );
}
