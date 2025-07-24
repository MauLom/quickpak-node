const express = require('express');
const { createFFTax, getFFTax, deleteFFTax, updateFFTax } = require('../controllers/configuration.controller');

const router = express.Router();

router.get('/ffTax', getFFTax);
router.post('/ffTax', createFFTax);
router.put('/ffTax/:ffTaxID', updateFFTax);
router.delete('/ffTax/:ffTaxID', deleteFFTax);  

module.exports = router;