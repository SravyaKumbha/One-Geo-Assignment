const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LogData = sequelize.define('LogData', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  wellId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'well_id',
    references: {
      model: 'wells',
      key: 'id',
    },
  },
  depth: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  curveValues: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'curve_values',
  },
}, {
  tableName: 'log_data',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      fields: ['well_id', 'depth'],
    },
  ],
});

module.exports = LogData;
