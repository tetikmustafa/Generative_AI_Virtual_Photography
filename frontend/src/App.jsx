import React, { useState, useCallback } from 'react';
import Header from './components/Header.jsx';
import ImageUploader from './components/ImageUploader.jsx';
import ProgressSection from './components/ProgressSection.jsx';
import OutputGallery from './components/OutputGallery.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import ConsolePanel from './components/ConsolePanel.jsx';
import Modal from './components/Modal.jsx';
import useComfyUI from './hooks/useComfyUI.js';
import useSettings from './hooks/useSettings.js';

export default function App() {
  const comfy = useComfyUI();
  const { settings, updateSetting, updatePrompt, resetPrompt, resetAll } = useSettings();
  const [rightTab, setRightTab] = useState('settings');
  const [modalIndex, setModalIndex] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleGenerate = useCallback((file) => {
    if (file.size > 20 * 1024 * 1024) {
      addToast('Dosya çok büyük (max 20MB)', 'error');
      return;
    }
    comfy.runGeneration(file, settings);
  }, [comfy, settings, addToast]);

  return (
    <div className="app-container">
      <Header isConnected={comfy.isConnected} connectionError={comfy.connectionError} onReconnect={comfy.reconnect} />

      <main className="app-main">
        <div className="left-column">
          <ImageUploader onGenerate={handleGenerate} isRunning={comfy.isRunning} isConnected={comfy.isConnected} addToast={addToast} />
          <ProgressSection progress={comfy.progress} isRunning={comfy.isRunning} onCancel={comfy.cancelJob} />
          <OutputGallery outputs={comfy.outputs} progress={comfy.progress} onImageClick={(idx) => setModalIndex(idx)} />
        </div>

        <div className="right-column">
          <div className="right-tabs">
            <button className={`tab-btn ${rightTab === 'settings' ? 'active' : ''}`} onClick={() => setRightTab('settings')} id="tab-settings">⚙ Ayarlar</button>
            <button className={`tab-btn ${rightTab === 'console' ? 'active' : ''}`} onClick={() => setRightTab('console')} id="tab-console">📋 Konsol</button>
          </div>
          <div className="right-content">
            {rightTab === 'settings' ? (
              <SettingsPanel settings={settings} updateSetting={updateSetting} updatePrompt={updatePrompt} resetPrompt={resetPrompt} resetAll={resetAll} onTestConnection={comfy.testConnection} />
            ) : (
              <ConsolePanel logs={comfy.logs} onClear={comfy.clearLogs} />
            )}
          </div>
        </div>
      </main>

      {modalIndex !== null && (
        <Modal outputs={comfy.outputs} activeIndex={modalIndex} onClose={() => setModalIndex(null)} />
      )}

      <div className="toast-container" id="toast-container">
        {toasts.map(t => (
          <div className={`toast toast-${t.type}`} key={t.id}>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" onClick={() => removeToast(t.id)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
