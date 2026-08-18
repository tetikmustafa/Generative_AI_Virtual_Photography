import React from 'react';

export default function Header({ isConnected, connectionError, onReconnect }) {
  let statusClass = 'header-status';
  let statusDot = '';
  let statusText = '';

  if (isConnected) {
    statusClass += ' connected';
    statusDot = 'status-dot connected';
    statusText = 'ComfyUI Bağlı';
  } else if (connectionError) {
    statusClass += ' disconnected';
    statusDot = 'status-dot disconnected';
    statusText = "ComfyUI'ya Bağlanılamıyor";
  } else {
    statusClass += ' connecting';
    statusDot = 'status-dot connecting';
    statusText = 'Bağlanıyor...';
  }

  return (
    <header className="app-header" id="app-header">
      <div className="header-left">
        <svg className="header-logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#headerGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c6af7" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <h1 className="header-title">Product Photographer</h1>
      </div>
      <div className={statusClass}>
        <span className={statusDot} />
        <span className="status-text">{statusText}</span>
        {connectionError && (
          <button className="retry-btn" onClick={onReconnect} id="retry-connection-btn">
            Yeniden Dene
          </button>
        )}
      </div>
    </header>
  );
}
