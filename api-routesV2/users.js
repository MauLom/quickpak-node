require('dotenv').config()

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

process.on('exit', () => {
  client.close();
});

client.connect().then(() => {
  const db = client.db(dbName);
  const usersCollection = db.collection("user_pricing");

  // Define a route for creating a new user using the POST method
  router.post("", async (req, res) => {
    const { userName, email, password, string_reference, available_services, role, provider_access } = req.body;

    const user = {
      userName,
      email,
      password,
      string_reference,
      available_services,
      role,
      provider_access
    };

    try {
      const result = await usersCollection.insertOne(user);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // Define a route for retrieving a user by ID using the GET method
  router.get("/:id", async (req, res) => {
    const userId = req.params.id;

    try {
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.get("", async (req, res) => {
    try {
      // Retrieve all users from the users collection
      const allUsers = await usersCollection.find().toArray();

      res.status(200).json(allUsers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // Define a route for getting available services for a user using the GET method
  router.get("/:id/available-services", async (req, res) => {
    const userId = req.params.id;

    try {
      // Retrieve the user by ID
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

      if (user) {
        // If the user is found, return the available_services field
        const availableServices = user.available_services || [];
        res.status(200).json({ available_services: availableServices });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // Define a route for updating a user by ID using the PUT method
  router.put("/:id", async (req, res) => {
    const userId = req.params.id;
    const { userName, email, password, string_reference, provider_access, role } = req.body;

    const updatedUser = {
      userName,
      email,
      password,
      string_reference,
      provider_access,
      role
    };

    try {
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updatedUser }
      );
      if (result.modifiedCount === 1) {
        res.status(200).json({ message: "User updated" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // Define a route for deleting a user by ID using the DELETE method
  router.delete("/:id", async (req, res) => {
    const userId = req.params.id;

    try {
      const result = await usersCollection.deleteOne({ _id: new ObjectId(userId) });
      if (result.deletedCount === 1) {
        res.status(200).json({ message: "User deleted" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // Define a route for updating available services for a user using the PATCH method
  router.patch("/:id/available-services", async (req, res) => {
    const userId = req.params.id;
    const { available_services } = req.body;

    try {
      // Update the user's available_services field
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { available_services } }
      );

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: "User's available services updated" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

});

module.exports = router;
