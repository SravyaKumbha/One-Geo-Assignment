const sequelize = require('../config/db');
const User = require('./User');
const Well = require('./Well');
const Curve = require('./Curve');
const LogData = require('./LogData');

User.hasMany(Well, { foreignKey: 'userId', as: 'wells', onDelete: 'CASCADE' });
Well.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Well.hasMany(Curve, { foreignKey: 'wellId', as: 'curves', onDelete: 'CASCADE' });
Curve.belongsTo(Well, { foreignKey: 'wellId', as: 'well' });

Well.hasMany(LogData, { foreignKey: 'wellId', as: 'logData', onDelete: 'CASCADE' });
LogData.belongsTo(Well, { foreignKey: 'wellId', as: 'well' });

async function syncDatabase() {
  await sequelize.authenticate();
  console.log('Connected to PostgreSQL via Sequelize');

  await sequelize.sync({ alter: true });
  console.log('Database models synchronized');
}

module.exports = {
  sequelize,
  User,
  Well,
  Curve,
  LogData,
  syncDatabase,
};
