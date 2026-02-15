import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthPage from './components/AuthPage';
import FileUpload from './components/FileUpload';
import WellSelector from './components/WellSelector';
import CurveSelector from './components/CurveSelector';
import DepthRangeSlider from './components/DepthRangeSlider';
import ChartPanel from './components/ChartPanel';
import AIInterpretation from './components/AIInterpretation';
import ChatInterface from './components/ChatInterface';
import api from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" /> : <AuthPage mode="login" onLogin={handleLogin} />
          }
        />
        <Route
          path="/signup"
          element={
            user ? <Navigate to="/" /> : <AuthPage mode="signup" onLogin={handleLogin} />
          }
        />
        <Route
          path="/"
          element={
            user ? (
              <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

function Dashboard({ user, onLogout }) {
  const [selectedWell, setSelectedWell] = useState(null);
  const [selectedCurves, setSelectedCurves] = useState([]);
  const [depthRange, setDepthRange] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [wells, setWells] = useState([]);

  useEffect(() => {
    const fetchWells = async () => {
      try {
        const res = await api.get('/wells');
        setWells(res.data.wells || []);
      } catch (err) {
        console.error('Failed to fetch wells:', err);
      }
    };
    fetchWells();
  }, [refreshTrigger]);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleWellSelect = (well) => {
    setSelectedWell(well);
    setSelectedCurves([]);
    setDepthRange(null);
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="dashboard">
        <aside className="sidebar">
          <FileUpload onUploadSuccess={handleUploadSuccess} />

          <div className="controls-section">
            <h2 className="section-title">Data Controls</h2>

            <WellSelector
              onWellSelect={handleWellSelect}
              refreshTrigger={refreshTrigger}
            />

            <CurveSelector
              wellId={selectedWell?.id}
              onCurvesChange={setSelectedCurves}
            />

            <DepthRangeSlider
              well={selectedWell}
              onRangeChange={setDepthRange}
            />
          </div>
        </aside>

        <section className="main-content">
          <div className="chart-section">
            <h2 className="section-title">Well Log Visualization</h2>
            <ChartPanel
              wellId={selectedWell?.id}
              selectedCurves={selectedCurves}
              depthRange={depthRange}
            />
          </div>

          <AIInterpretation
            wellId={selectedWell?.id}
            selectedCurves={selectedCurves}
            depthRange={depthRange}
          />
        </section>
      </div>

      <ChatInterface wells={wells} />
    </Layout>
  );
}

export default App;
