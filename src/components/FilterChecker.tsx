import React, { useState, useMemo } from 'react';
import {
  MUTED_KEYWORDS,
  OPTIMAL_LENGTH_MIN, OPTIMAL_LENGTH_MAX, MAX_TWEET_LENGTH,
  MAX_SAFE_HASHTAGS, SPAM_HASHTAG_THRESHOLD,
} from '../engine/constants';
import { analyzeHookStrength, detectLinks, countHashtags, detectCTA, detectMutedKeywords } from '../engine/scorer';

// ── Filter Definitions ──────────────────────────

interface FilterDef {
  id: string;
  label: string;
  category: 'content' | 'engagement' | 'safety' | 'format';
  icon: string;
  source: string;
  check: (text: string, meta: TweetMeta) => FilterResult;
}

interface FilterResult {
  passed: boolean;
  detail: string;
  severity: 'pass' | 'warning' | 'fail';
}

interface TweetMeta {
  hasMedia: boolean;
  hasVideo: boolean;
}

const FILTERS: FilterDef[] = [
  // ── Content Quality ──
  {
    id: 'length_min', label: 'Minimum Length', category: 'content', icon: '📏', source: 'ranking_scorer.rs',
    check: (text) => {
      const len = text.length;
      if (len >= 50) return { passed: true, detail: `${len} chars — above 50-char minimum`, severity: 'pass' };
      return { passed: false, detail: `${len} chars — too short. Posts <50 chars get reduced dwell time.`, severity: 'fail' };
    },
  },
  {
    id: 'length_optimal', label: 'Optimal Length Range', category: 'content', icon: '📐', source: 'ranking_scorer.rs',
    check: (text) => {
      const len = text.length;
      if (len >= OPTIMAL_LENGTH_MIN && len <= OPTIMAL_LENGTH_MAX) return { passed: true, detail: `${len} chars — within optimal ${OPTIMAL_LENGTH_MIN}-${OPTIMAL_LENGTH_MAX} range`, severity: 'pass' };
      if (len > MAX_TWEET_LENGTH) return { passed: false, detail: `${len} chars — exceeds ${MAX_TWEET_LENGTH} limit`, severity: 'fail' };
      return { passed: false, detail: `${len} chars — outside optimal ${OPTIMAL_LENGTH_MIN}-${OPTIMAL_LENGTH_MAX} range`, severity: 'warning' };
    },
  },
  {
    id: 'hook_strength', label: 'Hook Strength', category: 'content', icon: '🪝', source: 'not_dwelled penalty (-11×)',
    check: (text) => {
      const { score, category } = analyzeHookStrength(text);
      if (score >= 6) return { passed: true, detail: `Score ${score}/10 — "${category}" hook. Will stop the scroll.`, severity: 'pass' };
      if (score >= 4) return { passed: true, detail: `Score ${score}/10 — "${category}" hook. Decent but could be stronger.`, severity: 'pass' };
      return { passed: false, detail: `Score ${score}/10 — Weak hook. High risk of -11× not_dwelled penalty.`, severity: 'fail' };
    },
  },
  {
    id: 'multi_line', label: 'Multi-Line Format', category: 'content', icon: '📝', source: 'dwell_time (2× weight)',
    check: (text) => {
      const lines = text.split('\n').filter(l => l.trim().length > 0).length;
      if (lines >= 3) return { passed: true, detail: `${lines} content lines — good for dwell time`, severity: 'pass' };
      return { passed: false, detail: `Only ${lines} line(s). Multi-line posts increase dwell time (2× signal).`, severity: 'warning' };
    },
  },

  // ── Engagement Signals ──
  {
    id: 'has_cta', label: 'Call-to-Action / Question', category: 'engagement', icon: '❓', source: 'reply (27× weight)',
    check: (text) => {
      const hasCTA = detectCTA(text);
      if (hasCTA) return { passed: true, detail: 'CTA or question detected — drives replies (27× signal)', severity: 'pass' };
      return { passed: false, detail: 'No CTA or question. End with a question to trigger reply signal.', severity: 'fail' };
    },
  },
  {
    id: 'has_media', label: 'Media Attached', category: 'engagement', icon: '🖼️', source: 'photo_expand (1× weight)',
    check: (_, meta) => {
      if (meta.hasMedia) return { passed: true, detail: 'Media attached — enables photo_expand signal', severity: 'pass' };
      return { passed: false, detail: 'No image/video. Attach media for the photo_expand signal.', severity: 'warning' };
    },
  },
  {
    id: 'has_video', label: 'Video Content', category: 'engagement', icon: '🎥', source: 'vqv (0.3× weight)',
    check: (_, meta) => {
      if (meta.hasVideo) return { passed: true, detail: 'Video attached — enables video quality view signal', severity: 'pass' };
      return { passed: false, detail: 'No video. Video content adds the vqv (0.3×) signal.', severity: 'warning' };
    },
  },

  // ── Safety Filters ──
  {
    id: 'no_links', label: 'No External Links', category: 'safety', icon: '🔗', source: 'link_filter.rs',
    check: (text) => {
      const links = detectLinks(text);
      if (links.length === 0) return { passed: true, detail: 'No links found — clean post', severity: 'pass' };
      return { passed: false, detail: `${links.length} link(s) detected: "${links[0]}". Move to first reply.`, severity: 'fail' };
    },
  },
  {
    id: 'hashtag_safe', label: 'Hashtag Limit (≤1)', category: 'safety', icon: '#️⃣', source: 'spam_filter.rs',
    check: (text) => {
      const count = countHashtags(text);
      if (count <= MAX_SAFE_HASHTAGS) return { passed: true, detail: `${count} hashtag(s) — within safe limit`, severity: 'pass' };
      if (count < SPAM_HASHTAG_THRESHOLD) return { passed: false, detail: `${count} hashtags — reduce to 0-1 for best results`, severity: 'warning' };
      return { passed: false, detail: `${count} hashtags — spam filter territory! Remove all hashtags.`, severity: 'fail' };
    },
  },
  {
    id: 'no_muted_words', label: 'No Muted Keywords', category: 'safety', icon: '🔇', source: 'mute_filter.rs',
    check: (text) => {
      const found = detectMutedKeywords(text);
      if (found.length === 0) return { passed: true, detail: 'No muted keywords found', severity: 'pass' };
      return { passed: false, detail: `Found: "${found.join('", "')}" — likely to be muted by users`, severity: 'fail' };
    },
  },
  {
    id: 'no_all_caps', label: 'No Excessive CAPS', category: 'safety', icon: '🔠', source: 'spam_filter.rs',
    check: (text) => {
      const words = text.split(/\s+/).filter(w => w.length > 2);
      const capsWords = words.filter(w => w === w.toUpperCase() && /[A-Z]/.test(w));
      const ratio = words.length > 0 ? capsWords.length / words.length : 0;
      if (ratio < 0.3) return { passed: true, detail: 'Capitalization is normal', severity: 'pass' };
      return { passed: false, detail: `${Math.round(ratio * 100)}% ALL-CAPS words — looks spammy`, severity: 'warning' };
    },
  },
  {
    id: 'no_excessive_emoji', label: 'Emoji Moderation', category: 'safety', icon: '😀', source: 'spam_filter.rs',
    check: (text) => {
      const emojiCount = (text.match(/[\u{1F600}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FA6F}]/gu) || []).length;
      if (emojiCount <= 5) return { passed: true, detail: `${emojiCount} emoji(s) — acceptable`, severity: 'pass' };
      return { passed: false, detail: `${emojiCount} emojis — excessive emoji use triggers spam detection`, severity: 'warning' };
    },
  },
  {
    id: 'no_spam_patterns', label: 'No Spam Patterns', category: 'safety', icon: '🚫', source: 'spam_filter.rs',
    check: (text) => {
      const spamPatterns = [
        { pattern: /\$\$\$|💰💰|🤑🤑/g, label: 'money emojis' },
        { pattern: /!!!+/g, label: 'excessive punctuation' },
        { pattern: /follow.*follow|like.*like|rt.*rt/gi, label: 'engagement bait' },
        { pattern: /100%\s*(guaranteed|results|profit)/gi, label: 'guarantee language' },
        { pattern: /\b(dm|DM)\s*(me|for)\b/gi, label: '"DM me" solicitation' },
      ];
      const found: string[] = [];
      for (const sp of spamPatterns) {
        if (sp.pattern.test(text)) found.push(sp.label);
      }
      if (found.length === 0) return { passed: true, detail: 'No spam patterns detected', severity: 'pass' };
      return { passed: false, detail: `Spam pattern(s): ${found.join(', ')}`, severity: 'fail' };
    },
  },

  // ── Format Checks ──
  {
    id: 'char_limit', label: 'Character Limit (280)', category: 'format', icon: '✂️', source: 'twitter.com',
    check: (text) => {
      const len = text.length;
      if (len <= MAX_TWEET_LENGTH) return { passed: true, detail: `${len}/${MAX_TWEET_LENGTH} — within limit`, severity: 'pass' };
      return { passed: false, detail: `${len}/${MAX_TWEET_LENGTH} — ${len - MAX_TWEET_LENGTH} chars over limit!`, severity: 'fail' };
    },
  },
  {
    id: 'no_thread_numbering', label: 'Clean Formatting', category: 'format', icon: '🧹', source: 'readability',
    check: (text) => {
      if (/^(1\/|1\)|tweet 1)/i.test(text.trim())) return { passed: false, detail: 'Starts with "1/" — if this is a thread, use Thread Builder', severity: 'warning' };
      return { passed: true, detail: 'No thread numbering in standalone tweet', severity: 'pass' };
    },
  },
  {
    id: 'no_broken_mentions', label: 'Valid @mentions', category: 'format', icon: '@', source: 'tweet parser',
    check: (text) => {
      const mentions = text.match(/@\w+/g) || [];
      if (mentions.length <= 3) return { passed: true, detail: `${mentions.length} @mention(s) — fine`, severity: 'pass' };
      return { passed: false, detail: `${mentions.length} @mentions — too many looks like spam or tag-baiting`, severity: 'warning' };
    },
  },
  {
    id: 'line_breaks', label: 'Readable Line Breaks', category: 'format', icon: '↩️', source: 'dwell_time heuristic',
    check: (text) => {
      const consecutiveBreaks = (text.match(/\n{3,}/g) || []).length;
      if (consecutiveBreaks === 0) return { passed: true, detail: 'Line breaks are clean', severity: 'pass' };
      return { passed: false, detail: `${consecutiveBreaks} excessive line break(s) — wastes space, looks unpolished`, severity: 'warning' };
    },
  },
  {
    id: 'no_repetition', label: 'No Word Repetition', category: 'format', icon: '🔄', source: 'spam_filter.rs',
    check: (text) => {
      const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const freq: Record<string, number> = {};
      for (const w of words) freq[w] = (freq[w] || 0) + 1;
      const repeated = Object.entries(freq).filter(([, c]) => c >= 4).map(([w]) => w);
      if (repeated.length === 0) return { passed: true, detail: 'No excessive word repetition detected', severity: 'pass' };
      return { passed: false, detail: `"${repeated.join('", "')}" repeated 4+ times — looks robotic`, severity: 'warning' };
    },
  },
];

