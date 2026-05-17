// X Algorithm Toolkit — Constants v2
// Extracted from: home-mixer/scorers/weighted_scorer.rs
// Source: github.com/xai-org/grok-1

export const ENGAGEMENT_WEIGHTS = {
  favorite:        { weight: 1.0,   label: 'Like',             icon: '❤️',  type: 'positive' as const, source: 'weighted_scorer.rs',        desc: 'Baseline engagement signal. The foundation all other weights are measured against.' },
  reply:           { weight: 27.0,  label: 'Reply',            icon: '💬',  type: 'positive' as const, source: 'weighted_scorer.rs',        desc: 'The HIGHEST positive signal. Replies indicate real conversation — the algorithm values this 27× more than a like.' },
  retweet:         { weight: 1.0,   label: 'Repost',           icon: '🔁',  type: 'positive' as const, source: 'weighted_scorer.rs',        desc: 'Repost amplifies reach to the reposter\'s audience, signaling endorsement.' },
  quote:           { weight: 1.0,   label: 'Quote',            icon: '💬',  type: 'positive' as const, source: 'weighted_scorer.rs',        desc: 'Quote tweets create derivative content — valued equally to reposts.' },
  bookmark:        { weight: 10.0,  label: 'Bookmark',         icon: '🔖',  type: 'positive' as const, source: 'weighted_scorer.rs',        desc: 'Private save. The algorithm interprets this as high-value content worth revisiting — 10× a like.' },
  share:           { weight: 1.0,   label: 'Share',            icon: '📤',  type: 'positive' as const, source: 'weighted_scorer.rs',        desc: 'External share via share menu — signals content worth sending outside X.' },
  share_via_dm:    { weight: 1.0,   label: 'DM Share',         icon: '📩',  type: 'positive' as const, source: 'weighted_scorer.rs',        desc: 'Shared via Direct Message — personal recommendation signal.' },
  share_copy_link: { weight: 1.0,   label: 'Copy Link',        icon: '🔗',  type: 'positive' as const, source: 'weighted_scorer.rs',        desc: 'User copied the link — intent to share externally or save.' },
  click:           { weight: 1.0,   label: 'Click',            icon: '👆',  type: 'positive' as const, source: 'weighted_scorer.rs',        desc: 'Clicked on the tweet to expand — curiosity signal.' },
  profile_click:   { weight: 1.0,   label: 'Profile Click',    icon: '👤',  type: 'positive' as const, source: 'weighted_scorer.rs',        desc: 'Clicked through to the author\'s profile — strong interest signal for follow prediction.' },
  photo_expand:    { weight: 1.0,   label: 'Photo Expand',     icon: '🖼️', type: 'positive' as const, source: 'weighted_scorer.rs',        desc: 'User expanded the attached photo — media engagement signal.' },
  vqv:             { weight: 0.3,   label: 'Video Quality View',icon: '🎥', type: 'positive' as const, source: 'weighted_scorer.rs',        desc: 'Quality video view (watched 50%+). Lower weight because autoplay inflates counts.' },
  follow_author:   { weight: 4.0,   label: 'Follow',           icon: '➕',  type: 'positive' as const, source: 'weighted_scorer.rs',        desc: 'User followed the author after seeing this post — 4× a like. Strong content endorsement.' },
  dwell_time:      { weight: 2.0,   label: 'Dwell Time',       icon: '⏱️', type: 'positive' as const, source: 'weighted_scorer.rs',        desc: 'Time spent reading — 2× a like. Multi-line posts and threads naturally increase this.' },
  not_interested:  { weight: -74.0, label: 'Not Interested',   icon: '🚫',  type: 'negative' as const, source: 'weighted_scorer.rs',        desc: 'User chose "Not interested" — catastrophic −74× penalty. Signals irrelevance or annoyance.' },
  block_author:    { weight: -74.0, label: 'Block',            icon: '🔴',  type: 'negative' as const, source: 'weighted_scorer.rs',        desc: 'User blocked the author — −74× penalty applied to ALL future content from this author.' },
  mute_author:     { weight: -74.0, label: 'Mute',             icon: '🔇',  type: 'negative' as const, source: 'weighted_scorer.rs',        desc: 'User muted the author — −74× penalty. Silently suppresses all future content.' },
  report:          { weight: -369.0,label: 'Report',           icon: '⚠️', type: 'negative' as const, source: 'weighted_scorer.rs',        desc: 'User reported the tweet — NUCLEAR −369× penalty. Triggers safety review.' },
  not_dwelled:     { weight: -11.0, label: 'Scrolled Past',    icon: '👋',  type: 'negative' as const, source: 'weighted_scorer.rs',        desc: 'User scrolled past without stopping — −11× penalty. Weak hooks and boring first lines cause this.' },
} as const;

