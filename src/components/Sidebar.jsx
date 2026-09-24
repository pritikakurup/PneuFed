import React from 'react';
import { Activity, Clock, BarChart2, Network, Info, X, LogOut } from 'lucide-react';

const Sidebar = ({ currentTab, setCurrentTab, sidebarOpen, setSidebarOpen, loggedInHospital, onLogout }) => {
  const navItems = [
    { id: 'predict',   label: 'Predict',             icon: <Activity size={20} /> },
    { id: 'history',   label: 'History',              icon: <Clock size={20} /> },
    { id: 'analytics', label: 'Analytics',            icon: <BarChart2 size={20} /> },
    { id: 'federated', label: 'Federated Learning',   icon: <Network size={20} /> },
    { id: 'about',     label: 'About / System Info',  icon: <Info size={20} /> },
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
              <p>Federated Learning Platform</p>
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
                    setSidebarOpen(false);
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {loggedInHospital && (
            <div className="sidebar-hospital-info">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Logged in as</div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>🏥 {loggedInHospital}</div>
            </div>
          )}
          <button
            className="btn btn-logout"
            onClick={onLogout}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
