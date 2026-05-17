import { useState, useMemo } from 'react';
import { toast } from './Toast';
import { analyzeHookStrength } from '../engine/scorer';
import { callAI } from '../engine/ai';
import { getSettings } from './Settings';

const HOOK_ARCHETYPES: { category: string; icon: string; tip: string; examples: string[] }[] = [
  {
    category: 'Data Point',
    icon: '📊',
    tip: 'Lead with a specific number or statistic. Creates instant credibility.',
    examples: [
      'I analyzed 10,000 tweets. Here\'s what I found.',
      '93% of viral posts share this one pattern.',
      'I spent 200 hours reading X\'s source code.',
    ],
  },
  {
    category: 'Contrarian',
    icon: '🔥',
    tip: 'Challenge conventional wisdom. Forces people to reply (27× signal).',
    examples: [
      'Unpopular opinion: Likes don\'t matter.',
      'Everyone is wrong about the X algorithm.',
      'Most people get content strategy completely backwards.',
    ],
  },
  {
    category: 'Question',
    icon: '❓',
    tip: 'Open a curiosity gap. Great for dwell time as people pause to think.',
    examples: [
      'What if everything you know about reach is wrong?',
      'Why do some posts get 1M views while yours gets 12?',
      'Have you ever wondered how the "For You" feed works?',
    ],
  },
  {
    category: 'Urgency',
    icon: '🚨',
    tip: 'Creates FOMO and news-like urgency. Stops the scroll immediately.',
    examples: [
      '🚨 X just open-sourced their entire algorithm.',
      'BREAKING: The engagement weights have been leaked.',
      '🚨 This changes everything about how we post on X.',
    ],
  },
  {
    category: 'List',
    icon: '📝',
    tip: 'Promise structured value. People bookmark lists (10× signal).',
    examples: [
      '7 rules to beat the X algorithm in 2026.',
      '5 mistakes that are killing your reach right now.',
      '10 things I learned from reading 50,000 lines of code.',
    ],
  },
  {
    category: 'Story',
    icon: '📖',
    tip: 'Start a narrative arc. Maximizes dwell time (2× signal) as people read on.',
    examples: [
      'Last year I had 200 followers. This month I hit 100K.',
      'I deleted a tweet that was going viral. Here\'s why.',
      'A single thread changed my entire career trajectory.',
    ],
  },
];

