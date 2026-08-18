import React, { useEffect, useCallback } from 'react';

const VIEW_LABELS = ['🎯 Ön Görünüm', '↗ Yan Profil', '📐 İzometrik'];
const VIEW_KEYS = ['front', 'side', 'iso'];

export default function Modal({ outputs, activeIndex, onClose }) {
  const readyIndices = VIEW_KEYS
    .map((key, idx) => outputs[key] ? idx : -1)
    .filter(i => i >= 0);

  const currentOutput = outputs[VIEW_KEYS[activeIndex]];

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  if (!currentOutput) return null;

  return (
    <div className="modal-overlay" onClick={onClose} id="image-modal">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-actions">
          <a href={currentOutput.url} download={currentOutput.filename} className="modal-btn" title="İndir">↓</a>
          <button className="modal-btn" onClick={onClose} title="Kapat">✕</button>
        </div>
        <img src={currentOutput.url} alt={VIEW_LABELS[activeIndex]} className="modal-image" />
        <div className="modal-info">
          <span className="modal-title">{VIEW_LABELS[activeIndex]}</span>
          <span className="modal-filename">{currentOutput.filename}</span>
        </div>
      </div>
    </div>
  );
}
