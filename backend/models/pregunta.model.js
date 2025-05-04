module.exports = (sequelize, DataTypes) => {
    const Pregunta = sequelize.define('Pregunta', {
        PreguntaID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        EncuestaID: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        TextoPregunta: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        TipoPregunta: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        Orden: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        PreguntaPadreID: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        DependeDeRespuesta: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        EsObligatoria: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'Preguntas',
        timestamps: false
    });

    return Pregunta;
};
