import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { FiLoader } from 'react-icons/fi';
import api from '../services/api';

const COLORS = [
  '#111111', '#e63946', '#2a9d8f', '#e76f51',
  '#264653', '#a8dadc', '#f4a261', '#457b9d',
];

function ChartPanel({ wellId, selectedCurves, depthRange }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!wellId || selectedCurves.length === 0 || !depthRange) {
      setData([]);
      return;
    }
    fetchData();
  }, [wellId, selectedCurves, depthRange]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/wells/${wellId}/data`, {
        params: {
          curves: selectedCurves.join(','),
          startDepth: depthRange[0],
          endDepth: depthRange[1],
        },
      });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!wellId || selectedCurves.length === 0) {
    return (
      <div className="chart-placeholder">
        <p>Select a well and at least one curve to view the chart.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="chart-placeholder">
        <FiLoader className="spinner" />
        <p>Loading chart data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-placeholder error">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="chart-placeholder">
        <p>No data available for the selected range.</p>
      </div>
    );
  }

  const depths = data.map((d) => d.depth);

  const traces = selectedCurves.map((curve, idx) => ({
    x: data.map((d) => d[curve]),
    y: depths,
    type: 'scattergl',
    mode: 'lines',
    name: curve,
    xaxis: idx === 0 ? 'x' : `x${idx + 1}`,
    yaxis: 'y',
    line: { color: COLORS[idx % COLORS.length], width: 1.2 },
    connectgaps: false,
  }));

  const domainWidth = 1 / selectedCurves.length;
  const xAxes = {};
  selectedCurves.forEach((curve, idx) => {
    const key = idx === 0 ? 'xaxis' : `xaxis${idx + 1}`;
    xAxes[key] = {
      title: { text: curve, font: { size: 11, color: '#333' } },
      domain: [idx * domainWidth + 0.01, (idx + 1) * domainWidth - 0.01],
      side: 'top',
      showgrid: true,
      gridcolor: '#eee',
      linecolor: '#ddd',
      tickfont: { size: 9, color: '#888' },
      titlefont: { color: COLORS[idx % COLORS.length] },
    };
  });

  const layout = {
    height: 700,
    yaxis: {
      title: { text: 'Depth (ft)', font: { size: 12, color: '#555' } },
      autorange: 'reversed',
      showgrid: true,
      gridcolor: '#eee',
      linecolor: '#ddd',
      tickfont: { size: 10, color: '#888' },
    },
    ...xAxes,
    showlegend: true,
    legend: {
      orientation: 'h',
      y: -0.05,
      font: { size: 11, color: '#333' },
      bgcolor: 'transparent',
    },
    dragmode: 'zoom',
    paper_bgcolor: '#fff',
    plot_bgcolor: '#fff',
    margin: { t: 60, b: 60, l: 70, r: 20 },
    font: { color: '#333', family: 'Inter, sans-serif' },
  };

  const config = {
    scrollZoom: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    responsive: true,
  };

  return (
    <div className="chart-container">
      <Plot
        data={traces}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler={true}
      />
    </div>
  );
}

export default ChartPanel;
