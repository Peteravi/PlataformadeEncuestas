const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./models');

const app = express();

// Función para logs estéticos
const log = {
  info: (message) => console.log(`\x1b[36m[INFO]\x1b[0m ${message}`),
  success: (message) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`),
  warn: (message) => console.log(`\x1b[33m[WARNING]\x1b[0m ${message}`),
  error: (message) => console.log(`\x1b[31m[ERROR]\x1b[0m ${message}`),
  route: (message) => console.log(`\x1b[35m[ROUTE]\x1b[0m ${message}`),
  db: (message) => console.log(`\x1b[34m[DATABASE]\x1b[0m ${message}`),
  file: (message) => console.log(`\x1b[90m[FILE]\x1b[0m ${message}`)
};

// Inicio del servidor
log.info('══════════════════════════════════════');
log.info(' Configurando servidor...');
log.info('══════════════════════════════════════');

// Middleware
log.info('Aplicando middlewares...');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
log.success('Middlewares configurados correctamente');

// Configurar rutas estáticas
const frontendPath = path.join(__dirname, '..', 'frontend');
const pagesPath = path.join(frontendPath, 'pages');
const jsPath = path.join(frontendPath, 'js');
const cssPath = path.join(frontendPath, 'css');

log.info('Configurando rutas estáticas:');
log.file(`Frontend: ${frontendPath}`);
log.file(`Páginas: ${pagesPath}`);
log.file(`JS: ${jsPath}`);
log.file(`CSS: ${cssPath}`);

// Servir archivos estáticos
app.use(express.static(frontendPath));
app.use('/pages', express.static(pagesPath));
app.use('/js', express.static(jsPath));
app.use('/css', express.static(cssPath));
log.success('Rutas estáticas configuradas');

// Rutas API
log.info('Configurando rutas API...');
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/encuestas', require('./routes/encuesta.routes'));
app.use('/api/preguntas', require('./routes/pregunta.routes'));
app.use('/api/respuestas', require('./routes/respuesta.routes'));
log.success('Rutas API configuradas');

// Función helper para enviar archivos
const sendFileSafe = (res, filePath, route) => {
  log.file(`Intentando servir: ${filePath} para ruta: ${route}`);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      log.error(`Archivo no encontrado: ${filePath}`);
      res.status(404).json({ error: 'Página no encontrada' });
      return;
    }
    log.file(`Archivo encontrado: ${filePath}`);
    res.sendFile(filePath, (err) => {
      if (err) {
        log.error(`Error al enviar archivo: ${filePath}`, err);
        res.status(500).json({ error: 'Error al cargar la página' });
      }
    });
  });
};

// Rutas para páginas HTML
log.info('Configurando rutas HTML...');
app.get(['/', '/login'], (req, res) => {
  log.route(`Solicitada: / o /login`);
  sendFileSafe(res, path.join(pagesPath, 'login.html'), '/login');
});

app.get('/register', (req, res) => {
  log.route(`Solicitada: /register`);
  sendFileSafe(res, path.join(pagesPath, 'register.html'), '/register');
});

app.get('/admin', (req, res) => {
  log.route(`Solicitada: /admin`);
  sendFileSafe(res, path.join(pagesPath, 'admin.html'), '/admin');
});

app.get('/empleado', (req, res) => {
  log.route(`Solicitada: /empleado`);
  sendFileSafe(res, path.join(pagesPath, 'empleado.html'), '/empleado');
}); 

app.get('/preguntas.html', (req, res) => {
    const encuestaId = req.query.encuestaId;
    if (!encuestaId) {
        return res.status(400).json({ error: 'ID de encuesta requerido' });
    }
    
    log.route(`Solicitada preguntas para encuesta ID: ${encuestaId}`);
    sendFileSafe(res, path.join(pagesPath, 'preguntas.html'), '/preguntas.html');
}); 



app.get('/index', (req, res) => {
  log.route(`Solicitada: /index`);
  sendFileSafe(res, path.join(pagesPath, 'index.html'), '/index');
});
log.success('Rutas HTML configuradas');

// Manejo de errores
app.use((req, res) => {
  log.warn(`Ruta no encontrada: ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Página no encontrada',
    path: req.originalUrl
  });
});

app.use((err, req, res, next) => {
  log.error(`Error interno: ${err.message}`);
  console.error(err.stack); // Mantenemos el stack trace completo
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : ''
  });
});

// Sincronizar la base de datos
log.db('Intentando sincronizar base de datos...');
db.sequelize.sync()
  .then(() => {
    log.db('══════════════════════════════════════');
    log.db(' Base de datos sincronizada correctamente');
    log.db('══════════════════════════════════════');
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      log.success('══════════════════════════════════════');
      log.success(` Servidor corriendo en http://localhost:${PORT}`);
      log.success('══════════════════════════════════════');
    });
  })
  .catch(err => {
    log.error('Error al sincronizar la base de datos:');
    console.error(err);
    process.exit(1);
  });

// Manejo de eventos del servidor
app.on('error', (err) => {
  log.error(`Error en el servidor: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
  log.error(`Unhandled Rejection: ${reason}`);
});

process.on('uncaughtException', (err) => {
  log.error(`Uncaught Exception: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});