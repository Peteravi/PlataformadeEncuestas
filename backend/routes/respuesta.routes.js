const express = require('express');
const router = express.Router();
const respuestaController = require('../controllers/respuesta.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Asegúrate de que estos métodos existan en tu controlador
router.post('/', 
    authMiddleware.verifyToken, 
    respuestaController.enviarRespuestas // <- Debe ser una función
);

router.get('/estadisticas/:encuestaId', 
    authMiddleware.verifyToken,
    authMiddleware.isAdmin,
    respuestaController.obtenerEstadisticas // <- Debe ser una función
);

router.get('/usuario/:usuarioId', 
    authMiddleware.verifyToken, 
    respuestaController.obtenerRespuestasPorUsuario // <- Debe ser una función
);

module.exports = router;