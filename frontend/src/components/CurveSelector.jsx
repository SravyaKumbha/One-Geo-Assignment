import React, { useState, useEffect } from 'react';
import { FiBarChart2 } from 'react-icons/fi';
import api from '../services/api';

function CurveSelector({ wellId, onCurvesChange }) {
  const [curves, setCurves] = useState([]);
  const [selectedCurves, setSelectedCurves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wellId) {
      setCurves([]);
      setSelectedCurves([]);
      return;
    }
    fetchCurves();
  }, [wellId]);

  const fetchCurves = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/wells/${wellId}/curves`);
      const filtered = res.data.curves.filter((c) => c.curve_index !== 0);
      setCurves(filtered);
      setSelectedCurves([]);
    } catch (err) {
      console.error('Failed to fetch curves:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCurve = (mnemonic) => {
    let updated;
    if (selectedCurves.includes(mnemonic)) {
      updated = selectedCurves.filter((c) => c !== mnemonic);
    } else {
      if (selectedCurves.length >= 8) {
        alert('Maximum 8 curves can be selected at once for readability.');
        return;
      }
      updated = [...selectedCurves, mnemonic];
    }
    setSelectedCurves(updated);
    if (onCurvesChange) onCurvesChange(updated);
  };

  const clearAll = () => {
    setSelectedCurves([]);
    if (onCurvesChange) onCurvesChange([]);
  };

  const filteredCurves = curves.filter((c) =>
    c.mnemonic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!wellId) return null;

  return (
    <div className="curve-selector">
      <label className="selector-label">
        <FiBarChart2 /> Select Curves
        {selectedCurves.length > 0 && (
          <span className="curve-count">({selectedCurves.length} selected)</span>
        )}
      </label>

      <div className="curve-controls">
        <input
          type="text"
          placeholder="Search curves..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="curve-search"
        />
        {selectedCurves.length > 0 && (
          <button className="btn btn-small btn-outline" onClick={clearAll}>
            Clear All
          </button>
        )}
      </div>

      <div className="curve-list">
        {loading ? (
          <p className="loading-text">Loading curves...</p>
        ) : (
          filteredCurves.map((c) => (
            <label
              key={c.mnemonic}
              className={`curve-chip ${selectedCurves.includes(c.mnemonic) ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedCurves.includes(c.mnemonic)}
                onChange={() => toggleCurve(c.mnemonic)}
                hidden
              />
              {c.mnemonic}
              {c.unit && c.unit !== 'UNKN' && <span className="curve-unit">({c.unit})</span>}
            </label>
          ))
        )}
      </div>
    </div>
  );
}

export default CurveSelector;
