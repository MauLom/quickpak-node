const express = require('express')
const router = express.Router()

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://root:Hyklv5gh@cluster0.dl9kn2d.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })
async function run() {
    try {
        const database = client.db("QuickpakMain");
        const generatedLabels = database.collection("generatedLabels");
        return generatedLabels
    } finally {
        await client.close();
    }
}


router.get('/', async (req, res) => {
    let limit = 20
    let skipper = 0
    if(req.query?.limit){
        limit = req.query?.limit
    }
    if(req.query?.page){
        skipper = req.query?.page * limit
    }
    try {
        const db = client.db("QuickpakMain");
        const generatedLabelSize = await db
            .collection("generatedLabels")
            .estimatedDocumentCount()
        const generatedLabels = await db
            .collection("generatedLabels")
            .find({})
            .skip(skipper)
            .limit(Number.parseInt(limit))
            .sort({ metacritic: -1 })
            .toArray();
        res.json({entries:generatedLabels, size:generatedLabelSize});
    } catch (e) {
        console.error(e);
    }
})
module.exports = router