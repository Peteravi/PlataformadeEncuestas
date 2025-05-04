const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('PlataformaEncuestas', 'sa', '1234', {
    host: 'localhost',
    dialect: 'mssql',
    dialectOptions: {
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    }
});

module.exports = sequelize;
