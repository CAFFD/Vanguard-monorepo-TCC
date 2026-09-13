import Fastify from "fastify";

import {
    equipmentRoutes
} from "./routes/equipment-routes.js";
import {
    sectorRoutes
} from "./routes/sector-routes.js";
import {
    telemetryRoutes
} from "./routes/telemetry-routes.js";

const app = Fastify({
    logger: true,
});

app.register(telemetryRoutes);
app.register(sectorRoutes);
app.register(equipmentRoutes);

app.listen({
    port: 3000,
    host: "0.0.0.0",
}).then(() => {

    console.log(
        "Servidor rodando na porta 3000"
    );

});