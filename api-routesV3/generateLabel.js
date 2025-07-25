const express = require('express');
const router = express.Router();
const { getAuthenticatedUsername, basicAuth } = require('./basicAuth'); 
const controllerDHLServices = require('../services/connectionDHLServices');
const controllerMongoData = require('../models/controllerMongoBD');
const controllerEstafetaServices = require('../services/connectionESTAFETAServices');
const controllerFirebaseBD = require('../models/controllerFirebaseBD');
const config = require('../config');
const envVariables = config.getVariables();

// Aplica autenticación básica a todos los endpoints de este router
router.use(basicAuth);

/**
 * @swagger
 * /api/v3/label/dhl:
 *   post:
 *     summary: Genera una guía DHL
 *     description: |
 *       Genera una guía DHL usando los datos de remitente, destinatario y paquetes. Requiere autenticación básica.
 *     tags:
 *       - Labels V3
 *     security:
 *       - basicAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - service
 *               - date
 *               - desc
 *               - oName
 *               - oCompany
 *               - oPhone
 *               - oEmail
 *               - oStreets
 *               - oCity
 *               - oZip
 *               - dName
 *               - dCompany
 *               - dPhone
 *               - dEmail
 *               - dStreets
 *               - dCity
 *               - dZip
 *               - packages
 *             properties:
 *               service:
 *                 type: string
 *                 description: "Tipo de servicio DHL. Ejemplo: 'G'"
 *                 example: "G"
 *               date:
 *                 type: string
 *                 description: "Fecha de envío. Ejemplo: '2025-07-10'"
 *                 example: "2025-07-10"
 *               desc:
 *                 type: string
 *                 description: "Descripción del contenido. Ejemplo: 'descripcion'"
 *                 example: "descripcion"
 *               oName:
 *                 type: string
 *                 description: "Nombre del remitente. Ejemplo: 'Carlos'"
 *                 example: "Carlos"
 *               oCompany:
 *                 type: string
 *                 description: "Empresa del remitente. Ejemplo: 'Comp de Carlos'"
 *                 example: "Comp de Carlos"
 *               oPhone:
 *                 type: string
 *                 description: "Teléfono del remitente. Ejemplo: '8180808080'"
 *                 example: "8180808080"
 *               oEmail:
 *                 type: string
 *                 description: "Correo del remitente. Ejemplo: 'correo@origen.com'"
 *                 example: "correo@origen.com"
 *               oStreets:
 *                 type: string
 *                 description: "Calle(s) de origen. Ejemplo: 'Calles origen'"
 *                 example: "Calles origen"
 *               oCity:
 *                 type: string
 *                 description: "Ciudad de origen. Ejemplo: 'Monterrey'"
 *                 example: "Monterrey"
 *               oZip:
 *                 type: string
 *                 description: "Código postal de origen. Ejemplo: '64000'"
 *                 example: "64000"
 *               dName:
 *                 type: string
 *                 description: "Nombre del destinatario. Ejemplo: 'Daniel'"
 *                 example: "Daniel"
 *               dCompany:
 *                 type: string
 *                 description: "Empresa del destinatario. Ejemplo: 'Comp de Daniel'"
 *                 example: "Comp de Daniel"
 *               dPhone:
 *                 type: string
 *                 description: "Teléfono del destinatario. Ejemplo: '8281818181'"
 *                 example: "8281818181"
 *               dEmail:
 *                 type: string
 *                 description: "Correo del destinatario. Ejemplo: 'correo@destino.com'"
 *                 example: "correo@destino.com"
 *               dStreets:
 *                 type: string
 *                 description: "Calle(s) de destino. Ejemplo: 'Calles destino'"
 *                 example: "Calles destino"
 *               dCity:
 *                 type: string
 *                 description: "Ciudad de destino. Ejemplo: 'Ciudad de Mexico'"
 *                 example: "Ciudad de Mexico"
 *               dZip:
 *                 type: string
 *                 description: "Código postal de destino. Ejemplo: '11500'"
 *                 example: "11500"
 *               packages:
 *                 type: array
 *                 description: "Arreglo de paquetes a enviar."
 *                 items:
 *                   type: object
 *                   properties:
 *                     @number:
 *                       type: number
 *                       description: "Número del paquete. Ejemplo: 1"
 *                       example: 1
 *                     Weight:
 *                       type: string
 *                       description: "Peso del paquete en kilogramos. Ejemplo: '2'"
 *                       example: "2"
 *                     Dimensions:
 *                       type: object
 *                       description: "Dimensiones del paquete."
 *                       properties:
 *                         Length:
 *                           type: string
 *                           description: "Largo del paquete en centímetros. Ejemplo: '10'"
 *                           example: "10"
 *                         Width:
 *                           type: string
 *                           description: "Ancho del paquete en centímetros. Ejemplo: '10'"
 *                           example: "10"
 *                         Height:
 *                           type: string
 *                           description: "Alto del paquete en centímetros. Ejemplo: '10'"
 *                           example: "10"
 *     responses:
 *       200:
 *         description: Guía generada exitosamente
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
 *                   example: ok
 *                 data:
 *                   type: object
 *       500:
 *         description: Error al generar la guía
 */
