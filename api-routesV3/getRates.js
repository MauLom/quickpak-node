const express = require('express');
const router = express.Router();
const { basicAuth } = require('./basicAuth');
const { getAuthenticatedUsername } = require('./basicAuth');
const controllerDHLServices = require('../services/connectionDHLServices');
const controllerEstafetaServices = require('../services/connectionESTAFETAServices');
const controllerWeight = require('../services/calculateWeight');
const controllerPrices = require('../services/calculatePricesWithClientData');
const getzoneDHL = require('../services/zoneRequest');
const controllerZonesEstafeta = require('../models/controllerSigsAndZonesEstafeta');
const controllerMongoBD = require('../models/controllerMongoBD');
const FFTaxes = require('../src/models/FFTaxes');

const getTasasByPaqueteria = async (paqueteria) => {
    return await FFTaxes.findOne({ paqueteria: new RegExp(`^${paqueteria}$`, 'i') }); // insensitive match
};



router.use(basicAuth);

/**
 * @swagger
 * /api/v3/rate/dhl:
 *   post:
 *     summary: Cotiza tarifas DHL para un envío
 *     description: |
 *       Cotiza tarifas DHL usando los datos de origen, destino, paquetes y usuario. Requiere autenticación básica.
 *     tags:
 *       - Rates
 *     security:
 *       - basicAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: "Fecha y hora del envío en formato ISO. Ejemplo: '2025-01-11T12:28+GMT+0500'"
 *                 example: "2025-01-11T12:28+GMT+0500"
 *               shipperCity:
 *                 type: string
 *                 example: "Cajeme"
 *               shipperCountryCode:
 *                 type: string
 *                 example: "MX"
 *               shipperZip:
 *                 type: string
 *                 example: "97115"
 *               recipientCity:
 *                 type: string
 *                 example: "Benito Juárez"
 *               recipientCountryCode:
 *                 type: string
 *                 example: "MX"
 *               recipientZip:
 *                 type: string
 *                 example: "31216"
 *               packages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     number:
 *                       type: integer
 *                       description: "Número de paquete"
 *                       example: 1
 *                     weight:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: string
 *                           description: "Peso del paquete en kilogramos"
 *                           example: "25"
 *                     dimensions:
 *                       type: object
 *                       properties:
 *                         length:
 *                           type: string
 *                           description: "Largo del paquete en cm"
 *                           example: "10"
 *                         width:
 *                           type: string
 *                           description: "Ancho del paquete en cm"
 *                           example: "10"
 *                         height:
 *                           type: string
 *                           description: "Alto del paquete en cm"
 *                           example: "10"
 *               insurance:
 *                 type: string
 *                 description: "Valor declarado para seguro"
 *                 example: "0"
 *               hora:
 *                 type: string
 *                 description: "(Opcional) Hora de recolección"
 *                 example: "10:00"
 *     responses:
 *       200:
 *         description: Cotización exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 messages:
 *                   type: string
 *                   example: ok
 *                 zone:
 *                   type: object
 *                   additionalProperties: true
 *                 data:
 *                   type: object
 *                   additionalProperties: true
 *       401:
 *         description: Autenticación requerida o fallida
 *       403:
 *         description: Usuario inactivo
 *       500:
 *         description: Error interno del servidor
 */
