const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Well = sequelize.define('Well', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  wellName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'well_name',
  },
  field: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  company: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  serviceCompany: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'service_company',
  },
  dateAnalysed: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'date_analysed',
  },
  startDepth: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: 'start_depth',
  },
  stopDepth: {
    type: DataTypes.FLOAT,
    allowNull: false,
    field: 'stop_depth',
  },
  step: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1,
  },
  nullValue: {
    type: DataTypes.FLOAT,
    defaultValue: -9999.0,
    field: 'null_value',
  },
  s3Key: {
    type: DataTypes.STRING(512),
    allowNull: true,
    field: 's3_key',
  },
  lasVersion: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'las_version',
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'wells',
  timestamps: true,
  underscored: true,
});

module.exports = Well;
