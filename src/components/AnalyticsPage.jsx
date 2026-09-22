import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const dataDistribution = [
  { name: 'Hospital A', NORMAL: 723, PNEUMONIA: 723 },
  { name: 'Hospital B', NORMAL: 723, PNEUMONIA: 723 },
  { name: 'Hospital C', NORMAL: 723, PNEUMONIA: 723 },
  { name: 'Hospital D', NORMAL: 723, PNEUMONIA: 723 },
];

const modelPerformance = [
  { name: 'Accuracy', Score: 98.41 },
  { name: 'Precision', Score: 99.36 },
  { name: 'Recall', Score: 97.50 },
  { name: 'F1 Score', Score: 98.43 },
];

const AnalyticsPage = () => {
  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Analytics</h2>
        <p>Global model evaluation and federated learning details</p>
      </div>

      {/* Summary Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Accuracy</span>
          <span className="metric-value">98.41%</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Precision</span>
          <span className="metric-value">99.36%</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Recall</span>
          <span className="metric-value">97.50%</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">F1 Score</span>
          <span className="metric-value">98.43%</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Test Images</span>
          <span className="metric-value" style={{ color: 'var(--text-primary)' }}>1261</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Model</span>
          <span className="metric-value" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>ResNet18 — Round 20</span>
        </div>
      </div>

      <div className="charts-grid">
        {/* Model Performance Graph */}
        <div className="card">
          <div className="card-header">Global Model Performance</div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelPerformance} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis domain={[90, 100]} stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--primary)' }}
                />
                <Bar dataKey="Score" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hospital Data Distribution Graph */}
        <div className="card">
          <div className="card-header">Configured Hospital Training Data Distribution</div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
                <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                <Bar dataKey="NORMAL" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PNEUMONIA" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Confusion Matrix */}
        <div className="card">
          <div className="card-header">Confusion Matrix — Round 20</div>
          <div className="confusion-matrix">
            <div className="cm-grid">
              <div className="cm-cell cm-empty"></div>
              <div className="cm-cell cm-header">Predicted<br/>NORMAL</div>
              <div className="cm-cell cm-header">Predicted<br/>PNEUMONIA</div>
              
              <div className="cm-cell cm-header">Actual<br/>NORMAL</div>
              <div className="cm-cell"><span className="cm-value">616</span></div>
              <div className="cm-cell"><span className="cm-value">4</span></div>
              
              <div className="cm-cell cm-header">Actual<br/>PNEUMONIA</div>
              <div className="cm-cell"><span className="cm-value">16</span></div>
              <div className="cm-cell"><span className="cm-value">625</span></div>
            </div>
          </div>
        </div>

        {/* Federated Learning Info */}
        <div className="card">
          <div className="card-header">Federated Learning</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Training Rounds</div>
              <div style={{ fontWeight: '600' }}>20</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Hospitals</div>
              <div style={{ fontWeight: '600' }}>4</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Model</div>
              <div style={{ fontWeight: '600' }}>ResNet18</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Aggregation</div>
              <div style={{ fontWeight: '600' }}>FedAvg</div>
            </div>
          </div>

          <div className="fl-diagram">
            <div className="fl-hospitals">
              <div className="fl-node">Hospital A</div>
              <div className="fl-node">Hospital B</div>
              <div className="fl-node">Hospital C</div>
              <div className="fl-node">Hospital D</div>
            </div>
            <div className="fl-arrow">⟶</div>
            <div className="fl-node">Federated Aggregation</div>
            <div className="fl-arrow">⟶</div>
            <div className="fl-node fl-global">Global Model<br/><small>Round 20</small></div>
          </div>
          
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--primary)' }}>Federated Training</div>
            <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Global Round-20 model is currently deployed for inference.</div>
            <div style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
              <span style={{ color: 'var(--success)' }}>● Model Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
