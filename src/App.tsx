import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';
import { PostScorer } from './components/PostScorer';
import { HookAnalyzer } from './components/HookAnalyzer';
import { DiversityCalc } from './components/DiversityCalc';
import { PrePostChecklist } from './components/PrePostChecklist';
import { AIRewrite } from './components/AIRewrite';
import { AIGenerate } from './components/AIGenerate';
import { ThreadBuilder } from './components/ThreadBuilder';
import { SignalsViz } from './components/SignalsViz';
import { FilterChecker } from './components/FilterChecker';
import { Settings, getSettings } from './components/Settings';
import { getProviderInfo } from './engine/ai';
import { ToastContainer } from './components/Toast';
import { Onboarding, useOnboarding } from './components/Onboarding';
import { DraftManager } from './components/DraftManager';
import { CompareMode } from './components/CompareMode';
import { ScoreHistory } from './components/ScoreHistory';
import { WelcomeDashboard } from './components/WelcomeDashboard';

/* ── Tab Groups ─────────────────────────────── */

const TAB_GROUPS = [
  {
    label: 'Core Tools',
    tabs: [
      { id: 'score', label: 'Score', icon: '🎯' },
      { id: 'hook', label: 'Hook', icon: '🪝' },
      { id: 'schedule', label: 'Schedule', icon: '⏰' },
      { id: 'checklist', label: 'Checklist', icon: '✅' },
    ],
  },
  {
    label: 'AI-Powered',
    tabs: [
      { id: 'rewrite', label: 'Rewrite', icon: '✍️' },
      { id: 'generate', label: 'Generate', icon: '✨' },
      { id: 'thread', label: 'Thread', icon: '🧵' },
    ],
  },
  {
    label: 'Advanced',
    tabs: [
      { id: 'drafts', label: 'Drafts', icon: '📝' },
      { id: 'compare', label: 'Compare', icon: '⚖️' },
      { id: 'history', label: 'History', icon: '📈' },
    ],
  },
  {
    label: 'Learn',
    tabs: [
      { id: 'signals', label: 'Signals', icon: '📊' },
      { id: 'filters', label: 'Filters', icon: '🛡️' },
    ],
  },
  {
    label: '',
    tabs: [
      { id: 'settings', label: 'Settings', icon: '⚙️' },
    ],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap(g => g.tabs);
const PRIMARY_TAB_IDS = ALL_TABS.slice(0, 8).map(t => t.id); // First 8 for mobile bottom nav

/* ── Page transition variants ───────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

/* ── Hooks ──────────────────────────────────── */

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('x-algo-theme') as 'dark' | 'light') || 'dark'
  );
  const setTheme = useCallback((t: 'dark' | 'light') => {
    setThemeState(t);
    localStorage.setItem('x-algo-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, []);
  return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}

/* ── App ────────────────────────────────────── */

export default function App() {
  const [activeTab, setActiveTab] = useState('score');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [providerName, setProviderName] = useState('');
  const [modelName, setModelName] = useState('');
  const [niche, setNiche] = useState('');
  const [scorerPreload, setScorerPreload] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const { theme, toggle: toggleTheme } = useTheme();
  const { show: showOnboarding, dismiss: dismissOnboarding } = useOnboarding();

  const refreshStatus = useCallback(() => {
    const s = getSettings();
    setHasApiKey(!!s.apiKey);
    const info = getProviderInfo(s.provider);
    setProviderName(info.name);
    setModelName(s.model);
    setNiche(s.niche);
  }, []);

  useEffect(() => {
    refreshStatus();
    window.addEventListener('storage', refreshStatus);
    window.addEventListener('settings-changed', refreshStatus);
    return () => {
      window.removeEventListener('storage', refreshStatus);
      window.removeEventListener('settings-changed', refreshStatus);
    };
  }, [refreshStatus]);

  useEffect(() => { refreshStatus(); }, [activeTab, refreshStatus]);

  const handleSendToScorer = useCallback((text: string) => {
    setScorerPreload(text);
    setActiveTab('score');
  }, []);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setMoreOpen(false);
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip when user is typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const tabShortcuts: Record<string, string> = {
        '1': 'score', '2': 'hook', '3': 'schedule', '4': 'checklist',
        '5': 'rewrite', '6': 'generate', '7': 'thread',
        '8': 'drafts', '9': 'compare', '0': 'history',
      };

      if (tabShortcuts[e.key]) {
        e.preventDefault();
        handleTabChange(tabShortcuts[e.key]);
      }

      // Ctrl+D = dark/light toggle
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleTheme]);  /* ── Render ─────────────────────────────── */

  const renderContent = () => {
    switch (activeTab) {
      case 'score':     return (
            <>
              {!scorerPreload && <WelcomeDashboard onNavigate={handleTabChange} niche={niche} hasApiKey={hasApiKey} />}
              <PostScorer preloadText={scorerPreload} onPreloadConsumed={() => setScorerPreload('')} />
            </>
          );
      case 'hook':      return <HookAnalyzer />;
      case 'schedule':  return <DiversityCalc />;
      case 'checklist': return <PrePostChecklist />;
      case 'rewrite':   return <AIRewrite onSendToScorer={handleSendToScorer} />;
      case 'generate':  return <AIGenerate onSendToScorer={handleSendToScorer} />;
      case 'thread':    return <ThreadBuilder onSendToScorer={handleSendToScorer} />;
      case 'drafts':    return <DraftManager onLoadDraft={handleSendToScorer} />;
      case 'compare':   return <CompareMode />;
      case 'history':   return <ScoreHistory />;
      case 'signals':   return <SignalsViz />;
      case 'filters':   return <FilterChecker onSendToScorer={handleSendToScorer} />;
      case 'settings':  return <Settings />;
      default:          return null;
    }
  };

  // Tabs for mobile "More" overflow (Learn + Settings)
  const overflowTabs = ALL_TABS.filter(t => !PRIMARY_TAB_IDS.includes(t.id));

  return (
    <div className="app-shell">
      {/* ── Onboarding ── */}
      <AnimatePresence>
        {showOnboarding && <Onboarding onDone={() => { dismissOnboarding(); refreshStatus(); }} />}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="app-header">
        <div className="container header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>X Algorithm Toolkit</h4>
              <p className="header-subtitle" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>by @Mr_Chartist • Open Source</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {niche && (
              <div className="niche-badge">🎯 {niche}</div>
            )}

            {/* Theme toggle */}
            <button className="btn btn-ghost theme-toggle" onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              style={{ fontSize: '1.1rem', padding: '4px 8px', borderRadius: 100 }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* AI status */}
            <div className="ai-status-pill" onClick={() => handleTabChange('settings')}
              title={hasApiKey ? `${providerName} • ${modelName}` : 'Click to connect an AI provider'}>
              <div className={`status-dot ${hasApiKey ? 'connected' : 'disconnected'}`} />
              <span style={{ color: hasApiKey ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {hasApiKey ? providerName : 'Connect AI'}
              </span>
            </div>

            <a href="https://github.com/Mr-Chartist/x-algo-toolkit" target="_blank" rel="noreferrer"
              className="btn btn-ghost star-btn" style={{ fontSize: '0.78rem', padding: '5px 10px' }}>
              ⭐ Star
            </a>
          </div>
        </div>
      </header>

      {/* ── Desktop Tab Bar ── */}
      {!isMobile && (
        <div className="container" style={{ paddingTop: 20 }}>
          <div className="tab-bar-wrapper">
            <div className="tab-bar">
            {TAB_GROUPS.map((group, gi) => (
              <div key={gi} className="tab-group">
                {gi > 0 && <div className="tab-divider" />}
                {group.label && <span className="tab-group-label">{group.label}</span>}
                {group.tabs.map(tab => (
                  <button key={tab.id}
                    className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => handleTabChange(tab.id)}>
                    <span className="tab-icon">{tab.icon}</span>
                    <span className="tab-label">{tab.label}</span>
                  </button>
                ))}
              </div>
            ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <main className="container page">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            variants={pageVariants}
            initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer className="app-footer">
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
            Built by <a href="https://x.com/Mr_Chartist" target="_blank" rel="noreferrer">@Mr_Chartist</a> • Powered by X's open-source algorithm • MIT License
          </p>
        </div>
      </footer>

      {/* ── Mobile Bottom Nav ── */}
      {isMobile && (
        <nav className="mobile-nav">
          {ALL_TABS.filter(t => PRIMARY_TAB_IDS.includes(t.id)).map(tab => (
            <button key={tab.id}
              className={`mobile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}>
              <span className="mobile-nav-icon">{tab.icon}</span>
            </button>
          ))}
          {/* More button */}
          <div style={{ position: 'relative' }}>
            <button className={`mobile-nav-item ${overflowTabs.some(t => t.id === activeTab) ? 'active' : ''}`}
              onClick={() => setMoreOpen(!moreOpen)}>
              <span className="mobile-nav-icon">⋯</span>
            </button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div className="more-menu"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}>
                  {overflowTabs.map(tab => (
                    <button key={tab.id} className={`more-menu-item ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => handleTabChange(tab.id)}>
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      )}

      {/* ── Toast container ── */}
      <ToastContainer />
    </div>
  );
}
