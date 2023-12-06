const axios = require('axios');
const config = require('../config')
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
    }
}