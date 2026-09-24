import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';

const PredictPage = ({ addHistoryItem, loggedInHospital }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

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
    setError(null);
    setResult(null);

    const apiUrl = import.meta.env.VITE_API_URL;

    if (!apiUrl) {
      setError('API URL is not configured. Please check your environment variables.');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);

      // Add to history
      addHistoryItem({
        date: new Date().toISOString(),
        hospital: loggedInHospital,
        filename: selectedFile.name,
        prediction: data.prediction,
        confidence: data.confidence,
        model: 'Global Round-20 ResNet18'
      });

    } catch (err) {
      setError('Unable to connect to the prediction server. Please make sure the Colab backend is running.');
      console.error(err);
    } finally {
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
          <span className="status-label">Status:</span>
          <span className="status-value status-ready">Ready for Prediction</span>
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
            {error}
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
            <button
              className="btn btn-primary"
              onClick={handlePredict}
              disabled={isLoading || !selectedFile}
            >
              {isLoading ? 'Analyzing X-ray...' : 'Analyze Image'}
            </button>
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