// Endpoint para generar guía DHL
router.post('/dhl', async (req, res) => {
    let hora = "T17:30:00 GMT-06:00"
    if (req.body.hora !== undefined) {
        hora = req.body.hora
    }
    try {

        const username = getAuthenticatedUsername(req);
        const user = await controllerMongoData.getUserPricing(username);
        if (!user) {
            return res.status(401).json({ status: "error", messages: "No se pudo determinar el usuario autenticado" });
        }

        const customerReference = user.reference_dhl || "";

        if(customerReference === ""){
            res.status(501).json({ status: "error", messages: ("La referencia no se configuro para el usuario") })
        }

        let newArrWithPackagess = req.body.packages
        newArrWithPackagess.forEach(cadaPaquete => {
            cadaPaquete['CustomerReferences'] = customerReference
        })

        let baseDataAddressOrigin = {
            "StreetLines": req.body.oStreets,
            "City": req.body.oCity,
            "PostalCode": req.body.oZip,
            "CountryCode": "MX"
        }
        if (req.body?.oStreets2 !== undefined) {
            baseDataAddressOrigin["StreetLines2"] = req.body.oStreets2
        }
        if (req.body?.oStreets3 !== undefined) {
            baseDataAddressOrigin["StreetLines3"] = req.body.oStreets3
        }

        let baseDataAddressDestiny = {
            "StreetLines": req.body.dStreets,
            "City": req.body.dCity,
            "PostalCode": req.body.dZip,
            "CountryCode": "MX"
        }
        if (req.body?.dStreets2 !== undefined) {
            baseDataAddressDestiny["StreetLines2"] = req.body.dStreets2
        }
        if (req.body?.dStreets3 !== undefined) {
            baseDataAddressDestiny["StreetLines3"] = req.body.dStreets3
        }

        const dataObj = {
            "ShipmentRequest": {
                "RequestedShipment": {
                    "ShipmentInfo": {
                        "DropOffType": "REGULAR_PICKUP",
                        "ServiceType": req.body.service,
                        "Account": 980966404,
                        "Currency": "MXN",
                        "UnitOfMeasurement": "SI",
                        "PackagesCount": 1,
                        "LabelOptions": {
                            "RequestWaybillDocument": "Y",
                            "HideAccountInWaybillDocument": "Y"
                        },
                        "LabelType": "PDF",
                    },
                    "ShipTimestamp": req.body.date + hora,
                    "PaymentInfo": "DDU",
                    "InternationalDetail": {
                        "Commodities": {
                            "NumberOfPieces": 1,
                            "Description": req.body.desc
                        }
                    },
                    "Ship": {
                        "Shipper": {
                            "Contact": {
                                "PersonName": req.body.oName,
                                "CompanyName": req.body.oCompany,
                                "PhoneNumber": req.body.oPhone,
                                "EmailAddress": req.body.oEmail
                            },
                            "Address": baseDataAddressOrigin
                        },
                        "Recipient": {
                            "Contact": {
                                "PersonName": req.body.dName,
                                "CompanyName": req.body.dCompany,
                                "PhoneNumber": req.body.dPhone,
                                "EmailAddress": req.body.dEmail
                            },
                            "Address": baseDataAddressDestiny
                        }
                    },
                    "Packages": {
                        "RequestedPackages": newArrWithPackagess
                    }
                }
            }
        }

        if(newArrWithPackagess[0].InsuredValue){
            dataObj.ShipmentRequest.RequestedShipment.ShipmentInfo['SpecialServices'] = [
                { "Service": { "ServiceType": "II", "ServiceValue": newArrWithPackagess[0].InsuredValue, "CurrencyCode": "MXN" } }
            ]
        }
        const response = await controllerDHLServices.generateLabel(dataObj)
        const objResponse = { status: "ok", messages: "ok", data: response.data }
        _ = await controllerMongoData.saveGeneratedLabelDataOnBD({ userId: user._id, request: req.body, response: response.data, type: "DHL", createdAt: Date.now() })

        // const registerOnBd = await controllerFirebaseBD.addGeneratedLabelDHl(userId, { request: req.body, response: response.data })
        res.status(200).json(objResponse)
    } catch (e) {
        res.status(501).json({ status: "error", messages: ("error: " + e) })
    }
});

