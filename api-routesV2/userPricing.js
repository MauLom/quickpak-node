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
    let { user_id, name,email, role, userName, password, basic_auth_username, basic_auth_pass, pricing_matrix_dhl, pricing_matrix_estafeta, reference_dhl, reference_estafeta } = req.body;
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
        email,
        role,
        userName,
        password,
        basic_auth_username,
        basic_auth_pass: encryptedBasicAuthPass,
        is_active: true,
        created_at: new Date(),
        reference_dhl: reference_dhl || "",
        reference_estafeta: reference_estafeta || "",
        ...(pricing_matrix_dhl ? { pricing_matrix_dhl } : {}),
        ...(pricing_matrix_estafeta ? { pricing_matrix_estafeta } : {})
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

  // Consultar todos los usuarios con paginación y búsqueda (GET /all)
  router.get("/all", async (req, res) => {
    try {
      let { page = 1, limit = 10, search = "" } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);

      const filter = search
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { basic_auth_username: { $regex: search, $options: "i" } },
            ],
          }
        : {};

      const totalClients = await userPricingCollection.countDocuments(filter);
      const totalPages = Math.ceil(totalClients / limit);

      const clients = await userPricingCollection
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ name: 1})
        .collation({ locale: 'es', strength: 1 })
        .toArray();

      res.status(200).json({
        clients,
        totalPages,
        totalClients,
        currentPage: page,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Actualizar campos de usuario (PUT)
  router.put("", async (req, res) => {
    const { user_id, name,email, role, userName, password, basic_auth_username, basic_auth_pass, is_active, reference_dhl, reference_estafeta } = req.body;
    if (!user_id) return res.status(400).json({ message: "user_id is required" });
    let updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (role) updateFields.role = role;
    if (userName) updateFields.userName = userName;
    if (password) updateFields.password = password;
    if (basic_auth_username) updateFields.basic_auth_username = basic_auth_username;
    if (basic_auth_pass && basic_auth_pass.trim() !== "") {
      const saltRounds = 10;
      updateFields.basic_auth_pass = await bcrypt.hash(basic_auth_pass, saltRounds);
    }
    if (typeof is_active === 'boolean') updateFields.is_active = is_active;
    if (reference_dhl) updateFields.reference_dhl = reference_dhl;
    if (reference_estafeta) updateFields.reference_estafeta = reference_estafeta;
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }
    try {
      const result = await userPricingCollection.updateOne(
        { user_id },
        { $set: updateFields }
      );
      if (result.matchedCount === 1) {
        res.status(200).json({ message: "User pricing updated" });
      } else {
        res.status(404).json({ message: "User pricing not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Actualizar matriz DHL (PUT /dhl)
  router.put("/dhl", async (req, res) => {
    const { user_id, pricing_matrix_dhl } = req.body;
    if (!user_id || !pricing_matrix_dhl) return res.status(400).json({ message: "user_id y pricing_matrix_dhl son requeridos" });
    try {
      const result = await userPricingCollection.updateOne(
        { user_id },
        { $set: { pricing_matrix_dhl } }
      );
      if (result.matchedCount === 1) {
        res.status(200).json({ message: "Matriz DHL actualizada" });
      } else {
        res.status(404).json({ message: "User pricing not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Actualizar matriz Estafeta (PUT /estafeta)
  router.put("/estafeta", async (req, res) => {
    const { user_id, pricing_matrix_estafeta } = req.body;
    if (!user_id || !pricing_matrix_estafeta) return res.status(400).json({ message: "user_id y pricing_matrix_estafeta son requeridos" });
    try {
      const result = await userPricingCollection.updateOne(
        { user_id },
        { $set: { pricing_matrix_estafeta } }
      );
      if (result.matchedCount === 1) {
        res.status(200).json({ message: "Matriz Estafeta actualizada" });
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
