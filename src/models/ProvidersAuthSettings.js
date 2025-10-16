const mongoose = require('mongoose');

const ProvidersAuthSettingsSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    trim: true
  },
  account: {
    type: String,
    trim: true,
    default: ''
  },
  user: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  scopes: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'providers_auth_settings'
});

module.exports = mongoose.model('ProvidersAuthSettings', ProvidersAuthSettingsSchema);