export function HookAnalyzer() {
  const [hook, setHook] = useState('');
  const [aiHooks, setAiHooks] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  const analysis = useMemo(() => analyzeHookStrength(hook), [hook]);

  const scoreColor = analysis.score >= 7 ? 'var(--success)' : analysis.score >= 4 ? 'var(--warning)' : 'var(--danger)';
  const scoreLabel = analysis.score >= 8 ? '🔥 Excellent — this will absolutely stop the scroll'
    : analysis.score >= 6 ? '✅ Strong — good chance of stopping the scroll'
    : analysis.score >= 4 ? '⚠️ Decent — could be stronger, some risk of scroll-past'
    : analysis.score >= 2 ? '🟡 Weak — likely to trigger not_dwelled penalty (-11×)'
    : '🔴 Very weak — almost certain scroll-past. Rewrite immediately.';

  const handleAIRewrite = async () => {
    const settings = getSettings();
    if (!settings.apiKey) {
      setAiError('No AI connected. Go to Settings → AI Connection to add your API key.');
      return;
    }
    if (!hook.trim()) return;

    setAiLoading(true);
    setAiError('');
    setAiHooks([]);

    const prompt = `I have this tweet opening hook:

"${hook.trim()}"

Rewrite it into 5 stronger scroll-stopping alternatives. Each hook must:
- Be under 100 characters
- Prevent the -11× "not_dwelled" penalty by stopping the scroll
- Use a different hook archetype: data point, contrarian, question, urgency, story
- Be specific (use numbers, names, results)
- No markdown formatting, no quotation marks around the hook

Return EXACTLY 5 hooks, one per line. No numbering, no labels, no explanations.`;

    try {
      const result = await callAI(prompt, settings);
      const hooks = result.split('\n').map(l => l.trim()).filter(l => l.length > 10 && l.length < 200);
      setAiHooks(hooks.slice(0, 5));
    } catch (err: any) {
      setAiError(err.message || 'Failed to rewrite hooks.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    toast('success', 'Hook copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2>Hook Analyzer</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
          Test your opening line. If people scroll past, the <span className="font-mono text-danger">-11× not_dwelled</span> penalty kicks in.
        </p>
      </div>

      <div className="card">
        <input
          className="input"
          placeholder="Type your first line here..."
          value={hook}
          onChange={e => setHook(e.target.value)}
          style={{ fontSize: '1.05rem', fontWeight: 500 }}
        />
        <span className="font-mono" style={{ display: 'block', marginTop: 6, fontSize: '0.7rem', color: hook.length > 100 ? 'var(--warning)' : 'var(--text-tertiary)' }}>
          {hook.length} chars {hook.length > 100 && '— hooks over 100 chars may get truncated in feed'}
        </span>
      </div>

      {hook.trim().length > 0 && (
        <>
          {/* Score Display */}
          <div className="card card-glow" style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', minWidth: 100 }}>
              <div className="font-mono" style={{ fontSize: '3.5rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                {analysis.score}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 4, textTransform: 'uppercase' }}>/10</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="badge" style={{ background: scoreColor + '20', color: scoreColor, border: `1px solid ${scoreColor}40`, marginBottom: 8 }}>
                {analysis.category}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{scoreLabel}</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleAIRewrite}
              disabled={aiLoading}
              style={{ opacity: aiLoading ? 0.5 : 1 }}
            >
              {aiLoading ? '⏳ Rewriting...' : '🤖 AI Rewrite (5 alternatives)'}
            </button>
          </div>

          {/* AI Error with Retry */}
          {aiError && (
            <div className="card animate-fade-in" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'var(--danger-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>❌ {aiError}</p>
                <button className="btn btn-secondary" onClick={handleAIRewrite} style={{ fontSize: '0.8rem', padding: '6px 12px', flexShrink: 0 }}>
                  🔄 Retry
                </button>
              </div>
            </div>
          )}

          {/* AI Skeleton */}
          {aiLoading && (
            <div className="card" style={{ opacity: 0.5, animation: 'pulse 1.5s infinite' }}>
              <div style={{ height: 14, width: '40%', background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: 12 }} />
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ height: 36, width: '100%', background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: 6 }} />
              ))}
            </div>
          )}

          {/* AI Results */}
          {aiHooks.length > 0 && (
            <div className="card animate-fade-in">
              <h4 style={{ marginBottom: 12, color: 'var(--accent)' }}>🤖 AI-Generated Alternatives</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aiHooks.map((h, i) => {
                  const hookScore = analyzeHookStrength(h);
                  const hColor = hookScore.score >= 7 ? 'var(--success)' : hookScore.score >= 4 ? 'var(--warning)' : 'var(--danger)';
                  return (
                    <div key={i} className="animate-slide-up" style={{
                      animationDelay: `${i * 60}ms`,
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                      cursor: 'pointer', transition: 'all 150ms ease',
                    }}
                    onClick={() => setHook(h)}
                    >
                      <span className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: hColor, minWidth: 28 }}>{hookScore.score}</span>
                      <span style={{ flex: 1, fontSize: '0.875rem' }}>{h}</span>
                      <span className="badge" style={{ fontSize: '0.6rem', background: hColor + '15', color: hColor }}>{hookScore.category}</span>
                      <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); handleCopy(h, i); }} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                        {copied === i ? '✅' : '📋'}
                      </button>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 10 }}>Click any hook to load it into the analyzer above.</p>
            </div>
          )}
        </>
      )}

      {/* Hook Archetypes Reference */}
      <div className="card">
        <h4 style={{ marginBottom: 16 }}>Hook Archetypes — Click to Test</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {HOOK_ARCHETYPES.map(archetype => (
            <div key={archetype.category} style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '1rem' }}>{archetype.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{archetype.category}</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 10, lineHeight: 1.4 }}>{archetype.tip}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {archetype.examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setHook(ex)}
                    style={{
                      background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6,
                      padding: '6px 10px', color: 'var(--text-secondary)', fontSize: '0.78rem', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 150ms ease', fontFamily: 'var(--font-sans)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