router.post('/dhl', async (req, res) => {
    const {
        timestamp,
        shipperCity,
        shipperCountryCode,
        shipperZip,
        recipientCity,
        recipientCountryCode,
        recipientZip,
        packages,
        insurance,
        hora,
    } = req.body;

    const requiredFields = {
        timestamp,
        shipperCity,
        shipperCountryCode,
        shipperZip,
        recipientCity,
        recipientCountryCode,
        recipientZip,
        packages,
        insurance,
    };

    const missingField = Object.entries(requiredFields).find(([key, value]) => value === undefined || value === '');

    if (missingField) {
        return res.status(500).json({ status: "error", messages: `No se pudo leer la propiedad '${missingField[0]}' del body` });
    }

    let cpOrigin = shipperZip;
    let cpDestino = recipientZip;
    let seguroMontoDeclarado = 0;
    let llevaSeguro = false;

    if (hora !== undefined) {
        seguroMontoDeclarado = parseFloat(insurance).toFixed(2).replace(",", ".");
        llevaSeguro = true;
    }

    try {
        const normalizedPackages = packages.map(normalizeKeys);
        const dataToDHL = controllerDHLServices.structureRequestToDHL(timestamp, shipperCity, cpOrigin, shipperCountryCode, recipientCity, cpDestino, recipientCountryCode, normalizedPackages, insurance);
        const dataResponseDHL = await controllerDHLServices.getRateAndStructure(dataToDHL);
        if (dataResponseDHL?.error) {
            return res.status(500).json({ status: "Error", messages: dataResponseDHL.message });
        }

        const weightForCalcs = controllerWeight.getWeightForCalcs(normalizedPackages);

        // Obtener el username autenticado desde req.user o desde el header Authorization
        let username = getAuthenticatedUsername(req);
        if (!username) {
            return res.status(401).json({ status: "error", messages: "No se pudo determinar el usuario autenticado" });
        }
        // Buscar la matriz de precios DHL en user_pricing por username
        const pricing_matrix_dhl = await controllerMongoBD.getDHLMatrixByUsername(username);

        if (!pricing_matrix_dhl) {
            return res.status(404).json({ status: "error", messages: "No se encontró matriz DHL para el usuario" });
        }

        const clientDataSheet = { data: pricing_matrix_dhl };

        const validServicesDHL = ["G", "N"];

        const zonedhl = getzoneDHL.getZoneRequest(cpOrigin, cpDestino);

        const tasas = await getTasasByPaqueteria("dhl");


        const cargoCombustibleAereo = tasas?.tasaAerea;
        const cargoCombustibleTerrestre = tasas?.tasaTerrestre;

        const pricesBasedOnClientData = controllerPrices.getPricesBasedOnSheet(dataResponseDHL, clientDataSheet, weightForCalcs, zonedhl, Number.parseFloat(cargoCombustibleAereo), Number.parseFloat(cargoCombustibleTerrestre), validServicesDHL);

        return res.status(200).json({ status: "OK", messages: "ok", zone: zonedhl, data: pricesBasedOnClientData });
    } catch (error) {
        return res.status(500).json({ status: "error", messages: error.message });
    }
});

/**
 * @swagger
 * /api/v3/rate/estafeta:
 *   post:
 *     summary: Cotiza tarifas Estafeta para un envío
 *     description: |
 *       Cotiza tarifas Estafeta usando los datos de origen, destino, paquete y usuario. Requiere autenticación básica.
 *     tags:
 *       - Rates
 *     security:
 *       - basicAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *              - height
 *              - width
 *              - isPackage
 *              - length
 *              - weight
 *              - originZip
 *              - destinationZip
 *             properties:
 *               height:
 *                 type: string
 *                 description: "Alto del paquete en centímetros. Ejemplo: '10'"
 *                 example: "10"
 *               width:
 *                 type: string
 *                 description: "Ancho del paquete en centímetros. Ejemplo: '10'"
 *                 example: "10"
 *               isPackage:
 *                 type: boolean
 *                 description: "Indica si el envío es un paquete (true) o sobre (false)."
 *                 example: true
 *               length:
 *                 type: string
 *                 description: "Largo del paquete en centímetros. Ejemplo: '10'"
 *                 example: "10"
 *               weight:
 *                 type: string
 *                 description: "Peso del paquete en kilogramos. Ejemplo: '5'"
 *                 example: "5"
 *               originZip:
 *                 type: string
 *                 description: "Código postal de origen. Ejemplo: '64000'"
 *                 example: "64000"
 *               destinationZip:
 *                 type: string
 *                 description: "Código postal de destino. Ejemplo: '77600'"
 *                 example: "77600"
 *               insurance:
 *                 type: number
 *                 description: "Valor declarado del seguro. Ejemplo: 0"
 *                 example: 0
 *     responses:
 *       200:
 *         description: Cotización exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 messages:
 *                   type: string
 *                   example: OK
 *                 data:
 *                   type: object
 *                 diasEntrega:
 *                   type: string
 *                 manejoEspecial:
 *                   type: string
 *                 ocurreForzoso:
 *                   type: string
 *                 zone:
 *                   type: object
 *       500:
 *         description: Error en la solicitud o datos incompletos
 */
