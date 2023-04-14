const express = require('express');
const app = express();
const axios = require('axios');
var cors = require('cors')
const getRatesRoute = require('./api-routes/getRates')
const generateLabel = require('./api-routes/generateLabel')
const getZoneDHL = require('./api-routes/getZoneDHL')
const labelsData = require('./api-routes/labelsData')
const usersData = require('./api-routes/usersData')
const getUsers = require ('./api-routes/getUsers')
const generalValues = require('./api-routes/changeGeneralValues')
const trackingLabels = require('./api-routes/trackingLabel')
app.use(express.json())

app.use(cors())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})
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
module.exports = app;