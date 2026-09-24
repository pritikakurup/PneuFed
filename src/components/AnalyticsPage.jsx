import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const modelPerformance = [
  { name: 'Accuracy',  Score: 98.41 },
  { name: 'Precision', Score: 99.36 },
  { name: 'Recall',    Score: 97.50 },
  { name: 'F1 Score',  Score: 98.43 },
];

const dataDistribution = [
  { name: 'Hospital A', NORMAL: 723, PNEUMONIA: 723 },
  { name: 'Hospital B', NORMAL: 723, PNEUMONIA: 723 },
  { name: 'Hospital C', NORMAL: 723, PNEUMONIA: 723 },
  { name: 'Hospital D', NORMAL: 723, PNEUMONIA: 723 },
];

const testSetData = [
  { name: 'NORMAL',    value: 620 },
  { name: 'PNEUMONIA', value: 641 },
];

const PIE_COLORS = ['#10b981', '#ef4444'];

const CustomTooltipBar = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '0.75rem 1.25rem' }}>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>{label}</p>
        <p style={{ margin: '0.25rem 0 0 0', color: '#3b82f6', fontWeight: 700 }}>{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600}>
      {value}
    </text>
  );
};

const AnalyticsPage = () => {
  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Analytics</h2>
        <p>Global model evaluation — Round 20 ResNet18</p>
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
          <span className="metric-value" style={{ color: 'var(--text-primary)' }}>1,261</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Model</span>
          <span className="metric-value" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>ResNet18 — Rd 20</span>
        </div>
      </div>

      {/* Row 1: Model Performance Bar + Confusion Matrix */}
      <div className="charts-grid">
        {/* Graph 1 – Global Model Performance Bar Chart */}
        <div className="card">
          <div className="card-header">Global Model Performance</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Round 20 – ResNet18</div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelPerformance} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 13 }} />
                <YAxis domain={[95, 100]} stroke="#94a3b8" tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltipBar />} />
                <Bar dataKey="Score" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2 – Confusion Matrix */}
        <div className="card">
          <div className="card-header">Confusion Matrix – Global Model</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Round 20 evaluation on 1,261 test images</div>
          <div className="confusion-matrix">
            <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <strong>Predicted NORMAL</strong>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <strong>Predicted PNEUMONIA</strong>
            </div>
            <div className="cm-grid">
              <div className="cm-cell cm-empty"></div>
              <div className="cm-cell cm-header">Predicted<br/>NORMAL</div>
              <div className="cm-cell cm-header">Predicted<br/>PNEUMONIA</div>

              <div className="cm-cell cm-header">Actual<br/>NORMAL</div>
              <div className="cm-cell cm-tp"><span className="cm-value">616</span><span className="cm-sublabel">TN</span></div>
              <div className="cm-cell cm-fp"><span className="cm-value">4</span><span className="cm-sublabel">FP</span></div>

              <div className="cm-cell cm-header">Actual<br/>PNEUMONIA</div>
              <div className="cm-cell cm-fn"><span className="cm-value">16</span><span className="cm-sublabel">FN</span></div>
              <div className="cm-cell cm-tp"><span className="cm-value">625</span><span className="cm-sublabel">TP</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Hospital Distribution + Test Set Pie */}
      <div className="charts-grid">
        {/* Graph 3 – Hospital Training Data Distribution */}
        <div className="card">
          <div className="card-header">Configured Hospital Training Data</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Each hospital configured with equal NORMAL / PNEUMONIA split
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 13 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                <Bar dataKey="NORMAL" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PNEUMONIA" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 4 – Test Set Class Distribution */}
        <div className="card">
          <div className="card-header">Test Set Class Distribution</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Total: 1,261 images — NORMAL: 620 · PNEUMONIA: 641
          </div>
          <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={testSetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {testSetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  formatter={(value, name) => [`${value} images`, name]}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Federated Setup Summary */}
      <div className="card">
        <div className="card-header">Federated Learning Configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Hospitals</div>
            <div style={{ fontWeight: '600', fontSize: '1.25rem' }}>4</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Federated Rounds</div>
            <div style={{ fontWeight: '600', fontSize: '1.25rem' }}>20</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Aggregation</div>
            <div style={{ fontWeight: '600', fontSize: '1.25rem' }}>FedAvg</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Global Model</div>
            <div style={{ fontWeight: '600', fontSize: '1.25rem' }}>ResNet18</div>
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
          <div className="fl-node">Federated Aggregation<br/>(FedAvg)</div>
          <div className="fl-arrow">⟶</div>
          <div className="fl-node fl-global">Global Model<br/><small>Round 20</small></div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
