import { useState, useMemo } from 'react';
import { ENGAGEMENT_WEIGHTS } from '../engine/constants';

interface SignalEntry {
  key: string;
  label: string;
  weight: number;
  icon: string;
  type: 'positive' | 'negative';
  source: string;
  desc: string;
}

function getAllSignals(): SignalEntry[] {
  return Object.entries(ENGAGEMENT_WEIGHTS).map(([key, val]) => ({
    key,
    label: val.label,
    weight: val.weight,
    icon: val.icon,
    type: val.type,
    source: val.source,
    desc: val.desc,
  }));
}

/** Logarithmic scale to make low-weight bars visible next to the -369× outlier */
function logBarWidth(absWeight: number): number {
  if (absWeight <= 0) return 4;
  return Math.max(8, Math.round((Math.log10(absWeight + 1) / Math.log10(370)) * 100));
}

export function SignalsViz() {
  const [sortMode, setSortMode] = useState<'weight' | 'alphabetical' | 'type'>('weight');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [showNegative, setShowNegative] = useState(true);
  const [showPositive, setShowPositive] = useState(true);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const allSignals = useMemo(() => getAllSignals(), []);

  const signals = useMemo(() => {
    let list = [...allSignals];

    // Filter
    if (!showNegative) list = list.filter(s => s.type === 'positive');
    if (!showPositive) list = list.filter(s => s.type === 'negative');

    // Sort
    if (sortMode === 'weight') list.sort((a, b) => b.weight - a.weight);
    else if (sortMode === 'alphabetical') list.sort((a, b) => a.label.localeCompare(b.label));
    else if (sortMode === 'type') list.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'positive' ? -1 : 1;
      return Math.abs(b.weight) - Math.abs(a.weight);
    });

    return list;
  }, [sortMode, showNegative, showPositive, allSignals]);

  // Stats
  const positiveCount = allSignals.filter(s => s.type === 'positive').length;
  const negativeCount = allSignals.filter(s => s.type === 'negative').length;
  const topSignal = allSignals.reduce((a, b) => a.weight > b.weight ? a : b);
  const worstSignal = allSignals.reduce((a, b) => a.weight < b.weight ? a : b);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2>Algorithm Signals</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
          All 19 engagement weights from <span className="font-mono text-accent">weighted_scorer.rs</span> — the actual numbers X uses to rank your content.
          Each weight is <strong>relative to 1 Like</strong> (1×).
        </p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>19</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Total Signals</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>{positiveCount}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Boost Signals</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>{negativeCount}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Penalty Signals</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)' }}>{topSignal.icon} {topSignal.label}</div>
          <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>+{topSignal.weight}×</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>= 27 Likes</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger)' }}>{worstSignal.icon} {worstSignal.label}</div>
          <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--danger)' }}>{worstSignal.weight}×</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>= −369 Likes</div>
        </div>
      </div>

      {/* Controls */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Sort:</span>
          {(['weight', 'type', 'alphabetical'] as const).map(mode => (
            <button
              key={mode}
              className={`btn ${sortMode === mode ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSortMode(mode)}
              style={{ fontSize: '0.75rem', padding: '4px 12px', textTransform: 'capitalize' }}
            >
              {mode === 'weight' ? '📊 Weight' : mode === 'type' ? '🔀 Type' : '🔤 A-Z'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', cursor: 'pointer', color: showPositive ? 'var(--success)' : 'var(--text-tertiary)' }}>
            <input type="checkbox" checked={showPositive} onChange={e => setShowPositive(e.target.checked)} style={{ accentColor: 'var(--success)' }} />
            Positive
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', cursor: 'pointer', color: showNegative ? 'var(--danger)' : 'var(--text-tertiary)' }}>
            <input type="checkbox" checked={showNegative} onChange={e => setShowNegative(e.target.checked)} style={{ accentColor: 'var(--danger)' }} />
            Negative
          </label>
        </div>
      </div>

      {/* Empty state */}
      {signals.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
          <p className="text-muted">No signals to show. Enable at least one filter above.</p>
        </div>
      )}

      {/* Bar Chart */}
      {signals.length > 0 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '20px 24px' }}>
          {signals.map((signal, idx) => {
            const isNeg = signal.type === 'negative';
            const barColor = isNeg ? 'var(--danger)' : 'var(--success)';
            const absWeight = Math.abs(signal.weight);
            const barWidth = logBarWidth(absWeight);
            const isExpanded = expandedKey === signal.key;
            const isHovered = hoveredKey === signal.key;

            return (
              <div key={signal.key} className="animate-slide-up" style={{ animationDelay: `${idx * 30}ms` }}>
                <div
                  onClick={() => setExpandedKey(isExpanded ? null : signal.key)}
                  onMouseEnter={() => setHoveredKey(signal.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer', position: 'relative',
                    background: isExpanded ? (isNeg ? 'var(--danger-bg)' : 'var(--success-bg)')
                      : isHovered ? 'var(--bg-tertiary)' : 'transparent',
                    transition: 'all 150ms ease',
                    border: `1px solid ${isExpanded ? (isNeg ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)') : 'transparent'}`,
                  }}
                >
                  {/* Icon */}
                  <span style={{ fontSize: '1.1rem', minWidth: 24, textAlign: 'center' }}>{signal.icon}</span>

                  {/* Label */}
                  <span style={{ minWidth: 120, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {signal.label}
                  </span>

                  {/* Bar */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      height: 22, borderRadius: 4, transition: 'width 0.5s ease',
                      width: `${barWidth}%`, minWidth: 8,
                      background: isNeg
                        ? 'linear-gradient(90deg, rgba(239,68,68,0.3), rgba(239,68,68,0.7))'
                        : 'linear-gradient(90deg, rgba(34,197,94,0.3), rgba(34,197,94,0.7))',
                      boxShadow: absWeight > 10 ? `0 0 8px ${isNeg ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}` : 'none',
                    }} />
                  </div>

                  {/* Weight */}
                  <span className="font-mono" style={{
                    fontSize: '0.9rem', fontWeight: 800, minWidth: 60, textAlign: 'right',
                    color: barColor,
                  }}>
                    {isNeg ? '' : '+'}{signal.weight}×
                  </span>

                  {/* Expand arrow */}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', transition: 'transform 200ms ease', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                    ▼
                  </span>

                  {/* Hover Tooltip */}
                  {isHovered && !isExpanded && (
                    <div style={{
                      position: 'absolute', bottom: '100%', left: 48, marginBottom: 6,
                      padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-md)', zIndex: 10, maxWidth: 340,
                      fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4,
                      pointerEvents: 'none', whiteSpace: 'normal',
                    }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{signal.label}</span>
                      <span className="font-mono" style={{ color: barColor, marginLeft: 6 }}>{signal.weight}×</span>
                      <br />
                      <span style={{ fontSize: '0.72rem' }}>{signal.desc.slice(0, 120)}{signal.desc.length > 120 ? '…' : ''}</span>
                      <br />
                      <span className="font-mono" style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>📁 {signal.source} · Click to expand</span>
                    </div>
                  )}
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="animate-fade-in" style={{
                    marginLeft: 48, marginTop: 4, marginBottom: 8, padding: '14px 18px',
                    background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                      {signal.desc}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
                        📁 {signal.source}
                      </span>
                      <span className="font-mono" style={{ fontSize: '0.72rem', color: barColor, fontWeight: 700 }}>
                        weight: {signal.weight}
                      </span>
                      <span className="badge" style={{ fontSize: '0.65rem', background: isNeg ? 'var(--danger-bg)' : 'var(--success-bg)', color: barColor, border: `1px solid ${isNeg ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                        {isNeg ? '⛔ PENALTY' : '🚀 BOOST'}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                        = {Math.abs(signal.weight)} Like{Math.abs(signal.weight) !== 1 ? 's' : ''} equivalent
                      </span>
                    </div>
                    {/* Strategy tip */}
                    <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, background: isNeg ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)', border: `1px solid ${isNeg ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)'}` }}>
                      <span style={{ fontSize: '0.72rem', color: isNeg ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                        {isNeg ? '⚠️ Avoid:' : '💡 Strategy:'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: 6 }}>
                        {signal.key === 'reply' && 'End every post with a question. "What do you think?" alone drives 27× engagement.'}
                        {signal.key === 'bookmark' && 'Write list posts and how-to guides. People bookmark content they want to reference later.'}
                        {signal.key === 'follow_author' && 'Consistently post in your niche. New follows come from niche authority, not viral one-offs.'}
                        {signal.key === 'dwell_time' && 'Use multi-line format, storytelling, and specific numbers to keep people reading longer.'}
                        {signal.key === 'favorite' && 'Likes are the baseline. Focus on higher-value signals like replies and bookmarks instead.'}
                        {signal.key === 'retweet' && 'Create quotable, shareable content. Hot takes and data points get the most reposts.'}
                        {signal.key === 'quote' && 'Share insights others can build on. Controversial takes drive quote engagement.'}
                        {signal.key === 'share' && 'Write content so good people share it outside X.'}
                        {signal.key === 'share_via_dm' && 'Personal, relatable content gets DM-shared. Think "I sent this to my friend."'}
                        {signal.key === 'share_copy_link' && 'Make content newsletter-worthy. People copy links to embed elsewhere.'}
                        {signal.key === 'click' && 'Use ellipsis or truncated thoughts to make people click "Show more."'}
                        {signal.key === 'profile_click' && 'Have a strong bio and pinned tweet. Profile clicks convert to follows.'}
                        {signal.key === 'photo_expand' && 'Use infographics, charts, or screenshots that require zooming in.'}
                        {signal.key === 'vqv' && 'Short, punchy videos (30-60s) with captions get the most quality views.'}
                        {signal.key === 'not_interested' && 'Stay on-niche. Random off-topic posts trigger this from your audience.'}
                        {signal.key === 'block_author' && 'Never harass, spam, or engage in pile-ons. Blocks destroy your reach permanently.'}
                        {signal.key === 'mute_author' && 'Avoid repetitive content and excessive posting. Mutes are silent but deadly.'}
                        {signal.key === 'report' && 'Never post anything that violates ToS. A single report is −369 Likes equivalent.'}
                        {signal.key === 'not_dwelled' && 'Your first line is everything. If it doesn\'t stop the scroll, you lose −11 Likes.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Key Insight */}
      <div className="card" style={{ background: 'var(--accent-subtle)', borderColor: 'rgba(255,107,53,0.2)' }}>
        <h4 style={{ color: 'var(--accent)', marginBottom: 8 }}>🧠 Key Insight</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Replies are 27× more valuable than likes.</strong> But a single "Not Interested" click is −74×, and a Report is −369×. 
          The algorithm rewards genuine conversation and punishes irrelevance brutally. 
          Write for replies, not likes — and never spam.
        </p>
      </div>

      {/* Comparison Scale */}
      <div className="card">
        <h4 style={{ marginBottom: 12 }}>⚖️ Signal Equivalence Table</h4>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 14 }}>
          Every weight is measured in "Likes equivalent" — how many likes it would take to match the impact of one signal.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
          {[
            { expr: '1 Reply', eq: '27 Likes', color: 'var(--success)' },
            { expr: '1 Bookmark', eq: '10 Likes', color: 'var(--success)' },
            { expr: '1 Follow', eq: '4 Likes', color: 'var(--success)' },
            { expr: '1 Dwell (read)', eq: '2 Likes', color: 'var(--success)' },
            { expr: '1 Scroll-past', eq: '−11 Likes', color: 'var(--danger)' },
            { expr: '1 Not Interested', eq: '−74 Likes', color: 'var(--danger)' },
            { expr: '1 Mute', eq: '−74 Likes', color: 'var(--danger)' },
            { expr: '1 Report', eq: '−369 Likes', color: 'var(--danger)' },
          ].map(row => (
            <div key={row.expr} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px', borderRadius: 6, background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{row.expr}</span>
              <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: row.color }}>{row.eq}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
