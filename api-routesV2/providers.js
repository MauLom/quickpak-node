const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const { MongoClient, ObjectId } = require("mongodb");

router.use(bodyParser.json());

// Connection URL and database name
const url = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

// MongoDB connection initialization
const client = new MongoClient(url, { useUnifiedTopology: true });

client.connect().then(() => {
  const db = client.db(dbName);
  const providersCollection = db.collection("providers");

  // Define a route for creating a new provider using the POST method
  router.post("", async (req, res) => {
    const { name, services } = req.body;

    const provider = {
      name,
      services,
    };

    try {
      const result = await providersCollection.insertOne(provider);
      res.status(201).json(result.ops[0]);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Define a route for retrieving a provider by ID using the GET method
  router.get("/:id", async (req, res) => {
    const providerId = req.params.id;

    try {
      const provider = await providersCollection.findOne({ _id: new ObjectId(providerId) });
      if (provider) {
        res.status(200).json(provider);
      } else {
        res.status(404).json({ message: "Provider not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // Define a route to retrieve all providers using the GET method
  router.get("", async (req, res) => {
    try {
      const allProviders = await providersCollection.find().toArray();
      res.status(200).json(allProviders);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Define a route for updating a provider by ID using the PUT method
  router.put("/:id", async (req, res) => {
    const providerId = req.params.id;
    const { name, services } = req.body;

    const updatedProvider = {
      name,
      services,
    };

    try {
      const result = await providersCollection.updateOne(
        { _id: new ObjectId(providerId) },
        { $set: updatedProvider }
      );
      if (result.modifiedCount === 1) {
        res.status(200).json({ message: "Provider updated" });
      } else {
        res.status(404).json({ message: "Provider not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Define a route for deleting a provider by ID using the DELETE method
  router.delete("/:id", async (req, res) => {
    const providerId = req.params.id;

    try {
      const result = await providersCollection.deleteOne({ _id: new ObjectId(providerId) });
      if (result.deletedCount === 1) {
        res.status(200).json({ message: "Provider deleted" });
      } else {
        res.status(404).json({ message: "Provider not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });


});

module.exports = router;
