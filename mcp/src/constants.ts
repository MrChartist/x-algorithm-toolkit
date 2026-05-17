// X Algorithm MCP — Constants
// Extracted from: home-mixer/scorers/weighted_scorer.rs

export const ENGAGEMENT_WEIGHTS = {
  favorite:        { weight: 1.0,   label: 'Like',             icon: '❤️',  type: 'positive' as const, source: 'weighted_scorer.rs',  desc: 'Baseline engagement signal.' },
  reply:           { weight: 27.0,  label: 'Reply',            icon: '💬',  type: 'positive' as const, source: 'weighted_scorer.rs',  desc: 'HIGHEST positive signal. Replies = real conversation — 27× a like.' },
  retweet:         { weight: 1.0,   label: 'Repost',           icon: '🔁',  type: 'positive' as const, source: 'weighted_scorer.rs',  desc: 'Repost amplifies reach.' },
  quote:           { weight: 1.0,   label: 'Quote',            icon: '💬',  type: 'positive' as const, source: 'weighted_scorer.rs',  desc: 'Quote tweets create derivative content.' },
  bookmark:        { weight: 10.0,  label: 'Bookmark',         icon: '🔖',  type: 'positive' as const, source: 'weighted_scorer.rs',  desc: 'Private save — 10× a like.' },
  share:           { weight: 1.0,   label: 'Share',            icon: '📤',  type: 'positive' as const, source: 'weighted_scorer.rs',  desc: 'External share via share menu.' },
  share_via_dm:    { weight: 1.0,   label: 'DM Share',         icon: '📩',  type: 'positive' as const, source: 'weighted_scorer.rs',  desc: 'Shared via Direct Message.' },
  share_copy_link: { weight: 1.0,   label: 'Copy Link',        icon: '🔗',  type: 'positive' as const, source: 'weighted_scorer.rs',  desc: 'User copied the link.' },
  click:           { weight: 1.0,   label: 'Click',            icon: '👆',  type: 'positive' as const, source: 'weighted_scorer.rs',  desc: 'Clicked to expand — curiosity signal.' },
  profile_click:   { weight: 1.0,   label: 'Profile Click',    icon: '👤',  type: 'positive' as const, source: 'weighted_scorer.rs',  desc: 'Clicked to author profile.' },
  photo_expand:    { weight: 1.0,   label: 'Photo Expand',     icon: '🖼️', type: 'positive' as const, source: 'weighted_scorer.rs',  desc: 'Expanded the attached photo.' },
  vqv:             { weight: 0.3,   label: 'Video Quality View',icon: '🎥', type: 'positive' as const, source: 'weighted_scorer.rs',  desc: 'Quality video view (50%+).' },
  follow_author:   { weight: 4.0,   label: 'Follow',           icon: '➕',  type: 'positive' as const, source: 'weighted_scorer.rs',  desc: 'Followed after seeing post — 4× a like.' },
  dwell_time:      { weight: 2.0,   label: 'Dwell Time',       icon: '⏱️', type: 'positive' as const, source: 'weighted_scorer.rs',  desc: 'Time spent reading — 2× a like.' },
  not_interested:  { weight: -74.0, label: 'Not Interested',   icon: '🚫',  type: 'negative' as const, source: 'weighted_scorer.rs',  desc: 'User chose "Not interested" — −74×.' },
  block_author:    { weight: -74.0, label: 'Block',            icon: '🔴',  type: 'negative' as const, source: 'weighted_scorer.rs',  desc: 'User blocked author — −74×.' },
  mute_author:     { weight: -74.0, label: 'Mute',             icon: '🔇',  type: 'negative' as const, source: 'weighted_scorer.rs',  desc: 'User muted author — −74×.' },
  report:          { weight: -369.0,label: 'Report',           icon: '⚠️', type: 'negative' as const, source: 'weighted_scorer.rs',  desc: 'Reported — NUCLEAR −369×.' },
  not_dwelled:     { weight: -11.0, label: 'Scrolled Past',    icon: '👋',  type: 'negative' as const, source: 'weighted_scorer.rs',  desc: 'Scrolled past without stopping — −11×.' },
} as const;

export const SCORING_RULES = {
  NO_LINKS:        { points: 15, label: 'No external links in main post' },
  HAS_MEDIA:       { points: 12, label: 'Image or video attached' },
  HAS_CTA:         { points: 12, label: 'Question or CTA at the end' },
  STRONG_HOOK:     { points: 12, label: 'Strong opening hook' },
  OPTIMAL_LENGTH:  { points: 10, label: 'Optimal length (100-250 chars)' },
  LOW_HASHTAGS:    { points: 8,  label: '0-1 hashtags only' },
  ON_TOPIC:        { points: 8,  label: 'On-topic for your niche' },
  DWELL_POTENTIAL: { points: 8,  label: 'Multi-line, readable format' },
  NO_MUTED_WORDS:  { points: 5,  label: 'No commonly muted keywords' },
  CADENCE_OK:      { points: 5,  label: 'Posting cadence is optimal' },
  HAS_VIDEO:       { points: 5,  label: 'Video content bonus' },
} as const;

