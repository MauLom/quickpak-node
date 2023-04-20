const express = require('express')
const router = express.Router()
const controllerDHLServices = require('../services/connectionDHLServices')
const controllerMongoData = require('../models/controllerMongoBD')
const controllerEstafetaServices = require('../services/connectionESTAFETAServices')
const controllerFirebaseBD = require('../models/controllerFirebaseBD');

const config = require('../config')

const envVariables = config.getVariables()

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}
router.post('/', async (req, res) => {
    var userId = ""
    let hora = "T12:00:00 GMT-05:00"
    if (req.body.hora !== undefined) {
        hora = req.body.hora
    }
    try {
        userId = req.body.userId
        let customerReference = ""
        if (userId === "4xUVTqVZ1n1FuBikezmQ") {
            customerReference = "REDBOX"
        } else if (userId === "enc0UiLq0oNXm1GTFHB8") {
            customerReference = "SRS Express"
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
                        "RequestedPackages": req.body.packages
                    }
                }
            }
        }

        if(req.body.packages[0].InsuredValue){
            dataObj.ShipmentRequest.RequestedShipment.ShipmentInfo['SpecialServices'] = [
                { "Service": { "ServiceType": "II", "ServiceValue": req.body.packages[0].InsuredValue, "CurrencyCode": "MXN" } }
            ]
        }
        const response = await controllerDHLServices.generateLabel(dataObj)
        const objResponse = { status: "ok", messages: "ok", data: response.data }
        const registerOnBd = await controllerMongoData.saveGeneratedLabelDataOnBD({ userId: userId, request: req.body, response: response.data, type: "DHL", createdAt: Date.now() })

        // const registerOnBd = await controllerFirebaseBD.addGeneratedLabelDHl(userId, { request: req.body, response: response.data })
        res.status(200).json(objResponse)
    } catch (e) {
        // console.log("error:", e)
        res.status(200).json({ status: "error", messages: ("error: " + e) })
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
    var tipoServicioId = ""
    var descripcionPaquete = ""
    var dataOrigen = ""
    var dataDestino = ""
    var customerReference = "test"
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
    } else if (req.body.descripcionPaquete === "" || req.body.descripcionPaquete === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'descripcionPaquete' del body" })
    } else if (req.body.userId === "" || req.body.userId === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'userId' del body" })
    } else if (req.body.dataOrigen === "" || req.body.dataOrigen === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'dataOrigen' del body" })
    } else if (req.body.dataDestino === "" || req.body.dataDestino === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'dataDestino' del body" })
    } else if (req.body.tipoServicioId === "" || req.body.tipoServicioId === undefined) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad 'tipoServicioId' del body" })
    } else {
        alto = req.body.alto
        ancho = req.body.ancho
        esPaquete = req.body.esPaquete
        largo = req.body.largo
        peso = req.body.peso
        userId = req.body.userId
        dataOrigen = req.body.dataOrigen
        dataDestino = req.body.dataDestino
        descripcionPaquete = req.body.descripcionPaquete
        if (userId === "4xUVTqVZ1n1FuBikezmQ") {
            customerReference = "REDBOX"
        } else if (userId === "enc0UiLq0oNXm1GTFHB8") {
            customerReference = "SRS Express"
        }
        let additionalInfo = ""
        let content = ""
        let seguroMontoDeclarado = 0
        let llevaSeguro = false
        tipoServicioId = req.body.tipoServicioId
        if (req.body.seguro !== undefined && Number(req.body.seguro) > 0) {
            seguroMontoDeclarado = parseFloat(req.body.seguro).toFixed(2)
            seguroMontoDeclarado = seguroMontoDeclarado.replace(",", ".")
            llevaSeguro = true
        }
        if (req.body.additionalInfo !== undefined) {
            additionalInfo = req.body.additionalInfo
        }
        if (req.body.content !== undefined) {
            content = req.body.content
        }
        const dateNow = new Date()
        const dateValidThru = dateNow.addDays(14)
        const dateValidThruFormatted = [
            dateValidThru.getFullYear(),
            padTo2Digits(dateValidThru.getMonth() + 1),
            padTo2Digits(dateValidThru.getDate()),
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
                    "aditionalInfo": additionalInfo,
                    "content": content,
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
                    "serviceTypeId": tipoServicioId,
                    "salesOrganization": envVariables.OrgVentas,
                    "effectiveDate": dateValidThruFormatted,
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
                            "roadTypeCode": "001",
                            "roadTypeAbbName": "string",
                            "roadName": dataOrigen.direccion.calle1 + "," + dataOrigen.direccion.area,
                            "townshipName": dataOrigen.direccion.area,
                            "settlementTypeCode": "001",
                            "settlementTypeAbbName": "string",
                            "settlementName": dataOrigen.contacto.nombreCortoDomicilio,

                            "stateAbbName": dataOrigen.direccion.estado,
                            "zipCode": dataOrigen.direccion.zip,
                            "countryCode": "484",
                            "countryName": "MEX",
                            "addressReference": dataOrigen.direccion.referencia,
                            "externalNum": dataOrigen.direccion.numExt,
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
                            "roadTypeCode": "001",
                            "roadTypeAbbName": "string",
                            "roadName": dataOrigen.direccion.calle1 + "," + dataOrigen.direccion.area,
                            "townshipName": dataOrigen.direccion.area,
                            "settlementTypeCode": "001",
                            "settlementTypeAbbName": "string",
                            "settlementName": dataOrigen.contacto.nombreCortoDomicilio,

                            "stateAbbName": dataOrigen.direccion.estado,
                            "zipCode": dataOrigen.direccion.zip,
                            "countryCode": "484",
                            "countryName": "MEX",
                            "addressReference": dataOrigen.direccion.referencia,
                            "externalNum": dataOrigen.direccion.numExt,
                            "indoorInformation": dataOrigen.direccion.numInt,
                            "localityName": dataOrigen.direccion.ciudad
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
                                "externalNum": dataDestino.direccion.numExt,
                                "indoorInformation": dataDestino.direccion.numInt,
                                "localityName": dataDestino.direccion.ciudad
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
                                "externalNum": dataDestino.direccion.numExt,
                                "indoorInformation": dataDestino.direccion.numInt,
                                "localityName": dataDestino.direccion.ciudad
                            }
                        }
                    }
                }
            }
        }
        const response = await controllerEstafetaServices.generateLabel(dataObj)

        if (null !== response?.data) {

            // const objToBd ={
            //     client:userId,
            //     createdAt: Date.now(),
            //     parcel:"Estafeta",
            //     labelId: response?.labelPetitionResult?.elements[0]?.waybill || "error",
            //     pieces:[{weight:peso, dimensions: `${alto}x${ancho}x${largo}`}],
            // }


            const registerOnBd = await controllerMongoData.saveGeneratedLabelDataOnBD({ userId: userId, request: req.body, response: response, type: "Estafeta", createdAt: Date.now() })
            console.log("Saved on BD", registerOnBd)
        }
        res.status(200).json({ status: "ok", messages: "ok", data: response })

    }
})
module.exports = router