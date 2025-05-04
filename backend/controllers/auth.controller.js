const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { sequelize } = require('../models');


// Función para login
async function login(req, res) {
  try {
    const { NombreUsuario, Contraseña } = req.body;
    
    // Validar campos requeridos
    if (!NombreUsuario || !Contraseña) {
      return res.status(400).json({ message: 'Nombre de usuario y contraseña son requeridos' });
    }

    // Buscar usuario
    const user = await Usuario.findOne({ 
      where: { NombreUsuario },
      attributes: ['UsuarioID', 'Nombre', 'NombreUsuario', 'Contraseña', 'EsAdmin', 'Activo']
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si el usuario está activo
    if (!user.Activo) {
      return res.status(403).json({ message: 'Cuenta desactivada' });
    }

    // Verificar contraseña
    const match = await bcrypt.compare(Contraseña, user.Contraseña);
    if (!match) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Actualizar último login
    await user.update({
      UltimoLogin: sequelize.literal('GETDATE()'),  
      IntentosLogin: 0
    });

    // Crear token JWT
    const token = jwt.sign(
      { userId: user.UsuarioID, isAdmin: user.EsAdmin },
      process.env.JWT_SECRET || 'mi_secreto_super_seguro',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      usuario: {
        UsuarioID: user.UsuarioID,
        Nombre: user.Nombre,
        NombreUsuario: user.NombreUsuario,
        EsAdmin: user.EsAdmin
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
}

// Función para registro
async function register(req, res) {
  try {
    const { Nombre, Apellido, NombreUsuario, Contraseña } = req.body;

    // Validaciones (se mantienen igual)
    if (!Nombre || !Apellido || !NombreUsuario || !Contraseña) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    if (Contraseña.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const existe = await Usuario.findOne({ where: { NombreUsuario } });
    if (existe) {
      return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(Contraseña, 10);

    // Crear nuevo usuario CON FORMATO DE FECHA COMPATIBLE
    const nuevoUsuario = await Usuario.create({
      Nombre,
      Apellido,
      NombreUsuario,
      Contraseña: hashedPassword,
      EsAdmin: false,
      Activo: true,
      EncuestasContestadas: 0,
      IntentosLogin: 0
    });

    res.status(201).json({ 
      message: 'Usuario registrado exitosamente',
      usuario: {
        UsuarioID: nuevoUsuario.UsuarioID,
        Nombre: nuevoUsuario.Nombre,
        NombreUsuario: nuevoUsuario.NombreUsuario
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      message: 'Error en el servidor',
      error: error.message 
    });
  }
}

module.exports = {
  login,
  register
};

// Agrega esto temporalmente en auth.controller.js
console.log(Usuario); // Debería mostrar la función del modelo
console.log(typeof Usuario.findOne); // Debería ser 'function'