export const DIVERSITY_PARAMS = {
  decay_factor: 0.65,
  floor: 0.1,
};

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
  LINK_IN_POST:    { points: -30, severity: 'critical' as const, label: 'External link in main post — move to first reply', fix: 'Remove the link and put it in your first reply instead' },
  TOO_MANY_HASHTAGS: { points: -15, severity: 'warning' as const, label: '3+ hashtags detected — spam filter risk', fix: 'Remove hashtags until you have 0-1 maximum' },
  WEAK_HOOK:       { points: -12, severity: 'warning' as const, label: 'Weak/generic opening line — not_dwelled risk', fix: 'Start with a specific number, contrarian take, or question' },
  TOO_SHORT:       { points: -10, severity: 'warning' as const, label: 'Post too short (<50 chars) — low dwell time', fix: 'Add more context to increase read time' },
  MUTED_KEYWORD:   { points: -10, severity: 'critical' as const, label: 'Commonly muted keyword detected', fix: 'Rephrase to avoid muted terms' },
  NO_MEDIA:        { points: -8,  severity: 'suggestion' as const, label: 'No media — missing photo_expand signal', fix: 'Add an image or infographic to boost engagement' },
  NO_CTA:          { points: -8,  severity: 'suggestion' as const, label: 'No question/CTA — missing reply signal', fix: 'End with a question to drive replies (highest weight signal)' },
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

// ── Niche System ─────────────────────────────

export interface NicheInfo {
  name: string;
  icon: string;
  keywords: string[];
  topicMatch: string;
}

export interface NicheCategoryInfo {
  icon: string;
  color: string;
  niches: NicheInfo[];
}

