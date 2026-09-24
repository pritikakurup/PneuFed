import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [hospital, setHospital] = useState('Hospital A');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const hospitals = [
    'Hospital A',
    'Hospital B',
    'Hospital C',
    'Hospital D'
  ];

  const credentials = {
    'Hospital A': 'hospitalA123',
    'Hospital B': 'hospitalB123',
    'Hospital C': 'hospitalC123',
    'Hospital D': 'hospitalD123',
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (credentials[hospital] === password) {
      onLogin(hospital);
    } else {
      setError('Invalid password for selected hospital');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <span className="brand-icon" style={{ fontSize: '3rem' }}>🏥</span>
          <h2>PneuFed</h2>
          <p>Hospital Portal</p>
          <p className="login-subtitle">Federated Learning Pneumonia Detection Platform</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label className="form-label">Select Hospital</label>
            <select 
              className="select-input"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
            >
              {hospitals.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="text-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter demo password"
              required
            />
          </div>
          
          {error && <div className="error-alert">{error}</div>}
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            <LogIn size={20} />
            Login
          </button>
        </form>
        <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          This is demo authentication for the college project demonstration.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
