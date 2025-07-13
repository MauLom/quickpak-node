const mongoose = require('mongoose');

const FFTaxesSchema  = new mongoose.Schema({
  paqueteria: {
    type: String,
     enum: ['estafeta', 'DHL'],
  },
  tasaAerea: {
    type: Number,
  },
  tasaTerrestre: {
    type: Number,
    required: true,
  }

}, {
  timestamps: true,
  collection: 'ff_tasas_personalizadas'
});


module.exports = mongoose.model('FFTaxes', FFTaxesSchema, 'ffTaxes');
