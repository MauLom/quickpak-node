const express = require('express');
const { createFFTax, getFFTax, deleteFFTax, updateFFTax } = require('../controllers/configuration.controller');

const router = express.Router();

router.get('/ffTax', getFFTax);
router.post('/ffTax', createFFTax);
router.put('/ffTax', updateFFTax);
router.delete('/ffTax', deleteFFTax)

module.exports = router;