import React from 'react';

const FederatedLearningPage = () => {
  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Federated Learning</h2>
        <p>How PneuFed Works</p>
      </div>

      <div className="card">
        <div className="card-header">Architecture Overview</div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Number of Hospitals</div>
            <div style={{ fontWeight: '600' }}>4 Participating Hospitals</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Federated Rounds</div>
            <div style={{ fontWeight: '600' }}>20 Rounds</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Aggregation</div>
            <div style={{ fontWeight: '600' }}>FedAvg</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Global Model</div>
            <div style={{ fontWeight: '600' }}>ResNet18</div>
          </div>
        </div>

        <div className="fl-diagram" style={{ padding: '2rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem' }}>
          <div className="fl-hospitals">
            <div className="fl-node">Hospital A</div>
            <div className="fl-node">Hospital B</div>
            <div className="fl-node">Hospital C</div>
            <div className="fl-node">Hospital D</div>
          </div>
          <div className="fl-arrow">⟶</div>
          <div className="fl-node" style={{ backgroundColor: 'var(--bg-surface)' }}>Federated Aggregation<br/>(FedAvg)</div>
          <div className="fl-arrow">⟶</div>
          <div className="fl-node fl-global">
            Global ResNet18 Model<br/>
            <small>Round 20 Model</small>
          </div>
          <div className="fl-arrow">⟶</div>
          <div className="fl-node" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success-border)' }}>
            Pneumonia Prediction
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Workflow</div>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Local Data</h4>
              <p>Each hospital has its own local chest X-ray data.</p>
            </div>
          </div>
          <div className="workflow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Local Training</h4>
              <p>The ResNet18 model is trained locally.</p>
            </div>
          </div>
          <div className="workflow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Aggregation</h4>
              <p>Only model updates are aggregated through Federated Averaging.</p>
            </div>
          </div>
          <div className="workflow-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Global Model</h4>
              <p>A global model is created.</p>
            </div>
          </div>
          <div className="workflow-step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h4>Inference</h4>
              <p>The global model is used for pneumonia prediction.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="info-alert">
        Federated retraining is performed in the research/training environment.
        This deployed dashboard currently provides inference using the trained Round-20 global model.
      </div>
    </div>
  );
};

export default FederatedLearningPage;
