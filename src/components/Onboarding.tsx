import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type AIProvider, getProviderInfo, getDefaultModel } from '../engine/ai';
import { NICHE_CATEGORIES } from '../engine/constants';
import { saveSettings, getSettings } from './Settings';

const ONBOARDED_KEY = 'x-algo-onboarded';

export function useOnboarding() {
  const [show, setShow] = useState(() => !localStorage.getItem(ONBOARDED_KEY));
  const dismiss = () => { localStorage.setItem(ONBOARDED_KEY, '1'); setShow(false); };
  return { show, dismiss };
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [selectedNiche, setSelectedNiche] = useState('');
  const [provider, setProvider] = useState<AIProvider>('groq');
  const [apiKey, setApiKey] = useState('');

  const finish = () => {
    const s = getSettings();
    if (selectedNiche) s.niche = selectedNiche;
    if (apiKey) { s.provider = provider; s.apiKey = apiKey; s.model = getDefaultModel(provider); }
    saveSettings(s);
    localStorage.setItem(ONBOARDED_KEY, '1');
    onDone();
  };

  const steps = [
    // Step 0: Welcome
    <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>⚡</div>
      <h2 style={{ fontSize: '1.75rem', marginBottom: 8 }}>X Algorithm Toolkit</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>
        Score your tweets, optimize for engagement signals, and generate AI-powered content — all based on X's actual open-source algorithm.
      </p>
      <button className="btn btn-primary" onClick={() => setStep(1)} style={{ padding: '12px 32px', fontSize: '0.95rem' }}>
        Get Started →
      </button>
      <div style={{ marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={finish} style={{ fontSize: '0.78rem' }}>Skip setup</button>
      </div>
    </motion.div>,

    // Step 1: Niche
    <motion.div key="niche" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      style={{ padding: '24px 20px' }}>
      <h3 style={{ marginBottom: 4 }}>🎯 Choose Your Niche</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: 20 }}>
        This personalizes AI prompts and content suggestions to your topic area.
      </p>
      <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Object.entries(NICHE_CATEGORIES).map(([categoryName, cat]) => (
          <div key={categoryName}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
              {cat.icon} {categoryName}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {cat.niches.map((n: { name: string; icon: string }) => (
                <button key={n.name} onClick={() => setSelectedNiche(n.name)}
                  className={`btn ${selectedNiche === n.name ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '5px 12px' }}>{n.icon} {n.name}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
        <button className="btn btn-primary" onClick={() => setStep(2)}>
          {selectedNiche ? `Continue with "${selectedNiche}"` : 'Skip →'}
        </button>
      </div>
    </motion.div>,

    // Step 2: API Key
    <motion.div key="apikey" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      style={{ padding: '24px 20px' }}>
      <h3 style={{ marginBottom: 4 }}>🤖 Connect AI (Optional)</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: 20 }}>
        Add an API key to unlock AI Rewrite, Generate, and Thread Builder. You can do this later in Settings.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {(['openai', 'google', 'anthropic', 'groq'] as AIProvider[]).map(p => {
          const info = getProviderInfo(p);
          return (
            <button key={p} onClick={() => setProvider(p)}
              className={`btn ${provider === p ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '6px 12px', flex: 1 }}>
              {info.name}
            </button>
          );
        })}
      </div>
      <input className="input" type="password" placeholder={`${getProviderInfo(provider).name} API Key`}
        value={apiKey} onChange={e => setApiKey(e.target.value)}
        style={{ marginBottom: 8 }} />
      <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 20 }}>
        🔒 Keys are stored locally in your browser. Never sent to any server.
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
        <button className="btn btn-primary" onClick={finish} style={{ padding: '10px 28px' }}>
          {apiKey ? '🚀 Launch Toolkit' : 'Skip & Launch →'}
        </button>
      </div>
    </motion.div>,
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) finish(); }}
    >
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', maxWidth: 520, width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(255,107,53,0.08)',
          overflow: 'hidden',
        }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 20px 0' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 100,
              background: i <= step ? 'var(--accent)' : 'var(--bg-tertiary)',
              transition: 'background 300ms ease',
            }} />
          ))}
        </div>
        <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
