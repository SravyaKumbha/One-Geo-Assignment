import React, { useState, useEffect } from 'react';
import { FiArrowDown, FiAlertCircle } from 'react-icons/fi';

function DepthRangeSlider({ well, onRangeChange }) {
  const [startDepth, setStartDepth] = useState(0);
  const [endDepth, setEndDepth] = useState(0);

  const [startText, setStartText] = useState('');
  const [endText, setEndText] = useState('');

  const [startWarning, setStartWarning] = useState('');
  const [endWarning, setEndWarning] = useState('');

  useEffect(() => {
    if (well) {
      const s = well.start_depth ?? well.startDepth;
      const e = well.stop_depth ?? well.stopDepth;
      setStartDepth(s);
      setEndDepth(e);
      setStartText(String(s));
      setEndText(String(e));
      setStartWarning('');
      setEndWarning('');
      if (onRangeChange) onRangeChange([s, e]);
    }
  }, [well]);

  const validateAndApply = (raw, which) => {
    const minD = well.start_depth ?? well.startDepth;
    const maxD = well.stop_depth ?? well.stopDepth;

    if (raw.trim() === '') {
      if (which === 'start') {
        setStartText(String(minD));
        setStartDepth(minD);
        setStartWarning('');
        if (onRangeChange) onRangeChange([minD, endDepth]);
      } else {
        setEndText(String(maxD));
        setEndDepth(maxD);
        setEndWarning('');
        if (onRangeChange) onRangeChange([startDepth, maxD]);
      }
      return;
    }

    const val = parseFloat(raw);

    if (isNaN(val)) {
      if (which === 'start') setStartWarning('Enter a valid number');
      else setEndWarning('Enter a valid number');
      return;
    }

    if (val < 0) {
      if (which === 'start') setStartWarning('Depth must be a positive number');
      else setEndWarning('Depth must be a positive number');
      return;
    }

    if (val < minD || val > maxD) {
      if (which === 'start') setStartWarning(`Value must be from ${minD} to ${maxD} (inclusive)`);
      else setEndWarning(`Value must be from ${minD} to ${maxD} (inclusive)`);
      return;
    }

    if (which === 'start') {
      setStartDepth(val);
      setStartText(String(val));
      setStartWarning('');
      if (onRangeChange) onRangeChange([val, endDepth]);
    } else {
      setEndDepth(val);
      setEndText(String(val));
      setEndWarning('');
      if (onRangeChange) onRangeChange([startDepth, val]);
    }
  };

  const handleStartSlider = (e) => {
    const val = parseFloat(e.target.value);
    setStartDepth(val);
    setStartText(String(val));
    setStartWarning('');
    if (onRangeChange) onRangeChange([val, endDepth]);
  };

  const handleEndSlider = (e) => {
    const val = parseFloat(e.target.value);
    setEndDepth(val);
    setEndText(String(val));
    setEndWarning('');
    if (onRangeChange) onRangeChange([startDepth, val]);
  };

  if (!well) return null;

  const minD = well.start_depth ?? well.startDepth;
  const maxD = well.stop_depth ?? well.stopDepth;
  const rangeSize = typeof startDepth === 'number' && typeof endDepth === 'number'
    ? Math.abs(endDepth - startDepth)
    : 0;

  return (
    <div className="depth-range">
      <label className="selector-label">
        <FiArrowDown /> Depth Range (ft)
      </label>
      <div className="depth-inputs">
        <div className="depth-field">
          <label>Start Depth</label>
          <input
            type="text"
            inputMode="decimal"
            value={startText}
            onChange={(e) => { setStartText(e.target.value); setStartWarning(''); }}
            onBlur={() => validateAndApply(startText, 'start')}
            onKeyDown={(e) => { if (e.key === 'Enter') validateAndApply(startText, 'start'); }}
            placeholder={String(minD)}
            className={`depth-input ${startWarning ? 'input-error' : ''}`}
          />
          {startWarning && (
            <span className="depth-warning"><FiAlertCircle /> {startWarning}</span>
          )}
          <input
            type="range"
            value={startDepth}
            onChange={handleStartSlider}
            min={minD}
            max={maxD}
            step={well.step || 1}
            className="depth-slider"
          />
        </div>
        <div className="depth-field">
          <label>End Depth</label>
          <input
            type="text"
            inputMode="decimal"
            value={endText}
            onChange={(e) => { setEndText(e.target.value); setEndWarning(''); }}
            onBlur={() => validateAndApply(endText, 'end')}
            onKeyDown={(e) => { if (e.key === 'Enter') validateAndApply(endText, 'end'); }}
            placeholder={String(maxD)}
            className={`depth-input ${endWarning ? 'input-error' : ''}`}
          />
          {endWarning && (
            <span className="depth-warning"><FiAlertCircle /> {endWarning}</span>
          )}
          <input
            type="range"
            value={endDepth}
            onChange={handleEndSlider}
            min={minD}
            max={maxD}
            step={well.step || 1}
            className="depth-slider"
          />
        </div>
      </div>
      <p className="depth-summary">
        Showing: {startDepth} ft — {endDepth} ft ({rangeSize} ft range)
      </p>
    </div>
  );
}

export default DepthRangeSlider;
