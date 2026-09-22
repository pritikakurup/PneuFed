import React from 'react';
import { Trash2 } from 'lucide-react';

const HistoryPage = ({ history, setHistory }) => {
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all prediction history?')) {
      setHistory([]);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>History</h2>
          <p>Local record of your past predictions</p>
        </div>
        {history.length > 0 && (
          <button className="btn btn-secondary" onClick={handleClearHistory} style={{ width: 'auto' }}>
            <Trash2 size={16} />
            Clear History
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {history.length === 0 ? (
          <div className="empty-state">
            <p>No predictions yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hospital</th>
                  <th>Filename</th>
                  <th>Prediction</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {history.slice().reverse().map((item, index) => (
                  <tr key={index}>
                    <td>{formatDate(item.date)}</td>
                    <td>{item.hospital}</td>
                    <td>{item.filename}</td>
                    <td>
                      <span className={`badge ${item.prediction === 'NORMAL' ? 'badge-normal' : 'badge-pneumonia'}`}>
                        {item.prediction}
                      </span>
                    </td>
                    <td>{item.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
