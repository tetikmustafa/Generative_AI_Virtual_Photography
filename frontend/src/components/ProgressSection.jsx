import React, { useEffect, useState } from 'react';

const PHASES = [
  { key: 'uploading', label: 'Yükleniyor' },
  { key: 'queued', label: 'Kuyrukta' },
  { key: 'running', label: 'Üretiliyor' },
  { key: 'done', label: 'Tamamlandı' },
];

const PHASE_ORDER = { uploading: 0, queued: 1, running: 2, done: 3, error: 3 };

export default function ProgressSection({ progress, isRunning, onCancel }) {
  const [visible, setVisible] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState(null);

  const isActive = isRunning || progress.phase === 'done' || progress.phase === 'error';

  useEffect(() => {
    if (isActive) {
      setVisible(true);
      if (autoHideTimer) clearTimeout(autoHideTimer);
      setAutoHideTimer(null);
    }
  }, [isActive]);

  useEffect(() => {
    if (progress.phase === 'done') {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      setAutoHideTimer(timer);
      return () => clearTimeout(timer);
    }
  }, [progress.phase]);

  const currentPhaseIdx = PHASE_ORDER[progress.phase] ?? -1;

  return (
    <div className={`progress-section ${visible ? 'visible' : ''}`} id="progress-section">
      <div className="progress-header">
        <span className="progress-phase-label">{progress.activeNodeLabel || 'Bekliyor...'}</span>
        {isRunning && (
          <button className="cancel-btn" onClick={onCancel} id="cancel-btn">
            ■ Durdur
          </button>
        )}
      </div>

      <div className="progress-bar-container">
        <div
          className={`progress-bar-fill ${progress.phase === 'done' ? 'completed' : ''} ${isRunning ? 'shimmer' : ''}`}
          style={{ width: `${progress.percent}%` }}
        />
        <span className="progress-bar-text">
          {progress.percent}% &nbsp; Adım {progress.completedSteps} / {progress.totalSteps}
        </span>
      </div>

      <div className="progress-phases">
        {PHASES.map((ph, idx) => {
          let phaseClass = 'phase-step';
          if (idx < currentPhaseIdx) phaseClass += ' completed';
          else if (idx === currentPhaseIdx) phaseClass += ' active';
          else phaseClass += ' pending';

          return (
            <div className={phaseClass} key={ph.key}>
              <span className="phase-indicator">
                {idx < currentPhaseIdx ? '✓' : idx === currentPhaseIdx ? '●' : '○'}
              </span>
              <span className="phase-label">{ph.label}</span>
            </div>
          );
        })}
      </div>

      {progress.phase === 'error' && (
        <div className="progress-error">
          ❌ Bir hata oluştu. Detaylar için konsolu kontrol edin.
        </div>
      )}
    </div>
  );
}
