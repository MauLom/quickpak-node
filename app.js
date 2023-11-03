const express = require('express');
const app = express();
var cors = require('cors')
const loginLogic = require('./api-routesV2/login'); // Import your Passport login logic
const getRatesRoute = require('./api-routes/getRates')
const generateLabel = require('./api-routes/generateLabel')
const getZoneDHL = require('./api-routes/getZoneDHL')
const labelsData = require('./api-routes/labelsData')
const usersData = require('./api-routes/usersData')
const getUsers = require('./api-routes/getUsers')
const generalValues = require('./api-routes/changeGeneralValues')
const trackingLabels = require('./api-routes/trackingLabel')
const users = require('./api-routes/users')
const editServices = require('./api-routes/editServices')

///V2 imports
const usersV2 = require('./api-routesV2/users')
const providers = require('./api-routesV2/providers')
const userPricing = require('./api-routesV2/userPricing')
const zips = require('./api-routesV2/zipCodes')
const rates = require('./api-routesV2/rates')
app.use(express.json())

app.use(cors())

app.get('/', (req, res) => {
  res.send(`Wrong path of URL`);
});

app.get('/sayHello', (req, res) => {
  const name = process.env.NAME || 'World';
  res.send(`Hello ${name}!`);
});


app.use('/getRates', getRatesRoute)
app.use('/generateLabel', generateLabel)
app.use('/getZoneDHL', getZoneDHL)
app.use('/labelsData', labelsData)
app.use('/usersData', usersData)
app.use('/getUsers', getUsers)
app.use('/generalValues', generalValues)
app.use('/trackingLabel', trackingLabels)
app.use('/users', users)
app.use('/editservices', editServices)

///V2
app.use('/api/users', usersV2)
app.use('/api/provider', providers)
app.use('/api/userPricing', userPricing)
app.use('/api/zip', zips)
app.use('/api/rates', rates)
app.use('/api/login', loginLogic)

module.exports = app;