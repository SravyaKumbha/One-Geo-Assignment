const express = require('express');
const { Well } = require('../models');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const wells = await Well.findAll({
      where: { userId: req.user.id },
      attributes: ['id', 'wellName', 'field', 'company', 'location', 'country', 'startDepth', 'stopDepth', 'step', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json({ wells });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const well = await Well.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!well) {
      return res.status(404).json({ error: 'Well not found' });
    }
    res.json({ well });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Well.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deleted) {
      return res.status(404).json({ error: 'Well not found' });
    }
    res.json({ message: 'Well deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
