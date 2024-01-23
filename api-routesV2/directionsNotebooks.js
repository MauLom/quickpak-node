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
    const notebooksCollection = db.collection("notebooks");

    // POST - Add a new address to the notebook
    router.post("/saveAddress", async (req, res) => {
        const { userId, addressData } = req.body;
        const currentDate = new Date().toISOString();

        try {
            const notebook = await notebooksCollection.findOne({ userId: userId });

            if (notebook) {
                // Check if the address already exists in the notebook
                const addressExists = notebook.addresses.some(address => {
                    return address.contactName === addressData.contactName &&
                        address.company === addressData.company &&
                        address.phone === addressData.phone &&
                        address.email === addressData.email &&
                        address.street === addressData.street &&
                        address.colony === addressData.colony &&
                        address.reference === addressData.reference;
                });

                if (addressExists) {
                    return res.status(409).json({ message: "Address already exists in the notebook" });
                }

                // Update the existing notebook with the new address
                await notebooksCollection.updateOne(
                    { userId: userId },
                    {
                        $push: { addresses: addressData },
                        $set: { updatedAt: currentDate }
                    }
                );
            } else {
                // Create a new notebook if it doesn't exist
                const newNotebook = {
                    userId: userId,
                    title: "Libreta de direcciones",
                    addresses: [addressData],
                    createdAt: currentDate,
                    updatedAt: currentDate
                };
                await notebooksCollection.insertOne(newNotebook);
            }

            res.status(200).json({ message: "Address added to notebook" });
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    });



    // POST - Create a new notebook direction
    router.post("", async (req, res) => {
        const directionData = req.body;

        try {
            const result = await notebooksCollection.insertOne(directionData);
            res.status(201).json(result.ops[0]);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    });

    // GET - Retrieve a notebook direction by ID
    router.get("/:id", async (req, res) => {
        const notebookId = req.params.id;

        try {
            const notebook = await notebooksCollection.findOne({ _id: new ObjectId(notebookId) });
            if (notebook) {
                res.status(200).json(notebook);
            } else {
                res.status(404).json({ message: "Notebook direction not found" });
            }
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    });

    // GET - Retrieve all notebook directions
    router.get("", async (req, res) => {
        try {
            const allNotebooks = await notebooksCollection.find().toArray();
            res.status(200).json(allNotebooks);
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    });

    // PUT - Update a notebook direction by ID
    router.put("/:id", async (req, res) => {
        const notebookId = req.params.id;
        const updatedData = req.body;

        try {
            const result = await notebooksCollection.updateOne(
                { _id: new ObjectId(notebookId) },
                { $set: updatedData }
            );
            if (result.modifiedCount === 1) {
                res.status(200).json({ message: "Notebook direction updated" });
            } else {
                res.status(404).json({ message: "Notebook direction not found" });
            }
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    });

    // DELETE - Delete a notebook direction by ID
    router.delete("/:id", async (req, res) => {
        const notebookId = req.params.id;

        try {
            const result = await notebooksCollection.deleteOne({ _id: new ObjectId(notebookId) });
            if (result.deletedCount === 1) {
                res.status(200).json({ message: "Notebook direction deleted" });
            } else {
                res.status(404).json({ message: "Notebook direction not found" });
            }
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    });

    // GET - Retrieve a notebook by userId
    router.get("/user/:userId", async (req, res) => {
        const userId = req.params.userId;

        try {
            const notebook = await notebooksCollection.findOne({ userId: userId });
            if (notebook) {
                res.status(200).json(notebook);
            } else {
                res.status(404).json({ message: "Notebook not found" });
            }
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    });

});

module.exports = router;
