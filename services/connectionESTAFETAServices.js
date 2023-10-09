const axios = require('axios');
const oauth = require('axios-oauth-client');
const config =  require('../config')
const envVariables = config.getVariables()

const getClientCredentials = oauth.client(axios.create(), {
    url: envVariables.URLtoken,
    grant_type: 'client_credentials',
    client_id: envVariables.EstftApiKey,
    client_secret: envVariables.EstftScrt,
    scope: 'execute',
});
const getClientCredentialsQA = oauth.client(axios.create(), {
    url: envVariables.fixURLtoken,
    grant_type: 'client_credentials',
    client_id: envVariables.fixEstftApiKey,
    client_secret: envVariables.fixEstftScrt,
    scope: 'execute',
});

const waybills = envVariables.URLBase+"wayBills?outputType=FILE_PDF&outputGroup=REQUEST&responseMode=SYNC_INLINE&printingTemplate=NORMAL_TIPO7_ZEBRAORI"
const rateRequest = "https://wscotizadorqa.estafeta.com/v2/FrecuenciaCotizadorOP/frecuenciacotizador"


module.exports = {

    generateLabel: async (dataToSend) => {
        const bearerToken = await getClientCredentials()
        const bearerStringWithToken = "Bearer " + bearerToken.access_token
        
        
        const config = {
            headers: {
                apiKey: envVariables.EstftApiKey,
                Authorization: bearerStringWithToken,
                ContentType : "application/json",
                Accept: "*",
                AcceptEncoding: "gzip, deflate, br"
            }
        }
        const resolvedRequest = await axios
            .post(waybills, dataToSend, config
            )
            .then(res => {
                return res.data
            })
            .catch(error => {
                console.error("error:",error);
                return error
            });
        return await resolvedRequest
    },
    getRates: async (dataToSend) => {
        const bearerToken = await getClientCredentialsQA()
        const bearerStringWithToken = "Bearer " + bearerToken.access_token
        const config = {
            headers: {
                apiKey: envVariables.fixEstftApiKey,
                Authorization: bearerStringWithToken
            }
        }
        const resolvedRequest = await axios
            .post(rateRequest, dataToSend, config)
            .then(res => {
                return res.data
            })
            .catch(error => {
                console.error(error)
                return error
            })
        return await resolvedRequest
    },
    getValidServices: async (arrServices, zone) => {
        let arrClean = []
        arrServices.forEach(cadaServicio => {
            switch (cadaServicio.DescripcionServicio) {
                case 'Dia Sig.':
                    arrClean.push(cadaServicio)
                    break;
                case 'Terrestre':
                    arrClean.push(cadaServicio)
                    break;
            }
        })
        return arrClean
    }
}