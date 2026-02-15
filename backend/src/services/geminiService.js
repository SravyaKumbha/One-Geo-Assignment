const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function getGenAI() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

async function interpretData({ wellName, depthRange, curves, stats, sampleData, totalRows }) {
  const ai = getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert well-log data analyst specializing in subsurface geological interpretation.
Analyze the following well-log data and provide detailed, actionable insights.

## Well Information
- **Well Name**: ${wellName}
- **Depth Range Analyzed**: ${depthRange.start} ft to ${depthRange.end} ft
- **Total Data Points**: ${totalRows}
- **Curves Analyzed**: ${curves.join(', ')}

## Summary Statistics (across the full depth range)
${JSON.stringify(stats, null, 2)}

## Sample Data (${sampleData.length} evenly-spaced rows from the range)
${JSON.stringify(sampleData, null, 2)}

## Requested Analysis

Please provide the following sections in your response:

### 1. Trend Analysis
Describe the overall behavior and trends for each curve across the depth range. Note whether values are increasing, decreasing, stable, or cyclic.

### 2. Anomaly Detection
Identify any anomalous readings, sudden spikes, drops, or outlier values. Specify the approximate depth(s) where anomalies occur.

### 3. Zone Identification
Based on the curve patterns, identify potential geological zones of interest (e.g., hydrocarbon-bearing zones, water zones, transition zones, cap rock, reservoir intervals). Explain what curve signatures indicate each zone.

### 4. Cross-Curve Correlations
Note any significant correlations or inverse relationships between the selected curves that could indicate geological features.

### 5. Recommendations
Suggest additional curves, depth ranges, or analyses that would be valuable for further investigation.

Format your response using clear markdown headings and bullet points for readability.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

module.exports = { interpretData };
