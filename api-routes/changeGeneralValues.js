const express = require('express');
const router = express.Router();
const controllerMongoData = require('../models/controllerMongoBD')

router.post('/', async (req, res) => {
    const registerOnBd = await controllerMongoData.saveGeneralValues({
        FFTaxes: {
            "aerial": 25,
            "land": 30
        }
    })
    console.log("Saved values on BD ", registerOnBd)
    res.status(200).json({status:"ok", messages:"ok", data: registerOnBd})
})
module.exports = router