/**
 * @swagger
 * /api/v3/label/estafeta:
 *   post:
 *     summary: Genera una guía Estafeta
 *     description: |
 *       Genera una guía Estafeta usando los datos de remitente, destinatario y paquete. Requiere autenticación básica.
 *     tags:
 *       - Labels V3
 *     security:
 *       - basicAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alto
 *               - ancho
 *               - esPaquete
 *               - largo
 *               - peso
 *               - descripcionPaquete
 *               - dataOrigen
 *               - dataDestino
 *               - tipoServicioId
 *             properties:
 *               alto:
 *                 type: number
 *                 description: "Alto del paquete en centímetros. Ejemplo: 20"
 *                 example: 20
 *               ancho:
 *                 type: number
 *                 description: "Ancho del paquete en centímetros. Ejemplo: 15"
 *                 example: 15
 *               esPaquete:
 *                 type: boolean
 *                 description: "Indica si es paquete (true) o sobre (false). Ejemplo: true"
 *                 example: true
 *               largo:
 *                 type: number
 *                 description: "Largo del paquete en centímetros. Ejemplo: 30"
 *                 example: 30
 *               peso:
 *                 type: number
 *                 description: "Peso del paquete en kilogramos. Ejemplo: 2.5"
 *                 example: 2.5
 *               descripcionPaquete:
 *                 type: string
 *                 description: "Descripción del contenido del paquete. Ejemplo: 'Ropa y accesorios'"
 *                 example: "Ropa y accesorios"
 *               dataOrigen:
 *                 type: object
 *                 description: "Datos completos del remitente (ver ejemplo de estructura)."
 *                 example:
 *                   contacto:
 *                     nombreCortoDomicilio: "Casa Matriz"
 *                     nombreContacto: "Juan Pérez"
 *                     celular: "5551234567"
 *                     telefono: "5557654321"
 *                     email1: "juan@correo.com"
 *                     RFC: "XAXX010101000"
 *                   direccion:
 *                     calle1: "Av. Reforma 123"
 *                     area: "Centro"
 *                     estado: "CDMX"
 *                     zip: "01000"
 *                     referencia: "Frente a parque"
 *                     numExt: "10"
 *                     numInt: "2A"
 *                     ciudad: "CDMX"
 *               dataDestino:
 *                 type: object
 *                 description: "Datos completos del destinatario (ver ejemplo de estructura)."
 *                 example:
 *                   contacto:
 *                     nombreCortoDomicilio: "Sucursal GDL"
 *                     nombreContacto: "Ana López"
 *                     celular: "3331234567"
 *                     telefono: "3337654321"
 *                     email1: "ana@correo.com"
 *                     RFC: "XEXX010101000"
 *                   direccion:
 *                     calle1: "Calle 5"
 *                     area: "Zona Centro"
 *                     estado: "JAL"
 *                     zip: "44100"
 *                     referencia: "Junto a la plaza"
 *                     numExt: "20"
 *                     numInt: "1B"
 *                     ciudad: "Guadalajara"
 *               tipoServicioId:
 *                 type: string
 *                 description: "ID del tipo de servicio Estafeta. Ejemplo: '70'"
 *                 example: "70"
 *               seguro:
 *                 type: number
 *                 description: "Valor declarado para seguro (opcional). Ejemplo: 1000"
 *                 example: 1000
 *               additionalInfo:
 *                 type: string
 *                 description: "Información adicional para la guía (opcional)."
 *                 example: "Entrega urgente"
 *               content:
 *                 type: string
 *                 description: "Descripción corta del contenido (opcional)."
 *                 example: "Documentos."
 *     responses:
 *       200:
 *         description: Guía generada exitosamente
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
 *                   example: ok
 *                 data:
 *                   type: object
 *       500:
 *         description: Error al generar la guía
 */
