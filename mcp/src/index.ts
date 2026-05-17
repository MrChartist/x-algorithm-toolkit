#!/usr/bin/env node

/**
 * X Algorithm MCP Server
 * 
 * Exposes X's open-source algorithm scoring engine as MCP tools.
 * Any AI client (Claude Desktop, Cursor, Windsurf, Gemini) can call these
 * to score tweets, check filters, analyze hooks, and calculate schedules.
 * 
 * Source: weighted_scorer.rs from X's open-source recommendation algorithm
 * Author: @Mr_Chartist
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  scorePost,
  analyzeHookStrength,
  detectLinks,
  countHashtags,
  detectCTA,
  detectMutedKeywords,
  generateOptimalSchedule,
  calculateDiversityMultiplier,
} from "./engine.js";
import { ENGAGEMENT_WEIGHTS, FILTER_RULES } from "./constants.js";

// ── Server Setup ──────────────────────────────

const server = new McpServer({
  name: "x-algorithm",
  version: "1.0.0",
});

// ══════════════════════════════════════════════
// TOOL 1: score_tweet
// ══════════════════════════════════════════════

server.tool(
  "score_tweet",
  "Score a tweet draft (0-100) based on X's actual algorithm weights from weighted_scorer.rs. Returns grade, check results, penalties, and improvement suggestions.",
  {
    text: z.string().describe("The tweet text to score"),
    has_media: z.boolean().optional().describe("Whether the tweet has an image/video attached"),
    has_video: z.boolean().optional().describe("Whether the tweet has a video specifically"),
  },
  async ({ text, has_media, has_video }) => {
    const result = scorePost(text, {
      hasMedia: has_media ?? false,
      hasVideo: has_video ?? false,
    });

    const output = {
      score: result.totalScore,
      grade: result.grade,
      grade_color: result.gradeColor,
      checks: result.checks.map(c => ({
        id: c.id,
        label: c.label,
        points: c.points,
        passed: c.passed,
      })),
      penalties: result.penalties.map(p => ({
        id: p.id,
        label: p.label,
        points: p.points,
        severity: p.severity,
        fix: p.fix,
      })),
      suggestions: result.suggestions.map(s => ({
        label: s.label,
        fix: s.fix,
        potential_points: s.points,
      })),
    };

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(output, null, 2),
      }],
    };
  }
);

// ══════════════════════════════════════════════
// TOOL 2: check_filters
// ══════════════════════════════════════════════

server.tool(
  "check_filters",
  "Run a tweet through all 18 quality/safety filters from the X algorithm. Returns pass/fail for each filter with explanations.",
  {
    text: z.string().describe("The tweet text to check"),
  },
  async ({ text }) => {
    const links = detectLinks(text);
    const hashtagCount = countHashtags(text);
    const hasCTA = detectCTA(text);
    const mutedWords = detectMutedKeywords(text);
    const hookAnalysis = analyzeHookStrength(text);
    const charCount = text.length;
    const lineCount = text.split('\n').filter(l => l.trim().length > 0).length;

    const filters = FILTER_RULES.map(rule => {
      let passed = true;
      let detail = '';

      switch (rule.id) {
        case 'external_link': passed = links.length === 0; detail = links.length > 0 ? `Found: ${links.join(', ')}` : 'Clean'; break;
        case 'hashtag_spam': passed = hashtagCount <= 1; detail = `Found ${hashtagCount} hashtags`; break;
        case 'muted_keywords': passed = mutedWords.length === 0; detail = mutedWords.length > 0 ? `Flagged: ${mutedWords.join(', ')}` : 'Clean'; break;
        case 'too_short': passed = charCount >= 50 || charCount === 0; detail = `${charCount} chars`; break;
        case 'too_long': passed = charCount <= 280; detail = `${charCount}/280 chars`; break;
        case 'no_hook': passed = hookAnalysis.score >= 4; detail = `Hook score: ${hookAnalysis.score}/10 (${hookAnalysis.category})`; break;
        case 'no_cta': passed = hasCTA; detail = hasCTA ? 'CTA detected' : 'No question or call-to-action found'; break;
        case 'no_media': passed = false; detail = 'Cannot verify — pass media flag via score_tweet'; break;
        case 'single_line': passed = lineCount >= 3; detail = `${lineCount} lines`; break;
        case 'all_caps': passed = text !== text.toUpperCase() || charCount < 10; detail = text === text.toUpperCase() ? 'ALL CAPS detected' : 'Normal case'; break;
        case 'excessive_emoji': {
          const emojiCount = (text.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length;
          passed = emojiCount <= 5;
          detail = `${emojiCount} emojis`;
          break;
        }
        case 'engagement_bait': {
          const baitPatterns = /follow for follow|f4f|l4l|sub4sub|like and retweet/i;
          passed = !baitPatterns.test(text);
          detail = baitPatterns.test(text) ? 'Engagement bait detected' : 'Clean';
          break;
        }
        case 'duplicate_content': passed = true; detail = 'Cannot verify without history'; break;
        case 'sensitive_content': {
          const sensitive = /nsfw|18\+|adult|xxx/i;
          passed = !sensitive.test(text);
          detail = sensitive.test(text) ? 'Sensitive content flag' : 'Clean';
          break;
        }
        case 'url_shortener': {
          const shorteners = /bit\.ly|t\.co|goo\.gl|tinyurl|ow\.ly/i;
          passed = !shorteners.test(text);
          detail = shorteners.test(text) ? 'URL shortener detected' : 'Clean';
          break;
        }
        case 'repetitive_chars': {
          const repetitive = /(.)\1{4,}/;
          passed = !repetitive.test(text);
          detail = repetitive.test(text) ? 'Repetitive characters found' : 'Clean';
          break;
        }
        case 'mention_spam': {
          const mentions = (text.match(/@\w+/g) || []).length;
          passed = mentions <= 3;
          detail = `${mentions} mentions`;
          break;
        }
        case 'low_quality': passed = charCount >= 20 && lineCount >= 1; detail = `${charCount} chars, ${lineCount} lines`; break;
        default: passed = true; detail = 'N/A';
      }

      return {
        id: rule.id,
        name: rule.name,
        passed,
        detail,
        severity: rule.severity,
        explanation: rule.explanation,
      };
    });

    const passedCount = filters.filter(f => f.passed).length;
    const output = {
      total_filters: filters.length,
      passed: passedCount,
      failed: filters.length - passedCount,
      pass_rate: `${Math.round((passedCount / filters.length) * 100)}%`,
      filters,
    };

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(output, null, 2),
      }],
    };
  }
);

// ══════════════════════════════════════════════
// TOOL 3: analyze_hook
// ══════════════════════════════════════════════

server.tool(
  "analyze_hook",
  "Analyze the opening line (hook) of a tweet and score it. Returns hook score (0-10), category, and specific improvement advice.",
  {
    text: z.string().describe("The tweet text (first line will be analyzed as the hook)"),
  },
  async ({ text }) => {
    const analysis = analyzeHookStrength(text);
    const firstLine = text.split('\n')[0].trim();

    const suggestions: string[] = [];
    if (analysis.score < 3) suggestions.push('Add a specific number or data point to create curiosity');
    if (analysis.score < 5) suggestions.push('Start with a contrarian take like "Unpopular opinion:" or "Everyone is wrong about..."');
    if (!/\?/.test(firstLine)) suggestions.push('Consider opening with a compelling question');
    if (!/\d/.test(firstLine)) suggestions.push('Include a number — "I analyzed 500+ threads" is stronger than "I analyzed threads"');
    if (firstLine.length < 40) suggestions.push('Make the hook longer — short hooks get scrolled past (not_dwelled penalty)');

    const output = {
      first_line: firstLine,
      score: analysis.score,
      max_score: 10,
      category: analysis.category,
      rating: analysis.score >= 7 ? 'Excellent' : analysis.score >= 4 ? 'Good' : analysis.score >= 2 ? 'Weak' : 'Very Weak',
      risk: analysis.score < 4 ? 'HIGH — likely to trigger not_dwelled penalty (-11× weight)' : 'LOW',
      suggestions,
    };

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(output, null, 2),
      }],
    };
  }
);

// ══════════════════════════════════════════════
// TOOL 4: get_signals
// ══════════════════════════════════════════════

server.tool(
  "get_signals",
  "Get all 19 engagement signal weights from X's weighted_scorer.rs. Shows exactly how the algorithm values each type of engagement.",
  {},
  async () => {
    const signals = Object.entries(ENGAGEMENT_WEIGHTS).map(([key, val]) => ({
      signal: key,
      label: val.label,
      weight: val.weight,
      icon: val.icon,
      type: val.type,
      source: val.source,
      description: val.desc,
    }));

    const positive = signals.filter(s => s.type === 'positive').sort((a, b) => b.weight - a.weight);
    const negative = signals.filter(s => s.type === 'negative').sort((a, b) => a.weight - b.weight);

    const output = {
      total_signals: signals.length,
      positive_signals: positive,
      negative_signals: negative,
      key_insight: 'Reply (27×) is the highest positive weight. Report (-369×) is the most destructive. Optimize for replies and bookmarks (10×), avoid triggering not_dwelled (-11×) with weak hooks.',
    };

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(output, null, 2),
      }],
    };
  }
);

// ══════════════════════════════════════════════
// TOOL 5: get_optimal_schedule
// ══════════════════════════════════════════════

server.tool(
  "get_optimal_schedule",
  "Calculate optimal posting schedule based on the author_diversity_scorer.rs decay formula. Shows how each additional post gets penalized.",
  {
    posts_per_day: z.number().min(1).max(10).describe("Number of posts planned for the day"),
    first_post_hour: z.number().min(0).max(23).optional().describe("Hour of first post (24h format, default 9)"),
  },
  async ({ posts_per_day, first_post_hour }) => {
    const schedule = generateOptimalSchedule(posts_per_day, first_post_hour ?? 9);

    const output = {
      posts_per_day,
      schedule: schedule.map((slot, i) => ({
        post_number: i + 1,
        time: slot.time,
        score_multiplier: `${Math.round(slot.multiplier * 100)}%`,
        raw_multiplier: Number(slot.multiplier.toFixed(3)),
        status: slot.multiplier >= 0.7 ? 'FULL_REACH' : slot.multiplier >= 0.4 ? 'REDUCED' : 'SEVERELY_PENALIZED',
      })),
      formula: 'multiplier = (1.0 - 0.1) × 0.65^position + 0.1',
      source: 'author_diversity_scorer.rs',
      recommendation: posts_per_day <= 3
        ? '✅ Optimal — 3 posts/day with 2+ hour spacing is the sweet spot.'
        : posts_per_day <= 5
        ? '⚠️ Posts 4-5 get 25-40% reach. Make them count.'
        : '🔴 Too many — posts 6+ are basically invisible. Cut to 3-5 max.',
    };

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(output, null, 2),
      }],
    };
  }
);

// ══════════════════════════════════════════════
// TOOL 6: compare_tweets
// ══════════════════════════════════════════════

server.tool(
  "compare_tweets",
  "Score two tweet drafts side-by-side and determine the algorithmically superior version.",
  {
    tweet_a: z.string().describe("First tweet version"),
    tweet_b: z.string().describe("Second tweet version"),
    has_media_a: z.boolean().optional().describe("Whether tweet A has media"),
    has_media_b: z.boolean().optional().describe("Whether tweet B has media"),
  },
  async ({ tweet_a, tweet_b, has_media_a, has_media_b }) => {
    const resultA = scorePost(tweet_a, { hasMedia: has_media_a ?? false });
    const resultB = scorePost(tweet_b, { hasMedia: has_media_b ?? false });

    const diff = Math.abs(resultA.totalScore - resultB.totalScore);
    const winner = resultA.totalScore > resultB.totalScore ? 'A' : resultB.totalScore > resultA.totalScore ? 'B' : 'TIE';

    const output = {
      tweet_a: {
        text: tweet_a,
        score: resultA.totalScore,
        grade: resultA.grade,
        checks_passed: resultA.checks.filter(c => c.passed).length,
        penalties: resultA.penalties.length,
      },
      tweet_b: {
        text: tweet_b,
        score: resultB.totalScore,
        grade: resultB.grade,
        checks_passed: resultB.checks.filter(c => c.passed).length,
        penalties: resultB.penalties.length,
      },
      winner,
      score_difference: diff,
      verdict: winner === 'TIE'
        ? 'Both versions score equally. Try tweaking the hook or CTA.'
        : diff >= 15
        ? `Version ${winner} is clearly superior by +${diff} points.`
        : diff >= 5
        ? `Version ${winner} has a moderate edge (+${diff}). Small tweaks could close the gap.`
        : `Very close — both are strong. Version ${winner} edges by +${diff}.`,
    };

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(output, null, 2),
      }],
    };
  }
);

// ══════════════════════════════════════════════
// TOOL 7: detect_spam_patterns
// ══════════════════════════════════════════════

server.tool(
  "detect_spam_patterns",
  "Scan a tweet for muted keywords, spam patterns, and terms that commonly trigger the algorithm's negative signals.",
  {
    text: z.string().describe("The tweet text to scan"),
  },
  async ({ text }) => {
    const mutedWords = detectMutedKeywords(text);
    const links = detectLinks(text);
    const hashtagCount = countHashtags(text);

    const spamPatterns: { pattern: string; found: boolean; detail: string }[] = [
      { pattern: 'Muted keywords', found: mutedWords.length > 0, detail: mutedWords.length > 0 ? `Found: ${mutedWords.join(', ')}` : 'Clean' },
      { pattern: 'External links', found: links.length > 0, detail: links.length > 0 ? `Found ${links.length} link(s)` : 'Clean' },
      { pattern: 'Hashtag spam (3+)', found: hashtagCount >= 3, detail: `${hashtagCount} hashtags` },
      { pattern: 'Engagement bait', found: /follow for follow|f4f|l4l|sub4sub/i.test(text), detail: /follow for follow|f4f|l4l|sub4sub/i.test(text) ? 'Engagement bait detected' : 'Clean' },
      { pattern: 'ALL CAPS', found: text === text.toUpperCase() && text.length > 10, detail: text === text.toUpperCase() ? 'All caps detected' : 'Normal case' },
      { pattern: 'Excessive mentions (4+)', found: ((text.match(/@\w+/g) || []).length) >= 4, detail: `${(text.match(/@\w+/g) || []).length} mentions` },
      { pattern: 'URL shortener', found: /bit\.ly|goo\.gl|tinyurl|ow\.ly/i.test(text), detail: /bit\.ly|goo\.gl|tinyurl|ow\.ly/i.test(text) ? 'Shortener detected' : 'Clean' },
      { pattern: 'Repetitive characters', found: /(.)\1{4,}/.test(text), detail: /(.)\1{4,}/.test(text) ? 'Found repetition' : 'Clean' },
    ];

    const flagged = spamPatterns.filter(p => p.found);
    const output = {
      risk_level: flagged.length === 0 ? 'LOW' : flagged.length <= 2 ? 'MEDIUM' : 'HIGH',
      total_issues: flagged.length,
      patterns: spamPatterns,
      muted_keywords_found: mutedWords,
      recommendation: flagged.length === 0
        ? 'Tweet is clean — no spam signals detected.'
        : `${flagged.length} issue(s) found. Fix: ${flagged.map(f => f.pattern).join(', ')}.`,
    };

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(output, null, 2),
      }],
    };
  }
);

// ══════════════════════════════════════════════
// TOOL 8: diversity_penalty
// ══════════════════════════════════════════════

server.tool(
  "diversity_penalty",
  "Calculate the exact diversity penalty for a specific post position using the author_diversity_scorer.rs formula.",
  {
    position: z.number().min(0).max(20).describe("The position of the post (0 = first post, 1 = second, etc.)"),
  },
  async ({ position }) => {
    const multiplier = calculateDiversityMultiplier(position);

    const output = {
      position,
      multiplier: Number(multiplier.toFixed(4)),
      reach_percentage: `${Math.round(multiplier * 100)}%`,
      interpretation: multiplier >= 0.9
        ? 'Full algorithmic reach — this post will get normal distribution.'
        : multiplier >= 0.6
        ? 'Moderate penalty — still visible but with reduced reach.'
        : multiplier >= 0.3
        ? 'Significant penalty — most followers won\'t see this.'
        : 'Severe penalty — essentially invisible in most feeds.',
      formula: `(1.0 - 0.1) × 0.65^${position} + 0.1 = ${multiplier.toFixed(4)}`,
      source: 'author_diversity_scorer.rs',
    };

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(output, null, 2),
      }],
    };
  }
);

// ── Resources ─────────────────────────────────

server.resource(
  "algorithm-weights",
  "x-algorithm://weights",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify(ENGAGEMENT_WEIGHTS, null, 2),
      mimeType: "application/json",
    }],
  })
);

// ── Start ─────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("X Algorithm MCP Server running on stdio");
}

main().catch(console.error);
