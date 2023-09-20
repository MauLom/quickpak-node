const express = require('express');
const router = express.Router();
const controllerDHLServices = require('../services/connectionDHLServices')
const controllerEstafetaServices = require('../services/connectionESTAFETAServices')
const controllerZone = require('../services/calculateZone')
const controllerWeight = require('../services/calculateWeight')
const controllerUserData = require('../models/controllerFirebaseBD')
const controllerPrices = require('../services/calculatePricesWithClientData');
const getzoneDHL = require('../services/zoneRequest')


const controllerFirebaseBD = require('../models/controllerFirebaseBD');
const controllerZonesEstafeta = require('../models/controllerSigsAndZonesEstafeta');
const controllerMongoBD = require('../models/controllerMongoBD');
router.post('/', async (req, res) => {
    var timestamp = ""
    var shipperCity = ""
    var shipperZip = ""
    var shipperCountryCode = ""
    var recipientCity = ""
    var recipientZip = ""
    var recipientCountryCode = ""
    var packages = ""
    var insurance = ""
    var userId = ""
    ///////
    var cpOrigin = ""
    var cpDestino = ""

    if (req.body.timestamp === "" || req.body.timestamp === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'timestamp' del body" })
    } else if (req.body.shipperCity === "" || req.body.shipperCity === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'shipperCity' del body" })
    } else if (req.body.shipperCountryCode === "" || req.body.shipperCountryCode === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'shipperCountryCode' del body" })
    } else if (req.body.shipperZip === "" || req.body.shipperZip === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'shipperZip' del body" })
    } else if (req.body.recipientCity === "" || req.body.recipientCity === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'recipientCity' del body" })
    } else if (req.body.recipientCountryCode === "" || req.body.recipientCountryCode === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'recipientCountryCode' del body" })
    } else if (req.body.recipientZip === "" || req.body.recipientZip === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'recipientZip' del body" })
    } else if (req.body.packages === "" || req.body.packages === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'packages' del body" })
    } else if (req.body.insurance === "" || req.body.insurance === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'insurance' del body" })
    } else if (req.body.userId === "" || req.body.userId === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'userId' del body" })

    }
    else {
        timestamp = req.body.timestamp
        shipperCity = req.body.shipperCity
        shipperCountryCode = req.body.shipperCountryCode
        cpOrigin = req.body.shipperZip

        recipientCity = req.body.recipientCity
        recipientCountryCode = req.body.recipientCountryCode
        cpDestino = req.body.recipientZip

        packages = req.body.packages
        insurance = req.body.insurance
        userId = req.body.userId
        let hora = ""
        if (req.body.hora !== undefined) {
            seguroMontoDeclarado = parseFloat(req.body.seguro).toFixed(2)
            seguroMontoDeclarado = seguroMontoDeclarado.replace(",", ".")
            llevaSeguro = true
        }

        const dataToDHL = controllerDHLServices.structureRequestToDHL(timestamp, shipperCity, cpOrigin, shipperCountryCode, recipientCity, cpDestino, recipientCountryCode, packages, insurance)
        const dataResponseDHL = await controllerDHLServices.getRateAndStructure(dataToDHL)
        const weightForCalcs = controllerWeight.getWeightForCalcs(packages)
        const clientDataSheet = await controllerUserData.getDataSheetById(userId)
        if (clientDataSheet?.error) {
            res.status(500).json({ status: "Error", messages: clientDataSheet.message })
        }
        const ffTaxes = await controllerMongoBD.findGeneralValues()
        //const validServicesDHL = await controllerUserData.getValidServices(userId)
        //const validServicesDHL = ["I", "O", "1", "G", "N"]
        const validServicesDHL = ["G", "N"]
        const zonedhl = getzoneDHL.getZoneRequest(cpOrigin, cpDestino);
        const pricesBasedOnClientData = controllerPrices.getPricesBasedOnSheet(dataResponseDHL, clientDataSheet, weightForCalcs, zonedhl,  Number.parseFloat(ffTaxes?.FFTaxes?.aerial || 9), Number.parseFloat(ffTaxes?.FFTaxes?.land || 16.5), validServicesDHL)

        res.status(200).json({ status: "OK", messages: "ok", zone: zonedhl, data: pricesBasedOnClientData })
    }

})

