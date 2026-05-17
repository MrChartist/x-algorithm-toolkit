import { useState, useMemo, useEffect, useRef } from 'react';
import { scorePost } from '../engine/scorer';
import { MAX_TWEET_LENGTH } from '../engine/constants';
import { addToHistory } from './ScoreHistory';
import { exportScorecard } from './ExportScorecard';
import { toast } from './Toast';

export function PostScorer({ preloadText, onPreloadConsumed }: { preloadText?: string; onPreloadConsumed?: () => void }) {
  const [text, setText] = useState('');
  const [hasMedia, setHasMedia] = useState(false);

  // Handle preloaded text from "Send to Scorer" flow
  useEffect(() => {
    if (preloadText && preloadText.trim()) {
      setText(preloadText);
      onPreloadConsumed?.();
    }
  }, [preloadText, onPreloadConsumed]);

  const result = useMemo(() => scorePost(text, { hasMedia }), [text, hasMedia]);
  const charCount = text.length;
  const charColor = charCount > MAX_TWEET_LENGTH ? 'var(--danger)' : charCount > 250 ? 'var(--warning)' : 'var(--text-tertiary)';

  // Auto-save to history when score stabilizes (debounced)
  const lastSaved = useRef('');
  useEffect(() => {
    if (!text.trim() || text.trim() === lastSaved.current) return;
    const timer = setTimeout(() => {
      lastSaved.current = text.trim();
      addToHistory(text, result.totalScore, result.grade, result.gradeColor);
    }, 1500);
    return () => clearTimeout(timer);
  }, [text, result]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2>Post Scorer</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>Type your tweet draft and get an instant algorithm score.</p>
      </div>

      {/* Input Area */}
      <div className="card">
        <textarea
          className="textarea"
          placeholder="Type or paste your tweet here..."
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ minHeight: 140, fontSize: '1rem' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={hasMedia} onChange={e => setHasMedia(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            📎 Has image/video attached
          </label>
          <span className="font-mono" style={{ fontSize: '0.8rem', color: charColor }}>
            {charCount}/{MAX_TWEET_LENGTH}
          </span>
        </div>
      </div>

      {text.trim().length > 0 && (
        <>
          {/* Score Display */}
          <div className="card card-glow" style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', minWidth: 120 }}>
              <div className="font-mono" style={{ fontSize: '4rem', fontWeight: 800, color: result.gradeColor, lineHeight: 1 }}>
                {result.totalScore}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Score / 100
              </div>
              <div className="badge" style={{ marginTop: 8, background: result.gradeColor + '20', color: result.gradeColor, border: `1px solid ${result.gradeColor}40` }}>
                Grade {result.grade}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                  onClick={() => {
                    navigator.clipboard.writeText(text);
                    toast('success', 'Copied!');
                  }}>📋 Copy</button>
                <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                  onClick={() => exportScorecard({
                    text, score: result.totalScore, grade: result.grade, gradeColor: result.gradeColor,
                    checks: result.checks.map(c => ({ label: c.label, passed: c.passed, points: c.points })),
                    penalties: result.penalties.map(p => ({ label: p.label, points: p.points })),
                  })}>📸 Export</button>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <h4 style={{ marginBottom: 12 }}>Checks Passed</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.checks.map(check => (
                  <div key={check.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.825rem' }}>
                    <span>{check.passed ? '✅' : '❌'}</span>
                    <span style={{ color: check.passed ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{check.label}</span>
                    <span className="font-mono" style={{ marginLeft: 'auto', color: check.passed ? 'var(--success)' : 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {check.passed ? `+${check.points}` : '0'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Penalties */}
          {result.penalties.length > 0 && (
            <div className="card">
              <h4 style={{ marginBottom: 12, color: 'var(--danger)' }}>🔴 Issues Found</h4>
              <div className="fix-list">
                {result.penalties.map(p => (
                  <div key={p.id} className={`fix-item ${p.severity}`}>
                    <span className="fix-icon">{p.severity === 'critical' ? '🚨' : '⚠️'}</span>
                    <div className="fix-text">
                      <div style={{ fontWeight: 600 }}>{p.label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{p.fix}</div>
                    </div>
                    <span className="fix-points font-mono" style={{ color: 'var(--danger)' }}>{p.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="card">
              <h4 style={{ marginBottom: 12, color: 'var(--accent)' }}>💡 Suggestions to Improve</h4>
              <div className="fix-list">
                {result.suggestions.map((s, i) => (
                  <div key={i} className="fix-item suggestion">
                    <span className="fix-icon">💡</span>
                    <div className="fix-text">
                      <div style={{ fontWeight: 600 }}>{s.label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{s.fix}</div>
                    </div>
                    <span className="fix-points font-mono" style={{ color: 'var(--accent)' }}>+{s.points}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
