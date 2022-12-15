const { default: axios } = require('axios');
const express = require('express');
const router = express.Router();


router.get("/", async (req, res) => {
    const zipCode = req.query.zipCode
    const urlServiceGoogle = "https://maps.googleapis.com/maps/api/geocode/json?"
    const payload = { 'components': 'postal_code:' + zipCode + '|country:MX', 'key': 'AIzaSyDVizqauMJ_a3bwcNtsLt_3Y78l74rDF14' }

    const peticion = await axios
        .get(urlServiceGoogle, {params:payload})
        .then((res)=> {return res})
        .catch((error)=> {console.log("error:", error )})
    res.status(200).json({message:"Ok", data: peticion.data})
    // r = requests.get(url=urlServiceGoogle, headers=headers, params=payload)
    // response = jsonify(r.text)
    // response.headers.add("Access-Control-Allow-Origin", "*")
    // return response
})
module.exports = router;