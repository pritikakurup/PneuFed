import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';
import { predictImage, checkHealth, normalizeApiUrl } from '../utils/api';

const PredictPage = ({ addHistoryItem, loggedInHospital }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const [customApiUrl, setCustomApiUrl] = useState(() => {
    if (typeof window === 'undefined') return '';
    const saved = localStorage.getItem('pneufed_api_url');
    // Sanitize stale ngrok/colab URLs so production VITE_API_URL is not overridden by dead tunnels
    if (saved && (saved.includes('ngrok') || saved.includes('colab'))) {
      localStorage.removeItem('pneufed_api_url');
      return '';
    }
    if (saved) {
      const normalized = normalizeApiUrl(saved);
      if (normalized && normalized !== saved) {
        localStorage.setItem('pneufed_api_url', normalized);
      }
      return normalized || '';
    }
    return '';
  });

  const apiUrl = normalizeApiUrl(customApiUrl || import.meta.env.VITE_API_URL || '');

  // Proactively check backend health and wake up Render on load
  useEffect(() => {
    let isMounted = true;
    if (!apiUrl) {
      setBackendStatus('Not configured');
      return;
    }

    setBackendStatus('Checking...');
    checkHealth(apiUrl, { timeoutMs: 15000 })
      .then((data) => {
        if (isMounted) {
          if (data?.model_loaded) {
            setBackendStatus('Ready for Prediction');
          } else {
            setBackendStatus('Online (Model Loading)');
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Initial backend health check notice:', err?.message);
          setBackendStatus('Standby / Cold Start');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiUrl]);

  const handleUpdateApiUrl = () => {
    const current = customApiUrl || import.meta.env.VITE_API_URL || '';
    const input = window.prompt('Enter backend API URL (e.g. https://pneufed-api.onrender.com):', current);
    if (input !== null) {
      const clean = input.trim().replace(/\/+$/, '');
      if (clean) {
        const normalized = normalizeApiUrl(clean);
        localStorage.setItem('pneufed_api_url', normalized);
        setCustomApiUrl(normalized);
        setError(null);
      } else {
        localStorage.removeItem('pneufed_api_url');
        setCustomApiUrl('');
      }
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.jpg') && !fileName.endsWith('.jpeg') && !fileName.endsWith('.png')) {
        setError('Please select a valid image file (.jpg, .jpeg, .png).');
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
    }

    setError(null);
    setResult(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handlePredict = async () => {
    if (!selectedFile) {
      setError('Please select an X-ray image.');
      return;
    }

    setIsLoading(true);
    setIsWarmingUp(false);
    setError(null);
    setResult(null);

    // If request takes longer than 4 seconds, show warming up notice for cold starts
    const warmUpTimer = setTimeout(() => {
      setIsWarmingUp(true);
    }, 4000);

    try {
      if (!apiUrl) {
        throw new Error('API URL is not configured. Please set the VITE_API_URL environment variable or use "Configure URL" to set your backend endpoint.');
      }

      const data = await predictImage(apiUrl, selectedFile);
      setResult(data);
      setBackendStatus('Ready for Prediction');

      // Add to history
      if (typeof addHistoryItem === 'function') {
        try {
          addHistoryItem({
            date: new Date().toISOString(),
            hospital: loggedInHospital,
            filename: selectedFile.name,
            prediction: data.prediction,
            confidence: data.confidence,
            model: data.model || 'Global Round-20 ResNet18'
          });
        } catch (historyErr) {
          console.warn('Could not record history item:', historyErr);
        }
      }

    } catch (err) {
      const isNetworkErr =
        err?.name === 'TypeError' ||
        err?.name === 'AbortError' ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('timed out');

      const isTimeout = err?.message?.includes('timed out');

      let errorMsg;
      if (isTimeout) {
        errorMsg = err.message;
      } else if (isNetworkErr) {
        errorMsg = 'Unable to connect to the prediction server. If the service is waking up from idle mode (cold start), please wait 30 seconds and try again.';
      } else {
        errorMsg = err?.message || 'Prediction failed. Please check the backend.';
      }
      setError(errorMsg);
      console.error('Prediction request error:', err);
    } finally {
      clearTimeout(warmUpTimer);
      setIsWarmingUp(false);
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Predict</h2>
        <p>Run inference using the global federated model</p>
      </div>

      {/* Hospital & Model Info */}
      <div className="card hospital-status-card">
        <div className="status-row">
          <span className="status-label">Current Hospital:</span>
          <span className="status-value">🏥 {loggedInHospital}</span>
        </div>
        <div className="status-row">
          <span className="status-label">Global Model:</span>
          <span className="status-value">ResNet18 – Federated Round 20</span>
        </div>
        <div className="status-row">
          <span className="status-label">Federated Learning:</span>
          <span className="status-value">4 Hospitals · 20 Rounds · FedAvg</span>
        </div>
        <div className="status-row">
          <span className="status-label">Backend API:</span>
          <span className="status-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
              {apiUrl ? apiUrl.replace(/^https?:\/\//, '') : 'Not configured'}
            </span>
            <button
              type="button"
              onClick={handleUpdateApiUrl}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color, #475569)',
                color: 'var(--primary, #38bdf8)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px'
              }}
            >
              Configure URL
            </button>
          </span>
        </div>
        <div className="status-row">
          <span className="status-label">Status:</span>
          <span className={`status-value ${backendStatus === 'Ready for Prediction' ? 'status-ready' : ''}`}>
            {backendStatus}
          </span>
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Prediction is performed using the shared global model, not a hospital-specific model.
        </div>
      </div>

      <div className="card">
        <div className="card-header">Upload Chest X-Ray</div>

        {!previewUrl ? (
          <div
            className="upload-area"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              className="file-input"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            <UploadCloud className="upload-icon" size={48} />
            <div className="upload-text">Drag and drop or click to upload</div>
            <div className="upload-subtext">JPG, JPEG, PNG only</div>
          </div>
        ) : (
          <div className="preview-container">
            <div className="image-preview-wrapper">
              <img src={previewUrl} alt="X-ray preview" className="preview-image" />
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {selectedFile.name}
            </div>
          </div>
        )}

        {error && (
          <div className="error-alert" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
            <div>{error}</div>
            {(error.includes('connect') || error.includes('server') || error.includes('configured') || error.includes('URL') || error.includes('backend')) && (
              <button
                type="button"
                onClick={handleUpdateApiUrl}
                style={{
                  marginTop: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid currentColor',
                  color: 'inherit',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Configure Backend URL
              </button>
            )}
          </div>
        )}

        {result && (
          <div className={`result-card ${result.prediction === 'NORMAL' ? 'normal' : 'pneumonia'}`}>
            <div className="result-heading">
              {result.prediction === 'NORMAL' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
              {result.prediction}
            </div>
            <div className="result-confidence">
              Confidence: {result.confidence}%
            </div>
            <div className="result-meta">
              <span>Model Used: Global Round-20 ResNet18</span>
              <span>Hospital: {loggedInHospital}</span>
            </div>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!result ? (
            <>
              <button
                className="btn btn-primary"
                onClick={handlePredict}
                disabled={isLoading || !selectedFile}
              >
                {isLoading ? 'Analyzing X-ray...' : 'Analyze Image'}
              </button>
              {isLoading && isWarmingUp && (
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', textAlign: 'center', margin: '-0.25rem 0' }}>
                  ⏳ Processing X-ray... Free-tier backend may take 30–50s if waking up from idle mode.
                </div>
              )}
            </>
          ) : null}

          {(previewUrl || result || error) && (
            <button
              className="btn btn-secondary"
              onClick={handleClear}
              disabled={isLoading}
            >
              {result ? 'Upload Another X-Ray' : 'Clear Image'}
            </button>
          )}
        </div>
      </div>

      <div className="info-alert">
        For educational and research purposes only. This system is not a medical diagnostic tool.
      </div>
    </div>
  );
};

export default PredictPage;
