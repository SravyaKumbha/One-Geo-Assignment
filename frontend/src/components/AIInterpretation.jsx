import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FiCpu, FiLoader } from 'react-icons/fi';
import api from '../services/api';

function AIInterpretation({ wellId, selectedCurves, depthRange }) {
  const [interpretation, setInterpretation] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canInterpret = wellId && selectedCurves.length > 0 && depthRange && depthRange[0] < depthRange[1];

  const handleInterpret = async () => {
    if (!canInterpret) return;

    setLoading(true);
    setError(null);
    setInterpretation('');
    setStats(null);

    try {
      const res = await api.post('/interpret', {
        wellId,
        curves: selectedCurves,
        startDepth: depthRange[0],
        endDepth: depthRange[1],
      });
      setInterpretation(res.data.interpretation);
      setStats(res.data.stats);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(`Interpretation failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-section">
      <h2 className="section-title">
        <FiCpu /> AI-Assisted Interpretation
      </h2>

      <p className="ai-description">
        Analyze the selected curves over the specified depth range using Gemini AI.
        The AI will identify trends, anomalies, and zones of interest.
      </p>

      <button
        className="btn btn-primary ai-btn"
        onClick={handleInterpret}
        disabled={!canInterpret || loading}
      >
        {loading ? (
          <>
            <FiLoader className="spinner" /> Analyzing with Gemini...
          </>
        ) : (
          <>
            <FiCpu /> Run AI Interpretation
          </>
        )}
      </button>

      {!canInterpret && !loading && (
        <p className="ai-hint">
          Select a well, at least one curve, and a valid depth range to enable interpretation.
        </p>
      )}

      {error && <div className="message error">{error}</div>}

      {stats && (
        <div className="stats-panel">
          <h3>Summary Statistics</h3>
          <div className="stats-grid">
            {Object.entries(stats).map(([curve, s]) => (
              <div key={curve} className="stat-card">
                <h4>{curve}</h4>
                <div className="stat-row"><span>Min:</span> <span>{s.min?.toFixed(2)}</span></div>
                <div className="stat-row"><span>Max:</span> <span>{s.max?.toFixed(2)}</span></div>
                <div className="stat-row"><span>Mean:</span> <span>{s.mean?.toFixed(2)}</span></div>
                <div className="stat-row"><span>Std Dev:</span> <span>{s.stdDev?.toFixed(2)}</span></div>
                <div className="stat-row"><span>Points:</span> <span>{s.count}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {interpretation && (
        <div className="interpretation-result">
          <h3>AI Analysis Results</h3>
          <div className="markdown-body">
            <ReactMarkdown>{interpretation}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIInterpretation;
