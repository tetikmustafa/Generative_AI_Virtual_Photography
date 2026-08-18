import React, { useEffect, useRef } from 'react';

const LOG_ICONS = {
  info: 'ℹ',
  success: '✓',
  error: '✕',
  warn: '⚠',
  progress: '⚡',
};

export default function ConsolePanel({ logs, onClear }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="console-panel" id="console-panel">
      <div className="console-header">
        <span className="console-title">📋 Konsol</span>
        <button className="console-clear-btn" onClick={onClear} id="clear-logs-btn">
          Temizle
        </button>
      </div>
      <div className="console-body" ref={scrollRef}>
        {logs.length === 0 ? (
          <div className="console-empty">Henüz log yok...</div>
        ) : (
          logs.map((log, idx) => (
            <div className={`console-line log-${log.type}`} key={idx}>
              <span className="log-time">[{log.time}]</span>
              <span className="log-icon">{LOG_ICONS[log.type] || 'ℹ'}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
