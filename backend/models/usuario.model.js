const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Usuario extends Model {
    static associate(models) {
      // Relación con Encuestas (1:N)
      this.hasMany(models.Encuesta, {
        foreignKey: 'CreadaPor',
        as: 'encuestas'
      });

      // Relación con Respuestas (1:N)
      this.hasMany(models.Respuesta, {
        foreignKey: 'UsuarioID',
        as: 'respuestas'
      });
    }
  }

  Usuario.init({
    UsuarioID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    Nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El nombre no puede estar vacío'
        }
      }
    },
    Apellido: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El apellido no puede estar vacío'
        }
      }
    },
    NombreUsuario: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: {
        msg: 'El nombre de usuario ya está registrado'
      },
      validate: {
        notEmpty: {
          msg: 'El nombre de usuario no puede estar vacío'
        }
      }
    },
    Contraseña: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La contraseña no puede estar vacía'
        }
      }
    },
    EsAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    FechaRegistro: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('GETDATE()'), 
      allowNull: false
    },
    Activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    EncuestasContestadas: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    IntentosLogin: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    UltimoLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
  }, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'Usuarios',
    timestamps: false, // ✅ Porque ya tienes FechaRegistro
    paranoid: false,   // ✅ No tienes deletedAt
    hooks: {
      beforeCreate: (usuario) => {
        if (usuario.Contraseña) {
          // Aquí podrías poner lógica de encriptado de contraseña si quieres.
        }
      }
    },
    defaultScope: {
      attributes: { exclude: ['Contraseña'] } // 👌 Evita enviar contraseña en respuestas
    },
    scopes: {
      withPassword: {
        attributes: { include: ['Contraseña'] }
      }
    }
  });

  return Usuario;
};
