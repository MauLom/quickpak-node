const swaggerJSDoc = require("swagger-jsdoc");

const options = {
    definition: {
    openapi: "3.0.0",
    info: {
        title: "Quickpak API",
        version: "1.0.0",
        description: "Documentación de la API de Quickpak",
    },
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
  apis: ["./api-routesV3/*.js"], // Documenta todos los archivos de rutas V3
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
