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
module.exports = app;