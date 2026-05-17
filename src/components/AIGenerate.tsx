import { useState } from 'react';
import { toast } from './Toast';
import { callAI } from '../engine/ai';
import { scorePost } from '../engine/scorer';
import { getSettings } from './Settings';
import { MAX_TWEET_LENGTH } from '../engine/constants';

const CONTENT_TYPES = [
  { id: 'hot_take', label: 'Hot Take', icon: '🔥', prompt: 'a bold, contrarian hot take that challenges conventional wisdom', tip: 'Drives replies through controversy' },
  { id: 'data_insight', label: 'Data Insight', icon: '📊', prompt: 'a tweet built around a specific data point, statistic, or number that surprises people', tip: 'Drives bookmarks — save-worthy' },
  { id: 'thread_starter', label: 'Thread Starter', icon: '🧵', prompt: 'a compelling thread hook tweet (1/N) that makes people want to click and read the thread', tip: 'Drives click-through + dwell' },
  { id: 'question', label: 'Question', icon: '❓', prompt: 'a thought-provoking question that drives maximum replies from the audience', tip: 'Reply signal (27× weight)' },
  { id: 'tip', label: 'Tactical Tip', icon: '💡', prompt: 'a specific, actionable tip that people will bookmark and save for later', tip: 'Bookmark signal (10× weight)' },
  { id: 'advice', label: 'Advice', icon: '🎯', prompt: 'a concise piece of hard-earned advice that sounds like it comes from years of experience', tip: 'Follow signal (4× weight)' },
  { id: 'contrarian', label: 'Contrarian', icon: '⚡', prompt: 'an "unpopular opinion" style tweet that goes against the crowd and sparks debate', tip: 'Reply + quote signal' },
];

interface GeneratedTweet {
  text: string;
  score: number;
  grade: string;
  gradeColor: string;
}

export function AIGenerate({ onSendToScorer }: { onSendToScorer?: (text: string) => void }) {
  const [contentType, setContentType] = useState(CONTENT_TYPES[0].id);
  const [topic, setTopic] = useState('');
  const [tweets, setTweets] = useState<GeneratedTweet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  const selectedType = CONTENT_TYPES.find(t => t.id === contentType)!;

  const handleGenerate = async () => {
    const settings = getSettings();
    if (!settings.apiKey) {
      setError('No AI connected. Go to Settings → AI Connection to add your API key.');
      return;
    }

    setLoading(true);
    setError('');
    setTweets([]);

    const topicContext = topic.trim() ? `The tweet should be about: "${topic.trim()}"` : 'Pick a trending or evergreen topic relevant to the niche.';

    const prompt = `Generate 3 unique tweets for the niche "${settings.niche || 'General'}".

CONTENT TYPE: ${selectedType.label} — write ${selectedType.prompt}.

${topicContext}

RULES:
- Each tweet must be under 280 characters
- No links
- No hashtags
- Strong hook on line 1 (prevent the -11× not_dwelled penalty)
- End with a question or CTA to drive replies (27× weight)
- Multi-line format preferred for dwell time
- No markdown formatting, no labels, no numbering
- Write in a natural, human voice

Return EXACTLY 3 tweets separated by "---SPLIT---". Nothing else.`;

    try {
      const result = await callAI(prompt, settings);
      const parts = result.split('---SPLIT---').map(p => p.trim()).filter(p => p.length > 0);

      const generated: GeneratedTweet[] = parts.slice(0, 3).map(text => {
        const r = scorePost(text, { hasMedia: false });
        return { text, score: r.totalScore, grade: r.grade, gradeColor: r.gradeColor };
      });

      setTweets(generated);
    } catch (err: any) {
      setError(err.message || 'Failed to generate. Check your API key.');
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

  const niche = getSettings().niche;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2>AI Generate</h2>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
            Pick a content type → get 3 algorithm-optimized tweets generated for your niche.
          </p>
        </div>
        {niche && (
          <span className="badge badge-accent" style={{ marginTop: 4 }}>
            🎯 {niche}
          </span>
        )}
      </div>

      {/* Content Type Picker */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Content Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {CONTENT_TYPES.map(type => {
            const isActive = contentType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setContentType(type.id)}
                title={type.tip}
                style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  background: isActive ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.82rem', fontWeight: isActive ? 700 : 500,
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 150ms ease',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{type.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div>{type.label}</div>
                  {isActive && <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>{type.tip}</div>}
                </div>
              </button>
            );
          })}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Topic <span style={{ color: 'var(--text-tertiary)' }}>(optional — leave blank for AI to pick)</span>
          </label>
          <input
            type="text"
            className="input"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. compound interest, React performance, cold email..."
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading}
          style={{ alignSelf: 'flex-start', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? '⏳ Generating...' : `✨ Generate ${selectedType.label}`}
        </button>
      </div>

      {/* Error with retry */}
      {error && (
        <div className="card animate-fade-in" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'var(--danger-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>❌ {error}</p>
            <button className="btn btn-secondary" onClick={handleGenerate} style={{ fontSize: '0.8rem', padding: '6px 12px', flexShrink: 0 }}>
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
                <div style={{ width: 24, height: 24, background: 'var(--bg-tertiary)', borderRadius: '50%' }} />
                <div style={{ height: 14, width: '25%', background: 'var(--bg-tertiary)', borderRadius: 8 }} />
              </div>
              <div style={{ height: 12, width: '85%', background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: 8 }} />
              <div style={{ height: 12, width: '60%', background: 'var(--bg-tertiary)', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      )}

      {/* Generated tweets */}
      {tweets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tweets.map((tweet, i) => {
            const overLimit = tweet.text.length > MAX_TWEET_LENGTH;
            return (
              <div key={i} className="card animate-slide-up" style={{ animationDelay: `${i * 100}ms`, border: `1px solid ${overLimit ? 'rgba(239,68,68,0.3)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                    {selectedType.icon} Option {i + 1}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: tweet.gradeColor }}>
                      {tweet.score}
                    </span>
                    <span className="badge" style={{ background: tweet.gradeColor + '20', color: tweet.gradeColor, border: `1px solid ${tweet.gradeColor}40`, fontSize: '0.65rem' }}>
                      {tweet.grade}
                    </span>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '14px 16px',
                  fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', border: `1px solid ${overLimit ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                }}>
                  {tweet.text}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
                  <span className="font-mono" style={{ fontSize: '0.7rem', color: overLimit ? 'var(--danger)' : 'var(--text-tertiary)' }}>
                    {tweet.text.length}/{MAX_TWEET_LENGTH} {overLimit && '⚠️ Over limit'}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => handleCopy(tweet.text, i)} style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
                      {copied === i ? '✅ Copied!' : '📋 Copy'}
                    </button>
                    {onSendToScorer && (
                      <button className="btn btn-ghost" onClick={() => onSendToScorer(tweet.text)} style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
                        🎯 Score
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Regenerate */}
          <div style={{ textAlign: 'center', paddingTop: 4 }}>
            <button className="btn btn-secondary" onClick={handleGenerate} disabled={loading} style={{ fontSize: '0.85rem' }}>
              🔄 Regenerate 3 More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
