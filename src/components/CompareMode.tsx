import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { scorePost } from '../engine/scorer';
import { toast } from './Toast';
import { MAX_TWEET_LENGTH } from '../engine/constants';

export function CompareMode() {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [hasMediaA, setHasMediaA] = useState(false);
  const [hasMediaB, setHasMediaB] = useState(false);

  const resultA = useMemo(() => scorePost(textA, { hasMedia: hasMediaA }), [textA, hasMediaA]);
  const resultB = useMemo(() => scorePost(textB, { hasMedia: hasMediaB }), [textB, hasMediaB]);

  const hasA = textA.trim().length > 0;
  const hasB = textB.trim().length > 0;
  const hasBoth = hasA && hasB;

  const winner = hasBoth
    ? resultA.totalScore > resultB.totalScore ? 'A' : resultB.totalScore > resultA.totalScore ? 'B' : 'TIE'
    : null;

  const diff = hasBoth ? Math.abs(resultA.totalScore - resultB.totalScore) : 0;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('success', 'Copied to clipboard!');
  };

  const renderColumn = (
    label: string, text: string, setText: (t: string) => void,
    hasMedia: boolean, setHasMedia: (v: boolean) => void,
    result: ReturnType<typeof scorePost>, isWinner: boolean,
  ) => (
    <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
        {isWinner && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="badge badge-success"
            style={{ fontSize: '0.65rem' }}>🏆 Winner</motion.span>
        )}
      </div>

      <textarea className="textarea" placeholder={`Paste ${label} tweet draft...`}
        value={text} onChange={e => setText(e.target.value)}
        style={{ minHeight: 100, fontSize: '0.9rem' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          <input type="checkbox" checked={hasMedia} onChange={e => setHasMedia(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
          📎 Media
        </label>
        <span className="font-mono" style={{ fontSize: '0.72rem', color: text.length > MAX_TWEET_LENGTH ? 'var(--danger)' : 'var(--text-tertiary)' }}>
          {text.length}/{MAX_TWEET_LENGTH}
        </span>
      </div>

      {text.trim().length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="card" style={{ borderColor: isWinner ? 'rgba(34,197,94,0.4)' : 'var(--border)', textAlign: 'center' }}>
          <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 800, color: result.gradeColor, lineHeight: 1 }}>
            {result.totalScore}
          </div>
          <div className="badge" style={{ marginTop: 8, background: result.gradeColor + '20', color: result.gradeColor, border: `1px solid ${result.gradeColor}40` }}>
            {result.grade}
          </div>

          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {result.checks.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
                <span>{c.passed ? '✅' : '❌'}</span>
                <span style={{ flex: 1, textAlign: 'left', color: c.passed ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{c.label}</span>
                <span className="font-mono" style={{ color: c.passed ? 'var(--success)' : 'var(--text-muted)', fontSize: '0.68rem' }}>
                  {c.passed ? `+${c.points}` : '0'}
                </span>
              </div>
            ))}
          </div>

          {result.penalties.length > 0 && (
            <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              {result.penalties.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--danger)' }}>
                  <span>🔴</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{p.label}</span>
                  <span className="font-mono">{p.points}</span>
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-ghost" onClick={() => handleCopy(text)}
            style={{ fontSize: '0.72rem', padding: '4px 10px', marginTop: 10 }}>📋 Copy</button>
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2>⚖️ Compare Tweets</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
          Score two versions side-by-side to find the algorithmically superior tweet.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {renderColumn('Version A', textA, setTextA, hasMediaA, setHasMediaA, resultA, winner === 'A')}

        {/* VS indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 40 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-tertiary)', border: '1px solid var(--border)', fontWeight: 800,
            fontSize: '0.7rem', color: 'var(--text-tertiary)',
          }}>VS</div>
        </div>

        {renderColumn('Version B', textB, setTextB, hasMediaB, setHasMediaB, resultB, winner === 'B')}
      </div>

      {/* Verdict */}
      {hasBoth && (
        <motion.div className="card card-glow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center' }}>
          {winner === 'TIE' ? (
            <>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🤝</div>
              <h4>It's a Tie!</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Both versions score <span className="font-mono text-accent">{resultA.totalScore}</span>. Try tweaking the hook or CTA.</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🏆</div>
              <h4>Version {winner} Wins by <span className="font-mono text-accent">+{diff}</span> points</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {diff >= 15 ? 'Clear winner — the difference is significant.' : diff >= 5 ? 'Moderate edge — small tweaks to the loser could close the gap.' : 'Very close — both versions are strong.'}
              </p>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
