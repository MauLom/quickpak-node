const express = require('express')
const router = express.Router()

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://root:Hyklv5gh@cluster0.dl9kn2d.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

router.get("/", async (req, res) => {
    try{
        const db = client.db("QuickpakMain");
        const clientsList = await db
        .collection("clients")
        .find({})
        .toArray()
        res.json({users:clientsList})
    } catch (e) {
        console.error("Error while get usersData: ", e)
    }
})
module.exports =router