const db = require('../models');
const Respuesta = db.Respuesta;
const Pregunta = db.Pregunta;


//ENVIAR RESPUESTAS
exports.enviarRespuestas = async (req, res) => {
    const { EncuestaID, UsuarioID, respuestas } = req.body;
    
    // Validaciones básicas mejoradas
    if (!EncuestaID || !UsuarioID || !respuestas || !Array.isArray(respuestas)) {
        return res.status(400).json({ 
            success: false,
            message: 'Datos incompletos o formato incorrecto'
        });
    }

    try {
        // Validar que todas las preguntas obligatorias estén respondidas
        const preguntasObligatorias = await Pregunta.findAll({
            where: { 
                EncuestaID: EncuestaID,
                EsObligatoria: true 
            },
            attributes: ['PreguntaID']
        });

        const preguntasObligatoriasIDs = preguntasObligatorias.map(p => p.PreguntaID);
        const preguntasRespondidasIDs = [...new Set(respuestas.map(r => r.PreguntaID))];
        
        const faltanObligatorias = preguntasObligatoriasIDs.some(
            id => !preguntasRespondidasIDs.includes(id)
        );

        if (faltanObligatorias) {
            return res.status(400).json({
                success: false,
                message: 'Faltan respuestas a preguntas obligatorias'
            });
        }

        // Crear respuestas en una transacción
        const respuestasCreadas = await db.sequelize.transaction(async (t) => {
            return Promise.all(respuestas.map(respuesta => {
                // Usar la función de SQL Server para la fecha en lugar de enviar un valor
                return Respuesta.create({
                    PreguntaID: respuesta.PreguntaID,
                    UsuarioID: UsuarioID,
                    EncuestaID: EncuestaID,
                    RespuestaTexto: respuesta.RespuestaTexto !== undefined ? respuesta.RespuestaTexto : null,
                    RespuestaOpcion: respuesta.RespuestaOpcion !== undefined ? respuesta.RespuestaOpcion : null,
                    EsCompletada: true,
                    // No incluir FechaRespuesta para que use el valor por defecto de la base de datos
                }, { 
                    transaction: t,
                    logging: console.log // Para depuración
                });
            }));
        });

        res.json({ 
            success: true,
            message: 'Respuestas guardadas correctamente',
            data: respuestasCreadas.map(r => ({
                PreguntaID: r.PreguntaID,
                RespuestaID: r.RespuestaID
            }))
        });

    } catch (error) {
        console.error('Error detallado:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });

        const mensajeError = error.name === 'SequelizeDatabaseError' 
            ? 'Error en la base de datos. Por favor verifica los datos.' 
            : 'Error al procesar las respuestas';

        res.status(500).json({ 
            success: false,
            message: mensajeError,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
// Obtener estadísticas de respuestas por pregunta
exports.obtenerEstadisticas = async (req, res) => {
    const { encuestaId } = req.params;
    
    try {
        // Obtener todas las preguntas de la encuesta
        const preguntas = await Pregunta.findAll({
            where: { EncuestaID: encuestaId },
            attributes: ['PreguntaID', 'TextoPregunta', 'TipoPregunta']
        });

        // Obtener estadísticas para cada pregunta
        const estadisticas = await Promise.all(preguntas.map(async (pregunta) => {
            const respuestas = await Respuesta.findAll({
                where: { PreguntaID: pregunta.PreguntaID },
                attributes: ['RespuestaTexto', 'RespuestaOpcion']
            });

            // Procesar según el tipo de pregunta
            if (pregunta.TipoPregunta === 'OpcionUnica') {
                const conteo = {
                    si: respuestas.filter(r => r.RespuestaOpcion === true).length,
                    no: respuestas.filter(r => r.RespuestaOpcion === false).length
                };
                return {
                    preguntaId: pregunta.PreguntaID,
                    textoPregunta: pregunta.TextoPregunta,
                    tipo: pregunta.TipoPregunta,
                    totalRespuestas: respuestas.length,
                    conteo
                };
            } else if (pregunta.TipoPregunta === 'SeleccionMultiple') {
                // Lógica para conteo de opciones múltiples
            } else {
                // Para preguntas abiertas, devolver el texto de respuestas
                return {
                    preguntaId: pregunta.PreguntaID,
                    textoPregunta: pregunta.TextoPregunta,
                    tipo: pregunta.TipoPregunta,
                    totalRespuestas: respuestas.length,
                    respuestas: respuestas.map(r => r.RespuestaTexto)
                };
            }
        }));

        res.json(estadisticas);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener estadísticas', 
            error: error.message 
        });
    }
}; 


exports.obtenerRespuestasPorUsuario = async (req, res) => {
    const { usuarioId } = req.params;
    
    try {
        const respuestas = await Respuesta.findAll({ 
            where: { UsuarioID: usuarioId },
            include: [{
                model: Pregunta,
                attributes: ['TextoPregunta', 'TipoPregunta']
            }]
        });
        
        res.json(respuestas);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error al obtener respuestas del usuario', 
            error: error.message 
        });
    }
};