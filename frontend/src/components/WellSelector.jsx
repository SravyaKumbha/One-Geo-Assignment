import React, { useState, useEffect } from 'react';
import { FiDatabase, FiClock, FiTrash2 } from 'react-icons/fi';
import api from '../services/api';

function WellSelector({ onWellSelect, refreshTrigger }) {
  const [wells, setWells] = useState([]);
  const [selectedWellId, setSelectedWellId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWells();
  }, [refreshTrigger]);

  const fetchWells = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wells');
      setWells(res.data.wells);
    } catch (err) {
      console.error('Failed to fetch wells:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const id = e.target.value;
    setSelectedWellId(id);
    const well = wells.find((w) => String(w.id) === id);
    if (onWellSelect) onWellSelect(well || null);
  };

  const handleDelete = async (wellId) => {
    if (!window.confirm('Delete this well and all its data?')) return;
    try {
      await api.delete(`/wells/${wellId}`);
      if (String(wellId) === selectedWellId) {
        setSelectedWellId('');
        if (onWellSelect) onWellSelect(null);
      }
      fetchWells();
    } catch (err) {
      console.error('Failed to delete well:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="well-selector">
      <label className="selector-label">
        <FiDatabase /> Select Well
      </label>
      <select
        value={selectedWellId}
        onChange={handleChange}
        disabled={loading || wells.length === 0}
        className="selector-dropdown"
      >
        <option value="">
          {loading ? 'Loading...' : wells.length === 0 ? 'No wells uploaded yet' : '-- Choose a well --'}
        </option>
        {wells.map((w) => (
          <option key={w.id} value={w.id}>
            {w.wellName} ({w.startDepth}ft - {w.stopDepth}ft)
          </option>
        ))}
      </select>

      {wells.length > 0 && (
        <div className="upload-history">
          <p className="history-label"><FiClock /> Upload History</p>
          <div className="history-list">
            {wells.map((w) => (
              <div
                key={w.id}
                className={`history-item ${String(w.id) === selectedWellId ? 'active' : ''}`}
                onClick={() => {
                  setSelectedWellId(String(w.id));
                  if (onWellSelect) onWellSelect(w);
                }}
              >
                <div className="history-item-info">
                  <span className="history-item-name">{w.wellName}</span>
                  <span className="history-item-depth">{w.startDepth}ft — {w.stopDepth}ft</span>
                  <span className="history-item-date">{formatDate(w.createdAt)}</span>
                </div>
                <button
                  className="history-delete"
                  onClick={(e) => { e.stopPropagation(); handleDelete(w.id); }}
                  title="Delete well"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WellSelector;