router.post('/estafeta', async (req, res) => {
    var alto = ""
    var ancho = ""
    var esPaquete = ""
    var largo = ""
    var peso = ""
    var originZip = ""
    var destinyZip = ""
    var userId = ""
    if (req.body.alto === "" || req.body.alto === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'alto' del body" })
    } else if (req.body.ancho === "" || req.body.ancho === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'ancho' del body" })
    } else if (req.body.esPaquete === "" || req.body.esPaquete === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'esPaquete' del body" })
    } else if (req.body.largo === "" || req.body.largo === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'largo' del body" })
    } else if (req.body.peso === "" || req.body.peso === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'peso' del body" })
    } else if (req.body.originZip === "" || req.body.originZip === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'originZip' del body" })
    } else if (req.body.destinyZip === "" || req.body.destinyZip === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'destinyZip' del body" })
    } else if (req.body.userId === "" || req.body.userId === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'userId' del body" })
    } else {
        alto = req.body.alto
        ancho = req.body.ancho
        esPaquete = req.body.esPaquete
        largo = req.body.largo
        peso = req.body.peso
        originZip = req.body.originZip
        destinyZip = req.body.destinyZip
        // if(destinyZip.charAt(0) === "0"){{
        //     destinyZip = destinyZip.slice(0,1)
        // }}      
        userId = req.body.userId
        let seguroMontoDeclarado = 0
        if (req.body.seguro !== undefined) {
            seguroMontoDeclarado = req.body.seguro
        }
        let dataRequest = {
            "idusuario": "1",
            "usuario": "AdminUser",
            "contra": ",1,B(vVi",
            "esFrecuencia": "true",
            "esLista": "true",
            "tipoEnvio": {
                "Alto": alto,
                "Ancho": ancho,
                "EsPaquete": esPaquete,
                "Largo": largo,
                "Peso": peso
            },
            "datosOrigen": {
                "string": [
                    originZip
                ]
            },
            "datosDestino": {
                "string": [
                    destinyZip
                ]
            }
        }
        // console.log("dataRequest: ", dataRequest)
        const dataResponseESTAFETARaw = await controllerEstafetaServices.getRates(dataRequest)

        let dataResponseESTAFETA = dataResponseESTAFETARaw.FrecuenciaCotizadorResponse.FrecuenciaCotizadorResult.Respuesta
        if (dataResponseESTAFETA.Error != "000") {
            res.status(200).json({ status: "error", message: dataResponseESTAFETA.MensajeError, errorCode: dataResponseESTAFETA.Error, })
        } else {
            dataResponseESTAFETA = dataResponseESTAFETARaw.FrecuenciaCotizadorResponse.FrecuenciaCotizadorResult.Respuesta
            const zone = await controllerZonesEstafeta.getZoneByZips(originZip, destinyZip)

            if (zone.hasOwnProperty("error")) {
                res.status(501).json({ status: "error", message: zone.error })
            } else {
                const clientDataSheet = await controllerUserData.getDataEstafetaSheetById(userId)
                const weightForCalcs = await controllerWeight.getWeightForCalcsFromEstafetaPackage({ 'alto': alto, 'ancho': ancho, 'largo': largo, 'peso': peso })
                const ffTaxes = await controllerMongoBD.findGeneralValues()
                const costoReexpedicion = dataResponseESTAFETARaw.FrecuenciaCotizadorResponse.FrecuenciaCotizadorResult.Respuesta.CostoReexpedicion
                const DiasEntrega = dataResponseESTAFETARaw.FrecuenciaCotizadorResponse.FrecuenciaCotizadorResult.Respuesta.DiasEntrega
                const txtManejoEspecial = "Envíos identificados como frágil, empaque irregular, envíos no transportables por bandas pueden generar un costo extra de  $63.67"
                const ocurreForzoso = dataResponseESTAFETARaw.FrecuenciaCotizadorResponse.FrecuenciaCotizadorResult.Respuesta.ModalidadEntrega.OcurreForzoso
                dataResponseESTAFETA = await controllerEstafetaServices.getValidServices(dataResponseESTAFETA.TipoServicio.TipoServicio, zone)
                const calculoSeguro = parseFloat(Number(seguroMontoDeclarado) * 0.0125).toFixed(2)
                const dataBasedOnUserSheet = await controllerPrices.getPricesEstafetaBasedOnSheet(dataResponseESTAFETA, clientDataSheet, weightForCalcs, zone, Number.parseFloat(ffTaxes?.FFTaxes?.aerial || 0.09), Number.parseFloat(ffTaxes?.FFTaxes?.land || 0.165), costoReexpedicion != "No" ? costoReexpedicion : "0", calculoSeguro)
                res.status(200).json({ status: "ok", messages: "OK", data: dataBasedOnUserSheet, diasEntrega: DiasEntrega, manejoEspecial: txtManejoEspecial, ocurreForzoso: ocurreForzoso, zone: zone, })
            }
        }

    }

})
module.exports = router;