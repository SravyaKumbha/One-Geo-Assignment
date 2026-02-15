const express = require('express');
const { Op } = require('sequelize');
const { Well, LogData } = require('../models');
const { interpretData } = require('../services/geminiService');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { wellId, curves, startDepth, endDepth } = req.body;

    if (!wellId || !curves || !curves.length || startDepth == null || endDepth == null) {
      return res.status(400).json({
        error: 'Required fields: wellId, curves (array), startDepth, endDepth',
      });
    }

    const well = await Well.findOne({ where: { id: wellId, userId: req.user.id } });
    if (!well) {
      return res.status(404).json({ error: 'Well not found' });
    }

    const nullVal = well.nullValue || -9999;

    const rows = await LogData.findAll({
      where: {
        wellId,
        depth: { [Op.between]: [startDepth, endDepth] },
      },
      attributes: ['depth', 'curveValues'],
      order: [['depth', 'ASC']],
    });

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No data found in the specified depth range.' });
    }

    const fullData = rows.map((row) => {
      const point = { depth: row.depth };
      curves.forEach((c) => {
        const val = row.curveValues[c];
        point[c] = val === nullVal ? null : (val !== undefined ? val : null);
      });
      return point;
    });

    const stats = {};
    curves.forEach((c) => {
      const vals = fullData.map((d) => d[c]).filter((v) => v !== null && v !== undefined);
      if (vals.length === 0) {
        stats[c] = { min: null, max: null, mean: null, stdDev: null, count: 0 };
        return;
      }
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / vals.length;
      stats[c] = {
        min: parseFloat(min.toFixed(4)),
        max: parseFloat(max.toFixed(4)),
        mean: parseFloat(mean.toFixed(4)),
        stdDev: parseFloat(Math.sqrt(variance).toFixed(4)),
        count: vals.length,
      };
    });

    const maxSample = 60;
    let sampleData;
    if (fullData.length <= maxSample) {
      sampleData = fullData;
    } else {
      const step = Math.floor(fullData.length / maxSample);
      sampleData = [];
      for (let i = 0; i < fullData.length; i += step) {
        sampleData.push(fullData[i]);
        if (sampleData.length >= maxSample) break;
      }
    }

    const interpretation = await interpretData({
      wellName: well.wellName,
      depthRange: { start: startDepth, end: endDepth },
      curves,
      stats,
      sampleData,
      totalRows: fullData.length,
    });

    res.json({
      wellId: parseInt(wellId),
      curves,
      depthRange: { start: startDepth, end: endDepth },
      stats,
      interpretation,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
