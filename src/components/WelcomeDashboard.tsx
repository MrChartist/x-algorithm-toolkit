import { motion } from 'framer-motion';

interface WelcomeDashboardProps {
  onNavigate: (tab: string) => void;
  niche: string;
  hasApiKey: boolean;
}

const QUICK_ACTIONS = [
  { id: 'rewrite', icon: '✍️', label: 'AI Rewrite', desc: 'Paste a tweet → get 3 algorithm-optimized versions' },
  { id: 'generate', icon: '✨', label: 'AI Generate', desc: 'Pick a content type → get niche-tuned tweets' },
  { id: 'thread', icon: '🧵', label: 'Thread Builder', desc: 'Paste long content → get a scored thread' },
  { id: 'compare', icon: '⚖️', label: 'Compare', desc: 'Score 2 versions side by side' },
  { id: 'signals', icon: '📊', label: 'Signals', desc: 'See all 19 algorithm weights' },
  { id: 'filters', icon: '🛡️', label: 'Filters', desc: 'Check your tweet against 18 safety filters' },
];

const ALGO_TIPS = [
  { icon: '💬', tip: 'Replies are weighted 27× — end every post with a question' },
  { icon: '📌', tip: 'Bookmarks are 18× — share save-worthy data and frameworks' },
  { icon: '⏱️', tip: 'Dwell time is 2× — longer posts earn more time-on-tweet' },
  { icon: '🔗', tip: 'External links get -12 penalty — keep links in the reply' },
  { icon: '📎', tip: 'Image/video attached = +2 engagement multiplier bonus' },
  { icon: '🧵', tip: 'Threads > single tweets — each tweet stacks engagement signals' },
];

export function WelcomeDashboard({ onNavigate, niche, hasApiKey }: WelcomeDashboardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', padding: '32px 0 8px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 8 }}>⚡</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          X Algorithm Toolkit
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 8, maxWidth: 500, margin: '8px auto 0' }}>
          Score, optimize, and generate tweets using the actual weights from X's open-source algorithm.
          {niche && <span> Tuned for <span className="text-accent font-mono" style={{ fontWeight: 600 }}>{niche}</span>.</span>}
        </p>
      </motion.div>

      {/* Status bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="card" style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '14px 20px', flexWrap: 'wrap' }}>
        {[
          { icon: '📊', label: '19 Signals', desc: 'from weighted_scorer.rs' },
          { icon: '🛡️', label: '18 Filters', desc: 'spam & quality gates' },
          { icon: '🤖', label: hasApiKey ? 'AI Connected' : 'AI Available', desc: hasApiKey ? 'Ready for generation' : 'Connect in Settings' },
          { icon: '🎯', label: niche || 'All Niches', desc: niche ? 'Niche selected' : 'Pick in Settings' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontSize: '1.2rem' }}>{s.icon}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{s.desc}</div>
          </div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Quick Actions
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button key={action.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              className="card"
              onClick={() => onNavigate(action.id)}
              style={{
                cursor: 'pointer', textAlign: 'left', padding: '14px 16px',
                display: 'flex', alignItems: 'flex-start', gap: 12,
                border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px var(--accent-glow)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}>
              <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{action.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{action.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{action.desc}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Algorithm Tips */}
      <div>
        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Algorithm Intelligence
        </h4>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {ALGO_TIPS.map((tip, i) => (
            <motion.div key={i}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.04 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)',
                borderBottom: i < ALGO_TIPS.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{tip.icon}</span>
              <span>{tip.tip}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{
          textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', padding: '8px 0',
        }}>
        💡 Pro tip: Press <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>1-9</kbd> to switch tabs • <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>Ctrl+D</kbd> to toggle theme
      </motion.div>
    </div>
  );
}
