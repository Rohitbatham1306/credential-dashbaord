const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Credential = sequelize.define('Credential', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Credential;

