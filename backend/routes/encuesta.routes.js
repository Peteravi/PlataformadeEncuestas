const express = require('express');
const router = express.Router();
const encuestaController = require('../controllers/encuesta.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Rutas existentes
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, encuestaController.crearEncuesta);
router.get('/', authMiddleware.verifyToken, encuestaController.obtenerEncuestas);
router.get('/:id', encuestaController.obtenerEncuestaPorId);
router.put('/archivar/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, encuestaController.archivarEncuesta);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, encuestaController.eliminarEncuesta);
// Ruta corregida para actualización (POST temporal)
router.post('/actualizar/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, encuestaController.actualizarEncuesta);

// Ruta PUT alternativa (debería ser el estándar)
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, encuestaController.actualizarEncuesta);
router.post('/crear-con-preguntas', authMiddleware.verifyToken, authMiddleware.isAdmin, encuestaController.crearEncuestaConPreguntas);
// Debajo de las demás rutas
router.get('/:id/estadisticas', authMiddleware.verifyToken, authMiddleware.isAdmin, encuestaController.obtenerEstadisticas);



module.exports = router;