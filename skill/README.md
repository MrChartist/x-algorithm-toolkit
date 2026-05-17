# X Algorithm Expert — AI Skill

> A 400+ line intelligence skill that makes any AI assistant an expert on X's recommendation algorithm. Covers 22 engagement signals, Phoenix ML model, 77+ topic categories, thread strategies, and niche-specific optimization.

## Installation

### For Antigravity / Gemini CLI

```bash
# Clone the skill to your global skills directory
mkdir -p ~/.gemini/antigravity/skills/x-algorithm-expert
cp skill/SKILL.md ~/.gemini/antigravity/skills/x-algorithm-expert/SKILL.md
```

Or from GitHub:

```bash
# Download directly
curl -o ~/.gemini/antigravity/skills/x-algorithm-expert/SKILL.md \
  https://raw.githubusercontent.com/MrChartist/x-algorithm-toolkit/master/skill/SKILL.md
```

### For Workspace-Level Installation

```bash
# Add to your project
mkdir -p .agents/skills/x-algorithm-expert
cp skill/SKILL.md .agents/skills/x-algorithm-expert/SKILL.md
```

## What the Skill Covers

| Section | Content |
|---------|---------|
| System Architecture | 7-stage pipeline: Query → Sourcing → Hydration → Filtering → Scoring → Selection → Response |
| 22 Engagement Signals | Every weight from `weighted_scorer.rs` + `ranking_scorer.rs` |
| Phoenix ML Model | Grok-based transformer architecture (256-dim, 4 heads, 2 layers) |
| 10-Point Scoring | Score tweets 0-100 with S/A/B/C/D/F grades |
| Hook Writing | 7 strong patterns, 3 weak patterns, scoring 0-10 |
| Author Diversity | Exact decay formula: `(1-floor) × decay^position + floor` |
| OON Viral Mechanics | How tweets escape your follower bubble |
| Topic Classification | 77+ verified categories from `topic_ids_filter.rs` |
| 18 Safety Filters | Pre-scoring and post-selection filter pipeline |
| Thread Strategy | 6 proven templates with structural rules |
| Content Templates | 7 high-performance tweet formats |
| Niche Optimization | 7 niches with signal-specific strategies |

## Activation Triggers

The skill activates automatically when you ask about:
- X algorithm, tweet scoring, viral content
- Hook writing, thread building
- Engagement optimization, content strategy
- How the For You feed works
- Writing, scoring, rewriting, or improving tweets

## Source

All data extracted from X's open-source algorithm repository (`twitter/the-algorithm`).

## License

MIT — Built by [Mr_Chartist](https://github.com/MrChartist)
