const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

const CheckSchema = new mongoose.Schema({
  name: String,
  value: Number,
}, {
  timestamps: true,
});

const CheckModel = mongoose.model('PermissionCheck', CheckSchema, 'permission_checks');

const connectDB = async () => {
  const uriConDB = mongoURI + dbName;
  console.log('🔗 Conectando a:', uriConDB);

  try {
    await mongoose.connect(uriConDB);
    console.log('✅ MongoDB conectado exitosamente');

    // Paso 1: Insertar documento
    const newDoc = new CheckModel({ name: 'test-check', value: 1 });
    const savedDoc = await newDoc.save();
    console.log('✅ Documento insertado');

    // Paso 2: Actualizar documento
    const updatedDoc = await CheckModel.findByIdAndUpdate(
      savedDoc._id,
      { value: 2 },
      { new: true }
    );
    console.log('✅ Documento actualizado');

    // Paso 3: Eliminar documento
    await CheckModel.findByIdAndDelete(savedDoc._id);
    console.log('✅ Documento eliminado correctamente');

    // Paso 4: Verificar que no existe
    const finalCheck = await CheckModel.findById(savedDoc._id);
    console.log('🔍 Verificación post-delete (debería ser null):', finalCheck);

    // await mongoose.disconnect();
    // console.log('🔌 Conexión cerrada correctamente');

  } catch (error) {
    console.error('❌ Error en alguna operación:', error.message);
    process.exit(1);
  }
};

// Exportación para uso externo
module.exports = connectDB;

// Ejecución directa si se llama como script (node connectAndCheck.js)
if (require.main === module) {
  connectDB();
}
