const express = require('express');
const router = express.Router();
const getzoneDHL = require('../services/zoneRequest')


router.post('/', (request, response) => {
    var cpOrigin = ""
    var cpDestino = ""
    if (request.body.cpOrigin === "" || request.body.cpOrigin === undefined) {
        response.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'CpOrigen' del body" })
    } else if (request.body.cpDestino === "" || request.body.cpDestino === undefined) {
        response.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'CpDestino' del body" })

    } else {
        cpOrigin = request.body.cpOrigin
        cpDestino = request.body.cpDestino
        const zonedhl = getzoneDHL.getZoneRequest(cpOrigin, cpDestino);
        console.log("zone on URL:", zonedhl)
        response.status(200).json({ message: "ok", zone:zonedhl})

    }
})
module.exports = router