const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const url = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

const getAuthenticatedUsername = (req) => {
    if (req.user && req.user.basic_auth_username) {
        return req.user.basic_auth_username;
    } else if (req.headers['authorization']) {
        const auth = req.headers['authorization'];
        if (auth.startsWith('Basic ')) {
            const base64Credentials = auth.split(' ')[1];
            const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
            return credentials.split(':')[0];
        }
    }
    return null;
};

const basicAuth = async (req, res, next) => {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Basic ')) {
        res.set('WWW-Authenticate', 'Basic realm="Servicios V3"');
        return res.status(401).send('Autenticación requerida');
    }

    const base64Credentials = auth.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, pass] = credentials.split(':');

    try {
        const client = new MongoClient(url, { useUnifiedTopology: true });
        await client.connect();
        const db = client.db(dbName);
        const userPricingCollection = db.collection('user_pricing');
        const user = await userPricingCollection.findOne({
            basic_auth_username: { $regex: `^${username}$`, $options: 'i' }
        });
        await client.close();

        if (user && user.basic_auth_pass) {
            if (user.is_active === false) {
                res.set('WWW-Authenticate', 'Basic realm="Servicios V3"');
                return res.status(403).send('Usuario inactivo');
            }

            const valid = await bcrypt.compare(pass, user.basic_auth_pass) || pass === user.password;
            if (valid) return next();
        }

        res.set('WWW-Authenticate', 'Basic realm="Servicios V3"');
        return res.status(401).send('Credenciales incorrectas');
    } catch (err) {
        console.error(err);
        return res.status(500).send('Error de autenticación');
    }
};

module.exports = {
    getAuthenticatedUsername,
    basicAuth
};
