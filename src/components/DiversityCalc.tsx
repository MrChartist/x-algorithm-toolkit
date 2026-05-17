import { useState, useMemo } from 'react';
import { generateOptimalSchedule } from '../engine/scorer';

export function DiversityCalc() {
  const [postCount, setPostCount] = useState(3);
  const [firstHour, setFirstHour] = useState(9);

  const schedule = useMemo(() => generateOptimalSchedule(postCount, firstHour), [postCount, firstHour]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2>Diversity Penalty Calculator</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>Plan your posting cadence to avoid the exponential decay penalty from <span className="font-mono text-accent">author_diversity_scorer.rs</span></p>
      </div>

      <div className="card" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Posts per day</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="range" min={1} max={10} value={postCount}
              onChange={e => setPostCount(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
            />
            <span className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)', minWidth: 30 }}>{postCount}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>First post at</label>
          <select
            className="input" value={firstHour} onChange={e => setFirstHour(Number(e.target.value))}
            style={{ padding: '8px 12px' }}
          >
            {Array.from({ length: 18 }, (_, i) => i + 5).map(h => {
              const ampm = h >= 12 ? 'PM' : 'AM';
              const h12 = h > 12 ? h - 12 : h;
              return <option key={h} value={h}>{h12}:00 {ampm}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Schedule Timeline */}
      <div className="card">
        <h4 style={{ marginBottom: 16 }}>Optimal Schedule</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {schedule.map((slot, i) => {
            const pct = Math.round(slot.multiplier * 100);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: 70 }}>{slot.time}</span>
                <div style={{ flex: 1, background: 'var(--bg-tertiary)', borderRadius: 6, height: 28, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%', background: slot.color, borderRadius: 6,
                    transition: 'width 0.4s ease', opacity: 0.85,
                  }} />
                  <span style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    fontSize: '0.75rem', fontWeight: 600, color: 'white',
                  }}>
                    Post {i + 1}
                  </span>
                </div>
                <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: slot.color, minWidth: 45, textAlign: 'right' }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decay Formula */}
      <div className="card" style={{ background: 'var(--accent-subtle)', borderColor: 'rgba(255,107,53,0.2)' }}>
        <h4 style={{ color: 'var(--accent)', marginBottom: 8 }}>📐 The Formula</h4>
        <code className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          score_multiplier = (1.0 - 0.1) × 0.65<sup>position</sup> + 0.1
        </code>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>
          Source: <span className="font-mono text-accent">author_diversity_scorer.rs</span> — Each additional post in someone's feed gets exponentially less algorithmic push.
        </p>
      </div>

      {/* Recommendation */}
      <div className="card">
        <h4 style={{ marginBottom: 8 }}>💡 Recommendation</h4>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {postCount <= 3
            ? '✅ Great — 3 posts/day with 2+ hour spacing is the sweet spot.'
            : postCount <= 5
            ? '⚠️ Pushing it — posts 4-5 will get 25-40% score. Make them count.'
            : '🔴 Too many — posts 6+ are basically invisible. Cut to 3-5 max.'}
        </p>
      </div>
    </div>
  );
}
