const db = require('../models');
const Encuesta = db.Encuesta;

exports.crearEncuesta = async (req, res) => {
  const { Nombre, Descripcion, FechaLimite, CreadaPor } = req.body;

  try {
    // Usar consulta SQL directa para evitar problemas con Sequelize
    const [resultado] = await db.sequelize.query(
      `INSERT INTO Encuestas (
                Nombre, 
                Descripcion, 
                FechaCreacion, 
                FechaLimite, 
                Estado, 
                Archivada, 
                CreadaPor
             )
             OUTPUT 
                INSERTED.EncuestaID,
                INSERTED.Nombre,
                INSERTED.Descripcion,
                INSERTED.FechaCreacion,
                INSERTED.FechaLimite,
                INSERTED.Estado,
                INSERTED.Archivada,
                INSERTED.CreadaPor
             VALUES (?, ?, GETDATE(), ?, 'Activa', 0, ?)`,
      {
        replacements: [
          Nombre,
          Descripcion,
          FechaLimite,
          CreadaPor
        ],
        type: db.sequelize.QueryTypes.INSERT
      }
    );

    res.status(201).json({
      message: 'Encuesta creada correctamente',
      encuesta: resultado
    });
  } catch (error) {
    console.error('Error al crear encuesta:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      message: 'Error al crear encuesta',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};
exports.obtenerEncuestas = async (req, res) => {
  try {
    const encuestas = await Encuesta.findAll({
      where: { Archivada: false },
      attributes: [
        'EncuestaID',
        'Nombre',
        'Descripcion',
        'FechaCreacion',
        'FechaLimite',
        'Estado',
        'Archivada',
        'CreadaPor'
      ],
      raw: true
    });

    res.json(encuestas);
  } catch (error) {
    console.error('Error al obtener encuestas:', error);
    res.status(500).json({
      message: 'Error al obtener encuestas',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
};
exports.archivarEncuesta = async (req, res) => {
  // 1. Obtener ID de los parámetros de la URL
  const { id } = req.params;

  try {
    // 2. Buscar encuesta en la base de datos
    const encuesta = await Encuesta.findByPk(id);

    // 3. Verificar existencia
    if (!encuesta) {
      return res.status(404).json({
        message: 'Encuesta no encontrada'
      });
    }

    // 4. Actualizar campo Archivada
    await encuesta.update({ Archivada: true });

    // 5. Responder con éxito
    res.json({
      message: 'Encuesta archivada correctamente'
    });
  } catch (error) {
    // 6. Manejar errores
    res.status(500).json({
      message: 'Error al archivar encuesta',
      error
    });
  }
};

// actualizar encuesta
exports.actualizarEncuesta = async (req, res) => {
  const { id } = req.params;
  const { Nombre, Descripcion, FechaLimite, ModificadoPor } = req.body;

  try {
    // Validación básica
    if (!Nombre || !FechaLimite) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y Fecha Límite son requeridos'
      });
    }

    // Actualización directa en SQL Server
    const [updated] = await db.sequelize.query(
      `UPDATE Encuestas SET 
                Nombre = ?, 
                Descripcion = ?, 
                FechaLimite = ?,
                UltimaModificacion = GETDATE(),
                ModificadoPor = ?
             WHERE EncuestaID = ?`,
      {
        replacements: [
          Nombre,
          Descripcion,
          FechaLimite,
          ModificadoPor,
          id
        ],
        type: db.sequelize.QueryTypes.UPDATE
      }
    );

    if (updated === 0) {
      return res.status(404).json({
        success: false,
        message: 'Encuesta no encontrada'
      });
    }

    // Obtener la encuesta actualizada
    const [encuesta] = await db.sequelize.query(
      `SELECT * FROM Encuestas WHERE EncuestaID = ?`,
      {
        replacements: [id],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      message: 'Encuesta actualizada correctamente',
      encuesta: encuesta[0]
    });

  } catch (error) {
    console.error('Error al actualizar encuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor',
      error: error.message
    });
  }
};

// Funciones auxiliares
function mostrarError(mensaje) {
  // Implementa tu lógica para mostrar errores al usuario
  alert(`Error: ${mensaje}`); // Ejemplo básico
}

function mostrarExito(mensaje) {
  // Implementa tu lógica para mostrar mensajes de éxito
  alert(`Éxito: ${mensaje}`); // Ejemplo básico
}

exports.obtenerEncuestaPorId = async (req, res) => {
  try {
    const encuesta = await db.sequelize.query(
      `SELECT [EncuestaID], [Nombre], [Descripcion], [FechaCreacion], [FechaLimite], 
                    [Estado], [Archivada], [CreadaPor], [UltimaModificacion], [ModificadoPor] 
             FROM [Encuestas] AS [Encuesta] 
             WHERE [Encuesta].[EncuestaID] = :id`,
      {
        replacements: { id: req.params.id },
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    if (encuesta.length === 0) {
      return res.status(404).json({ message: 'Encuesta no encontrada' });
    }

    res.json(encuesta[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener encuesta', error });
  }
};


exports.eliminarEncuesta = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ success: false, message: 'ID inválido' });
  }

  let transaction;
  try {
    transaction = await db.sequelize.transaction();

    // Paso 1: Eliminar de EncuestasArchivadas
    await db.sequelize.query(
      `DELETE FROM EncuestasArchivadas WHERE EncuestaID = ?`,
      { replacements: [id], transaction }
    );

    // Paso 2: Eliminar respuestas
    await db.sequelize.query(
      `DELETE FROM Respuestas WHERE EncuestaID = ?`,
      { replacements: [id], transaction }
    );

    // Paso 3: Eliminar preguntas hijas que dependen de otras
    await db.sequelize.query(
      `DELETE FROM Preguntas 
         WHERE PreguntaID IN (
           SELECT p.PreguntaID 
           FROM Preguntas p
           INNER JOIN Preguntas h ON p.PreguntaID = h.PreguntaPadreID
           WHERE p.EncuestaID = ?
         )`,
      { replacements: [id], transaction }
    );

    // Paso 4: Eliminar preguntas restantes
    await db.sequelize.query(
      `DELETE FROM Preguntas WHERE EncuestaID = ?`,
      { replacements: [id], transaction }
    );

    // Paso 5: Eliminar la encuesta
    await db.sequelize.query(
      `DELETE FROM Encuestas WHERE EncuestaID = ?`,
      { replacements: [id], transaction }
    );

    await transaction.commit();

    return res.json({
      success: true,
      message: 'Encuesta eliminada correctamente'
    });

  } catch (error) {
    if (transaction) await transaction.rollback();

    console.error('[ERROR al eliminar encuesta]', error);

    const fkError = error.original?.number === 547;

    return res.status(fkError ? 409 : 500).json({
      success: false,
      message: fkError
        ? 'No se puede eliminar porque tiene datos relacionados (FK)'
        : 'Error interno al eliminar la encuesta',
      error: error.message
    });
  }
};



exports.crearEncuestaConPreguntas = async (req, res) => {
  const { encuesta, preguntas } = req.body;

  console.log('=== CREAR ENCUESTA CON PREGUNTAS ===');
  console.log('Encuesta recibida:', encuesta);
  console.log('Preguntas recibidas:', preguntas);

  const transaction = await db.sequelize.transaction();

  try {
    // Validación mínima
    if (!encuesta.Nombre || !encuesta.FechaLimite || !encuesta.CreadaPor) {
      throw new Error('Faltan campos obligatorios: Nombre, FechaLimite o CreadaPor');
    }

    // Insertar encuesta y capturar ID
    const result = await db.sequelize.query(
      `INSERT INTO Encuestas 
          (Nombre, Descripcion, FechaCreacion, FechaLimite, Estado, Archivada, CreadaPor)
         OUTPUT INSERTED.EncuestaID
         VALUES (?, ?, GETDATE(), ?, 'Activa', 0, ?)`,
      {
        replacements: [
          encuesta.Nombre,
          encuesta.Descripcion || null,
          encuesta.FechaLimite,
          encuesta.CreadaPor
        ],
        type: db.sequelize.QueryTypes.INSERT,
        transaction
      }
    );

    const encuestaId = result[0][0].EncuestaID;
    console.log('Encuesta creada con ID:', encuestaId);

    // Insertar preguntas
    for (const pregunta of preguntas) {
      await db.sequelize.query(
        `INSERT INTO Preguntas 
            (EncuestaID, TextoPregunta, TipoPregunta, Orden, PreguntaPadreID, DependeDeRespuesta, EsObligatoria)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            encuestaId,
            pregunta.TextoPregunta,
            pregunta.TipoPregunta,
            pregunta.Orden,
            pregunta.PreguntaPadreID || null,
            pregunta.DependeDeRespuesta || null,
            pregunta.EsObligatoria ? 1 : 0
          ],
          type: db.sequelize.QueryTypes.INSERT,
          transaction
        }
      );
    }

    await transaction.commit();

    res.status(201).json({
      message: 'Encuesta y preguntas creadas correctamente',
      encuestaId
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error en crearEncuestaConPreguntas:', error);
    res.status(500).json({
      message: 'Error al crear la encuesta con preguntas',
      error: error.message
    });
  }
};

// Obtener estadísticas de una encuesta finalizada
exports.obtenerEstadisticas = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si la encuesta existe y ya venció
    const [encuesta] = await db.sequelize.query(
      `SELECT * FROM Encuestas WHERE EncuestaID = ? AND FechaLimite <= GETDATE()`,
      {
        replacements: [id],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    if (!encuesta) {
      return res.status(404).json({ message: 'Encuesta no encontrada o aún no ha vencido' });
    }

    // Obtener resumen de respuestas por pregunta
    const resultados = await db.sequelize.query(
      `
      SELECT 
        p.PreguntaID,
        p.TextoPregunta,
        p.TipoPregunta,
        COUNT(DISTINCT r.UsuarioID) AS TotalUsuarios,
        COUNT(r.RespuestaID) AS TotalRespuestas,
        SUM(CASE WHEN r.RespuestaOpcion = 1 THEN 1 ELSE 0 END) AS RespuestasSI,
        SUM(CASE WHEN r.RespuestaOpcion = 0 THEN 1 ELSE 0 END) AS RespuestasNO,
        CAST(SUM(CASE WHEN r.RespuestaOpcion = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(r.RespuestaID), 0) AS DECIMAL(5,2)) AS PorcentajeSI,
        CAST(SUM(CASE WHEN r.RespuestaOpcion = 0 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(r.RespuestaID), 0) AS DECIMAL(5,2)) AS PorcentajeNO,
        CAST(COUNT(r.RespuestaID) * 1.0 / NULLIF(COUNT(DISTINCT r.UsuarioID), 0) AS DECIMAL(5,2)) AS PromedioRespuestasPorUsuario,

        -- NUEVA COLUMNA: usuarios y cuántas encuestas ha respondido cada uno
        ISNULL((
          SELECT STUFF((
            SELECT ', ' + NombreCompleto
            FROM (
              SELECT CONCAT(u2.Nombre, ' ', u2.Apellido, ' (', COUNT(DISTINCT r2.EncuestaID), ')') AS NombreCompleto
              FROM Usuarios u2
              JOIN Respuestas r2 ON r2.UsuarioID = u2.UsuarioID
              GROUP BY u2.Nombre, u2.Apellido
            ) AS Sub
            FOR XML PATH(''), TYPE
          ).value('.', 'NVARCHAR(MAX)'), 1, 2, '')
        ), 'Ningún usuario ha respondido encuestas') AS EncuestasRespondidasPorUsuario

      FROM Preguntas p
      LEFT JOIN Respuestas r ON p.PreguntaID = r.PreguntaID
      LEFT JOIN Usuarios u ON r.UsuarioID = u.UsuarioID
      WHERE p.EncuestaID = ?
      GROUP BY p.PreguntaID, p.TextoPregunta, p.TipoPregunta, p.Orden
      ORDER BY p.Orden
      `,
      {
        replacements: [id],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    res.json({
      encuesta: {
        id: encuesta.EncuestaID,
        nombre: encuesta.Nombre,
        descripcion: encuesta.Descripcion,
        fechaLimite: encuesta.FechaLimite
      },
      resultados
    });
  } catch (error) {
    console.error('[Error estadísticas]', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error });
  }
};
