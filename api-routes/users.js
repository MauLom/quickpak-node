const express = require('express');
const router = express.Router();
const controllerMongoData = require('../models/controllerMongoBD')
const CryptoJS = require('crypto-js')

router.get('/:userId?', async (req, res) => {
    let userId = ""
    userId = req.params?.userId
    if(undefined != userId && "" != userId) {
        const data = await controllerMongoData.findOneClientById(userId)
        res.status(200).send({message: "One user data", data:data})
    } else {
        const data = await controllerMongoData.findClients()
        res.status(200).send({message: "All users data", data:data})
    }
  
})
router.get('/')
module.exports = router