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
const uri = "mongodb+srv://root:Hyklv5gh@cluster0.dl9kn2d.mongodb.net/test";

module.exports = {
    findClients: async (data) =>{
        const client = new MongoClient(uri);
            const database = client.db("QuickpakMain");
            const userfind = database.collection("clients");
            var referencia = data.referencia;
            var idServices = data.idServices;
            var result=  await userfind.findOne({referencia:referencia, idServices:idServices}) 
            console.log('controler '+result)
            return result;
    },
    saveGeneratedLabelDataOnBD: async (data) => {
        const client = new MongoClient(uri);
        try {
            const database = client.db("QuickpakMain");
            const generatedLabels = database.collection("generatedLabels");
            // create a document to insert
            const doc = data
            const result = await generatedLabels.insertOne(doc);
            console.log(`A document was inserted with the _id: ${result.insertedId}`);
        } catch (error) {
            console.log("Error:", error)
        } finally {
            await client.close();
        }
    }
}