import Fastify from "fastify";

import {
    telemetryRoutes
} from "./routes/telemetry-routes.js";

const app = Fastify({
    logger: true,
});

app.register(telemetryRoutes);

app.listen({
    port: 3000,
    host: "0.0.0.0",
}).then(() => {

    console.log(
        "Servidor rodando na porta 3000"
    );

});