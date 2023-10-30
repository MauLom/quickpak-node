const express = require('express');
const router = express.Router();
const bodyParser = require("body-parser");
const { MongoClient, ObjectId } = require("mongodb")
const { validateRequiredProperties } = require("./validateRequiredProperties")
router.use(bodyParser.json());

const getzoneDHL = require('../services/zoneRequest')
const controllerDHLServices = require('../services/connectionDHLServices')
const controllerEstafetaServices = require('../services/connectionESTAFETAServices')
const controllerWeight = require('../services/calculateWeight')

const url = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const client = new MongoClient(url, { useUnifiedTopology: true });

function numberToZoneString(number) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (number < 1 || number > 8) {
        throw new Error('No se encontro Zona con los CP proporcionados');
    }
    const zoneLetter = alphabet.charAt(number - 1);
    return ` Zona ${zoneLetter}`;
}

process.on('exit', () => {
    client.close();
});

client.connect().then(() => {
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    const userPricingCollection = db.collection("user_pricing")

    router.post('/DHL', async (req, res) => {
        try {
            const requiredProperties = ['timestamp', 'shipperCity', 'shipperCountryCode', 'shipperZip', 'recipientCity', 'recipientCountryCode', 'recipientZip', 'packages', 'insurance', 'userId'];
            validateRequiredProperties(req, res, requiredProperties);

            if (req.body.hora !== undefined) {
                seguroMontoDeclarado = parseFloat(req.body.seguro).toFixed(2);
                seguroMontoDeclarado = seguroMontoDeclarado.replace(",", ".");
                llevaSeguro = true;
            }



            const zoneAsNumber = getzoneDHL.getZoneRequest(req.body.shipperZip, req.body.recipientZip);
            const zonedhl = numberToZoneString(zoneAsNumber);

            const dataToDHL = controllerDHLServices.structureRequestToDHL(req.body.timestamp, req.body.shipperCity, req.body.shipperZip, req.body.shipperCountryCode, req.body.recipientCity, req.body.recipientZip, req.body.recipientCountryCode, req.body.packages, req.body.insurance);
            const dataResponseDHL = await controllerDHLServices.getRateAndStructure(dataToDHL);

            function getServicesByProvider(arr, provider) {
                const foundProvider = arr.find(item => item.provider_id === provider);
                if (!foundProvider) {
                    throw new Error('El usuario no cuenta con servicios de este proveedor');
                }
                return foundProvider.services;
            }

            const user = await usersCollection.findOne({ _id: new ObjectId(req.body.userId) });
            const filtered = getServicesByProvider(user.provider_access, "DHL");
            if (typeof filtered === "string") {
                throw new Error(`Error in fetching user services: ${filtered}`);
            }

            function filterDataByServices(data, services) {
                return data.filter(item => services.includes(item['@type']));
            }

            const filteredData = filterDataByServices(dataResponseDHL, filtered);

            const weightForCalcs = controllerWeight.getWeightForCalcs(req.body.packages);

            let matrix = [];
            for (let i = 0; i < filtered.length; i++) {
                const query = { provider_id: "DHL", service: filtered[i], user_id: req.body.userId };
                const result = await userPricingCollection.findOne(query);
                if (!result) {
                    throw new Error(`Error in fetching user matrix for service ${filtered[i]}`);
                }
                matrix.push({ service: filtered[i], message: "OK", data: result.pricing });
            }

            function getPrice(priceList, kg, zone) {
                if (kg <= 30) {
                    const zonePrice = priceList.find(entry => entry.kg === kg);
                    if (!zonePrice) {
                        throw new Error(`No matching price found for the given kg ${kg}`);
                    }
                    const foundZonePrice = zonePrice.prices.find(price => price.zone === zone);
                    return foundZonePrice ? foundZonePrice.price : `No matching price found for the given zone ${zone}`;
                }
                if (kg > 30) {
                    const price30 = priceList.find(entry => entry.kg === 30);
                    const extraPrice = priceList.find(entry => entry.kg === 'extra');
                    const price30ForZone = price30.prices.find(price => price.zone === zone);
                    const extraPriceForZone = extraPrice.prices.find(price => price.zone === zone);
                    if (!extraPriceForZone || !price30ForZone) {
                        throw new Error(`No matching price found for the given zone ${zone}`);
                    }
                    const extraWeight = kg - 30;
                    const totalExtraPrice = (extraWeight * extraPriceForZone.price) + price30ForZone.price;
                    return totalExtraPrice
                }
            }


            const FFGroundTax = 16.8;
            const FFAerialTax = 10.8;

            const finalArr = [];
            filteredData.forEach(cadaServicio => {
                const dataMatrix = matrix.find(entry => entry.service === cadaServicio["@type"]);
                const requestPrice = getPrice(dataMatrix.data, weightForCalcs, zonedhl);
                if (cadaServicio['Charges']['Charge'].length > 2) {
                    let valoresParaSumarFF = 0;
                    cadaServicio['Charges']['Charge'].forEach(cadaCargo => {
                        if (["YY", "OO", "YB", "II", "YE"].includes(cadaCargo.ChargeCode)) {
                            cadaCargo.ChargeAmount = Number(parseFloat(Number(cadaCargo.ChargeAmount) / 1.16).toFixed(2));
                            valoresParaSumarFF += cadaCargo.ChargeAmount;
                        } else if (cadaCargo.ChargeCode === "FF") {
                            valoresParaSumarFF += Number(parseFloat(Number(requestPrice)).toFixed(2));
                            const multiplicadorCombus = cadaServicio['@type'] === "G" ? FFGroundTax : FFAerialTax;
                            const porcDepured = Number.parseFloat(multiplicadorCombus / 100).toFixed(2);
                            const resultMulti = valoresParaSumarFF * porcDepured;
                            cadaCargo.ChargeAmount = Number(parseFloat(resultMulti).toFixed(2));
                        }
                    });
                } else {
                    const eleccionTipoFF = cadaServicio['@type'] === "G" ? FFGroundTax : FFAerialTax;
                    const valorDividido = parseFloat(Number(requestPrice) * eleccionTipoFF / 100).toFixed(2);
                    cadaServicio['Charges']['Charge'][1].ChargeAmount = Number(valorDividido);
                }
                const subTotalCharge = { 'ChargeType': 'SubTotal', 'ChargeAmount': 0 }

                cadaServicio['Charges']['Charge'].forEach(cadaSubCargo => {
                    subTotalCharge.ChargeAmount += Number(cadaSubCargo['ChargeAmount']);
                });

                subTotalCharge.ChargeAmount = parseFloat(subTotalCharge.ChargeAmount).toFixed(2);
                cadaServicio['Charges']['Charge'].push(subTotalCharge);
                const ivaCharge = { 'ChargeType': 'IVA', 'ChargeAmount': 0 };
                ivaCharge.ChargeAmount = parseFloat(subTotalCharge.ChargeAmount * 0.16).toFixed(2);
                cadaServicio['Charges']['Charge'].push(ivaCharge);
                cadaServicio['TotalNet'].Amount = parseFloat(Number(subTotalCharge.ChargeAmount) + Number(ivaCharge.ChargeAmount)).toFixed(2);
                finalArr.push(cadaServicio);
            });

            const response = {
                status: "OK",
                messages: "ok",
                zone: zonedhl,
                data: finalArr
            };

            res.status(200).json(response);
        } catch (error) {
            res.status(500).json({ message: `Error occurred during processing: ${error.message}` });
        }
    })
    router.post('/estafeta', async (req, res) => {
        try {
            const requiredFields = ['alto', 'ancho', 'esPaquete', 'largo', 'peso', 'originZip', 'destinyZip', 'userId'];
            const missingField = requiredFields.find(field => !req.body[field]);

            if (missingField) {
                throw new Error(`No se pudo leer la propiedad '${missingField}' del body`);
            }

            const {
                alto,
                ancho,
                esPaquete,
                largo,
                peso,
                originZip,
                destinyZip,
                userId,
                seguro: seguroMontoDeclarado = 0
            } = req.body;

            const dataRequest = {
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

            const dataResponseESTAFETARaw = await controllerEstafetaServices.getRates(dataRequest);
            let dataResponseESTAFETA = dataResponseESTAFETARaw.FrecuenciaCotizadorResponse.FrecuenciaCotizadorResult.Respuesta;

            if (dataResponseESTAFETA.Error !== '000') {
                throw new Error(dataResponseESTAFETA.MensajeError);
            }

            const zoneAsNumber = getzoneDHL.getZoneRequest(req.body.shipperZip, req.body.recipientZip);
            const zone = numberToZoneString(zoneAsNumber);

            if (zone.error) {
                throw new Error(zone.error);
            }

            // Retrieve necessary data and perform other required operations...
            // ...

            // const dataBasedOnUserSheet = await controllerPrices.getPricesEstafetaBasedOnSheet(
            //     dataResponseESTAFETA,
            //     clientDataSheet,
            //     weightForCalcs,
            //     zone,
            //     Number.parseFloat(ffTaxes?.FFTaxes?.aerial || 0.108),
            //     Number.parseFloat(ffTaxes?.FFTaxes?.land || 0.168),
            //     costoReexpedicion !== 'No' ? costoReexpedicion : '0',
            //     calculoSeguro
            // );

            res.status(200).json({
                status: 'ok',
                messages: 'OK',
                data: dataResponseESTAFETARaw,
                manejoEspecial: 'Envíos identificados como frágil, empaque irregular, envíos no transportables por bandas pueden generar un costo extra de  $63.67',
                zone: zone
            });
        } catch (error) {
            res.status(500).json({ message: `Error occurred during processing: ${error.message}` });
        }
    });


});

module.exports = router;
