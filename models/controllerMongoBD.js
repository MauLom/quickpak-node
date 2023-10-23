// var MongoClient = require('mongodb').MongoClient;
// //var url = "mongodb://localhost:27017/";
// var url = "mongodb+srv://root:<password>@cluster0.dl9kn2d.mongodb.net/test"

// MongoClient.connect(url, function(err, db) {
//   if (err) throw err;
//   var dbo = db.db("mydb");
//   var myobj = { name: "Company Inc", address: "Highway 37" };
//   dbo.collection("customers").insertOne(myobj, function(err, res) {
//     if (err) throw err;
//     console.log("1 document inserted");
//     db.close();
//   });
// });

const MongoClient = require("mongodb").MongoClient;
// const uri = "mongodb+srv://root:Hyklv5gh@cluster0.dl9kn2d.mongodb.net/test";
// const bdName = "QuickpakMain"
// const collectionName = "clients"
const bdName = "Quickpak_logistic"
const collectionName = "users"
const uri = "mongodb+srv://maulom:rnreqcL5@logisticclcuster.8cqosl5.mongodb.net/"

module.exports = {
    findClients: async () => {
        const client = new MongoClient(uri);

        try {
            const database = client.db(bdName);
            const userfind = database.collection(collectionName);
            var result = await userfind.find({})
            const arrClients = []
            for await (const doc of result) {
                arrClients.push(doc)
            }
            return arrClients;
        } catch (error) { console.error("findClientsError:", error) }
        finally {
            client.close()
        }
    },
    findOneClientById: async (data) => {
        const client = new MongoClient(uri);

        try {
            const database = client.db(bdName);
            const userfind = database.collection(collectionName);
            var result = await userfind.findOne({ idServices: data })
            return result;
        } catch (error) { console.error("findOneClientById:", error) }
        finally { client.close() }
    },
    findOneClient: async (data) => {
        const client = new MongoClient(uri);

        try {
            const database = client.db(bdName);
            const userfind = database.collection(collectionName);
            var referencia = data.referencia;
            var idServices = data.idServices;
            var result = await userfind.findOne({ referencia: referencia, idServices: idServices })
            return result;
        }
        catch (error) { console.error("findOneClient", error) }
        finally { client.close() }
    },
    findGeneralValues: async () => {
        const client = new MongoClient(uri);

        try {
            const database = client.db(bdName);
            const generalValuesCollection = database.collection("additionalValues")
            var result = await generalValuesCollection.findOne({ "key": "finded" })
            return result;
        }
        catch (error) { console.error("findOneClient", error) }
        finally { client.close() }
    },
    saveGeneratedLabelDataOnBD: async (data) => {
        const client = new MongoClient(uri);

        try {
            const database = client.db(bdName);
            const generatedLabels = database.collection("generatedLabels");
            // create a document to insert
            const doc = data
            const result = await generatedLabels.insertOne(doc);
        } catch (error) {
            console.log("Error:", error)
        } finally {
            await client.close();
        }
    },
    saveGeneratedUsersonBD: async (data) => {
        const client = new MongoClient(uri);

        try {
            const database = client.db(bdName);
            const generatedLabels = database.collection(collectionName);
            // create a document to insert
            const doc = data
            const result = await generatedLabels.insertOne(doc);
        } catch (error) {
            console.log("Error:", error)
        } finally {
            await client.close();
        }
    },
    saveGeneralValues: async (data) => {
        const client = new MongoClient(uri);

        try {
            const database = client.db(bdName);
            const additionalValues = database.collection("additionalValues")
            const result = await additionalValues.findOneAndReplace({ "key": "finded" }, {
                "key": "finded",
                "FFTaxes": {
                    "aerial": data.aerial,
                    "land": data.land
                }
            })
        }
        catch (error) {
            console.log("Error:", error)
        } finally {
            await client.close()
        }
    },
    findDirectionNotebook: async (data) => {
        const client = new MongoClient(uri);

        try {
            const database = client.db(bdName);
            const directionsNotebooks = database.collection("directionsNotebooks");
            var idServices = data.idServices;
            var result = await directionsNotebooks.findOne({ idServices: idServices })
            console.log('controler ' + result)
            return result;
        }
        catch (error) { console.error("findOneClient", error) }
        finally { client.close() }
    },
    saveDirectionsNoteBook: async (data) => {
        const client = new MongoClient(uri);

        try {
            const database = client.db(bdName);
            const directionsNotebooks = database.collection("directionsNotebooks");
            const doc = data
            console.log("The dodc: ", doc)
            const result = await directionsNotebooks.insertOne(doc);
            console.log(`A document was inserted with the _id: ${result.insertedId}`);
        } catch (error) {
            console.log("Error:", error)
        } finally {
            await client.close()
        }
    }
}
