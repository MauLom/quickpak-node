const express = require('express')
const router = express.Router();

router.post('/', (req, res) => {
    let data = req.body.data
    if (req.body.data === undefined || req.body.data === "" || req.body.data === null) {
        res.status(500).json({ status: "error", messages: "No se pudo leer la propiedad data del body" })
    } else {
        data = req.body.data
        res.status(200).json({ status: "OK", messages: "ok", data: data })


    }
})
module.exports = router;