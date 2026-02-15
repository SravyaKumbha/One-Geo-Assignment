const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Well, LogData, Curve } = require('../models');
const sequelize = require('../config/db');

let genAI = null;

const wellContextCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getGenAI() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

async function getCachedWellContext(wellId, userId) {
  const cacheKey = `${userId}-${wellId}`;
  const cached = wellContextCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const context = await getWellContext(wellId, userId);
  if (context) {
    wellContextCache.set(cacheKey, { data: context, timestamp: Date.now() });
  }
  return context;
}

async function getWellContext(wellId, userId) {
  const [well, curves] = await Promise.all([
    Well.findOne({
      where: { id: wellId, userId },
      attributes: ['id', 'wellName', 'field', 'company', 'location', 'country', 'startDepth', 'stopDepth', 'step', 'nullValue'],
    }),
    Curve.findAll({
      where: { wellId },
      attributes: ['mnemonic', 'unit', 'description'],
    }),
  ]);

  if (!well) {
    return null;
  }

  const countResult = await LogData.count({ where: { wellId } });

  const sampleData = await LogData.findAll({
    where: { wellId },
    attributes: ['depth', 'curveValues'],
    order: [['depth', 'ASC']],
    limit: 10,
  });

  const curveNames = curves.map((c) => c.mnemonic);
  const stats = await calculateStatsSQL(wellId, curveNames, well.nullValue);

  return {
    well: {
      name: well.wellName,
      field: well.field,
      company: well.company,
      location: well.location,
      country: well.country,
      startDepth: well.startDepth,
      stopDepth: well.stopDepth,
      step: well.step,
    },
    curves: curves.map((c) => ({
      name: c.mnemonic,
      unit: c.unit,
      description: c.description,
    })),
    statistics: stats,
    sampleData: sampleData.map((row) => ({
      depth: row.depth,
      ...row.curveValues,
    })),
    totalDataPoints: countResult,
  };
}

async function calculateStatsSQL(wellId, curveNames, nullValue) {
  const stats = {};
  
  const batchSize = 5;
  for (let i = 0; i < curveNames.length; i += batchSize) {
    const batch = curveNames.slice(i, i + batchSize);
    
    const promises = batch.map(async (curveName) => {
      try {
        const [result] = await sequelize.query(`
          SELECT 
            MIN((curve_values->>'${curveName}')::numeric) as min_val,
            MAX((curve_values->>'${curveName}')::numeric) as max_val,
            AVG((curve_values->>'${curveName}')::numeric) as avg_val,
            COUNT(*) as count_val
          FROM log_data 
          WHERE well_id = :wellId 
            AND curve_values->>'${curveName}' IS NOT NULL
            AND (curve_values->>'${curveName}')::numeric != :nullValue
        `, {
          replacements: { wellId, nullValue: nullValue || -9999 },
          type: sequelize.QueryTypes.SELECT,
        });

        if (result && result.count_val > 0) {
          stats[curveName] = {
            min: parseFloat(result.min_val),
            max: parseFloat(result.max_val),
            avg: parseFloat(parseFloat(result.avg_val).toFixed(2)),
            count: parseInt(result.count_val),
          };
        }
      } catch (err) {
        console.warn(`Stats calculation failed for curve ${curveName}:`, err.message);
      }
    });
    
    await Promise.all(promises);
  }
  
  return stats;
}

async function chatAboutWell(wellContext, userMessage, conversationHistory = []) {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const curvesList = wellContext.curves.map((c) => 
    `${c.name}${c.unit ? ` (${c.unit})` : ''}`
  ).join(', ');

  const topCurves = Object.keys(wellContext.statistics).slice(0, 10);
  const compactStats = topCurves.map((name) => {
    const s = wellContext.statistics[name];
    return `${name}: ${s.min.toFixed(1)}-${s.max.toFixed(1)} (avg ${s.avg.toFixed(1)})`;
  }).join('; ');

  const systemPrompt = `You are a well-log data analyst. Be concise and helpful.

Well: ${wellContext.well.name}
Depth: ${wellContext.well.startDepth}-${wellContext.well.stopDepth} ft, ${wellContext.totalDataPoints} points
Curves: ${curvesList}
Stats: ${compactStats}

Answer questions about this well data. Use markdown. Be brief but informative.`;

  const recentHistory = conversationHistory.slice(-6);

  const messages = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: `Ready to help with ${wellContext.well.name}. What would you like to know?` }] },
    ...recentHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })),
  ];

  const chat = model.startChat({ history: messages });
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

function getWellSummary(wellContext) {
  const curveCount = wellContext.curves.length;
  const topCurves = wellContext.curves.slice(0, 8).map((c) => c.name).join(', ');
  
  return `**${wellContext.well.name}**
📏 ${wellContext.well.startDepth} - ${wellContext.well.stopDepth} ft
📊 ${curveCount} curves: ${topCurves}${curveCount > 8 ? '...' : ''}
📈 ${wellContext.totalDataPoints} data points

Ask me anything about this well!`;
}

function clearWellCache(userId, wellId) {
  wellContextCache.delete(`${userId}-${wellId}`);
}

module.exports = {
  getWellContext: getCachedWellContext,
  chatAboutWell,
  getWellSummary,
  clearWellCache,
};
