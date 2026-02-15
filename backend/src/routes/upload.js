const express = require('express');
const multer = require('multer');
const { parseLasFile } = require('../services/lasParser');
const { uploadToS3 } = require('../services/s3Service');
const { Well, Curve, LogData, sequelize } = require('../models');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/', upload.single('lasFile'), async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded. Use field name "lasFile".' });
    }

    let s3Key = null;
    try {
      s3Key = `las-files/${req.user.id}/${Date.now()}-${file.originalname}`;
      await uploadToS3(s3Key, file.buffer, 'application/octet-stream');
    } catch (s3Err) {
      console.warn('S3 upload failed (continuing without S3):', s3Err.message);
      s3Key = `local-only/${Date.now()}-${file.originalname}`;
    }

    const content = file.buffer.toString('utf-8');
    const parsed = parseLasFile(content);

    if (parsed.curves.length === 0) {
      return res.status(400).json({ error: 'Failed to parse LAS file. No curves found.' });
    }
    if (parsed.data.length === 0) {
      return res.status(400).json({ error: 'Failed to parse LAS file. No data rows found.' });
    }

    const wellInfo = parsed.well;
    const well = await Well.create({
      userId: req.user.id,
      wellName: wellInfo.WELL?.value || 'Unknown',
      field: wellInfo.FLD?.value || null,
      company: wellInfo.COMP?.value || null,
      location: wellInfo.LOC?.value || null,
      country: wellInfo.CTRY?.value || null,
      serviceCompany: wellInfo.SRVC?.value || null,
      dateAnalysed: wellInfo.DATE?.value || null,
      startDepth: parseFloat(wellInfo.STRT?.value) || 0,
      stopDepth: parseFloat(wellInfo.STOP?.value) || 0,
      step: parseFloat(wellInfo.STEP?.value) || 1,
      nullValue: parseFloat(wellInfo.NULL?.value) || -9999,
      s3Key,
      lasVersion: parsed.version.VERS?.value || '2.0',
      metadata: parsed.well,
    }, { transaction });

    const curveRecords = parsed.curves.map((curve) => ({
      wellId: well.id,
      mnemonic: curve.mnemonic,
      unit: curve.unit,
      description: curve.description,
      curveIndex: curve.index,
    }));
    await Curve.bulkCreate(curveRecords, { transaction });

    const depthKey = parsed.curves[0].mnemonic;
    const batchSize = 500;

    for (let i = 0; i < parsed.data.length; i += batchSize) {
      const batch = parsed.data.slice(i, i + batchSize);
      const logRecords = batch.map((row) => {
        const depth = row[depthKey];
        const curveValues = { ...row };
        delete curveValues[depthKey];
        return { wellId: well.id, depth, curveValues };
      });
      await LogData.bulkCreate(logRecords, { transaction });
    }

    await transaction.commit();

    res.status(201).json({
      message: 'LAS file uploaded and parsed successfully',
      wellId: well.id,
      wellName: well.wellName,
      curvesCount: parsed.curves.length,
      dataRowsCount: parsed.data.length,
      depthRange: { start: well.startDepth, stop: well.stopDepth },
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
});

module.exports = router;
