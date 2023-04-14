const DHLAccessUser = "centraldeenMX"
const DHLAccessPass = "F$3lN^1lK@4iY!9r"
const FirebaseConfigOBJ = process.env.FBCOBJ
const enviroment = "gbl/"
const EstftScrt = "bde857125970446ba047bc4e01a902dd"
const EstftApiKey = "l75b30c5d4866942f6baa2963ba4ca2b26"
const noClient = "0000000"
const OrgVentas = "112"
const URLtoken = "https://apiqa.estafeta.com:8443/auth/oauth/v2/token"
const URLBase = "https://labelqa.estafeta.com/v1/"

const fixEstftApiKey = "l75b30c5d4866942f6baa2963ba4ca2b26"
const fixURLtoken = "https://apiqa.estafeta.com:8443/auth/oauth/v2/token"
const fixEstftScrt = "bde857125970446ba047bc4e01a902dd"
const fixURLBase = "https://labelqa.estafeta.com/v1/"
// const DHLAccessUser = "centraldeenMX"
// const DHLAccessPass = "F$3lN^1lK@4iY!9r"
// const enviroment = "gbl/"
// const FirebaseConfigOBJ = process.env.FBCOBJ
// const EstftScrt = "4b087ce15b0d49b58020f86b51c9ee0b"
// const EstftApiKey = "l74266177fff204854ac3b891a992353f2"
// const noClient = "5899980"
// const OrgVentas = "611"
// const URLtoken = "https://api.estafeta.com/auth/oauth/v2/token"
// const URLBase = "https://labelrest.estafeta.com/v1/"

module.exports = {
    getVariables: () => {
        const secretsVariable = {
            "DHLAccessUser": DHLAccessUser,
            "DHLAccessPass": DHLAccessPass,
            "FirebaseConfigOBJ": FirebaseConfigOBJ,
            "enviroment": enviroment,
            "EstftScrt" : EstftScrt,
            "EstftApiKey": EstftApiKey,
            "noClient": noClient,
            "OrgVentas": OrgVentas,
            "URLtoken": URLtoken,
            "URLLabel": URLBase,
            "URLBase": URLBase,
            "fixEstftApiKey":fixEstftApiKey,
            "fixURLtoken": fixURLtoken,
            "fixEstftScrt":fixEstftScrt,
            "fixURLBase": fixURLBase
        }
        return secretsVariable;
    }

}
