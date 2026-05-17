// X Algorithm Toolkit — Core Scoring Engine
// Implements the scoring logic from weighted_scorer.rs

import {
  LINK_PATTERNS, HASHTAG_PATTERN, CTA_PATTERNS, MUTED_KEYWORDS,
  OPTIMAL_LENGTH_MIN, OPTIMAL_LENGTH_MAX, MAX_SAFE_HASHTAGS,
  SPAM_HASHTAG_THRESHOLD, PENALTIES, SCORING_RULES,
} from './constants';

export interface ScoreResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  checks: CheckResult[];
  penalties: PenaltyResult[];
  suggestions: SuggestionResult[];
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  gradeColor: string;
}

export interface CheckResult {
  id: string;
  label: string;
  points: number;
  passed: boolean;
}

export interface PenaltyResult {
  id: string;
  label: string;
  points: number;
  severity: 'critical' | 'warning' | 'suggestion';
  fix: string;
}

export interface SuggestionResult {
  label: string;
  impact: string;
  fix: string;
  points: number;
}

// ── Detection Utilities ─────────────────────

export function detectLinks(text: string): string[] {
  const matches: string[] = [];
  for (const pattern of LINK_PATTERNS) {
    const found = text.match(pattern);
    if (found) matches.push(...found);
  }
  return matches;
}

export function countHashtags(text: string): number {
  const matches = text.match(HASHTAG_PATTERN);
  return matches ? matches.length : 0;
}

export function detectCTA(text: string): boolean {
  return CTA_PATTERNS.some(pattern => pattern.test(text));
}

export function detectMutedKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return MUTED_KEYWORDS.filter(keyword => lower.includes(keyword));
}

export function analyzeHookStrength(text: string): { score: number; category: string } {
  const firstLine = text.split('\n')[0].trim();
  let score = 0;
  let category = 'Generic';

  // Numbers/data → strong curiosity
  if (/\d+[%xk+,.]/.test(firstLine)) { score += 3; category = 'Data Point'; }
  // Contrarian hooks
  if (/unpopular opinion|everyone is wrong|nobody talks about|most people/i.test(firstLine)) { score += 3; category = 'Contrarian'; }
  // Breaking/urgent
  if (/🚨|breaking|just happened|just announced/i.test(firstLine)) { score += 2; category = 'Breaking'; }
  // Questions
  if (/\?/.test(firstLine)) { score += 2; category = category === 'Generic' ? 'Question' : category; }
  // List/thread
  if (/\d+\s*(things|ways|tips|rules|reasons|lessons|mistakes)/i.test(firstLine)) { score += 2; category = 'List'; }
  // Thread indicator
  if (/🧵|thread/i.test(firstLine)) { score += 1; }
  // Specificity bonus
  if (/\d/.test(firstLine)) { score += 1; }
  // Length check — too short is weak
  if (firstLine.length > 40) { score += 1; }
  // Caps for emphasis (but not all caps)
  if (/[A-Z]{3,}/.test(firstLine) && firstLine !== firstLine.toUpperCase()) { score += 1; }

  return { score: Math.min(score, 10), category };
}

function hasMultipleLines(text: string): boolean {
  return text.split('\n').filter(l => l.trim().length > 0).length >= 3;
}

// ── Core Scorer ─────────────────────────────

