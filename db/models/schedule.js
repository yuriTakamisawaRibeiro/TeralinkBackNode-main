'use strict';
const { Model, DataTypes } = require('sequelize'); 
const sequelize = require('../../config/database');


const Sequelize = require('sequelize');

module.exports = sequelize.define('schedule', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER
  },
  terapeutaId: {
    allowNull:false,
    type: DataTypes.INTEGER
  },
 data: {
    allowNull: false,
    type: DataTypes.DATE
  },
  hora: {
    allowNull: false,
    type: DataTypes.TIME,
    unique: true 
  },
  estado:{
    allowNull:false,
    type: DataTypes.ENUM('0','1','2')

  },
  pacienteId: {
    type: DataTypes.INTEGER
  },
  
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE
  },
  deletedAt: {
    allowNull: true,
    type: DataTypes.DATE
  }
}, {
  paranoid: true,
  freezeTableName: true,
  modelName: 'user',
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['cpf']
    }
  ]
});