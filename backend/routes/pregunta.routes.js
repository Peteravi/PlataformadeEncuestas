const express = require('express');
const router = express.Router();
const preguntaController = require('../controllers/pregunta.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Agregar pregunta a una encuesta (solo admins)
router.post('/', 
    authMiddleware.verifyToken, 
    authMiddleware.isAdmin, 
    preguntaController.agregarPregunta
);

// Listar preguntas de una encuesta (accesible para usuarios autenticados)
router.get('/:encuestaId', 
    authMiddleware.verifyToken, 
    preguntaController.obtenerPreguntasPorEncuesta
);

module.exports = router;