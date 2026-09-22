import React from 'react';
import { Activity, Clock, BarChart2, Menu, X } from 'lucide-react';

const Sidebar = ({ currentTab, setCurrentTab, sidebarOpen, setSidebarOpen }) => {
  const navItems = [
    { id: 'predict', label: 'Predict', icon: <Activity size={20} /> },
    { id: 'history', label: 'History', icon: <Clock size={20} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={20} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-icon">🏥</span>
            <div className="brand-text">
              <h2>PneuFed</h2>
              <p>Federated Pneumonia Detection</p>
            </div>
          </div>
          <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-button ${currentTab === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setSidebarOpen(false); // Close on mobile after selection
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
