const express = require('express')
const router = express.Router()

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://maulom:rnreqcL5@logisticclcuster.8cqosl5.mongodb.net/";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

router.get("/", async (req, res) => {
    try{
        const db = client.db("Quickpak_logistic");
        const clientsList = await db
        .collection("users")
        .find({})
        .toArray()
        res.json({users:clientsList})
    } catch (e) {
        console.error("Error while get usersData: ", e)
    }
})

router.post("/", async (req,res) =>{
    try{
        if(!req?.body?.userName){
            res.json({"message": "Cannot read username"})
        }else if (!req?.body?.password) {
            if(!req?.body?.password){
                res.json({"message": "Cannot read password"})
            }
        } else {
            const db = client.db("Quickpak_logistic");
            const clientsList = await db
            .collection("users")
            .insertOne({"userName": req?.body?.userName, "password":req?.body?.password})
            res.json({"message": "Added user"})
        }
    }catch(e){
        console.error("Error while adding user: ", e)
    
    }})

module.exports =router

