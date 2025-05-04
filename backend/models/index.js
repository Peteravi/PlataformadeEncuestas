const { Sequelize, DataTypes } = require('sequelize');

// Configura la conexión
const sequelize = new Sequelize('PlataformaEncuestas', 'sa', '1234', {
  host: 'localhost',
  dialect: 'mssql',
  dialectOptions: {
    options: {
      encrypt: false, // O true si usas Azure
      trustServerCertificate: true,
    }
  },
  logging: console.log,
});

// Importar modelos
const Usuario = require('./usuario.model')(sequelize, DataTypes);
const Encuesta = require('./encuesta.model')(sequelize, DataTypes);
const Pregunta = require('./pregunta.model')(sequelize, DataTypes);
const Respuesta = require('./respuesta.model')(sequelize, DataTypes);

// Definir relaciones
Usuario.hasMany(Encuesta, { foreignKey: 'usuarioId' });
Encuesta.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Encuesta.hasMany(Pregunta, { foreignKey: 'encuestaId' });
Pregunta.belongsTo(Encuesta, { foreignKey: 'encuestaId' });

Pregunta.hasMany(Respuesta, { foreignKey: 'preguntaId' });
Respuesta.belongsTo(Pregunta, { foreignKey: 'preguntaId' });

Usuario.hasMany(Respuesta, { foreignKey: 'usuarioId' });
Respuesta.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// Exportar sequelize y modelos
module.exports = {
  sequelize,
  Usuario,
  Encuesta,
  Pregunta,
  Respuesta,
};

// Conectar y sincronizar
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    // Sincronizar sin forzar cambios
    await sequelize.sync();
    console.log('✅ Base de datos sincronizada.');
  } catch (error) {
    console.error('❌ Error de conexión o sincronización:', error);
  }
})();