const express = require('express');
const router = express.Router();
const controllerMongoData = require('../models/controllerMongoBD')
const CryptoJS = require('crypto-js')

router.post('/', async (req, res) => {
    var referencia = ''
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
        
        const resuloffind = await controllerMongoData.findClients({ referencia: referencia, idServices: textofinal }) 
        
        
        console.log("resultado en getUsers", resuloffind)
        if (resuloffind === null) {
            
            res.status(500).json({ status: "error", message: "No se pudo encontrar", data:false })

        }else{
            res.status(200).send({ message: 'se recibieron los datos', data: true })
            
        }
        console.log('result',resuloffind)
        
        


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
        console.log('resultadosde insercion de cliente',UserInserted )
    }
})
module.exports = router