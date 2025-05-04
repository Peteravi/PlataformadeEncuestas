const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || "mi_secreto_super_seguro"; // Mejor usar variable de entorno

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ message: 'Token no proporcionado' });
    }

    jwt.verify(token, SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token inválido o expirado' });
        }
        req.userId = decoded.id;
        req.isAdmin = decoded.isAdmin; // Cambiar de esAdmin a isAdmin para consistencia
        next();
    });
};

exports.isAdmin = (req, res, next) => {
    if (!req.isAdmin) {
        return res.status(403).json({ message: 'Requiere rol de administrador' });
    }
    next();
};