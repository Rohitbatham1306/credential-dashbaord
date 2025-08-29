const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActionLog = sequelize.define('ActionLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userEmail: { type: DataTypes.STRING },
  action: { type: DataTypes.STRING, allowNull: false },
  details: { type: DataTypes.TEXT },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  credentialId: { type: DataTypes.INTEGER, allowNull: true },
  assignmentId: { type: DataTypes.INTEGER, allowNull: true },
  adminEmail: { type: DataTypes.STRING, allowNull: true },
  ipAddress: { type: DataTypes.STRING, allowNull: true },
  userAgent: { type: DataTypes.TEXT, allowNull: true },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  severity: { 
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), 
    defaultValue: 'low' 
  },
  category: { 
    type: DataTypes.ENUM('authentication', 'credential_management', 'user_management', 'assignment', 'report', 'system'), 
    defaultValue: 'system' 
  }
});

module.exports = ActionLog;

