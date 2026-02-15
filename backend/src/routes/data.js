const express = require('express');
const { Op } = require('sequelize');
const { Well, LogData } = require('../models');

const router = express.Router();

router.get('/:wellId/data', async (req, res, next) => {
  try {
    const { wellId } = req.params;
    const { curves, startDepth, endDepth } = req.query;

    if (!curves) {
      return res.status(400).json({ error: 'Query param "curves" is required (comma-separated).' });
    }

    const well = await Well.findOne({ where: { id: wellId, userId: req.user.id } });
    if (!well) {
      return res.status(404).json({ error: 'Well not found' });
    }

    const nullVal = well.nullValue || -9999;
    const start = startDepth ? parseFloat(startDepth) : well.startDepth;
    const end = endDepth ? parseFloat(endDepth) : well.stopDepth;
    const curveList = curves.split(',').map((c) => c.trim());

    const rows = await LogData.findAll({
      where: {
        wellId,
        depth: { [Op.between]: [start, end] },
      },
      attributes: ['depth', 'curveValues'],
      order: [['depth', 'ASC']],
    });

    const data = rows.map((row) => {
      const point = { depth: row.depth };
      curveList.forEach((c) => {
        const val = row.curveValues[c];
        point[c] = val === nullVal ? null : (val !== undefined ? val : null);
      });
      return point;
    });

    res.json({
      wellId: parseInt(wellId),
      curves: curveList,
      startDepth: start,
      endDepth: end,
      totalRows: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
