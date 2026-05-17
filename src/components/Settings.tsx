import { useState } from 'react';
import { toast } from './Toast';
import { type AIProvider, type AISettings, PROVIDERS, getProviderInfo, getDefaultModel, testConnection } from '../engine/ai';
import { NICHE_CATEGORIES, isKnownNiche } from '../engine/constants';

export const LOCAL_STORAGE_KEY = 'x-algo-toolkit-settings';

export function getSettings(): AISettings {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch { /* ignore */ }
  }
  return { provider: 'groq', apiKey: '', model: getDefaultModel('groq'), niche: '' };
}

export function saveSettings(settings: AISettings) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  // Dispatch storage event so App.tsx header can react immediately
  window.dispatchEvent(new Event('settings-changed'));
}

export function Settings() {
  const [settings, setSettings] = useState<AISettings>(getSettings());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [testStatus, setTestStatus] = useState<{ state: 'idle' | 'testing' | 'success' | 'error'; message: string }>({ state: 'idle', message: '' });
  const [showKey, setShowKey] = useState(false);

  const currentProvider = getProviderInfo(settings.provider);

  const handleProviderChange = (providerId: AIProvider) => {
    const info = getProviderInfo(providerId);
    setSettings(prev => ({
      ...prev,
      provider: providerId,
      model: info.defaultModel,
    }));
    setTestStatus({ state: 'idle', message: '' });
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaveStatus('saved');
    toast('success', 'Settings saved!');
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const handleTest = async () => {
    if (!settings.apiKey) {
      setTestStatus({ state: 'error', message: 'Please enter an API key first.' });
      return;
    }
    setTestStatus({ state: 'testing', message: 'Testing connection...' });
    const result = await testConnection(settings);
    setTestStatus({
      state: result.success ? 'success' : 'error',
      message: result.message,
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Header ── */}
      <div>
        <h2>Settings</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
          Configure your AI provider and professional niche. All data stays in your browser.
        </p>
      </div>

      {/* ── AI Provider Selection ── */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h4 style={{ color: 'var(--accent)' }}>🤖 AI Connection</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          Your API key is stored in your browser's localStorage only. It is never sent to any server other than your chosen AI provider.
        </p>

        {/* Provider Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {PROVIDERS.map(p => {
            const isSelected = settings.provider === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleProviderChange(p.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  background: isSelected ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '1.1rem' }}>{p.icon} <strong style={{ fontSize: '0.9rem' }}>{p.name}</strong></span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: 100, background: p.badge.includes('Free') ? 'var(--success-bg)' : 'var(--warning-bg)', color: p.badge.includes('Free') ? 'var(--success)' : 'var(--warning)' }}>
                    {p.badge.replace(/🟢 |💰 /g, '')}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{p.description}</p>
              </div>
            );
          })}
        </div>

        {/* Model Dropdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Model</label>
            <select
              className="input"
              value={settings.model}
              onChange={e => setSettings({ ...settings, model: e.target.value })}
            >
              {currentProvider.models.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              API Key
              <a href={currentProvider.keyHelpUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 8, fontSize: '0.7rem' }}>Get key →</a>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                className="input"
                value={settings.apiKey}
                onChange={e => { setSettings({ ...settings, apiKey: e.target.value }); setTestStatus({ state: 'idle', message: '' }); }}
                placeholder={currentProvider.keyPlaceholder}
                autoComplete="off"
                style={{ paddingRight: 44 }}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        </div>

        {/* Test Connection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={handleTest}
            disabled={testStatus.state === 'testing'}
            style={{ minWidth: 160, opacity: testStatus.state === 'testing' ? 0.7 : 1 }}
          >
            {testStatus.state === 'testing' ? '⏳ Testing...' : '🔌 Test Connection'}
          </button>
          {testStatus.state === 'success' && (
            <span className="animate-fade-in" style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 500 }}>
              ✅ {testStatus.message}
            </span>
          )}
          {testStatus.state === 'error' && (
            <span className="animate-fade-in" style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 500 }}>
              ❌ {testStatus.message}
            </span>
          )}
        </div>
      </div>

      {/* ── Professional Niche ── */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h4 style={{ color: 'var(--accent)' }}>🎯 Professional Niche</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          Select your primary niche. This customizes AI prompts, scoring relevance, hook templates, and topic classification.
        </p>

        {/* Niche Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
          {Object.entries(NICHE_CATEGORIES).map(([categoryName, category]) => (
            <div key={categoryName} style={{ background: 'var(--bg-tertiary)', padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: category.color, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{category.icon}</span> {categoryName}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {category.niches.map(niche => {
                  const isSelected = settings.niche === niche.name;
                  return (
                    <label
                      key={niche.name}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 600 : 400,
                        padding: '3px 6px', borderRadius: 6,
                        background: isSelected ? 'var(--accent-subtle)' : 'transparent',
                        transition: 'all 100ms ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="niche"
                        value={niche.name}
                        checked={isSelected}
                        onChange={e => setSettings({ ...settings, niche: e.target.value })}
                        style={{ accentColor: 'var(--accent)', display: 'none' }}
                      />
                      <span>{niche.icon}</span>
                      <span>{niche.name}</span>
                      {isSelected && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--accent)' }}>●</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Custom Niche */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Or type a custom niche</label>
          <input
            type="text"
            className="input"
            value={isKnownNiche(settings.niche) ? '' : settings.niche}
            onChange={e => setSettings({ ...settings, niche: e.target.value })}
            placeholder="e.g. SaaS Founders, Real Estate Agents, Indie Hackers..."
          />
        </div>
      </div>

      {/* ── Save Button ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20 }}>
        <button className="btn btn-primary" onClick={handleSave} style={{ minWidth: 140, fontSize: '0.9rem' }}>
          {saveStatus === 'saved' ? '✅ Saved!' : '💾 Save Settings'}
        </button>
        {saveStatus === 'saved' && (
          <span className="animate-fade-in" style={{ fontSize: '0.85rem', color: 'var(--success)' }}>
            Settings saved to browser storage.
          </span>
        )}
      </div>
    </div>
  );
}
