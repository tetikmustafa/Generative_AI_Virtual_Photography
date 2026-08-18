import React, { useRef, useState, useEffect, useCallback } from 'react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export default function ImageUploader({ onGenerate, isRunning, isConnected, addToast }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const validateAndSetFile = useCallback((f) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      addToast('Sadece JPG, PNG, WEBP destekleniyor', 'error');
      return;
    }
    if (f.size > MAX_SIZE) {
      addToast('Dosya çok büyük (max 20MB)', 'error');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, [preview, addToast]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  }, [validateAndSetFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e) => {
    const f = e.target.files?.[0];
    if (f) validateAndSetFile(f);
  }, [validateAndSetFile]);

  const handleRemove = useCallback(() => {
    if (isRunning) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  }, [isRunning, preview]);

  const handleGenerate = useCallback(() => {
    if (file && !isRunning && isConnected) {
      onGenerate(file);
    }
  }, [file, isRunning, isConnected, onGenerate]);

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="uploader-card" id="image-uploader">
      {!file ? (
        <div
          className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          id="upload-dropzone"
        >
          <div className="dropzone-icon-wrapper">
            <svg className="dropzone-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="dropzone-title">Ürün fotoğrafını buraya bırakın</p>
          <p className="dropzone-subtitle">ya da tıklayın</p>
          <p className="dropzone-formats">JPG · PNG · WEBP</p>
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileInput}
            style={{ display: 'none' }}
            id="file-input"
          />
        </div>
      ) : (
        <div className="upload-preview">
          <div className="preview-image-container">
            <img src={preview} alt="Ürün önizleme" className="preview-image" />
            <button
              className="preview-remove-btn"
              onClick={handleRemove}
              disabled={isRunning}
              title="Kaldır"
              id="remove-image-btn"
            >
              ✕
            </button>
          </div>
          <div className="preview-info">
            <span className="preview-filename">{file.name}</span>
            <span className="preview-size">{formatSize(file.size)}</span>
          </div>
          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={isRunning || !isConnected}
            id="generate-btn"
          >
            {isRunning ? (
              <>
                <span className="btn-spinner" />
                Üretiliyor...
              </>
            ) : (
              <>
                <span className="btn-play-icon">▶</span>
                Fotoğrafları Oluştur
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
