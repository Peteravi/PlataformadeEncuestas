const db = require('../models');
const Pregunta = db.Pregunta;

exports.agregarPregunta = async (req, res) => {
    const { EncuestaID, TextoPregunta, TipoPregunta, Orden, EsObligatoria } = req.body;
    try {
        const nuevaPregunta = await Pregunta.create({
            EncuestaID,
            TextoPregunta,
            TipoPregunta,
            Orden,
            EsObligatoria
        });
        res.json({ message: 'Pregunta agregada correctamente', pregunta: nuevaPregunta });
    } catch (error) {
        res.status(500).json({ message: 'Error al agregar pregunta', error });
    }
};

exports.obtenerPreguntasPorEncuesta = async (req, res) => {
    const { encuestaId } = req.params;
    try {
        const preguntas = await db.sequelize.query(
            `SELECT [PreguntaID], [EncuestaID], [TextoPregunta], [TipoPregunta], [Orden], 
                    [PreguntaPadreID], [DependeDeRespuesta], [EsObligatoria] 
             FROM [Preguntas] 
             WHERE [EncuestaID] = :encuestaId
             ORDER BY [Orden] ASC`,
            {
                replacements: { encuestaId },
                type: db.sequelize.QueryTypes.SELECT
            }
        );
        
        res.json(preguntas);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener preguntas', error });
    }
};