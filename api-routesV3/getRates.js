const express = require('express');
const router = express.Router();
const basicAuth = require('./basicAuth');
const controllerDHLServices = require('../services/connectionDHLServices');
const controllerEstafetaServices = require('../services/connectionESTAFETAServices');
const controllerZone = require('../services/calculateZone');
const controllerWeight = require('../services/calculateWeight');
const controllerUserData = require('../models/controllerFirebaseBD');
const controllerPrices = require('../services/calculatePricesWithClientData');
const getzoneDHL = require('../services/zoneRequest');
const controllerZonesEstafeta = require('../models/controllerSigsAndZonesEstafeta');
const controllerMongoBD = require('../models/controllerMongoBD');

const cargoCombustibleAereo = 10.10;
const cargoCombustibleTerrestre = 20.31;

// Aplica autenticación básica a todos los endpoints de este router
router.use(basicAuth);

router.post('/', async (req, res) => {
    // Si pasa el middleware de autenticación, siempre responde OK
    return res.status(200).json({ status: "OK", message: "Autenticación exitosa" });
});

module.exports = router;
