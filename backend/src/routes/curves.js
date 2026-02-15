const express = require('express');
const { Well, Curve } = require('../models');

const router = express.Router();

router.get('/:wellId/curves', async (req, res, next) => {
  try {
    const { wellId } = req.params;

    const well = await Well.findOne({ where: { id: wellId, userId: req.user.id } });
    if (!well) {
      return res.status(404).json({ error: 'Well not found' });
    }

    const curves = await Curve.findAll({
      where: { wellId },
      attributes: ['id', 'mnemonic', 'unit', 'description', 'curveIndex'],
      order: [['curveIndex', 'ASC']],
    });

    res.json({ wellId: parseInt(wellId), curves });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
