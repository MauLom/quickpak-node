const express = require('express')
const router = express.Router();

router.post('/', (req, res) => {
    let data = req.body.data
    let user = req.body.user
    if (req.body.data === undefined || req.body.data === "" || req.body.data === null) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad data del body" })
    }else if (req.body.user === undefined || req.body.user === "" || req.body.user === null){
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad user del body" })
    }else {
        data = req.body.data
        res.status(200).json({ status: "OK", messages: "ok", data: data })


    }
})
router.post('/DHL', (req,res)=>{
    let data = req.body.data
    let user = req.body.user
    if (req.body.data === undefined || req.body.data === "" || req.body.data === null) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad data del body" })
    } else if (req.body.user === undefined || req.body.user === "" || req.body.user === null){
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad user del body" })
    }else{
        data = req.body.data
        user = req.body.user
        
        res.status(200).json({ status: "OK", messages: "ok", data: data })
    }
})
module.exports = router;