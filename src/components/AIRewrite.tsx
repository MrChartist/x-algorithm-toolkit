import { useState, useMemo } from 'react';
import { toast } from './Toast';
import { callAI } from '../engine/ai';
import { scorePost } from '../engine/scorer';
import { getSettings } from './Settings';
import { MAX_TWEET_LENGTH } from '../engine/constants';

interface RewriteVersion {
  label: string;
  strategy: string;
  icon: string;
  text: string;
  score: number;
  grade: string;
  gradeColor: string;
}

export function AIRewrite({ onSendToScorer }: { onSendToScorer?: (text: string) => void }) {
  const [input, setInput] = useState('');
  const [versions, setVersions] = useState<RewriteVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  // Score the original draft for comparison
  const originalScore = useMemo(() => {
    if (!input.trim()) return null;
    return scorePost(input.trim(), { hasMedia: false });
  }, [input]);

  const handleRewrite = async () => {
    const settings = getSettings();
    if (!settings.apiKey) {
      setError('No AI connected. Go to Settings → AI Connection to add your API key.');
      return;
    }
    if (!input.trim()) return;

    setLoading(true);
    setError('');
    setVersions([]);

    const prompt = `I have this tweet draft:

"${input.trim()}"

Rewrite it in 3 different versions, each optimized for a different algorithmic signal:

VERSION A — REPLY MAXIMIZER
Optimize to drive maximum replies (27× weight). End with a provocative question or hot take that compels people to respond.

VERSION B — BOOKMARK MAGNET  
Optimize to drive bookmarks & shares (10× weight). Make it a save-worthy insight, tactical tip, or reference-quality information.

VERSION C — DWELL TIME OPTIMIZER
Optimize for maximum dwell time (2× weight). Use multi-line format, storytelling, and line breaks to keep people reading.

RULES:
- Each version must be under 280 characters
- No links in the text
- No hashtags
- Strong hook on line 1
- No markdown formatting
- No labels or prefixes like "Version A:" — just the tweet text

Return EXACTLY 3 versions separated by the delimiter "---SPLIT---". Nothing else.`;

    try {
      const result = await callAI(prompt, settings);
      const parts = result.split('---SPLIT---').map(p => p.trim()).filter(p => p.length > 0);

      const strategies = [
        { label: 'Reply Maximizer', strategy: 'Drives replies (27× weight)', icon: '💬' },
        { label: 'Bookmark Magnet', strategy: 'Drives bookmarks (10× weight)', icon: '🔖' },
        { label: 'Dwell Optimizer', strategy: 'Maximizes read time (2× weight)', icon: '⏱️' },
      ];

      const newVersions: RewriteVersion[] = parts.slice(0, 3).map((text, i) => {
        const result = scorePost(text, { hasMedia: false });
        return {
          ...strategies[i],
          text,
          score: result.totalScore,
          grade: result.grade,
          gradeColor: result.gradeColor,
        };
      });

      setVersions(newVersions);
    } catch (err: any) {
      setError(err.message || 'Failed to rewrite. Check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    toast('success', 'Copied to clipboard!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2>AI Rewrite</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
          Paste any tweet → get 3 algorithm-optimized versions targeting different engagement signals.
        </p>
      </div>

      {/* Input */}
      <div className="card">
        <textarea
          className="textarea"
          placeholder="Paste your tweet draft here..."
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ minHeight: 100 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="font-mono" style={{ fontSize: '0.75rem', color: input.length > MAX_TWEET_LENGTH ? 'var(--danger)' : 'var(--text-tertiary)' }}>
              {input.length}/{MAX_TWEET_LENGTH}
            </span>
            {originalScore && (
              <span className="font-mono" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 100, background: originalScore.gradeColor + '15', color: originalScore.gradeColor, fontWeight: 600 }}>
                Current: {originalScore.totalScore} ({originalScore.grade})
              </span>
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleRewrite}
            disabled={loading || !input.trim()}
            style={{ opacity: (loading || !input.trim()) ? 0.5 : 1 }}
          >
            {loading ? '⏳ Rewriting...' : '🤖 Rewrite with AI'}
          </button>
        </div>
      </div>

      {/* Error with retry */}
      {error && (
        <div className="card animate-fade-in" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'var(--danger-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>❌ {error}</p>
            <button className="btn btn-secondary" onClick={handleRewrite} style={{ fontSize: '0.8rem', padding: '6px 12px', flexShrink: 0 }}>
              🔄 Retry
            </button>
          </div>
        </div>
      )}

      {/* Skeleton Loaders */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{ opacity: 0.5, animation: 'pulse 1.5s infinite', animationDelay: `${i * 200}ms` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, background: 'var(--bg-tertiary)', borderRadius: '50%' }} />
                <div style={{ height: 14, width: '30%', background: 'var(--bg-tertiary)', borderRadius: 8 }} />
              </div>
              <div style={{ height: 12, width: '90%', background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ height: 12, width: '70%', background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ height: 12, width: '50%', background: 'var(--bg-tertiary)', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {versions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {versions.map((v, i) => {
            const delta = originalScore ? v.score - originalScore.totalScore : 0;
            const deltaColor = delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--danger)' : 'var(--text-tertiary)';
            const overLimit = v.text.length > MAX_TWEET_LENGTH;

            return (
              <div key={i} className="card animate-slide-up" style={{ animationDelay: `${i * 100}ms`, border: `1px solid ${overLimit ? 'rgba(239,68,68,0.3)' : 'var(--border)'}` }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.2rem' }}>{v.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{v.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{v.strategy}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {originalScore && delta !== 0 && (
                      <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: deltaColor }}>
                        {delta > 0 ? '+' : ''}{delta}
                      </span>
                    )}
                    <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: v.gradeColor }}>
                      {v.score}
                    </span>
                    <span className="badge" style={{ background: v.gradeColor + '20', color: v.gradeColor, border: `1px solid ${v.gradeColor}40`, fontSize: '0.65rem' }}>
                      {v.grade}
                    </span>
                  </div>
                </div>

                {/* Tweet body */}
                <div style={{
                  background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '14px 16px',
                  fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', border: `1px solid ${overLimit ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                }}>
                  {v.text}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                  <span className="font-mono" style={{ fontSize: '0.7rem', color: overLimit ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                    {v.text.length}/{MAX_TWEET_LENGTH} chars {overLimit && '⚠️ Over limit'}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => handleCopy(v.text, i)} style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
                      {copied === i ? '✅ Copied!' : '📋 Copy'}
                    </button>
                    <button className="btn btn-ghost" onClick={() => setInput(v.text)} style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
                      ✏️ Edit
                    </button>
                    {onSendToScorer && (
                      <button className="btn btn-ghost" onClick={() => onSendToScorer(v.text)} style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
                        🎯 Score
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
