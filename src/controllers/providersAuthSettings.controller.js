const ProvidersAuthSettings = require('../models/ProvidersAuthSettings');

// Crear nuevo provider auth setting
const createProviderAuthSetting = async (req, res) => {
  try {
    const { provider, account, user, password, scopes, isActive } = req.body;
    
    const newSetting = new ProvidersAuthSettings({
      provider,
      account,
      user,
      password,
      scopes,
      isActive
    });

    const savedSetting = await newSetting.save();
    res.status(201).json({
      success: true,
      data: savedSetting
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener todos los provider auth settings
const getAllProviderAuthSettings = async (req, res) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const settings = await ProvidersAuthSettings.find(filter);
    res.status(200).json({
      success: true,
      count: settings.length,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener provider auth setting por ID
const getProviderAuthSettingById = async (req, res) => {
  try {
    const setting = await ProvidersAuthSettings.findById(req.params.id);
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Provider auth setting not found'
      });
    }

    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Actualizar provider auth setting
const updateProviderAuthSetting = async (req, res) => {
  try {
    const { provider, account, user, password, scopes, isActive } = req.body;
    
    const setting = await ProvidersAuthSettings.findByIdAndUpdate(
      req.params.id,
      { provider, account, user, password, scopes, isActive },
      { new: true, runValidators: true }
    );

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Provider auth setting not found'
      });
    }

    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Eliminar provider auth setting
const deleteProviderAuthSetting = async (req, res) => {
  try {
    const setting = await ProvidersAuthSettings.findByIdAndDelete(req.params.id);
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Provider auth setting not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Provider auth setting deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtener provider auth settings por provider
const getProviderAuthSettingsByProvider = async (req, res) => {
  try {
    const { provider } = req.params;
    const settings = await ProvidersAuthSettings.find({ 
      provider: provider,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      count: settings.length,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createProviderAuthSetting,
  getAllProviderAuthSettings,
  getProviderAuthSettingById,
  updateProviderAuthSetting,
  deleteProviderAuthSetting,
  getProviderAuthSettingsByProvider
};