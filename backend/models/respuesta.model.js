module.exports = (sequelize, DataTypes) => {
    const Respuesta = sequelize.define('Respuesta', {
        RespuestaID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        PreguntaID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Preguntas',
                key: 'PreguntaID'
            }
        },
        UsuarioID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Usuarios',
                key: 'UsuarioID'
            }
        },
        EncuestaID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Encuestas',
                key: 'EncuestaID'
            }
        },
        RespuestaTexto: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        RespuestaOpcion: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        FechaRespuesta: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.fn('GETDATE')
        },
        EsCompletada: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'Respuestas',
        timestamps: false,
        indexes: [
            { fields: ['PreguntaID'] },
            { fields: ['UsuarioID'] },
            { fields: ['EncuestaID'] }
        ]
    });

    return Respuesta;
};