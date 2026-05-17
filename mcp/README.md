# X Algorithm MCP Server

> Score, analyze, and optimize tweets using **X's actual algorithm weights** — extracted directly from the open-source `weighted_scorer.rs`, `ranking_scorer.rs`, and `recsys_model.py`.

[![npm](https://img.shields.io/npm/v/x-algorithm-mcp)](https://www.npmjs.com/package/x-algorithm-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What This Does

This MCP server gives any AI assistant (Claude, Gemini, etc.) the ability to:

- **Score tweets 0-100** with letter grades (S/A/B/C/D/F) based on algorithm compliance
- **Analyze hooks** — the first line determines if users scroll past (-11× penalty)
- **Check 18 safety filters** before you post
- **Calculate diversity penalties** — know exactly how posting frequency kills reach
- **Run full pre-publish audits** — comprehensive 5-in-1 reports
- **Compare tweets side-by-side** — pick the winner before posting

## 22 Engagement Signals

Every weight is from X's actual source code:

| Signal | Weight | Why It Matters |
|--------|--------|---------------|
| Reply | **27.0×** | #1 signal — end posts with questions |
| Bookmark | **10.0×** | Save-worthy = algorithm gold |
| Follow | **4.0×** | "I want more" — career signal |
| Dwell | **2.0×** | Reading time matters |
| Cont. Dwell | **1.5×** | Longer reads score higher |
| Report | **-369×** | Nuclear — content becomes invisible |
| Not Interested | **-74×** | Off-topic = algorithmic death |
| Scrolled Past | **-11×** | Weak hooks trigger this |

*+ 14 more signals (Like, Repost, Quote, Share, Click, etc.)*

## Quick Start

### Use with Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "x-algorithm": {
      "command": "npx",
      "args": ["-y", "x-algorithm-mcp"]
    }
  }
}
```

### Use with any MCP client

```bash
npx x-algorithm-mcp
```

### Install globally

```bash
npm install -g x-algorithm-mcp
x-algorithm-mcp
```

## 11 Tools Available

| Tool | Description |
|------|-------------|
| `score_tweet` | Score 0-100 with grade, checks, and penalties |
| `check_filters` | Run against 18 safety/quality filters |
| `analyze_hook` | Score opening line 0-10 with improvement advice |
| `get_signals` | All 22 engagement signal weights with descriptions |
| `get_optimal_schedule` | Diversity-decay-aware posting schedule |
| `compare_tweets` | Side-by-side scoring with winner declaration |
| `detect_spam_patterns` | Muted keywords + spam pattern detection |
| `diversity_penalty` | Exact position-based decay calculation |
| `classify_niche` | 7-niche classification with optimization tips |
| `get_thread_strategy` | 6 proven thread templates + structural rules |
| `full_audit` | Complete pre-publish audit (all tools combined) |

## 3 Resources

| URI | Content |
|-----|---------|
| `x-algorithm://weights` | All 22 engagement signal weights (JSON) |
| `x-algorithm://filters` | 18 filter definitions (JSON) |
| `x-algorithm://niches` | 7 niche classifications with strategies (JSON) |

## Source Code Attribution

Every weight and formula is verified against X's open-source algorithm:

| Source File | What's Extracted |
|------------|-----------------|
| `weighted_scorer.rs` | 19 base engagement signal weights |
| `ranking_scorer.rs` | 3 additional signals + OON weighting |
| `author_diversity_scorer.rs` | `(1-floor) × decay^pos + floor` formula |
| `oon_scorer.rs` | Out-of-network score multiplier |
| `topic_ids_filter.rs` | 77+ topic categories with hierarchy |
| `recsys_model.py` | Phoenix Grok-based transformer (256d, 4 heads) |

## Companion Skill

This MCP server has a companion AI Skill (`SKILL.md`) that provides 400+ lines of domain expertise for any AI assistant. Install it with:

```bash
# Copy to your skills directory
cp skill/SKILL.md ~/.gemini/antigravity/skills/x-algorithm-expert/SKILL.md
```

## License

MIT — Built by [Mr_Chartist](https://github.com/MrChartist)
