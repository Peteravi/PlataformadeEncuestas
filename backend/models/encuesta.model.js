module.exports = (sequelize, DataTypes) => {
  const Encuesta = sequelize.define('Encuesta', {
    EncuestaID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    Descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    FechaCreacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    FechaLimite: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      get() {
        return this.getDataValue('FechaLimite');
      },
      set(value) {
        this.setDataValue('FechaLimite', value);
      }
    },
    Estado: {
      type: DataTypes.STRING(20),
      defaultValue: 'Activa'
    },
    Archivada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    CreadaPor: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    UltimaModificacion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ModificadoPor: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'Encuestas',
    timestamps: false,
    freezeTableName: true,
    // Configuración para evitar que Sequelize busque campos automáticos
    createdAt: false,
    updatedAt: false,
    deletedAt: false,
    paranoid: false
  });

  Encuesta.associate = function(models) {
    Encuesta.hasMany(models.Pregunta, {
      foreignKey: 'EncuestaID',
      as: 'preguntas', // Asegurar que el alias coincida en todas partes
      onDelete: 'CASCADE'
    });
    
    Encuesta.belongsTo(models.Usuario, {
      foreignKey: 'CreadaPor',
      as: 'creador',
      constraints: false // Evitar que Sequelize intente crear columnas automáticas
    });
    
    Encuesta.belongsTo(models.Usuario, {
      foreignKey: 'ModificadoPor',
      as: 'modificador',
      constraints: false
    });
  };

  return Encuesta;
};