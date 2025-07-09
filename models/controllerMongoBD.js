// var MongoClient = require('mongodb').MongoClient;
// //var url = "mongodb://localhost:27017/";
// var url = "mongodb+srv://root:<password>@cluster0.dl9kn2d.mongodb.net/test"

// MongoClient.connect(url, function(err, db) {
//   if (err) throw err;
//   var dbo = db.db("mydb");
//   var myobj = { name: "Company Inc", address: "Highway 37" };
//   dbo.collection("customers").insertOne(myobj, function(err, res) {
//     if (err) throw err;
//     db.close();
//   });
// });

const MongoClient = require("mongodb").MongoClient;
// const uri = "mongodb+srv://root:Hyklv5gh@cluster0.dl9kn2d.mongodb.net/test";
// const bdName = "QuickpakMain"
// const collectionName = "clients"
const bdName = process.env.DB_NAME;
const collectionName = "users"
const uri = process.env.MONGO_URI;

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
            console.error("Error:", error)
        } finally {
            await client.close();
        }
    },
    saveGeneratedLabelDataOnBDV2: async (data) => {
        const client = new MongoClient(uri);

        try {
            const database = client.db(bdName);
            const generatedLabels = database.collection("Labels");
            // create a document to insert
            const doc = data
            const result = await generatedLabels.insertOne(doc);
        } catch (error) {
            console.error("Error:", error)
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
            console.error("Error:", error)
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
            console.error("Error:", error)
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
            const result = await directionsNotebooks.insertOne(doc);
        } catch (error) {
            console.error("Error:", error)
        } finally {
            await client.close()
        }
    },
    getDHLMatrixByUsername: async (username) => {
        const client = new MongoClient(uri);
        try {
            const database = client.db(bdName);
            const userPricing = database.collection('user_pricing');
            const user = await userPricing.findOne({ basic_auth_username: { $regex: `^${username}$`, $options: 'i' } });

            if (!user || !user.pricing_matrix_dhl) {
                return null;
            }

            const pricingMatrixDHL = user.pricing_matrix_dhl;
            
            //HOTFIX: los precios se calculaban mal por no incluir los encabezados de zona
            const zoneHeaders = ['', 'Zona 1', 'Zona 2', 'Zona 3', 'Zona 4', 'Zona 5', 'Zona 6', 'Zona 7', 'Zona 8'];
            // Agregar encabezados de zona como primera fila
            pricingMatrixDHL.N = [zoneHeaders.map(header => ({ value: header, readOnly: true })), ...pricingMatrixDHL.N];
            pricingMatrixDHL.G = [zoneHeaders.map(header => ({ value: header, readOnly: true })), ...pricingMatrixDHL.G];

            return pricingMatrixDHL;
        } catch (error) {
            console.error("getDHLMatrixByUsername error:", error);
            return null;
        } finally {
            await client.close();
        }
    },
    getEstafetaMatrixByUsername: async (username) => {
        const client = new MongoClient(uri);
        try {
            const database = client.db(bdName);
            const userPricing = database.collection('user_pricing');
            const user = await userPricing.findOne({ basic_auth_username: { $regex: `^${username}$`, $options: 'i' } });

            if (!user || !user.pricing_matrix_estafeta) {
                return null;
            }

            const pricingMatrixEstafeta = user.pricing_matrix_estafeta;
            
            //HOTFIX: los precios se calculaban mal por no incluir los encabezados de zona
            const zoneHeaders = ['', 'Zona 1', 'Zona 2', 'Zona 3', 'Zona 4', 'Zona 5', 'Zona 6', 'Zona 7', 'Zona 8'];
            // Agregar encabezados de zona como primera fila
            pricingMatrixEstafeta['Terrestre']= [zoneHeaders.map(header => ({ value: header, readOnly: true })), ...pricingMatrixEstafeta['Terrestre']];
            pricingMatrixEstafeta['Dia Sig.'] = [zoneHeaders.map(header => ({ value: header, readOnly: true })), ...pricingMatrixEstafeta['Dia Sig.']];

            return pricingMatrixEstafeta;
        } catch (error) {
            console.error("getEstafetaMatrixByUsername error:", error);
            return null;
        } finally {
            await client.close();
        }
    },
}
