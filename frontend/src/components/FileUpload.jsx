import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiFile, FiCheck, FiX } from 'react-icons/fi';
import api from '../services/api';

function FileUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.las')) {
        setError('Please select a valid LAS file (.las)');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.toLowerCase().endsWith('.las')) {
        setError('Please select a valid LAS file (.las)');
        return;
      }
      setFile(droppedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    const formData = new FormData();
    formData.append('lasFile', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(pct);
        },
      });

      setSuccess(
        `Uploaded successfully! Well: ${response.data.wellName}, ` +
        `${response.data.curvesCount} curves, ${response.data.dataRowsCount} data points`
      );
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onUploadSuccess) onUploadSuccess(response.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="upload-section">
      <h2 className="section-title">Upload LAS File</h2>

      <div
        className={`drop-zone ${file ? 'has-file' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept=".las"
          onChange={handleFileChange}
          ref={fileInputRef}
          hidden
        />
        {file ? (
          <div className="file-info">
            <FiFile className="file-icon" />
            <span className="file-name">{file.name}</span>
            <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
            <button className="clear-btn" onClick={(e) => { e.stopPropagation(); clearFile(); }}>
              <FiX />
            </button>
          </div>
        ) : (
          <div className="drop-prompt">
            <FiUploadCloud className="upload-icon" />
            <p>Drag & drop a LAS file here or click to browse</p>
            <span className="drop-hint">Supports .las files up to 50MB</span>
          </div>
        )}
      </div>

      {uploading && (
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      {error && <div className="message error"><FiX /> {error}</div>}
      {success && <div className="message success"><FiCheck /> {success}</div>}

      <button
        className="btn btn-primary upload-btn"
        onClick={handleUpload}
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading & Parsing...' : 'Upload & Parse'}
      </button>
    </div>
  );
}

export default FileUpload;