export const PENALTIES = {
  LINK_IN_POST:      { points: -30, severity: 'critical' as const, label: 'External link in main post', fix: 'Remove the link and put it in your first reply instead' },
  TOO_MANY_HASHTAGS: { points: -15, severity: 'warning' as const, label: '3+ hashtags detected — spam filter risk', fix: 'Remove hashtags until 0-1 maximum' },
  WEAK_HOOK:         { points: -12, severity: 'warning' as const, label: 'Weak opening line — not_dwelled risk', fix: 'Start with a specific number, contrarian take, or question' },
  TOO_SHORT:         { points: -10, severity: 'warning' as const, label: 'Post too short (<50 chars)', fix: 'Add more context to increase read time' },
  MUTED_KEYWORD:     { points: -10, severity: 'critical' as const, label: 'Commonly muted keyword detected', fix: 'Rephrase to avoid muted terms' },
  NO_MEDIA:          { points: -8,  severity: 'suggestion' as const, label: 'No media — missing photo_expand signal', fix: 'Add an image or infographic' },
  NO_CTA:            { points: -8,  severity: 'suggestion' as const, label: 'No question/CTA — missing reply signal', fix: 'End with a question to drive replies' },
} as const;

export const MAX_TWEET_LENGTH = 280;
export const OPTIMAL_LENGTH_MIN = 100;
export const OPTIMAL_LENGTH_MAX = 250;
export const MAX_SAFE_HASHTAGS = 1;
export const SPAM_HASHTAG_THRESHOLD = 3;

export const MUTED_KEYWORDS = [
  'guaranteed returns', 'get rich quick', 'free money', 'investment advice',
  'financial advice', 'buy now', 'limited offer', 'act fast', 'double your',
  'make money online', 'passive income hack', 'secret method', 'dm me',
  'link in bio', 'follow for follow', 'f4f', 'l4l', 'sub4sub',
  'giveaway', 'free giveaway', 'crypto airdrop', 'pump and dump',
  'click the link', 'sign up now', 'join my', 'free trial',
];

export const CTA_PATTERNS = [
  /\?$/m, /what do you think/i, /thoughts\??/i, /agree\??/i,
  /reply below/i, /comment below/i, /let me know/i, /drop a/i,
  /which one/i, /what's your/i, /do you/i, /have you/i,
  /follow.*for/i, /repost/i, /bookmark/i, /save this/i,
];

export const LINK_PATTERNS = [
  /https?:\/\/[^\s]+/i,
  /www\.[^\s]+/i,
  /bit\.ly\/[^\s]+/i,
  /t\.co\/[^\s]+/i,
];

export const HASHTAG_PATTERN = /#[a-zA-Z0-9_]+/g;

export const FILTER_RULES = [
  { id: 'external_link', name: 'External Link Check', severity: 'critical', explanation: 'Links in main post get -30 penalty. Move to first reply.' },
  { id: 'hashtag_spam', name: 'Hashtag Spam Filter', severity: 'warning', explanation: '3+ hashtags trigger spam detection. Use 0-1 max.' },
  { id: 'muted_keywords', name: 'Muted Keywords Scanner', severity: 'critical', explanation: 'Commonly muted terms cause users to hit "Not Interested" (-74×).' },
  { id: 'too_short', name: 'Minimum Length', severity: 'warning', explanation: 'Posts under 50 chars get low dwell time — minimal algorithmic push.' },
  { id: 'too_long', name: 'Character Limit', severity: 'critical', explanation: 'Posts over 280 chars get truncated or rejected.' },
  { id: 'no_hook', name: 'Hook Strength', severity: 'warning', explanation: 'Weak first line triggers not_dwelled penalty (-11×).' },
  { id: 'no_cta', name: 'Call-to-Action', severity: 'suggestion', explanation: 'No question = no replies. Reply weight is 27× — the highest signal.' },
  { id: 'no_media', name: 'Media Attachment', severity: 'suggestion', explanation: 'Media drives photo_expand signals and increases dwell time.' },
  { id: 'single_line', name: 'Multi-line Format', severity: 'suggestion', explanation: 'Multi-line posts increase dwell time (2× weight).' },
  { id: 'all_caps', name: 'ALL CAPS Filter', severity: 'warning', explanation: 'All caps is treated as shouting — triggers mute/block signals.' },
  { id: 'excessive_emoji', name: 'Emoji Overuse', severity: 'suggestion', explanation: '5+ emojis reduces readability and professional perception.' },
  { id: 'engagement_bait', name: 'Engagement Bait', severity: 'critical', explanation: 'F4F, L4L, sub4sub patterns trigger aggressive spam filtering.' },
  { id: 'duplicate_content', name: 'Duplicate Check', severity: 'critical', explanation: 'Repeated posts get suppressed by the dedup filter.' },
  { id: 'sensitive_content', name: 'Sensitive Content', severity: 'critical', explanation: 'NSFW/adult flags restrict distribution.' },
  { id: 'url_shortener', name: 'URL Shortener', severity: 'warning', explanation: 'Shortened URLs are associated with spam and phishing.' },
  { id: 'repetitive_chars', name: 'Repetitive Characters', severity: 'warning', explanation: 'aaaaa or !!!!! patterns trigger low-quality filters.' },
  { id: 'mention_spam', name: 'Mention Spam', severity: 'warning', explanation: '4+ mentions looks like spam tagging.' },
  { id: 'low_quality', name: 'Quality Threshold', severity: 'critical', explanation: 'Minimum content threshold for algorithmic distribution.' },
] as const;
