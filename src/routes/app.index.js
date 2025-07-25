const express = require('express');
const router = express.Router();


router.use('/config', require('./configuration.routes'));

module.exports = router;
