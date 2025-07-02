// Middleware de autenticación básica para Express usando user_pricing
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const url = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

module.exports = async function basicAuth(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Basic ')) {
        res.set('WWW-Authenticate', 'Basic realm="Servicios V3"');
        return res.status(401).send('Autenticación requerida');
    }
    // Decodificar credenciales
    const base64Credentials = auth.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, pass] = credentials.split(':');

    try {
        const client = new MongoClient(url, { useUnifiedTopology: true });
        await client.connect();
        const db = client.db(dbName);
        const userPricingCollection = db.collection('user_pricing');
        // Buscar por basic_auth_username (case-insensitive)
        const user = await userPricingCollection.findOne({ basic_auth_username: { $regex: `^${username}$`, $options: 'i' } });
        await client.close();
        if (user && user.basic_auth_pass) {
            const valid = await bcrypt.compare(pass, user.basic_auth_pass);
            if (valid) return next();
        }
        res.set('WWW-Authenticate', 'Basic realm="Servicios V3"');
        return res.status(401).send('Credenciales incorrectas');
    } catch (err) {
        return res.status(500).send('Error de autenticación');
    }
};
