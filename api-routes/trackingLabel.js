const express = require('express');
const router = express.Router();
const controllerDHLServices = require('../services/connectionDHLServices')

router.get('/', async (req, res) => {
    const labelID = req.query.label
    /// Possible values;
    // - LAST_CHECKPOINT_ONLY
    // - ALL_CHECKPOINTS
    // - SHIPMENT_DETAILS_ONLY
    // - ADVANCE_SHIPMENT
    // - BBX_CHILDREN
    const detailsLeveloption = "ALL_CHECKPOINTS"
    /// Possible Values:
    // - B = Both Piece and Shipment
    // - S = Shipment Details Only
    // - P = Piece Details Only
    const piecesOption = "S"
    if (null === labelID || undefined === labelID) {
        res.status(500).json({ status: "error", message: "No se pudo leer el label del query" })
    } else {
        const dataToDHL = {
            "trackShipmentRequest": {
                "trackingRequest": {
                    "TrackingRequest": {
                        "Request": {
                            "ServiceHeader": {
                                "MessageTime": "2023-03-23T16:46:42",
                                "MessageReference": "896ab310ba5311e38d9ffb21b7e57543"
                            }
                        },
                        "AWBNumber": {
                            "ArrayOfAWBNumberItem": labelID
                        },
                        "LevelOfDetails": detailsLeveloption,
                        "PiecesEnabled": piecesOption
                    }
                }
            }
        }

        const responseDHL = await controllerDHLServices.trackingLabel(dataToDHL)
        res.status(200).json({status:"Ok", message:"DHL data obtained", data: responseDHL})
    }

})

module.exports = router;