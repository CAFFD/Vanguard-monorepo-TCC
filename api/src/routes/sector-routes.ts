import type { FastifyInstance } from "fastify";
import {
    createSector,
    deleteSector,
    getSectors,
} from "../controllers/sector-controller.js";
import { authenticated, gestorOnly } from "../middlewares/auth.js";

export async function sectorRoutes(
    app: FastifyInstance
) {
    // Estrutura organizacional: criação/exclusão exclusiva do GESTOR.
    app.post(
        "/sectors",
        { preHandler: gestorOnly },
        createSector
    );

    app.delete(
        "/sectors/:id",
        { preHandler: gestorOnly },
        deleteSector
    );

    app.get(
        "/sectors",
        { preHandler: authenticated },
        getSectors
    );
}
