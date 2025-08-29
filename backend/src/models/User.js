const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'user'), allowNull: false, defaultValue: 'user' },
  status: { 
    type: DataTypes.ENUM('Pending', 'Onboarded', 'Offboarding-In-Progress', 'Offboarded'), 
    defaultValue: 'Pending' 
  },
  emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  emailVerificationToken: { type: DataTypes.STRING, allowNull: true },
  emailVerificationExpires: { type: DataTypes.DATE, allowNull: true },
  passwordResetToken: { type: DataTypes.STRING, allowNull: true },
  passwordResetExpires: { type: DataTypes.DATE, allowNull: true },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true },
  onboardedAt: { type: DataTypes.DATE, allowNull: true },
  offboardedAt: { type: DataTypes.DATE, allowNull: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = User;

