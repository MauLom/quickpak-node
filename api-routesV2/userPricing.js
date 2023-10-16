const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

router.use(bodyParser.json());

// Connection URL and database name
const url = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

// MongoDB connection initialization
const client = new MongoClient(url, { useUnifiedTopology: true });

client.connect().then(() => {
  const db = client.db(dbName);
  const userPricingCollection = db.collection("user_pricing");

  // Define a route for creating or updating user pricing using the POST method
  router.post("/api/user-pricing", async (req, res) => {
    const { user_id, provider_id, service, zone, csvData } = req.body;
    const prices = csvData.split(",").map((price) => price.trim());

    // Find an existing document or insert a new one
    const query = {
      user_id,
      provider_id,
      service,
      zone,
    };

    const update = {
      $set: {
        user_id,
        provider_id,
        service,
        zone,
        prices,
      },
    };

    const options = {
      upsert: true,
    };

    try {
      const result = await userPricingCollection.updateOne(query, update, options);
      res.status(200).json({ message: "User pricing created or updated" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Define a route for updating user pricing with the PATCH method
  router.patch("/api/user-pricing", async (req, res) => {
    const { user_id, provider_id, service, zone, csvData } = req.body;
    const prices = csvData.split(",").map((price) => price.trim());

    const query = {
      user_id,
      provider_id,
      service,
      zone,
    };

    const update = {
      $set: {
        prices,
      },
    };

    try {
      const result = await userPricingCollection.updateOne(query, update);
      if (result.modifiedCount === 1) {
        res.status(200).json({ message: "User pricing updated" });
      } else {
        res.status(404).json({ message: "User pricing not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Define a route for retrieving user pricing with the GET method
  router.get("/api/user-pricing", async (req, res) => {
    const { user_id, provider_id, service, zone } = req.query;
    const query = { user_id, provider_id, service, zone };

    try {
      const userPricing = await userPricingCollection.findOne(query);
      if (userPricing) {
        res.status(200).json(userPricing);
      } else {
        res.status(404).json({ message: "User pricing not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Define a route for deleting user pricing with the DELETE method
  router.delete("/api/user-pricing", async (req, res) => {
    const { user_id, provider_id, service, zone } = req.query;
    const query = { user_id, provider_id, service, zone };

    try {
      const result = await userPricingCollection.deleteOne(query);
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
