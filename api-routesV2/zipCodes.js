require('dotenv').config();
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

router.get('/:cp', async (req, res) => {
  const apiUrl = 'https://api.tau.com.mx/dipomex/v1/codigo_postal';
  const apiKey = 'your-api-key'; // Replace with your actual API key
  const cp = req.params.cp; // Replace with your actual postal code
  const queryParams = new URLSearchParams({ cp }).toString();

  const headers = {
    'APIKEY': process.env.TAU_API_KEY,
  };

  const apiUrlWithParams = `${apiUrl}?${queryParams}`;

  // Use dynamic import to load node-fetch as an ES module
  import('node-fetch')
    .then((module) => {
      const fetch = module.default;
      return fetch(apiUrlWithParams, { headers });
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Request failed');
      }
      return response.json();
    })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((error) => {
      console.error(error);
    });
});

module.exports = router;
