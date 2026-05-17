import { useState } from 'react';
import { toast } from './Toast';
import { callAI } from '../engine/ai';
import { scorePost } from '../engine/scorer';
import { getSettings } from './Settings';
import { MAX_TWEET_LENGTH } from '../engine/constants';

interface ThreadTweet {
  id: string;
  index: number;
  text: string;
  score: number;
  grade: string;
  gradeColor: string;
  role: 'hook' | 'body' | 'cta';
}

let tweetIdCounter = 0;
const nextId = () => `t-${++tweetIdCounter}`;

function scoreTweet(text: string) {
  const r = scorePost(text, { hasMedia: false });
  return { score: r.totalScore, grade: r.grade, gradeColor: r.gradeColor };
}

export function ThreadBuilder({ onSendToScorer }: { onSendToScorer?: (text: string) => void }) {
  const [input, setInput] = useState('');
  const [thread, setThread] = useState<ThreadTweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleBuild = async () => {
    const settings = getSettings();
    if (!settings.apiKey) {
      setError('No AI connected. Go to Settings → AI Connection to add your API key.');
      return;
    }
    if (input.trim().length < 50) {
      setError('Please paste at least 50 characters of content to split into a thread.');
      return;
    }

    setLoading(true);
    setError('');
    setThread([]);

    const prompt = `Convert this content into a viral X thread of 5-10 tweets:

"""
${input.trim().slice(0, 3000)}
"""

THREAD STRUCTURE:
- Tweet 1 (HOOK): A scroll-stopping opening line that creates urgency to read the thread. Include 🧵 at the end.
- Tweets 2-N (BODY): Each tweet delivers one clear point. Use specific numbers, results, or examples. Each should stand alone as valuable.
- Final Tweet (CTA): End with a call-to-action asking for replies, reposts, or follows.

RULES:
- Each tweet MUST be under 270 characters (leave room for numbering)
- No links in any tweet
- No hashtags
- No markdown formatting
- Use multi-line format within tweets for dwell time
- Number each tweet at the start: "1/" "2/" etc.
- No labels like "HOOK:" or "CTA:" — just the tweet text

Return tweets separated by "---SPLIT---". Nothing else.`;

    try {
      const result = await callAI(prompt, settings);
      const parts = result.split('---SPLIT---').map(p => p.trim()).filter(p => p.length > 0);

      const threadTweets: ThreadTweet[] = parts.map((text, i) => {
        const scores = scoreTweet(text);
        let role: 'hook' | 'body' | 'cta' = 'body';
        if (i === 0) role = 'hook';
        if (i === parts.length - 1) role = 'cta';
        return { id: nextId(), index: i + 1, text, ...scores, role };
      });

      setThread(threadTweets);
    } catch (err: any) {
      setError(err.message || 'Failed to build thread. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast('success', 'Tweet copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyAll = () => {
    const fullThread = thread.map(t => t.text).join('\n\n');
    navigator.clipboard.writeText(fullThread);
    setCopiedAll(true);
    toast('success', 'Full thread copied!');
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Delete a single tweet
  const handleDelete = (id: string) => {
    setThread(prev => {
      const updated = prev.filter(t => t.id !== id);
      return reindex(updated);
    });
  };

  // Start editing
  const startEdit = (tweet: ThreadTweet) => {
    setEditingId(tweet.id);
    setEditText(tweet.text);
  };

  // Save edit
  const saveEdit = () => {
    if (!editingId) return;
    setThread(prev => prev.map(t => {
      if (t.id !== editingId) return t;
      const scores = scoreTweet(editText);
      return { ...t, text: editText, ...scores };
    }));
    setEditingId(null);
    setEditText('');
  };

  // Reindex after reorder/delete
  const reindex = (tweets: ThreadTweet[]): ThreadTweet[] => {
    return tweets.map((t, i) => ({
      ...t,
      index: i + 1,
      role: i === 0 ? 'hook' as const : i === tweets.length - 1 ? 'cta' as const : 'body' as const,
    }));
  };

  // Drag & drop reorder
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragEnd = () => setDraggedId(null);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    setThread(prev => {
      const items = [...prev];
      const dragIdx = items.findIndex(t => t.id === draggedId);
      const dropIdx = items.findIndex(t => t.id === targetId);
      const [dragged] = items.splice(dragIdx, 1);
      items.splice(dropIdx, 0, dragged);
      return reindex(items);
    });
    setDraggedId(null);
  };

  const avgScore = thread.length > 0 ? Math.round(thread.reduce((sum, t) => sum + t.score, 0) / thread.length) : 0;
  const totalChars = thread.reduce((sum, t) => sum + t.text.length, 0);
  const totalWords = thread.reduce((sum, t) => sum + t.text.split(/\s+/).filter(Boolean).length, 0);
  const roleLabels = { hook: '🪝 Hook', body: '📝 Body', cta: '📣 CTA' };
  const roleBorders = { hook: 'rgba(255,107,53,0.4)', body: 'var(--border)', cta: 'rgba(34,197,94,0.4)' };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2>Thread Builder</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
          Paste long content → AI splits it into a scored, numbered thread. Drag to reorder, edit inline.
        </p>
      </div>

      <div className="card">
        <textarea
          className="textarea"
          placeholder="Paste your article, notes, ideas, or long-form content here..."
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ minHeight: 160 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {input.length} chars • {input.split(/\s+/).filter(Boolean).length} words
          </span>
          <button
            className="btn btn-primary"
            onClick={handleBuild}
            disabled={loading || input.trim().length < 50}
            style={{ opacity: (loading || input.trim().length < 50) ? 0.5 : 1 }}
          >
            {loading ? '⏳ Building Thread...' : '🧵 Build Thread'}
          </button>
        </div>
      </div>

      {/* Error with retry */}
      {error && (
        <div className="card animate-fade-in" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'var(--danger-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>❌ {error}</p>
            <button className="btn btn-secondary" onClick={handleBuild} style={{ fontSize: '0.8rem', padding: '6px 12px', flexShrink: 0 }}>
              🔄 Retry
            </button>
          </div>
        </div>
      )}

      {/* Skeleton Loaders */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ display: 'flex', gap: 14, animation: 'pulse 1.5s infinite', animationDelay: `${i * 150}ms`, opacity: 0.4 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-tertiary)', flexShrink: 0 }} />
              <div className="card" style={{ flex: 1, padding: 14 }}>
                <div style={{ height: 10, width: '30%', background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: 8 }} />
                <div style={{ height: 10, width: '80%', background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: 6 }} />
                <div style={{ height: 10, width: '55%', background: 'var(--bg-tertiary)', borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {thread.length > 0 && (
        <>
          {/* Thread Stats */}
          <div className="card card-glow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>{thread.length}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Tweets</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: avgScore >= 60 ? 'var(--success)' : 'var(--warning)' }}>{avgScore}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Avg Score</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{totalWords}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Words</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{totalChars}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Chars</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleCopyAll} style={{ fontSize: '0.85rem' }}>
              {copiedAll ? '✅ Copied All!' : '📋 Copy Entire Thread'}
            </button>
          </div>

          {/* Drag instruction */}
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            ↕️ Drag tweets to reorder • ✏️ Click edit to modify • 🗑️ Delete to remove
          </p>

          {/* Thread Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
            {/* Vertical line connector */}
            <div style={{
              position: 'absolute', left: 18, top: 20, bottom: 20, width: 2,
              background: 'var(--border)', zIndex: 0,
            }} />

            {thread.map((tweet) => {
              const overLimit = tweet.text.length > MAX_TWEET_LENGTH;
              const isDragging = draggedId === tweet.id;

              return (
                <div
                  key={tweet.id}
                  className="animate-slide-up"
                  draggable
                  onDragStart={() => handleDragStart(tweet.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(tweet.id)}
                  style={{
                    display: 'flex', gap: 16, position: 'relative', zIndex: 1,
                    opacity: isDragging ? 0.5 : 1,
                    cursor: 'grab',
                  }}
                >
                  {/* Thread dot */}
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-secondary)',
                    border: `2px solid ${tweet.role === 'hook' ? 'var(--accent)' : tweet.role === 'cta' ? 'var(--success)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
                  }}>
                    {tweet.index}
                  </div>

                  {/* Tweet Card */}
                  <div style={{
                    flex: 1, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${overLimit ? 'rgba(239,68,68,0.3)' : roleBorders[tweet.role]}`,
                    padding: '14px 16px', marginBottom: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>
                          {roleLabels[tweet.role]}
                        </span>
                        <span className="font-mono" style={{ fontSize: '0.65rem', color: overLimit ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                          {tweet.text.length}/{MAX_TWEET_LENGTH} {overLimit && '⚠️'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: tweet.gradeColor }}>{tweet.score}</span>
                        <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '2px 6px', borderRadius: 100, background: tweet.gradeColor + '20', color: tweet.gradeColor }}>{tweet.grade}</span>
                      </div>
                    </div>

                    {/* Editable content */}
                    {editingId === tweet.id ? (
                      <div>
                        <textarea
                          className="textarea"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          style={{ minHeight: 80, fontSize: '0.875rem' }}
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button className="btn btn-primary" onClick={saveEdit} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
                            💾 Save
                          </button>
                          <button className="btn btn-ghost" onClick={() => setEditingId(null)} style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                        {tweet.text}
                      </div>
                    )}

                    {/* Actions */}
                    {editingId !== tweet.id && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <button className="btn btn-ghost" onClick={() => handleCopy(tweet.text, tweet.id)} style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                          {copied === tweet.id ? '✅' : '📋'}
                        </button>
                        <button className="btn btn-ghost" onClick={() => startEdit(tweet)} style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                          ✏️ Edit
                        </button>
                        {onSendToScorer && (
                          <button className="btn btn-ghost" onClick={() => onSendToScorer(tweet.text)} style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                            🎯 Score
                          </button>
                        )}
                        <button className="btn btn-ghost" onClick={() => handleDelete(tweet.id)} style={{ fontSize: '0.72rem', padding: '3px 8px', marginLeft: 'auto', color: 'var(--danger)' }}>
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
