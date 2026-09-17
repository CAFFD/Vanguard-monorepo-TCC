import type { FastifyInstance } from "fastify";
import {
    createSector,
    getSectors,
} from "../controllers/sector-controller.js";

export async function sectorRoutes(
    app: FastifyInstance
) {
    app.post(
        "/sectors",
        createSector
    );

    app.get(
        "/sectors",
        getSectors
    );
}
