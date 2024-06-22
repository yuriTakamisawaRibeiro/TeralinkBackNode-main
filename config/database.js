const { Sequelize } = require('sequelize');
const config = require('./config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Verifica se todos os campos obrigatórios estão presentes, exceto a senha
if ((!dbConfig.username &&!dbConfig.password) || 
   !dbConfig.database || 
   !dbConfig.host) {
    throw new Error('Database configuration is missing some required fields.');
}

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    port: dbConfig.port,
});

module.exports = sequelize;