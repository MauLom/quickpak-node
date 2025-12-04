const express = require('express')
const router = express.Router()
const controllerDHLServices = require('../services/connectionDHLServices')
const controllerMongoData = require('../models/controllerMongoBD')
const controllerEstafetaServices = require('../services/connectionESTAFETAServices')
const controllerFirebaseBD = require('../models/controllerFirebaseBD');
const config = require('../config')
const envVariables = config.getVariables()

const { MongoClient, ObjectId } = require("mongodb");
// Connection URL and database name
const url = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
const client = new MongoClient(url, { useUnifiedTopology: true });


Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}

router.get('/', async (req, res) => {
    const { origin, userId } = req.query;
    try {
        await client.connect();
        const db = client.db(dbName);
        const labelsCollections = db.collection(origin);
        const data = await labelsCollections.find().toArray();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    } finally {
        await client.close();
    }
});


router.post('/DHL', async (req, res) => {
    try {
        const {
            userId,
            hora = req.body.hora || "T17:30:00 GMT-06:00",
            packages,
            oStreets, oStreets2, oStreets3, oCity, oZip, oName, oCompany, oPhone, oEmail,
            dStreets, dStreets2, dStreets3, dCity, dZip, dName, dCompany, dPhone, dEmail,
            service, date, desc
        } = req.body;

        if (!userId) {
            return res.status(400).json({
                status: "error",
                messages: "userId es requerido para generar la etiqueta"
            });
        }

        // Buscar el usuario directamente en user_pricing
        await client.connect();
        const db = client.db(dbName);
        const userPricingCollection = db.collection("user_pricing");
        const providersAuthSettings = db.collection('providers_auth_settings');
        
        const user = await userPricingCollection.findOne({ _id: new ObjectId(userId) });
        console.log("user from user_pricing collection", user);
        
        if (!user) {
            throw new Error('Usuario no encontrado en user_pricing');
        }

        // Si el usuario tiene provider_auth_settings, hacer el join con la colección de providers_auth_settings
        if (user.provider_auth_settings && Array.isArray(user.provider_auth_settings) && user.provider_auth_settings.length > 0) {
            // Convertir los IDs a ObjectId si son strings
            const providerIds = user.provider_auth_settings.map(id => {
                try {
                    return typeof id === 'string' ? new ObjectId(id) : id;
                } catch (error) {
                    console.warn('Invalid ObjectId:', id);
                    return null;
                }
            }).filter(id => id !== null);

            if (providerIds.length > 0) {
                // Buscar los provider_auth_settings completos
                const fullProviderSettings = await providersAuthSettings.find({
                    _id: { $in: providerIds },
                    isActive: true // Solo proveedores activos
                }).toArray();

                console.log('🔗 [V2] Providers auth settings cargados:', fullProviderSettings.map(p => ({
                    id: p._id,
                    provider: p.provider,
                    account: p.account,
                    user: p.user,
                    isActive: p.isActive
                })));

                // Reemplazar los IDs con los objetos completos
                user.provider_auth_settings = fullProviderSettings;
            }
        }
        
        const customerReference = user?.string_reference || "Quikpack"

        let newArrWithPackagess = packages
        newArrWithPackagess.forEach(cadaPaquete => {
            cadaPaquete['CustomerReferences'] = customerReference
        })

        const baseDataAddress = (streets, streets2, streets3, city, zip) => ({
            "StreetLines": streets,
            "City": city,
            "PostalCode": zip,
            "CountryCode": "MX",
            ...(streets2 && { "StreetLines2": streets2 }),
            ...(streets3 && { "StreetLines3": streets3 })
        });

        const baseDataAddressOrigin = baseDataAddress(oStreets, oStreets2, oStreets3, oCity, oZip);
        const baseDataAddressDestiny = baseDataAddress(dStreets, dStreets2, dStreets3, dCity, dZip);
        const dataObj = {
            "ShipmentRequest": {
                "RequestedShipment": {
                    "ShipmentInfo": {
                        "DropOffType": "REGULAR_PICKUP",
                        "ServiceType": service,
                        "Account": 980966404,
                        "Currency": "MXN",
                        "UnitOfMeasurement": "SI",
                        "PackagesCount": 1,
                        "LabelOptions": {
                            "RequestWaybillDocument": "Y",
                            "HideAccountInWaybillDocument": "Y"
                        },
                        "LabelType": process.env.DHL_LABEL_TYPE || "PDF",
                    },
                    "ShipTimestamp": date + hora,
                    "PaymentInfo": "DDU",
                    "InternationalDetail": {
                        "Commodities": {
                            "NumberOfPieces": 1,
                            "Description": desc
                        }
                    },
                    "Ship": {
                        "Shipper": {
                            "Contact": {
                                "PersonName": oName,
                                "CompanyName": oCompany,
                                "PhoneNumber": oPhone,
                                "EmailAddress": oEmail
                            },
                            "Address": baseDataAddressOrigin
                        },
                        "Recipient": {
                            "Contact": {
                                "PersonName": dName,
                                "CompanyName": dCompany,
                                "PhoneNumber": dPhone,
                                "EmailAddress": dEmail
                            },
                            "Address": baseDataAddressDestiny
                        }
                    },
                    "Packages": {
                        "RequestedPackages": newArrWithPackagess
                    }
                }
            }
        };

        if (newArrWithPackagess[0]?.InsuredValue) {
            dataObj.ShipmentRequest.RequestedShipment.ShipmentInfo['SpecialServices'] = [
                { "Service": { "ServiceType": "II", "ServiceValue": newArrWithPackagess[0].InsuredValue, "CurrencyCode": "MXN" } }
            ];
        }

        let response;

        // Implementar la obtención de múltiples rates para encontrar el proveedor más barato
        try {
            if (user.hasDynamicCalculation && user.provider_auth_settings && user.provider_auth_settings.length > 0) {
                
                // Filtrar solo proveedores DHL
                const dhlProviders = user.provider_auth_settings.filter(provider => {
                    const normalizedProvider = provider.provider?.toUpperCase();
                    return normalizedProvider === 'DHL';
                });
                
                if (dhlProviders.length === 0) {
                    throw new Error('No se encontraron proveedores DHL configurados');
                }
                
                // Crear estructura de paquetes para cotización con el formato correcto
                let rateArrPackages = packages.map((pkg, index) => ({
                    "@number": index + 1,
                    "Weight": {
                        "Value": parseFloat(pkg.Weight || pkg.weight || 0)
                    },
                    "Dimensions": {
                        "Length": pkg.Dimensions?.Length || pkg.dimensions?.length || pkg.Length || "10",
                        "Width": pkg.Dimensions?.Width || pkg.dimensions?.width || pkg.Width || "10", 
                        "Height": pkg.Dimensions?.Height || pkg.dimensions?.height || pkg.Height || "10"
                    }
                }));
                
                // Crear estructura de datos para cotización usando paquetes normalizados
                const rateDataForQuote = controllerDHLServices.structureRequestToDHL(
                    dataObj.ShipmentRequest.RequestedShipment.ShipTimestamp,
                    dataObj.ShipmentRequest.RequestedShipment.Ship.Shipper.Address.City,
                    dataObj.ShipmentRequest.RequestedShipment.Ship.Shipper.Address.PostalCode,
                    dataObj.ShipmentRequest.RequestedShipment.Ship.Shipper.Address.CountryCode,
                    dataObj.ShipmentRequest.RequestedShipment.Ship.Recipient.Address.City,
                    dataObj.ShipmentRequest.RequestedShipment.Ship.Recipient.Address.PostalCode,
                    dataObj.ShipmentRequest.RequestedShipment.Ship.Recipient.Address.CountryCode,
                    rateArrPackages, // Usando paquetes con estructura correcta
                    newArrWithPackagess[0].InsuredValue || 0 // Clave normalizada
                );

                // Obtener múltiples cotizaciones usando solo proveedores DHL
                const multiRatesResult = await controllerDHLServices.getMultiRatesAndStructure(
                    dhlProviders.map((m) => m._id),
                    rateDataForQuote
                );
                
                // Filtrar y ordenar cotizaciones válidas
                let validQuotes = [];
                
                if (multiRatesResult && !multiRatesResult.error && multiRatesResult.results) {
                    // Filtrar resultados sin errores y buscar el servicio solicitado
                    multiRatesResult.results
                        .filter(result => !result.error && result.services) // Solo resultados exitosos
                        .forEach(result => {
                            // Buscar servicios que coincidan con el tipo solicitado
                            result.services
                                .filter(serviceItem => serviceItem['@type'] === service) // Filtrar por tipo de servicio
                                .forEach(serviceItem => {
                                    // Extraer el precio total
                                    const totalAmount = parseFloat(serviceItem.TotalNet?.Amount || 0);
                                    
                                    if (totalAmount > 0) {
                                        validQuotes.push({
                                            providerId: result.providerId,
                                            providerUser: result.auth.username,
                                            providerPassword: result.auth.password,
                                            auth: result.auth,
                                            service: serviceItem,
                                            totalAmount: totalAmount,
                                            serviceType: serviceItem['@type']
                                        });
                                    }
                                });
                        });
                    
                    // Ordenar de más barato a más caro
                    validQuotes.sort((a, b) => a.totalAmount - b.totalAmount);
                    
                    console.log('🏷️ [V2] Generando etiqueta DHL con cuenta seleccionada:', {
                        cuenta: validQuotes[0].auth.account,
                        usuario: validQuotes[0].providerUser,
                        precio: validQuotes[0].totalAmount,
                        servicio: validQuotes[0].serviceType,
                        proveedor: 'DHL',
                        endpoint: '/api/generateLabel/DHL'
                    });
                    
                    dataObj.ShipmentRequest.RequestedShipment.ShipmentInfo.Account = validQuotes[0].auth.account;

                    response = await controllerDHLServices.generateLabelWithCredentials(dataObj, validQuotes[0].providerUser, validQuotes[0].providerPassword);
                } else {
                    throw new Error('No se obtuvieron cotizaciones válidas');
                }
            } else {
                throw new Error('No hay configuración de cálculo dinámico habilitada');
            }

        } catch (error) {
            console.log('⚠️ [V2] Fallback: Generando etiqueta DHL con configuración por defecto debido a error:', error.message);
            console.log('🏷️ [V2] Generando etiqueta DHL con cuenta por defecto:', {
                cuenta: dataObj.ShipmentRequest.RequestedShipment.ShipmentInfo.Account,
                motivo: 'Configuración por defecto (no hay cálculo dinámico)',
                proveedor: 'DHL',
                endpoint: '/api/generateLabel/DHL'
            });
            response = await controllerDHLServices.generateLabel(dataObj);
        }
        console.log('✅ [V2] Etiqueta DHL generada exitosamente para usuario:', userId);
        
        const objResponse = { status: "ok", messages: "ok", data: response.data };

        // const objToBd ={
        //     client:userId,
        //     createdAt: Date.now(),
        //     parcel:"Estafeta",
        //     labelId: response?.labelPetitionResult?.elements[0]?.waybill || "error",
        //     pieces:[{weight:peso, dimensions: `${alto}x${ancho}x${largo}`}],
        // }

        const registerOnBd = await controllerMongoData.saveGeneratedLabelDataOnBDV2({
            userId,
            request: req.body,
            response: response.data,
            type: "DHL",
            createdAt: Date.now()
        });
        registerOnBd

        res.status(200).json(objResponse);
    } catch (e) {
        res.status(500).json({ status: "error", messages: `Error: ${e.message}` });
    } finally {
        await client.close();
    }
});

router.post('/estafeta', async (req, res) => {
    const requiredProperties = [
        "alto", "ancho", "esPaquete", "largo", "peso",
        "descripcionPaquete", "userId", "dataOrigen",
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
        alto, ancho, esPaquete, largo, peso, userId,
        dataOrigen, dataDestino, tipoServicioId,
        descripcionPaquete, seguro, additionalInfo, content
    } = req.body;

    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection("user_pricing");
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) })

    const customerReference =  user?.string_reference || "Quikpack"

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
            client: userId,
            createdAt: Date.now(),
            parcel: "Estafeta",
            labelId: response?.labelPetitionResult?.elements[0]?.waybill || "error",
            pieces: [{ weight: peso, dimensions: `${alto}x${ancho}x${largo}` }],
        }
        const registerOnBd = await controllerMongoData.saveGeneratedLabelDataOnBDV2({
            userId,
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

module.exports = router