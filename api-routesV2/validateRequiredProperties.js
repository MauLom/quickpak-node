function validateRequiredProperties(req, res, requiredProperties) {
    for (const property of requiredProperties) {
        if (!req.body[property] && req.body[property] !== 0) {
            return res.status(500).json({ status: 'error', message: `No se pudo leer la propiedad '${property}' del body` });
        }
    }
}
module.exports = {
    validateRequiredProperties,
};