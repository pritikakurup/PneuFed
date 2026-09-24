import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import PredictPage from './components/PredictPage';
import HistoryPage from './components/HistoryPage';
import AnalyticsPage from './components/AnalyticsPage';
import FederatedLearningPage from './components/FederatedLearningPage';
import AboutPage from './components/AboutPage';
import './App.css';

function App() {
  // Auth state — persisted in sessionStorage
  const [loggedInHospital, setLoggedInHospital] = useState(() => {
    return sessionStorage.getItem('pneufed_hospital') || null;
  });

  const [currentTab, setCurrentTab] = useState('predict');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Prediction history — persisted in localStorage
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('pneufed_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('pneufed_history', JSON.stringify(history));
  }, [history]);

  const addHistoryItem = (item) => {
    setHistory(prev => [...prev, item]);
  };

  const handleLogin = (hospital) => {
    sessionStorage.setItem('pneufed_hospital', hospital);
    setLoggedInHospital(hospital);
    setCurrentTab('predict');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pneufed_hospital');
    setLoggedInHospital(null);
    setSidebarOpen(false);
  };

  // If not logged in, show login page
  if (!loggedInHospital) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loggedInHospital={loggedInHospital}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {/* Mobile Header */}
        <div className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🏥</span>
            <h1>PneuFed</h1>
          </div>
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Dynamic Content */}
        <div style={{ flex: 1 }}>
          {currentTab === 'predict'   && <PredictPage addHistoryItem={addHistoryItem} loggedInHospital={loggedInHospital} />}
          {currentTab === 'history'   && <HistoryPage history={history} setHistory={setHistory} />}
          {currentTab === 'analytics' && <AnalyticsPage />}
          {currentTab === 'federated' && <FederatedLearningPage />}
          {currentTab === 'about'     && <AboutPage />}
        </div>

        {/* Global Footer */}
        <footer className="footer">
          For educational and research purposes only. This system is not a medical diagnostic tool.
        </footer>
      </main>
    </div>
  );
}

export default App;
