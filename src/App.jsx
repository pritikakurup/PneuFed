import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import PredictPage from './components/PredictPage';
import HistoryPage from './components/HistoryPage';
import AnalyticsPage from './components/AnalyticsPage';
import './App.css';

function App() {
  const [currentTab, setCurrentTab] = useState('predict');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Load history from localStorage
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('pneufed_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('pneufed_history', JSON.stringify(history));
  }, [history]);

  const addHistoryItem = (item) => {
    setHistory(prev => [...prev, item]);
  };

  return (
    <div className="app-layout">
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
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
          {currentTab === 'predict' && <PredictPage addHistoryItem={addHistoryItem} />}
          {currentTab === 'history' && <HistoryPage history={history} setHistory={setHistory} />}
          {currentTab === 'analytics' && <AnalyticsPage />}
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
