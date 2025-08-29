const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Credential = require('./Credential');

const Assignment = sequelize.define('Assignment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  confirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
  problematic: { type: DataTypes.BOOLEAN, defaultValue: false },
  inactive: { type: DataTypes.BOOLEAN, defaultValue: false },
});

User.belongsToMany(Credential, { through: Assignment, foreignKey: 'userId' });
Credential.belongsToMany(User, { through: Assignment, foreignKey: 'credentialId' });

Assignment.belongsTo(User, { foreignKey: 'userId' });
Assignment.belongsTo(Credential, { foreignKey: 'credentialId' });

module.exports = Assignment;

