const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Curve = sequelize.define('Curve', {
  id: {
    type: DataTypes.INTEGER,
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
  mnemonic: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  unit: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  curveIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'curve_index',
  },
}, {
  tableName: 'curves',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['well_id', 'mnemonic'],
    },
  ],
});

module.exports = Curve;
