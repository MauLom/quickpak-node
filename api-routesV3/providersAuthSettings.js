const express = require('express');
const router = express.Router();
const {
  createProviderAuthSetting,
  getAllProviderAuthSettings,
  getProviderAuthSettingById,
  updateProviderAuthSetting,
  deleteProviderAuthSetting,
  getProviderAuthSettingsByProvider
} = require('../src/controllers/providersAuthSettings.controller');

// POST /api/v3/providers-auth-settings - Crear nuevo provider auth setting
router.post('/providers-auth-settings', createProviderAuthSetting);

// GET /api/v3/providers-auth-settings - Obtener todos los provider auth settings
router.get('/providers-auth-settings', getAllProviderAuthSettings);

// GET /api/v3/providers-auth-settings/:id - Obtener provider auth setting por ID
router.get('/providers-auth-settings/:id', getProviderAuthSettingById);

// PUT /api/v3/providers-auth-settings/:id - Actualizar provider auth setting
router.put('/providers-auth-settings/:id', updateProviderAuthSetting);

// DELETE /api/v3/providers-auth-settings/:id - Eliminar provider auth setting
router.delete('/providers-auth-settings/:id', deleteProviderAuthSetting);

// GET /api/v3/providers-auth-settings/provider/:provider - Obtener por provider específico
router.get('/providers-auth-settings/provider/:provider', getProviderAuthSettingsByProvider);

module.exports = router;