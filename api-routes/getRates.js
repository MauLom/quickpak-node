const express = require('express');
const router = express.Router();
const controllerDHLServices = require('../services/connectionDHLServices')
const controllerEstafetaServices = require('../services/connectionESTAFETAServices')
const controllerZone = require('../services/calculateZone')
const controllerWeight = require('../services/calculateWeight')
const controllerUserData = require('../models/controllerFirebaseBD')
const controllerPrices = require('../services/calculatePricesWithClientData');
const getzoneDHL = require('../services/zoneRequest')
const controllerZonesEstafeta = require('../models/controllerSigsAndZonesEstafeta');
const controllerMongoBD = require('../models/controllerMongoBD');

const cargoCombustibleAereo = 10.10;
const cargoCombustibleTerrestre = 19.91;

router.post('/', async (req, res) => {
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
        userId,
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
        userId,
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
        const dataToDHL = controllerDHLServices.structureRequestToDHL(timestamp, shipperCity, cpOrigin, shipperCountryCode, recipientCity, cpDestino, recipientCountryCode, packages, insurance);
        const dataResponseDHL = await controllerDHLServices.getRateAndStructure(dataToDHL);
        if (dataResponseDHL?.error) {
            return res.status(500).json({ status: "Error", messages: dataResponseDHL.message });
        }

        const weightForCalcs = controllerWeight.getWeightForCalcs(packages);
        const clientDataSheet = await controllerUserData.getDataSheetById(userId);

        if (clientDataSheet?.error) {
            return res.status(500).json({ status: "Error", messages: clientDataSheet.message });
        }

        //const ffTaxes = await controllerMongoBD.findGeneralValues();
        const ffTaxes = null
        const validServicesDHL = ["G", "N"]; // Your valid services for DHL

        const zonedhl = getzoneDHL.getZoneRequest(cpOrigin, cpDestino);
        const pricesBasedOnClientData = controllerPrices.getPricesBasedOnSheet(dataResponseDHL, clientDataSheet, weightForCalcs, zonedhl, Number.parseFloat(cargoCombustibleAereo), Number.parseFloat(cargoCombustibleTerrestre), validServicesDHL);

        return res.status(200).json({ status: "OK", messages: "ok", zone: zonedhl, data: pricesBasedOnClientData });
    } catch (error) {
        return res.status(500).json({ status: "error", messages: error.message });
    }
});


router.post('/estafeta', async (req, res) => {
    const {
        alto,
        ancho,
        esPaquete,
        largo,
        peso,
        originZip,
        destinyZip,
        userId,
        seguro,
    } = req.body;

    const requiredFields = { alto, ancho, esPaquete, largo, peso, originZip, destinyZip, userId };

    const missingField = Object.entries(requiredFields).find(([key, value]) => value === undefined || value === '');

    if (missingField) {
        return res.status(500).json({ status: "error", messages: `No se pudo leer la propiedad '${missingField[0]}' del body` });
    }

    const dataRequest = {
        "idusuario": "1",
        "usuario": "AdminUser",
        "contra": ",1,B(vVi",
        "esFrecuencia": "true",
        "esLista": "true",
        "tipoEnvio": { "Alto": alto, "Ancho": ancho, "EsPaquete": esPaquete, "Largo": largo, "Peso": peso },
        "datosOrigen": { "string": [originZip] },
        "datosDestino": { "string": [destinyZip] }
    };

    try {
        const dataResponseESTAFETARaw = await controllerEstafetaServices.getRates(dataRequest);
        const dataResponseESTAFETA = dataResponseESTAFETARaw.FrecuenciaCotizadorResponse.FrecuenciaCotizadorResult.Respuesta;

        if (dataResponseESTAFETA.Error !== "000") {
            return res.status(200).json({ status: "error", message: dataResponseESTAFETA.MensajeError, errorCode: dataResponseESTAFETA.Error });
        }

        const zone = await controllerZonesEstafeta.getZoneByZips(originZip, destinyZip);

        if (zone.error) {
            return res.status(501).json({ status: "error", message: zone.error });
        }

        const clientDataSheet = await controllerUserData.getDataEstafetaSheetById(userId);
        const weightForCalcs = await controllerWeight.getWeightForCalcsFromEstafetaPackage({ alto, ancho, largo, peso });
        // const ffTaxes = await controllerMongoBD.findGeneralValues();
        const ffTaxes = null
        const costoReexpedicion = dataResponseESTAFETARaw.FrecuenciaCotizadorResponse.FrecuenciaCotizadorResult.Respuesta.CostoReexpedicion;
        const DiasEntrega = dataResponseESTAFETARaw.FrecuenciaCotizadorResponse.FrecuenciaCotizadorResult.Respuesta.DiasEntrega;
        const txtManejoEspecial = "Envíos identificados como frágil, empaque irregular, envíos no transportables por bandas pueden generar un costo extra de  $63.67";
        const ocurreForzoso = dataResponseESTAFETARaw.FrecuenciaCotizadorResponse.FrecuenciaCotizadorResult.Respuesta.ModalidadEntrega.OcurreForzoso;

        const dataResponseEstafeta = await controllerEstafetaServices.getValidServices(dataResponseESTAFETA.TipoServicio.TipoServicio, zone);
        const calculoSeguro = parseFloat(Number(seguro || 0) * 0.0125).toFixed(2);
        const dataBasedOnUserSheet = await controllerPrices.getPricesEstafetaBasedOnSheet(
            dataResponseEstafeta,
            clientDataSheet,
            weightForCalcs,
            zone,
            Number.parseFloat(cargoCombustibleAereo/100),
            Number.parseFloat(cargoCombustibleTerrestre/100),
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

module.exports = router;
