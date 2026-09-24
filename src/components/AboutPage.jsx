import React from 'react';

const AboutPage = () => {
  return (
    <div className="page-content">
      <div className="page-header">
        <h2>About / System Info</h2>
        <p>PneuFed platform information</p>
      </div>

      <div className="card">
        <div className="card-header">Project Information</div>
        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">Project</span>
            <span className="info-value">PneuFed</span>
          </div>
          <div className="info-row">
            <span className="info-label">Model</span>
            <span className="info-value">ResNet18</span>
          </div>
          <div className="info-row">
            <span className="info-label">Learning</span>
            <span className="info-value">Federated Learning</span>
          </div>
          <div className="info-row">
            <span className="info-label">Aggregation</span>
            <span className="info-value">FedAvg</span>
          </div>
          <div className="info-row">
            <span className="info-label">Hospitals</span>
            <span className="info-value">4</span>
          </div>
          <div className="info-row">
            <span className="info-label">Federated Rounds</span>
            <span className="info-value">20</span>
          </div>
          <div className="info-row">
            <span className="info-label">Final Global Model</span>
            <span className="info-value">Round 20</span>
          </div>
          <div className="info-row">
            <span className="info-label">Test Images</span>
            <span className="info-value">1,261</span>
          </div>
          <div className="info-row">
            <span className="info-label">Final Accuracy</span>
            <span className="info-value" style={{ color: 'var(--primary)' }}>98.41%</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Evaluation Metrics</div>
        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">Accuracy</span>
            <span className="info-value" style={{ color: 'var(--primary)' }}>98.41%</span>
          </div>
          <div className="info-row">
            <span className="info-label">Precision</span>
            <span className="info-value" style={{ color: 'var(--primary)' }}>99.36%</span>
          </div>
          <div className="info-row">
            <span className="info-label">Recall</span>
            <span className="info-value" style={{ color: 'var(--primary)' }}>97.50%</span>
          </div>
          <div className="info-row">
            <span className="info-label">F1 Score</span>
            <span className="info-value" style={{ color: 'var(--primary)' }}>98.43%</span>
          </div>
        </div>
      </div>

      <div className="danger-alert">
        <strong>Disclaimer:</strong> For educational and research purposes only.
        This system is not a medical diagnostic tool.
      </div>
    </div>
  );
};

export default AboutPage;
