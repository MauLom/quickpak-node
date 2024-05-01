const DHLAccessUser = "centraldeenMX"
const DHLAccessPass = "F$3lN^1lK@4iY!9r"
const enviroment = "gbl/"
const FirebaseConfigOBJ = process.env.FBCOBJ

const EstftScrt = "0385796e802741a9bd0c171e8fbbcb6b"
//const EstftScrt = "4b087ce15b0d49b58020f86b51c9ee0b"

const EstftApiKey = "l7cd90d9b1fa31487c8813704a6fcfd6e9"
//const EstftApiKey = "l74266177fff204854ac3b891a992353f2"
const noClient = "5899980"
const OrgVentas = "611"
const URLtoken = "https://api.estafeta.com/auth/oauth/v2/token"
const URLBase = "https://labelrest.estafeta.com/v1/"

const fixURLtoken = "https://apiqa.estafeta.com:8443/auth/oauth/v2/token"
const fixEstftApiKey = "l7cd90d9b1fa31487c8813704a6fcfd6e9"
const fixEstftScrt = "0385796e802741a9bd0c171e8fbbcb6b"
const fixURLBase = "https://labelqa.estafeta.com/v1/"

module.exports = {
    getVariables: () => {
        const secretsVariable = {
            "DHLAccessUser": DHLAccessUser,
            "DHLAccessPass": DHLAccessPass,
            "FirebaseConfigOBJ": FirebaseConfigOBJ,
            "enviroment": enviroment,
            "EstftScrt": EstftScrt,
            "EstftApiKey": EstftApiKey,
            "noClient": noClient,
            "OrgVentas": OrgVentas,
            "URLtoken": URLtoken,
            "URLLabel": URLBase,
            "URLBase": URLBase,
            "fixURLtoken": fixURLtoken,
            "fixEstftApiKey": fixEstftApiKey,
            "fixEstftScrt": fixEstftScrt,
            "fixURLBase": fixURLBase
        }
        return secretsVariable;
    }

}