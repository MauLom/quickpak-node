const axios = require('axios');
const config = require('../config')
const ProvidersAuthSettings = require('../src/models/ProvidersAuthSettings')
const mainUrl = "https://wsbexpress.dhl.com/rest/"
const rateRequest = "RateRequest"
const shipmentRequest = "ShipmentRequest"
const trackintRequestURL = "TrackingRequest"
const envVariables = config.getVariables()

module.exports = {

    structureRequestToDHL: (timestamp, shipperCity, shipperZip, shipperCountryCode, recipientCity, recipientZip, recipientCountryCode, packages, insurance) => {
        return {
            RateRequest: {
                ClientDetails: 1,
                RequestedShipment: {
                    GetDetailedRateBreakdown: "Y",
                    DropOffType: "REGULAR_PICKUP",
                    NextBusinessDay:"Y",
                    ShipTimestamp: timestamp,
                    UnitOfMeasurement: "SI",
                    Content: "DOCUMENTS",
                    PaymentInfo: "DDU",
                    Account: 980966404,
                    Ship: {
                        Shipper: {
                            City: shipperCity,
                            PostalCode: shipperZip,
                            CountryCode: shipperCountryCode
                        },
                        Recipient: {
                            City: recipientCity,
                            PostalCode: recipientZip,
                            CountryCode: recipientCountryCode
                        }
                    },
                    Packages: {
                        RequestedPackages: packages
                    },
                    DeclaredValue: 0,
                    SpecialServices: {
                        Service: [
                            {
                                ServiceType: "II",
                                ServiceValue: insurance,
                                CurrencyCode: "MXN"
                            }
                        ]
                    }
                }
            }
        };
    },

    getRateAndStructure: async (dataToSend) => {
        try {
            const response = await axios.post(
                `${mainUrl}${envVariables.enviroment}${rateRequest}`,
                dataToSend,
                {
                    auth: {
                        username: envVariables.DHLAccessUser,
                        password: envVariables.DHLAccessPass
                    }
                }
            );
            const { RateResponse: { Provider } } = response.data;

            const code = Provider[0]['@code'];
            const message = Provider[0]?.Notification[0]['Message']
            if (code === 0 || message !== null) {
                return { error: true, message: (Provider[0].Notification[0]['Message']) };
            }

            const { Service } = Provider[0];

            if (Array.isArray(Service)) {
                Service.forEach(service => {
                    if (service?.Charges?.Charge?.length) {
                        service?.Charges.Charge.forEach(charge => {
                            if (charge.ChargeBreakdown) {
                                delete charge.ChargeBreakdown;
                            }
                        });
                    }
                });

                return Service;
            }

            if (Service?.Charges?.Charge?.length) {
                Service.Charges.Charge.forEach(charge => {
                    if (charge.ChargeBreakdown) {
                        delete charge.ChargeBreakdown;
                    }
                });
            }
            return [Service];
        } catch (error) {
            console.error(error);
            return error;
        }
    },

    generateLabel: async (dataToSend) => {
        const resolvedRequest = await axios
            .post(mainUrl + envVariables.enviroment + shipmentRequest, dataToSend,
                { auth: { username: envVariables.DHLAccessUser, password: envVariables.DHLAccessPass } })
            .then(res => {
                return res
            })
            .catch(error => {
                console.error(error);
                return error
            });
        return resolvedRequest
    },
    
    generateLabelWithCredentials: async (dataToSend, username, password) => {
        const resolvedRequest = await axios
            .post(mainUrl + envVariables.enviroment + shipmentRequest, dataToSend,
                { auth: { username: username, password: password } })
            .then(res => {
                return res
            })
            .catch(error => {
                console.error(error);
                return error
            });
        return resolvedRequest
    },

    trackingLabel: async (dataToSend) => {
        const resolvedRequest = await axios
            .post(`${mainUrl}${envVariables.enviroment}${trackintRequestURL}`, dataToSend, { auth: { username: envVariables.DHLAccessUser, password: envVariables.DHLAccessPass } })
            .then(res => {
                return res.data.trackShipmentRequestResponse.trackingResponse.TrackingResponse.AWBInfo.ArrayOfAWBInfoItem
            })
            .catch(error => {
                console.error(error)
                return error
            })
        return resolvedRequest
    },

    getMultiRatesAndStructure: async (providerIds, dataToSend) => {
        try {
            // Obtener las configuraciones de autenticación de los proveedores
            const providers = await ProvidersAuthSettings.find({
                _id: { $in: providerIds },
                isActive: true,
                provider: 'DHL' // Solo proveedores DHL
            });

            if (!providers || providers.length === 0) {
                return { error: true, message: 'No se encontraron proveedores DHL activos' };
            }

            // Crear promesas para todas las peticiones
            const ratePromises = providers.map(async (provider) => {
                try {
                    dataToSend.RateRequest.RequestedShipment.Account = provider.account;

                    const response = await axios.post(
                        `${mainUrl}${envVariables.enviroment}${rateRequest}`,
                        dataToSend,
                        {
                            auth: {
                                username: provider.user,
                                password: provider.password
                            }
                        }
                    );

                    const { RateResponse: { Provider } } = response.data;
                    const code = Provider[0]['@code'];
                    const message = Provider[0]?.Notification[0]['Message'];

                    if (code === 0 || message !== null) {
                        return {
                            providerId: provider._id,
                            error: true,
                            message: Provider[0].Notification[0]['Message'],
                            auth: {
                                account: provider.account,
                                username: provider.user,
                                password: provider.password
                            }
                        };
                    }

                    const { Service } = Provider[0];
                    let services;

                    if (Array.isArray(Service)) {
                        Service.forEach(service => {
                            if (service?.Charges?.Charge?.length) {
                                service?.Charges.Charge.forEach(charge => {
                                    if (charge.ChargeBreakdown) {
                                        delete charge.ChargeBreakdown;
                                    }
                                });
                            }
                        });
                        services = Service;
                    } else {
                        if (Service?.Charges?.Charge?.length) {
                            Service.Charges.Charge.forEach(charge => {
                                if (charge.ChargeBreakdown) {
                                    delete charge.ChargeBreakdown;
                                }
                            });
                        }
                        services = [Service];
                    }

                    return {
                        providerId: provider._id,
                        error: false,
                        services: services,
                        auth: {
                            account: provider.account,
                            username: provider.user,
                            password: provider.password
                        }
                    };

                } catch (error) {
                    console.error(`Error con proveedor ${provider.user}:`, error.message);
                    return {
                        providerId: provider._id,
                        error: true,
                        message: error.message || 'Error de conexión con DHL',
                        auth: {
                            account: provider.account,
                            username: provider.user,
                            password: provider.password
                        }
                    };
                }
            });

            // Ejecutar todas las peticiones en paralelo
            const results = await Promise.allSettled(ratePromises);
            
            // Procesar resultados
            const processedResults = results.map((result, index) => {
                if (result.status === 'fulfilled') {
                    return result.value;
                } else {
                    return {
                        providerId: providers[index]._id,
                        error: true,
                        message: result.reason?.message || 'Error desconocido',
                        auth: {
                            account: providers[index].account,
                            username: providers[index].user,
                            password: providers[index].password
                        }
                    };
                }
            });

            return {
                success: true,
                totalProviders: providers.length,
                results: processedResults,
                summary: {
                    successful: processedResults.filter(r => !r.error).length,
                    failed: processedResults.filter(r => r.error).length
                }
            };

        } catch (error) {
            console.error('Error en getMultiRatesAndStructure:', error);
            return {
                error: true,
                message: 'Error al procesar múltiples cotizaciones',
                details: error.message
            };
        }
    }
}