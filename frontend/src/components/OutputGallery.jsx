import React, { useState } from 'react';

const VIEWS = [
  { key: 'front', label: '🎯 Ön Görünüm', badge: 'Ön', nodeId: '60' },
  { key: 'side', label: '↗ Yan Profil', badge: 'Yan', nodeId: '179' },
  { key: 'iso', label: '📐 İzometrik', badge: 'İso', nodeId: '180' },
];

const KSAMPLER_FOR_VIEW = {
  front: '115:3',
  side: '142:138',
  iso: '160:156',
};

export default function OutputGallery({ outputs, progress, onImageClick }) {
  const allReady = outputs.front && outputs.side && outputs.iso;

  const handleDownloadAll = () => {
    VIEWS.forEach(v => {
      const output = outputs[v.key];
      if (output) {
        const a = document.createElement('a');
        a.href = output.url;
        a.download = output.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  };

  return (
    <div className="output-gallery" id="output-gallery">
      <div className="gallery-grid">
        {VIEWS.map((view, idx) => {
          const output = outputs[view.key];
          const isLoading = progress.phase === 'running' &&
            progress.activeNodeId &&
            (progress.activeNodeId === KSAMPLER_FOR_VIEW[view.key] || !output);

          return (
            <div className="gallery-card" key={view.key} id={`output-card-${view.key}`}>
              <div className="card-header">
                <span className="card-title">{view.label}</span>
              </div>
              <div className="card-image-container">
                {output ? (
                  <div className="card-image-wrapper">
                    <img
                      src={output.url}
                      alt={view.label}
                      className="card-image"
                      onClick={() => onImageClick(idx)}
                    />
                    <div className="card-overlay">
                      <a
                        href={output.url}
                        download={output.filename}
                        className="overlay-btn download-btn"
                        title="İndir"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ↓
                      </a>
                      <button
                        className="overlay-btn fullscreen-btn"
                        title="Tam Ekran"
                        onClick={(e) => { e.stopPropagation(); onImageClick(idx); }}
                      >
                        ⛶
                      </button>
                    </div>
                    <span className="card-badge">{view.badge}</span>
                  </div>
                ) : isLoading ? (
                  <div className="card-skeleton">
                    <div className="skeleton-shimmer" />
                  </div>
                ) : (
                  <div className="card-placeholder">
                    <svg className="placeholder-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span className="placeholder-text">Bekleniyor...</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allReady && (
        <button className="download-all-btn" onClick={handleDownloadAll} id="download-all-btn">
          Tümünü İndir
        </button>
      )}
    </div>
  );
}
