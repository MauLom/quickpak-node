const swaggerJSDoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Quickpak API",
            version: "1.0.0",
            description: "Documentación de la API de Quickpak",
        },
        servers: [
            {
                url: process.env.HOST_NAME || "http://localhost:3000",
                description: "Servidor de Quickpak",
            }
        ],
        components: {
            securitySchemes: {
                basicAuth: {
                    type: "http",
                    scheme: "basic",
                },
            },
        },
        security: [{ basicAuth: [] }],
    },
    apis: ["./api-routesV3/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