const CATEGORY_META = {
  content: { label: 'Content Quality', icon: '📝', color: 'var(--accent)' },
  engagement: { label: 'Engagement Signals', icon: '📈', color: 'var(--success)' },
  safety: { label: 'Safety & Spam Filters', icon: '🛡️', color: 'var(--warning)' },
  format: { label: 'Format & Structure', icon: '🔧', color: 'var(--text-secondary)' },
};

export function FilterChecker({ onSendToScorer }: { onSendToScorer?: (text: string) => void } = {}) {
  const [text, setText] = useState('');
  const [hasMedia, setHasMedia] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);

  const meta: TweetMeta = { hasMedia, hasVideo };

  const results = useMemo(() => {
    if (!text.trim()) return [];
    return FILTERS.map(filter => ({
      ...filter,
      result: filter.check(text, meta),
    }));
  }, [text, hasMedia, hasVideo]);

  const passed = results.filter(r => r.result.passed).length;
  const total = results.length;
  const failed = total - passed;

  // Detect muted keywords for inline highlighting
  const mutedFound = useMemo(() => detectMutedKeywords(text), [text]);

  // Detect links and hashtags for inline highlighting
  const linksFound = useMemo(() => detectLinks(text), [text]);
  const hashtagCount = useMemo(() => countHashtags(text), [text]);
  const hasAnythingToHighlight = mutedFound.length > 0 || linksFound.length > 0 || hashtagCount > 0;

  // Build highlighted text
  const highlightedText = useMemo(() => {
    if (!text.trim() || !hasAnythingToHighlight) return null;

    const lower = text.toLowerCase();
    const spans: { start: number; end: number; keyword: string }[] = [];

    for (const kw of mutedFound) {
      let idx = 0;
      while (true) {
        const found = lower.indexOf(kw, idx);
        if (found === -1) break;
        spans.push({ start: found, end: found + kw.length, keyword: kw });
        idx = found + 1;
      }
    }

    // Also find spam patterns
    const spamRegexes = [
      /https?:\/\/[^\s]+/gi,
      /#{1}[a-zA-Z0-9_]+/g,
    ];
    for (const rx of spamRegexes) {
      let match;
      while ((match = rx.exec(text)) !== null) {
        spans.push({ start: match.index, end: match.index + match[0].length, keyword: match[0] });
      }
    }

    spans.sort((a, b) => a.start - b.start);

    // Build JSX
    const elements: (string | React.JSX.Element)[] = [];
    let cursor = 0;
    for (const span of spans) {
      if (span.start > cursor) {
        elements.push(text.slice(cursor, span.start));
      }
      if (span.start >= cursor) {
        elements.push(
          <mark key={span.start} style={{
            background: 'rgba(239,68,68,0.25)', color: 'var(--danger)', borderRadius: 3,
            padding: '1px 3px', fontWeight: 600, textDecoration: 'underline wavy var(--danger)',
          }} title={`Flagged: "${span.keyword}"`}>
            {text.slice(span.start, span.end)}
          </mark>
        );
        cursor = span.end;
      }
    }
    if (cursor < text.length) {
      elements.push(text.slice(cursor));
    }

    return elements;
  }, [text, mutedFound]);

  // Group results by category
  const grouped = useMemo(() => {
    const map: Record<string, typeof results> = {};
    for (const r of results) {
      if (!map[r.category]) map[r.category] = [];
      map[r.category].push(r);
    }
    return map;
  }, [results]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2>Filter Checker</h2>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: 4 }}>
          Paste your tweet → runs {FILTERS.length} filters checking content quality, engagement signals, spam detection, and formatting.
        </p>
      </div>

      {/* Input */}
      <div className="card">
        <textarea
          className="textarea"
          placeholder={`Paste your tweet to scan through ${FILTERS.length} filters...`}
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ minHeight: 110 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={hasMedia} onChange={e => setHasMedia(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
              📎 Image
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={hasVideo} onChange={e => setHasVideo(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
              🎬 Video
            </label>
            {text.trim() && (
              <button className="btn btn-ghost" onClick={() => setText('')} style={{ fontSize: '0.72rem', padding: '3px 10px' }}>
                ✕ Clear
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {text.trim() && onSendToScorer && (
              <button className="btn btn-secondary" onClick={() => onSendToScorer(text)} style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
                📊 Send to Scorer
              </button>
            )}
            <span className="font-mono" style={{ fontSize: '0.75rem', color: text.length > MAX_TWEET_LENGTH ? 'var(--danger)' : 'var(--text-tertiary)' }}>
              {text.length}/{MAX_TWEET_LENGTH}
            </span>
          </div>
        </div>
      </div>

      {/* Inline Highlighted Preview */}
      {highlightedText && (
        <div className="card animate-fade-in" style={{ borderColor: 'rgba(239,68,68,0.25)' }}>
          <h4 style={{ marginBottom: 10, color: 'var(--danger)', fontSize: '0.85rem' }}>🔍 Flagged Content Scanner</h4>
          <div style={{
            background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '14px 16px',
            fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', border: '1px solid var(--border)',
          }}>
            {highlightedText}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 8 }}>
            🔴 Highlighted words are muted keywords, links, or hashtags that may suppress your reach.
          </p>
        </div>
      )}

      {/* Score Bar */}
      {text.trim().length > 0 && (
        <>
          <div className="card card-glow" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', minWidth: 90 }}>
              <div className="font-mono" style={{
                fontSize: '2.5rem', fontWeight: 800, lineHeight: 1,
                color: failed === 0 ? 'var(--success)' : failed <= 3 ? 'var(--warning)' : 'var(--danger)',
              }}>
                {passed}/{total}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 4, textTransform: 'uppercase' }}>Filters Passed</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 3, height: 10, borderRadius: 100, overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                {results.map((r, i) => (
                  <div key={i} style={{
                    flex: 1, borderRadius: 100,
                    background: r.result.passed ? 'var(--success)' : r.result.severity === 'warning' ? 'var(--warning)' : 'var(--danger)',
                    opacity: 0.8,
                  }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>✅ {passed}</span>
              {failed > 0 && <span style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 600 }}>❌ {failed}</span>}
            </div>
          </div>

          {/* Grouped Filter Results */}
          {(['content', 'engagement', 'safety', 'format'] as const).map(cat => {
            const catResults = grouped[cat];
            if (!catResults || catResults.length === 0) return null;
            const catMeta = CATEGORY_META[cat];
            const catPassed = catResults.filter(r => r.result.passed).length;

            return (
              <div key={cat} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <h4 style={{ color: catMeta.color, fontSize: '0.9rem' }}>{catMeta.icon} {catMeta.label}</h4>
                  <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                    {catPassed}/{catResults.length} passed
                  </span>
                </div>

                {catResults.map((filter, idx) => {
                  const r = filter.result;
                  return (
                    <div key={filter.id} className="animate-slide-up" style={{
                      animationDelay: `${idx * 40}ms`,
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: r.passed ? 'rgba(34,197,94,0.06)' : r.severity === 'warning' ? 'rgba(234,179,8,0.06)' : 'rgba(239,68,68,0.06)',
                      border: `1px solid ${r.passed ? 'rgba(34,197,94,0.15)' : r.severity === 'warning' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)'}`,
                    }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>
                        {r.passed ? '✅' : r.severity === 'warning' ? '⚠️' : '❌'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{filter.icon} {filter.label}</span>
                          <span className="font-mono" style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
                            {filter.source}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: r.passed ? 'var(--text-tertiary)' : 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4 }}>
                          {r.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </>
      )}

      {/* Muted Keywords Reference */}
      <div className="card">
        <h4 style={{ marginBottom: 10 }}>🔇 Muted Keywords Database ({MUTED_KEYWORDS.length} tracked)</h4>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 12 }}>
          These keywords are commonly muted by users. If your tweet contains any, it will be hidden from those users' feeds — triggering the −74× mute penalty.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {MUTED_KEYWORDS.map(kw => {
            const isActive = mutedFound.includes(kw);
            return (
              <span key={kw} className="font-mono" style={{
                padding: '3px 10px', borderRadius: 100, fontSize: '0.7rem', fontWeight: 500,
                background: isActive ? 'rgba(239,68,68,0.2)' : 'var(--bg-tertiary)',
                color: isActive ? 'var(--danger)' : 'var(--text-tertiary)',
                border: `1px solid ${isActive ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                transition: 'all 200ms ease',
              }}>
                {kw}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