export const NICHE_CATEGORIES: Record<string, NicheCategoryInfo> = {
  Finance: {
    icon: '💰',
    color: '#22C55E',
    niches: [
      { name: 'Stock Trading', icon: '📈', keywords: ['nifty', 'sensex', 'options', 'calls', 'puts', 'intraday', 'swing trade'], topicMatch: 'BUSINESS_FINANCE' },
      { name: 'Crypto', icon: '₿', keywords: ['bitcoin', 'ethereum', 'defi', 'web3', 'blockchain', 'token', 'wallet'], topicMatch: 'BUSINESS_FINANCE' },
      { name: 'Personal Finance', icon: '🏦', keywords: ['savings', 'budget', 'investment', 'mutual funds', 'SIP', 'retirement'], topicMatch: 'BUSINESS_FINANCE' },
      { name: 'Real Estate', icon: '🏠', keywords: ['property', 'rental', 'mortgage', 'housing', 'REIT', 'land'], topicMatch: 'BUSINESS_FINANCE' },
      { name: 'FinTech', icon: '💳', keywords: ['payments', 'UPI', 'neobank', 'lending', 'insurance', 'robo-advisor'], topicMatch: 'SCIENCE_TECHNOLOGY' },
    ],
  },
  Tech: {
    icon: '💻',
    color: '#3B82F6',
    niches: [
      { name: 'AI / Machine Learning', icon: '🤖', keywords: ['LLM', 'GPT', 'transformer', 'neural network', 'deep learning', 'fine-tuning'], topicMatch: 'SCIENCE_TECHNOLOGY' },
      { name: 'Software Dev', icon: '👨‍💻', keywords: ['javascript', 'python', 'react', 'API', 'frontend', 'backend', 'devops'], topicMatch: 'SCIENCE_TECHNOLOGY' },
      { name: 'Web3 / Blockchain', icon: '⛓️', keywords: ['smart contract', 'solidity', 'DAO', 'NFT', 'dApp', 'layer 2'], topicMatch: 'SCIENCE_TECHNOLOGY' },
      { name: 'SaaS', icon: '☁️', keywords: ['ARR', 'MRR', 'churn', 'PLG', 'onboarding', 'pricing'], topicMatch: 'SCIENCE_TECHNOLOGY' },
      { name: 'Cybersecurity', icon: '🔒', keywords: ['vulnerability', 'pentest', 'zero-day', 'firewall', 'encryption', 'breach'], topicMatch: 'SCIENCE_TECHNOLOGY' },
      { name: 'Data Science', icon: '📊', keywords: ['pandas', 'SQL', 'visualization', 'analytics', 'machine learning', 'statistics'], topicMatch: 'SCIENCE_TECHNOLOGY' },
    ],
  },
  Business: {
    icon: '🏢',
    color: '#F59E0B',
    niches: [
      { name: 'Startups', icon: '🚀', keywords: ['founder', 'seed', 'Series A', 'pitch deck', 'MVP', 'product-market fit'], topicMatch: 'BUSINESS_FINANCE' },
      { name: 'Marketing', icon: '📣', keywords: ['SEO', 'content marketing', 'brand', 'funnel', 'conversion', 'growth'], topicMatch: 'BUSINESS_FINANCE' },
      { name: 'Sales', icon: '🤝', keywords: ['pipeline', 'cold email', 'outreach', 'quota', 'CRM', 'close rate'], topicMatch: 'BUSINESS_FINANCE' },
      { name: 'E-commerce', icon: '🛒', keywords: ['Shopify', 'D2C', 'dropshipping', 'AOV', 'cart', 'fulfillment'], topicMatch: 'BUSINESS_FINANCE' },
      { name: 'Consulting', icon: '💼', keywords: ['strategy', 'advisory', 'client', 'retainer', 'deliverable', 'framework'], topicMatch: 'BUSINESS_FINANCE' },
    ],
  },
  Creative: {
    icon: '🎨',
    color: '#EC4899',
    niches: [
      { name: 'Writing', icon: '✍️', keywords: ['copywriting', 'storytelling', 'newsletter', 'editing', 'publishing', 'authorship'], topicMatch: 'ENTERTAINMENT' },
      { name: 'Design', icon: '🎨', keywords: ['UI/UX', 'Figma', 'brand identity', 'typography', 'layout', 'visual'], topicMatch: 'ENTERTAINMENT' },
      { name: 'Photography', icon: '📸', keywords: ['portrait', 'landscape', 'editing', 'Lightroom', 'composition', 'lens'], topicMatch: 'ENTERTAINMENT' },
      { name: 'Video / Film', icon: '🎬', keywords: ['editing', 'premiere', 'cinematography', 'YouTube', 'short-form', 'production'], topicMatch: 'ENTERTAINMENT' },
      { name: 'Music', icon: '🎵', keywords: ['production', 'beats', 'mixing', 'mastering', 'DAW', 'release'], topicMatch: 'ENTERTAINMENT' },
    ],
  },
  Education: {
    icon: '📚',
    color: '#8B5CF6',
    niches: [
      { name: 'EdTech', icon: '🎓', keywords: ['e-learning', 'LMS', 'gamification', 'assessment', 'curriculum', 'student'], topicMatch: 'EDUCATION' },
      { name: 'Online Courses', icon: '🖥️', keywords: ['cohort', 'launch', 'enrollment', 'curriculum', 'certification', 'community'], topicMatch: 'EDUCATION' },
      { name: 'Coaching', icon: '🏆', keywords: ['mindset', 'accountability', 'transformation', 'client', 'session', 'framework'], topicMatch: 'EDUCATION' },
      { name: 'Study Tips', icon: '📝', keywords: ['exam', 'revision', 'notes', 'flashcards', 'memory', 'focus'], topicMatch: 'EDUCATION' },
    ],
  },
  Lifestyle: {
    icon: '🌟',
    color: '#14B8A6',
    niches: [
      { name: 'Fitness', icon: '💪', keywords: ['workout', 'protein', 'gym', 'cardio', 'strength', 'recovery'], topicMatch: 'SPORTS' },
      { name: 'Health', icon: '🧬', keywords: ['nutrition', 'sleep', 'mental health', 'longevity', 'supplements', 'wellness'], topicMatch: 'SCIENCE_TECHNOLOGY' },
      { name: 'Travel', icon: '✈️', keywords: ['destination', 'itinerary', 'flight', 'hotel', 'backpacking', 'visa'], topicMatch: 'ENTERTAINMENT' },
      { name: 'Food', icon: '🍳', keywords: ['recipe', 'cooking', 'restaurant', 'meal prep', 'diet', 'cuisine'], topicMatch: 'ENTERTAINMENT' },
      { name: 'Parenting', icon: '👶', keywords: ['child', 'toddler', 'school', 'development', 'family', 'milestone'], topicMatch: 'ENTERTAINMENT' },
    ],
  },
  Other: {
    icon: '🌐',
    color: '#6B7280',
    niches: [
      { name: 'Politics', icon: '🏛️', keywords: ['policy', 'election', 'legislation', 'governance', 'democracy', 'reform'], topicMatch: 'NEWS' },
      { name: 'Sports', icon: '⚽', keywords: ['cricket', 'football', 'IPL', 'FIFA', 'training', 'league'], topicMatch: 'SPORTS' },
      { name: 'Gaming', icon: '🎮', keywords: ['esports', 'streaming', 'console', 'PC', 'multiplayer', 'indie'], topicMatch: 'ENTERTAINMENT' },
      { name: 'Entertainment', icon: '🎭', keywords: ['movies', 'series', 'review', 'streaming', 'celebrity', 'release'], topicMatch: 'ENTERTAINMENT' },
      { name: 'Science', icon: '🔬', keywords: ['research', 'space', 'physics', 'biology', 'climate', 'discovery'], topicMatch: 'SCIENCE_TECHNOLOGY' },
    ],
  },
} as const;

// Helper to get flat list of all niches
export function getAllNiches(): NicheInfo[] {
  return Object.values(NICHE_CATEGORIES).flatMap(cat => cat.niches);
}

export function isKnownNiche(name: string): boolean {
  return getAllNiches().some(n => n.name === name);
}

export type NicheCategory = keyof typeof NICHE_CATEGORIES;