export function scorePost(text: string, options: { hasMedia?: boolean; hasVideo?: boolean; hoursAfterLastPost?: number } = {}): ScoreResult {
  const { hasMedia = false, hasVideo = false, hoursAfterLastPost = 3 } = options;

  const checks: CheckResult[] = [];
  const penalties: PenaltyResult[] = [];
  const suggestions: SuggestionResult[] = [];

  const links = detectLinks(text);
  const hashtagCount = countHashtags(text);
  const hasCTA = detectCTA(text);
  const mutedWords = detectMutedKeywords(text);
  const hookAnalysis = analyzeHookStrength(text);
  const charCount = text.length;

  // ── Positive Checks ──

  // 1. No links
  const noLinks = links.length === 0;
  checks.push({ id: 'NO_LINKS', label: SCORING_RULES.NO_LINKS.label, points: SCORING_RULES.NO_LINKS.points, passed: noLinks });

  // 2. Has media
  checks.push({ id: 'HAS_MEDIA', label: SCORING_RULES.HAS_MEDIA.label, points: SCORING_RULES.HAS_MEDIA.points, passed: hasMedia });

  // 3. Has CTA
  checks.push({ id: 'HAS_CTA', label: SCORING_RULES.HAS_CTA.label, points: SCORING_RULES.HAS_CTA.points, passed: hasCTA });

  // 4. Strong hook
  const strongHook = hookAnalysis.score >= 4;
  checks.push({ id: 'STRONG_HOOK', label: SCORING_RULES.STRONG_HOOK.label, points: SCORING_RULES.STRONG_HOOK.points, passed: strongHook });

  // 5. Optimal length
  const optimalLength = charCount >= OPTIMAL_LENGTH_MIN && charCount <= OPTIMAL_LENGTH_MAX;
  checks.push({ id: 'OPTIMAL_LENGTH', label: SCORING_RULES.OPTIMAL_LENGTH.label, points: SCORING_RULES.OPTIMAL_LENGTH.points, passed: optimalLength });

  // 6. Low hashtags
  const lowHashtags = hashtagCount <= MAX_SAFE_HASHTAGS;
  checks.push({ id: 'LOW_HASHTAGS', label: SCORING_RULES.LOW_HASHTAGS.label, points: SCORING_RULES.LOW_HASHTAGS.points, passed: lowHashtags });

  // 7. On-topic (always passes for now — future: user niche config)
  checks.push({ id: 'ON_TOPIC', label: SCORING_RULES.ON_TOPIC.label, points: SCORING_RULES.ON_TOPIC.points, passed: true });

  // 8. Dwell potential (multi-line)
  const dwellPotential = hasMultipleLines(text);
  checks.push({ id: 'DWELL_POTENTIAL', label: SCORING_RULES.DWELL_POTENTIAL.label, points: SCORING_RULES.DWELL_POTENTIAL.points, passed: dwellPotential });

  // 9. No muted words
  const noMutedWords = mutedWords.length === 0;
  checks.push({ id: 'NO_MUTED_WORDS', label: SCORING_RULES.NO_MUTED_WORDS.label, points: SCORING_RULES.NO_MUTED_WORDS.points, passed: noMutedWords });

  // 10. Cadence
  const cadenceOk = hoursAfterLastPost >= 2;
  checks.push({ id: 'CADENCE_OK', label: SCORING_RULES.CADENCE_OK.label, points: SCORING_RULES.CADENCE_OK.points, passed: cadenceOk });

  // 11. Video bonus
  if (hasVideo) {
    checks.push({ id: 'HAS_VIDEO', label: SCORING_RULES.HAS_VIDEO.label, points: SCORING_RULES.HAS_VIDEO.points, passed: true });
  }

  // ── Penalties ──

  if (!noLinks) {
    penalties.push({ id: 'LINK_IN_POST', ...PENALTIES.LINK_IN_POST });
  }

  if (hashtagCount >= SPAM_HASHTAG_THRESHOLD) {
    penalties.push({ id: 'TOO_MANY_HASHTAGS', ...PENALTIES.TOO_MANY_HASHTAGS });
  }

  if (!strongHook) {
    penalties.push({ id: 'WEAK_HOOK', ...PENALTIES.WEAK_HOOK });
  }

  if (charCount < 50 && charCount > 0) {
    penalties.push({ id: 'TOO_SHORT', ...PENALTIES.TOO_SHORT });
  }

  if (!noMutedWords) {
    penalties.push({ id: 'MUTED_KEYWORD', ...PENALTIES.MUTED_KEYWORD });
  }

  // ── Suggestions ──

  if (!hasMedia) {
    suggestions.push({ label: PENALTIES.NO_MEDIA.label, impact: '+8 pts', fix: PENALTIES.NO_MEDIA.fix, points: 8 });
  }

  if (!hasCTA) {
    suggestions.push({ label: PENALTIES.NO_CTA.label, impact: '+8 pts', fix: PENALTIES.NO_CTA.fix, points: 8 });
  }

  if (!noLinks) {
    suggestions.push({ label: 'Move link to first reply', impact: '+30 pts', fix: PENALTIES.LINK_IN_POST.fix, points: 30 });
  }

  if (!strongHook) {
    suggestions.push({ label: 'Strengthen your opening line', impact: '+12 pts', fix: PENALTIES.WEAK_HOOK.fix, points: 12 });
  }

  // ── Calculate Score ──

  const earnedPoints = checks.filter(c => c.passed).reduce((sum, c) => sum + c.points, 0);
  const penaltyPoints = penalties.reduce((sum, p) => sum + p.points, 0);
  const maxScore = 100;
  const totalScore = Math.max(0, Math.min(100, earnedPoints + penaltyPoints));
  const percentage = totalScore;

  // Grade
  let grade: ScoreResult['grade'];
  let gradeColor: string;
  if (percentage >= 90) { grade = 'S'; gradeColor = '#22C55E'; }
  else if (percentage >= 75) { grade = 'A'; gradeColor = '#22C55E'; }
  else if (percentage >= 60) { grade = 'B'; gradeColor = '#EAB308'; }
  else if (percentage >= 45) { grade = 'C'; gradeColor = '#EAB308'; }
  else if (percentage >= 30) { grade = 'D'; gradeColor = '#EF4444'; }
  else { grade = 'F'; gradeColor = '#EF4444'; }

  return { totalScore, maxScore, percentage, checks, penalties, suggestions, grade, gradeColor };
}

// ── Diversity Penalty Calculator ────────────

export function calculateDiversityMultiplier(position: number, decayFactor = 0.65, floor = 0.1): number {
  if (position <= 0) return 1.0;
  return (1.0 - floor) * Math.pow(decayFactor, position) + floor;
}

export function generateOptimalSchedule(postCount: number, firstPostHour: number): { time: string; multiplier: number; color: string }[] {
  const schedule = [];
  const spacing = Math.max(2, Math.floor(14 / postCount)); // spread across ~14 waking hours

  for (let i = 0; i < postCount; i++) {
    const hour = firstPostHour + (i * spacing);
    const h = hour % 24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const time = `${h12}:00 ${ampm}`;

    const multiplier = calculateDiversityMultiplier(i);
    let color: string;
    if (multiplier >= 0.7) color = '#22C55E';
    else if (multiplier >= 0.4) color = '#EAB308';
    else color = '#EF4444';

    schedule.push({ time, multiplier, color });
  }

  return schedule;
}