// Endpoint para generar guía Estafeta
router.post('/estafeta', async (req, res) => {
    const requiredProperties = [
        "alto", "ancho", "esPaquete", "largo", "peso",
        "descripcionPaquete", "dataOrigen",
        "dataDestino", "tipoServicioId"
    ];

    const missingProperty = requiredProperties.find(prop => !req.body[prop]);

    if (missingProperty) {
        return res.status(500).json({
            status: "error",
            messages: `No se pudo leer la propiedad '${missingProperty}' del body`
        });
    }

    const {
        alto, ancho, esPaquete, largo, peso,
        dataOrigen, dataDestino, tipoServicioId,
        descripcionPaquete, seguro, additionalInfo, content
    } = req.body;

    const username = getAuthenticatedUsername(req);
    const user = await controllerMongoData.getUserPricing(username);
    if (!user) {
        return res.status(401).json({ status: "error", messages: "No se pudo determinar el usuario autenticado" });
    }

    const customerReference =  user?.reference_estafeta || "Quikpack"

    let seguroMontoDeclarado = 0;
    let llevaSeguro = false;

    if (seguro !== undefined && Number(seguro) > 0) {
        seguroMontoDeclarado = parseFloat(seguro).toFixed(2).replace(",", ".");
        llevaSeguro = true;
    }

    const dateNow = new Date();
    const dateValidThru = dateNow.addDays(14);
    const dateValidThruFormatted = [
        dateValidThru.getFullYear(),
        (dateValidThru.getMonth() + 1).toString().padStart(2, '0'),
        (dateValidThru.getDate()).toString().padStart(2, '0'),
    ].join('');

    const dataObj = {
        "identification": {
            "suscriberId": "WS",
            "customerNumber": envVariables.noClient
        },
        "systemInformation": {
            "id": "AP01",
            "name": "AP01",
            "version": "1.10.20"
        },
        "labelDefinition": {
            "wayBillDocument": {
                "aditionalInfo": additionalInfo || "string",
                "content": content || "Documents.",
                "costCenter": "SPMXA12345",
                "customerShipmentId": null,
                "referenceNumber": customerReference,
                "groupShipmentId": null
            },
            "itemDescription": {
                "parcelId": 1,
                "weight": Number(peso),
                "height": Number(alto),
                "length": Number(largo),
                "width": Number(ancho),
                "merchandises": {
                    "totalGrossWeight": 121.1,
                    "weightUnitCode": "XLU",
                    "merchandise": [
                        {
                            "merchandiseValue": 0.1,
                            "currency": "MXN",
                            "productServiceCode": "10131508",
                            "merchandiseQuantity": 2.5,
                            "measurementUnitCode": "F63",
                            "tariffFraction": "12345678",
                            "UUIDExteriorTrade": "ABCDed02-a12A-B34B-c56C-c5abcdef61F2",
                            "isInternational": false,
                            "isImport": false,
                            "isHazardousMaterial": false,
                            "hazardousMaterialCode": "M0035",
                            "packagingCode": "4A"
                        }
                    ]
                }
            },
            "serviceConfiguration": {
                "quantityOfLabels": 1,
                "serviceTypeId": tipoServicioId || "70",
                "salesOrganization": envVariables.OrgVentas || 112,
                "effectiveDate": dateValidThruFormatted || "20240301",
                "originZipCodeForRouting": "06170",
                "isInsurance": llevaSeguro,
                "insurance": {
                    "contentDescription": descripcionPaquete,
                    "declaredValue": seguroMontoDeclarado
                },
                "isReturnDocument": false,
                "returnDocument": {
                    "type": "DRFZ",
                    "serviceId": "60"
                }
            },
            "location": {
                "isDRAAlternative": false,
                "DRAAlternative": {
                    "contact": {
                        "corporateName": dataOrigen.contacto.nombreCortoDomicilio,
                        "contactName": dataOrigen.contacto.nombreContacto,
                        "cellPhone": dataOrigen.contacto.celular,
                        "telephone": dataOrigen.contacto.telefono,
                        "phoneExt": "0",
                        "email": dataOrigen.contacto.email1,
                        "taxPayerCode": dataOrigen.contacto.RFC
                    },
                    "address": {
                        "bUsedCode": false,
                        "roadName": dataOrigen.direccion.calle1 + "," + dataOrigen.direccion.area,
                        "townshipName": dataOrigen.direccion.area,
                        "settlementName": dataOrigen.contacto.nombreCortoDomicilio,
                        "stateAbbName": dataOrigen.direccion.estado,
                        "zipCode": dataOrigen.direccion.zip,
                        "countryCode": "484",
                        "countryName": "MEX",
                        "addressReference": dataOrigen.direccion.referencia,
                        "externalNum": dataOrigen.direccion.numExt || "00",
                        "indoorInformation": dataOrigen.direccion.numInt,
                        "localityName": dataOrigen.direccion.ciudad
                    }
                },
                "origin": {
                    "contact": {
                        "corporateName": dataOrigen.contacto.nombreCortoDomicilio,
                        "contactName": dataOrigen.contacto.nombreContacto,
                        "cellPhone": dataOrigen.contacto.celular,
                        "telephone": dataOrigen.contacto.telefono,
                        "phoneExt": "0",
                        "email": dataOrigen.contacto.email1,
                        "taxPayerCode": dataOrigen.contacto.RFC
                    },
                    "address": {
                        "bUsedCode": false,
                        "roadTypeAbbName": "string",
                        "roadName": dataOrigen.direccion.calle1 + "," + dataOrigen.direccion.area,
                        "townshipName": dataOrigen.direccion.area,
                        "settlementTypeAbbName": "string",
                        "settlementName": dataOrigen.contacto.nombreCortoDomicilio,
                        "stateAbbName": dataOrigen.direccion.estado,
                        "zipCode": dataOrigen.direccion.zip,
                        "countryCode": "484",
                        "countryName": "MEX",
                        "addressReference": dataOrigen.direccion.referencia,
                        "externalNum": dataOrigen.direccion.numExt || "00",
                        "indoorInformation": dataOrigen.direccion.numInt,
                        "localityName": dataOrigen.direccion.ciudad,
                        "betweenRoadName1": "La Morelos",
                        "betweenRoadName2": "Los Estrada",
                    }
                },
                "destination": {
                    "isDeliveryToPUDO": false,
                    "deliveryPUDOCode": "567",
                    "homeAddress": {
                        "contact": {
                            "corporateName": dataDestino.contacto.nombreCortoDomicilio,
                            "contactName": dataDestino.contacto.nombreContacto,
                            "cellPhone": dataDestino.contacto.celular,
                            "telephone": dataDestino.contacto.telefono,
                            "phoneExt": "0",
                            "email": dataDestino.contacto.email1,
                            "taxPayerCode": dataDestino.contacto.RFC
                        },
                        "address": {
                            "bUsedCode": false,
                            "roadTypeCode": "001",
                            "roadTypeAbbName": "string",
                            "roadName": dataDestino.direccion.calle1 + "," + dataDestino.direccion.area,
                            "townshipName": dataDestino.direccion.area,
                            "settlementTypeCode": "001",
                            "settlementTypeAbbName": "string",
                            "settlementName": dataDestino.contacto.nombreCortoDomicilio,
                            "stateAbbName": dataDestino.direccion.estado,
                            "zipCode": dataDestino.direccion.zip,
                            "countryCode": "484",
                            "countryName": "MEX",
                            "addressReference": dataDestino.direccion.referencia,
                            "externalNum": dataDestino.direccion.numExt || "00",
                            "indoorInformation": dataDestino.direccion.numInt,
                            "localityName": dataDestino.direccion.ciudad,

                            "betweenRoadName1": "La Morelos",
                            "betweenRoadName2": "Los Estrada",
                        }
                    }
                },
                "notified": {
                    "notifiedTaxIdCode": "notifiedTaxCode",
                    "notifiedTaxCountry": "MEX",
                    "residence": {
                        "contact": {
                            "corporateName": dataDestino.contacto.nombreCortoDomicilio,
                            "contactName": dataDestino.contacto.nombreContacto,
                            "cellPhone": dataDestino.contacto.celular,
                            "telephone": dataDestino.contacto.telefono,
                            "phoneExt": "0",
                            "email": dataDestino.contacto.email1,
                            "taxPayerCode": dataDestino.contacto.RFC
                        },
                        "address": {
                            "bUsedCode": false,
                            "roadTypeCode": "001",
                            "roadTypeAbbName": "string",
                            "roadName": dataDestino.direccion.calle1 + "," + dataDestino.direccion.area,
                            "townshipName": dataDestino.direccion.area,
                            "settlementTypeCode": "001",
                            "settlementTypeAbbName": "string",
                            "settlementName": dataDestino.contacto.nombreCortoDomicilio,
                            "stateAbbName": dataDestino.direccion.estado,
                            "zipCode": dataDestino.direccion.zip,
                            "countryCode": "484",
                            "countryName": "MEX",
                            "addressReference": dataDestino.direccion.referencia,
                            "externalNum": dataDestino.direccion.numExt || "00",
                            "indoorInformation": dataDestino.direccion.numInt,
                            "localityName": dataDestino.direccion.ciudad,

                            "betweenRoadName1": "La Morelos",
                            "betweenRoadName2": "Los Estrada",
                        }
                    }
                }
            }
        }
    }

    const response = await controllerEstafetaServices.generateLabel(dataObj);
    if (response?.data !== null) {
        const objToBd = {
            client: user._id,
            createdAt: Date.now(),
            parcel: "Estafeta",
            labelId: response?.labelPetitionResult?.elements[0]?.waybill || "error",
            pieces: [{ weight: peso, dimensions: `${alto}x${ancho}x${largo}` }],
        }
        const registerOnBd = await controllerMongoData.saveGeneratedLabelDataOnBDV2({
            userId: user._id,
            request: req.body,
            response,
            data: objToBd,
            type: "Estafeta",
            createdAt: Date.now()
        });
        registerOnBd
    }

    return res.status(200).json({
        status: "ok",
        messages: "ok",
        data: response
    });
});

module.exports = router;
