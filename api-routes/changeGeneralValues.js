const express = require('express');
const router = express.Router();
const controllerMongoData = require('../models/controllerMongoBD')

router.post('/', async (req, res) => {
    if(req.body.aerial === undefined|| req.body.aerial === "" || req.body.aerial === 0 ) {
        res.status(500).json({status:"error", message:"El campo aerial no puede leerse"})
    } else if(req.body.land === undefined|| req.body.land === "" || req.body.land === 0 ) {
        res.status(500).json({status:"error", message:"El campo land no puede leerse"})
    } else {
        const registerOnBd = await controllerMongoData.saveGeneralValues({
         
                "aerial": req.body.aerial,
                "land": req.body.land
        })
        res.status(200).json({status:"ok", messages:"ok", data: registerOnBd})
    }


})

router.get('/', async (req, res) => {
    const resultOfFind = await controllerMongoData.findGeneralValues()
    res.status(200).json({data:resultOfFind, message:"Ok"})
})
module.exports = router