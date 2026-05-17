import { useState } from 'react';

const CHECKS = [
  { id: 1, label: 'Strong hook — first line stops the scroll', source: 'not_dwelled signal', icon: '🪝' },
  { id: 2, label: 'No external links in main post', source: 'Link penalty (-90% reach)', icon: '🔗' },
  { id: 3, label: '0-1 hashtags maximum', source: 'Spam filter rules', icon: '🏷️' },
  { id: 4, label: 'Image or video attached', source: 'photo_expand / vqv signals', icon: '📎' },
  { id: 5, label: 'Question or CTA at the end', source: 'reply_score (highest weight)', icon: '❓' },
  { id: 6, label: '2+ hours since last post', source: 'author_diversity_scorer.rs', icon: '⏰' },
  { id: 7, label: 'On-topic for your niche', source: 'topic_ids_filter.rs', icon: '🎯' },
  { id: 8, label: 'No commonly muted keywords', source: 'muted_keyword_filter.rs', icon: '🚫' },
  { id: 9, label: 'Optimal length (100-250 chars)', source: 'dwell_time optimization', icon: '📏' },
  { id: 10, label: 'Within peak posting window', source: 'Engagement velocity data', icon: '📊' },
];

export function PrePostChecklist() {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const progress = Math.round((checked.size / CHECKS.length) * 100);
  const ready = progress >= 80;
  const progressColor = progress >= 80 ? 'var(--success)' : progress >= 50 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2>Pre-Post Checklist</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>Go/No-Go audit before hitting "Post". Based on the algorithm's scoring rules.</p>
      </div>

      {/* Progress Bar */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Post Readiness</span>
            <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: progressColor }}>{progress}%</span>
          </div>
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 100, height: 10, overflow: 'hidden' }}>
            <div style={{
              width: `${progress}%`, height: '100%', background: progressColor,
              borderRadius: 100, transition: 'all 0.4s ease',
            }} />
          </div>
        </div>
        <div className="badge" style={{
          background: ready ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: ready ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${ready ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          fontSize: '0.8rem', padding: '6px 14px',
        }}>
          {ready ? '✅ GO' : '🔴 NO-GO'}
        </div>
      </div>

      {/* Checklist Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CHECKS.map(check => (
          <div
            key={check.id}
            className={`check-item ${checked.has(check.id) ? 'checked' : ''}`}
            onClick={() => toggle(check.id)}
          >
            <div className="check-box">
              {checked.has(check.id) && <span style={{ fontSize: '0.75rem', color: 'white' }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                <span style={{ marginRight: 8 }}>{check.icon}</span>
                {check.label}
              </div>
              <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                Source: {check.source}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reset */}
      <button className="btn btn-secondary" onClick={() => setChecked(new Set())} style={{ alignSelf: 'flex-start' }}>
        Reset Checklist
      </button>
    </div>
  );
}