router.post('/estafeta', async (req, res) => {
    const {
        height,
        width,
        isPackage,
        length,
        weight,
        originZip,
        destinationZip,
        insurance = 0, // Valor por defecto si no se proporciona
    } = req.body;

    const requiredFields = { height, width, isPackage, length, weight, originZip, destinationZip };
    const missingField = Object.entries(requiredFields).find(([key, value]) => value === undefined || value === '');
    if (missingField) {
        return res.status(500).json({ status: "error", messages: `No se pudo leer la propiedad '${missingField[0]}' del body` });
    }

    // Remapeo a variables en español para mantener compatibilidad interna
    const alto = height;
    const ancho = width;
    const esPaquete = isPackage;
    const largo = length;
    const peso = weight;
    const originZipES = originZip;
    const destinyZipES = destinationZip;
    const seguro = insurance;

    const dataRequest = {
        "idusuario": "1",
        "usuario": "AdminUser",
        "contra": ",1,B(vVi",
        "esFrecuencia": "true",
        "esLista": "true",
        "tipoEnvio": { "Alto": alto, "Ancho": ancho, "EsPaquete": esPaquete, "Largo": largo, "Peso": peso },
        "datosOrigen": { "string": [originZipES] },
        "datosDestino": { "string": [destinyZipES] }
    };

    try {
        const dataResponseESTAFETARaw = await controllerEstafetaServices.getRates(dataRequest);
        const dataResponseESTAFETA = dataResponseESTAFETARaw.FrecuenciaCotizadorResponse.FrecuenciaCotizadorResult.Respuesta;

        if (dataResponseESTAFETA.Error !== "000") {
            return res.status(200).json({ status: "error", message: dataResponseESTAFETA.MensajeError, errorCode: dataResponseESTAFETA.Error });
        }

        const zone = await controllerZonesEstafeta.getZoneByZips(originZipES, destinyZipES);

        if (zone.error) {
            return res.status(501).json({ status: "error", message: zone.error });
        }
        // Obtener el username autenticado desde req.user o desde el header Authorization
        let username = getAuthenticatedUsername(req);
        if (!username) {
            return res.status(401).json({ status: "error", messages: "No se pudo determinar el usuario autenticado" });
        }

        const response = await controllerMongoBD.getEstafetaMatrixByUsername(username);
        const clientDataSheet = { data: response };

        const weightForCalcs = await controllerWeight.getWeightForCalcsFromEstafetaPackage({ alto, ancho, largo, peso });
        // const ffTaxes = await controllerMongoBD.findGeneralValues();
        const costoReexpedicion = dataResponseESTAFETARaw.FrecuenciaCotizadorResponse.FrecuenciaCotizadorResult.Respuesta.CostoReexpedicion;
        const DiasEntrega = dataResponseESTAFETARaw.FrecuenciaCotizadorResponse.FrecuenciaCotizadorResult.Respuesta.DiasEntrega;
        const txtManejoEspecial = "Envíos identificados como frágil, empaque irregular, envíos no transportables por bandas pueden generar un costo extra de  $63.67";
        const ocurreForzoso = dataResponseESTAFETARaw.FrecuenciaCotizadorResponse.FrecuenciaCotizadorResult.Respuesta.ModalidadEntrega.OcurreForzoso;

        const dataResponseEstafeta = await controllerEstafetaServices.getValidServices(dataResponseESTAFETA.TipoServicio.TipoServicio, zone);
        const calculoSeguro = parseFloat(Number(seguro || 0) * 0.0125).toFixed(2);

        const cargoCombustibleAereo = await getTasasByPaqueteria("estafeta")?.tasaAerea || getTasasByPaqueteria("dhl")?.tasaAerea;
        const cargoCombustibleTerrestre = await getTasasByPaqueteria("estafeta")?.tasaTerrestre || getTasasByPaqueteria("dhl")?.tasaTerrestre;

        const dataBasedOnUserSheet = await controllerPrices.getPricesEstafetaBasedOnSheet(
            dataResponseEstafeta,
            clientDataSheet,
            weightForCalcs,
            zone,
            Number.parseFloat(cargoCombustibleAereo / 100),
            Number.parseFloat(cargoCombustibleTerrestre / 100),
            costoReexpedicion !== "No" ? costoReexpedicion : "0",
            calculoSeguro
        );

        return res.status(200).json({
            status: "ok",
            messages: "OK",
            data: dataBasedOnUserSheet,
            diasEntrega: DiasEntrega,
            manejoEspecial: txtManejoEspecial,
            ocurreForzoso: ocurreForzoso,
            zone: zone
        });
    } catch (error) {
        return res.status(500).json({ status: "error", message: error.message });
    }
});

const normalizeKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return obj; // Manejo de casos no válidos
    return Object.entries(obj).reduce((acc, [key, value]) => {
        const sanitizedKey = key.replace(/[^a-zA-Z0-9]/g, '');
        const normalizedKey = sanitizedKey.charAt(0).toUpperCase() + sanitizedKey.slice(1).toLowerCase();
        acc[normalizedKey] = normalizeKeys(value); // Recursividad para objetos anidados
        return acc;
    }, {});
};

module.exports = router;
