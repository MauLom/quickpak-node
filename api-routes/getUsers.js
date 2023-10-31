const express = require('express');
const router = express.Router();
const controllerMongoData = require('../models/controllerMongoBD')
const CryptoJS = require('crypto-js')

router.post('/', async (req, res) => {
    var direccion = ''
    var idServices = ''

    if (req.body.referencia === "" || req.body.referencia === undefined) {
        res.status(500).json({ status: "error", message: "No se pudo leer la propiedad 'referencia' del body", data: referencia })
    } else if (req.body.idServices === "" || req.body.idServices === undefined) {
        res.status(500).json({ status: "error", message: "No se pudo leer la propiedad 'idServices' en el body", data: idServices })
    } else {
        referencia = req.body.referencia
        idServices = req.body.idServices
        var descifrado=CryptoJS.AES.decrypt(idServices,'test');
        var textofinal=descifrado.toString(CryptoJS.enc.Utf8);
        const resuloffind = await controllerMongoData.findOneClient({ referencia: referencia, idServices: textofinal }) 
        if (resuloffind === null) {
            res.status(500).json({ status: "error", message: "No se pudo encontrar", data:false })
        }else{
            res.status(200).send({ message: 'se recibieron los datos', data: true })
        }
    }
})
router.post('/register', async (req, res)=>{
    var idServices=""
    var referencia="" 
    var matriz={}
    if (req.body.idServices === "" || req.body.idServices === undefined) {
        res.status(500).json({ status: "error", message: "No se pudo leer la propiedad 'referencia' del body", data: referencia })
    }else if (req.body.referencia === "" || req.body.referencia === undefined) {
        res.status(500).json({ status: "error", message: "No se pudo leer la propiedad 'idServices' en el body", data: idServices })
    } else if (req.body.matriz === null || req.body.matriz === undefined) {
        res.status(500).json({ status: "error", message: "No se pudo leer la propiedad 'idServices' en el body", data: idServices })
    } else {
        idServices=req.body.idServices
        referencia=req.body.referencia
        matriz=req.body.matriz
        const UserInserted= await controllerMongoData.saveGeneratedUsersonBD({idServices:idServices, referencia:referencia, matriz:matriz})
    }
})
router.post('/getDirection', async (req,res) =>{
  
    var id = ''
    var idServices = ''

    if (req.body.id === "" || req.body.id === undefined) {
        res.status(500).json({ status: "error", message: "No se pudo leer la propiedad 'id' del body", data: id })
    } else if (req.body.idServices === "" || req.body.idServices === undefined) {
        res.status(500).json({ status: "error", message: "No se pudo leer la propiedad 'idServices' en el body", data: idServices })
    } else {
        id = req.body.id
        idServices = req.body.idServices
        var descifrado=CryptoJS.AES.decrypt(idServices,'test');
        var textofinal=descifrado.toString(CryptoJS.enc.Utf8);
        const resuloffind = await controllerMongoData.findDirectionNotebook({  idServices: idServices, id: id }) 
        if (resuloffind === null) {
            res.status(500).json({ status: "error", message: "No se pudo encontrar", data:false })
        }else{
            res.status(200).send({ message: 'se recibieron los datos', data: resuloffind.datos })
        }
    }
})
router.post('/saveDirection', async (req, res) =>{
    var idServices=""
    var direccion="" 
    if (req.body.idServices === "" || req.body.idServices === undefined) {
        res.status(500).json({ status: "error", message: "No se pudo leer la propiedad 'idServices' del body", data: idServices })
    }else if (req.body.direccion === "" || req.body.direccion === undefined) {
        res.status(500).json({ status: "error", message: "No se pudo leer la propiedad 'direccion' en el body", data: direccion })
    }  else {
        idServices=req.body.idServices
        direccion=req.body.direccion
        await controllerMongoData.saveDirectionsNoteBook({idServices:idServices, datos:direccion})
    }
})
module.exports = router