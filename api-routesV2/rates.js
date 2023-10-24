const router = express.Router();
const bodyParser = require("body-parser");
const { MongoClient, ObjectId } = require("mongodb")
const { validateRequiredProperties } = require("./validateRequiredProperties")
router.use(bodyParser.json());

/// V1 imports

const getzoneDHL = require('../services/zoneRequest')
const controllerDHLServices = require('../services/connectionDHLServices')
const controllerWeight = require('../services/calculateWeight')

router.post('/DHL', async (req, res) => {
    const requiredProperties = [
        'timestamp',
        'shipperCity',
        'shipperCountryCode',
        'shipperZip',
        'recipientCity',
        'recipientCountryCode',
        'recipientZip',
        'packages',
        'insurance',
        'userId',
    ];

    validateRequiredProperties(req, res, requiredProperties);

    let hora = ""
    if (req.body.hora !== undefined) {
        seguroMontoDeclarado = parseFloat(req.body.seguro).toFixed(2)
        seguroMontoDeclarado = seguroMontoDeclarado.replace(",", ".")
        llevaSeguro = true
    }
    /// GET ZONE
    const zonedhl = getzoneDHL.getZoneRequest(req.body.shipperZip, req.body.recipientZip);

    /// GET DHL DATA
    const dataToDHL = controllerDHLServices.structureRequestToDHL(req.body.timestamp, req.body.shipperCity, req.body.shipperZip, req.body.shipperCountryCode, req.body.recipientCity, req.body.recipientZip, req.body.recipientCountryCode, req.body.packages, req.body.insurance)

    /// GET WEIGHT
    const weightForCalcs = controllerWeight.getWeightForCalcs(packages)
    
    /// GET USER MATRIZ (FOR USER AVAILABLE SERVICES/FILTERED BY DHL RESPONSE)
    /// GET FFTaxes
    /// CONVERT DATA TO RESPONSE

})