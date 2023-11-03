require('dotenv').config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const router = express.Router();
const bodyParser = require("body-parser");
const url = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

router.use(bodyParser.json());
router.post("", async (req, res) => {
    const { username, password } = req.body;
    try {
        const client = new MongoClient(url, { useUnifiedTopology: true });
        const db = client.db(dbName);
        const collection = db.collection('users');

        const user = await collection.findOne({ userName: username });
        if (!user) {
            client.close();
            return res.status(401).json({ message: "Incorrect username" });
        }

        // Here, perform your password comparison logic
        if (user.password !== password) {
            client.close();
            return res.status(401).json({ message: "Incorrect password" });
        }

        client.close();
        return res.status(200).json({ message: "Logged in", id: user._id, role: user.role });
    } catch (err) {
        return res.status(500).json({ message: err });
    }
});

module.exports = router;
