const express = require('express');
const router = express.Router();

router.use('/config', require('./configuration.routes'));
router.use('/', require('../../api-routesV3/providersAuthSettings'));

module.exports = router;
