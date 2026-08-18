import React, { useState } from 'react';

const PROMPT_VIEWS = [
  { key: 'front', label: '🎯 Ön Görünüm' },
  { key: 'side', label: '↗ Yan Profil' },
  { key: 'iso', label: '📐 İzometrik' },
];

export default function SettingsPanel({ settings, updateSetting, updatePrompt, resetPrompt, resetAll, onTestConnection }) {
  const [expandedPrompt, setExpandedPrompt] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const ok = await onTestConnection();
    setTestResult(ok ? 'success' : 'error');
    setIsTesting(false);
  };

  const handleResetAll = () => {
    if (window.confirm('Tüm ayarları varsayılana sıfırlamak istediğinizden emin misiniz?')) resetAll();
  };

  return (
    <div className="settings-panel" id="settings-panel">
      <div className="settings-section">
        <h3 className="settings-section-title">Genel Ayarlar</h3>

        <div className="setting-row">
          <label className="setting-label">Adım Sayısı</label>
          <div className="setting-control">
            <input type="range" min={1} max={8} step={1} value={settings.steps} onChange={e => updateSetting('steps', parseInt(e.target.value))} className="setting-slider" id="steps-slider" />
            <span className="setting-value">{settings.steps}</span>
          </div>
        </div>

        <div className="setting-row">
          <label className="setting-label">Çözünürlük</label>
          <div className="setting-control">
            <div className="toggle-group" id="resolution-toggle">
              {[0.5, 1, 2].map(mp => (
                <button key={mp} className={`toggle-btn ${settings.megapixels === mp ? 'active' : ''}`} onClick={() => updateSetting('megapixels', mp)}>{mp} MP</button>
              ))}
            </div>
          </div>
        </div>

        <div className="setting-row">
          <label className="setting-label">LoRA Gücü</label>
          <div className="setting-control">
            <input type="range" min={0} max={2} step={0.1} value={settings.loraStrength} onChange={e => updateSetting('loraStrength', parseFloat(e.target.value))} className="setting-slider" id="lora-slider" />
            <span className="setting-value">{settings.loraStrength.toFixed(1)}</span>
          </div>
        </div>

        <div className="setting-row">
          <label className="setting-label">CFGNorm Gücü</label>
          <div className="setting-control">
            <input type="range" min={0} max={2} step={0.1} value={settings.cfgNorm} onChange={e => updateSetting('cfgNorm', parseFloat(e.target.value))} className="setting-slider" id="cfgnorm-slider" />
            <span className="setting-value">{settings.cfgNorm.toFixed(1)}</span>
          </div>
        </div>

        <div className="setting-row">
          <label className="setting-label">Seed Modu</label>
          <div className="setting-control">
            <label className="toggle-switch" id="seed-toggle">
              <input type="checkbox" checked={settings.randomSeed} onChange={e => updateSetting('randomSeed', e.target.checked)} />
              <span className="toggle-track"><span className="toggle-thumb" /></span>
              <span className="toggle-label-text">{settings.randomSeed ? 'Rastgele Seed' : 'Sabit Seed'}</span>
            </label>
          </div>
        </div>

        {!settings.randomSeed && (
          <div className="seed-inputs">
            {settings.seeds.map((seed, idx) => (
              <div className="seed-row" key={idx}>
                <label className="seed-label">Pipeline {idx + 1} Seed</label>
                <input type="number" className="seed-input" value={seed} onChange={e => { const s = [...settings.seeds]; s[idx] = parseInt(e.target.value) || 0; updateSetting('seeds', s); }} id={`seed-input-${idx}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Prompt Editörü</h3>
        {PROMPT_VIEWS.map(view => (
          <div className={`prompt-card ${expandedPrompt === view.key ? 'expanded' : ''}`} key={view.key}>
            <button className="prompt-card-header" onClick={() => setExpandedPrompt(expandedPrompt === view.key ? null : view.key)} id={`prompt-toggle-${view.key}`}>
              <span>{view.label}</span>
              <span className="prompt-expand-icon">{expandedPrompt === view.key ? '▾' : '▸'}</span>
            </button>
            {expandedPrompt === view.key && (
              <div className="prompt-card-body">
                <label className="prompt-textarea-label">Pozitif Prompt</label>
                <textarea className="prompt-textarea positive" rows={8} value={settings.prompts[view.key].positive} onChange={e => updatePrompt(view.key, 'positive', e.target.value)} id={`prompt-positive-${view.key}`} />
                <label className="prompt-textarea-label">Negatif Prompt</label>
                <textarea className="prompt-textarea negative" rows={3} value={settings.prompts[view.key].negative} onChange={e => updatePrompt(view.key, 'negative', e.target.value)} id={`prompt-negative-${view.key}`} />
                <button className="prompt-reset-link" onClick={() => resetPrompt(view.key)}>Varsayılana Sıfırla</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Bağlantı</h3>
        <div className="setting-row">
          <label className="setting-label">ComfyUI Adresi</label>
          <div className="setting-control">
            <input type="text" className="readonly-input" value={settings.comfyUrl} readOnly id="comfy-url-input" />
          </div>
        </div>
        <div className="connection-actions">
          <button className="test-btn" onClick={handleTest} disabled={isTesting} id="test-connection-btn">
            {isTesting ? '⏳ Test ediliyor...' : '🔌 Bağlantıyı Test Et'}
          </button>
          {testResult === 'success' && <span className="test-result success">✅ Bağlantı başarılı</span>}
          {testResult === 'error' && <span className="test-result error">❌ Bağlanamadı</span>}
        </div>
        <button className="reset-all-btn" onClick={handleResetAll} id="reset-all-btn">Tüm Ayarları Sıfırla</button>
      </div>
    </div>
  );
}
