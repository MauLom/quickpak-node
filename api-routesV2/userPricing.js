const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

router.use(bodyParser.json());

// Connection URL and database name
const url = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;
// MongoDB connection initialization
const client = new MongoClient(url, { useUnifiedTopology: true });

process.on("exit", () => {
  client.close();
});

client.connect().then(() => {
  const db = client.db(dbName);
  const userPricingCollection = db.collection("user_pricing");

  // Crear o actualizar usuario (POST)
  router.post("", async (req, res) => {
    let { user_id, name, basic_auth_username, basic_auth_pass } = req.body;
    if (!user_id) {
      user_id = crypto.randomUUID();
    }
    // Validar que basic_auth_username no exista ya (ignorando mayúsculas/minúsculas)
    const existingUser = await userPricingCollection.findOne({ basic_auth_username: { $regex: `^${basic_auth_username}$`, $options: 'i' } });
    if (existingUser) {
      return res.status(400).json({ message: "El nombre de usuario ya existe. Elige otro." });
    }
    let plainPassword = basic_auth_pass;
    if (!plainPassword) {
      plainPassword = crypto.randomBytes(8).toString("hex");
    }
    const saltRounds = 10;
    const encryptedBasicAuthPass = await bcrypt.hash(plainPassword, saltRounds);
    const query = { user_id };
    const update = {
      $set: {
        user_id,
        name,
        basic_auth_username,
        basic_auth_pass: encryptedBasicAuthPass,
        is_active: true,
        created_at: new Date(),
      },
    };
    const options = { upsert: true };
    try {
      const result = await userPricingCollection.updateOne(query, update, options);
      res.status(200).json({ message: "User pricing created or updated", user_id, plainPassword });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Consultar un usuario por user_id (GET)
  router.get("", async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ message: "user_id is required" });
    try {
      const userPricing = await userPricingCollection.findOne({ user_id });
      if (userPricing) {
        res.status(200).json(userPricing);
      } else {
        res.status(404).json({ message: "User pricing not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Consultar todos los usuarios (GET /all)
  router.get("/all", async (req, res) => {
    try {
      const allClients = await userPricingCollection.find({}).toArray();
      res.status(200).json(allClients);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Actualizar campos de usuario (PUT)
  router.put("", async (req, res) => {
    const { user_id, name, basic_auth_username, basic_auth_pass } = req.body;
    if (!user_id) return res.status(400).json({ message: "user_id is required" });
    let updateFields = {};
    if (name) updateFields.name = name;
    if (basic_auth_username) updateFields.basic_auth_username = basic_auth_username;
    if (basic_auth_pass) {
      const saltRounds = 10;
      updateFields.basic_auth_pass = await bcrypt.hash(basic_auth_pass, saltRounds);
    }
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }
    try {
      const result = await userPricingCollection.updateOne(
        { user_id },
        { $set: updateFields }
      );
      if (result.modifiedCount === 1) {
        res.status(200).json({ message: "User pricing updated" });
      } else {
        res.status(404).json({ message: "User pricing not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Eliminar usuario por user_id (DELETE)
  router.delete("", async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ message: "user_id is required" });
    try {
      const result = await userPricingCollection.deleteOne({ user_id });
      if (result.deletedCount === 1) {
        res.status(200).json({ message: "User pricing deleted" });
      } else {
        res.status(404).json({ message: "User pricing not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
});
module.exports = router;
