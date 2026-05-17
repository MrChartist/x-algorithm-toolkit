# ⚡ X Algorithm Toolkit

> Score, optimize, and generate tweets using the **actual signal weights** from X's open-source recommendation algorithm.

[![npm](https://img.shields.io/npm/v/x-algorithm-mcp)](https://www.npmjs.com/package/x-algorithm-mcp)
[![Built with React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🧠 What This Does

This toolkit reverse-engineers X's recommendation algorithm from the [open-source codebase](https://github.com/twitter/the-algorithm) and gives you:

- **Tweet Scorer** — Score any draft (0-100) against the actual algorithm weights
- **Hook Analyzer** — Test your opening line against the -11× `not_dwelled` penalty
- **Diversity Calculator** — Plan posting cadence using the decay formula from `author_diversity_scorer.rs`
- **18 Filter Checker** — Run tweets through quality/safety gates
- **AI Rewrite, Generate & Thread Builder** — Multi-provider AI (Groq, Gemini, OpenAI, Claude)
- **Draft Manager, Compare Mode, Score History** — Full workflow tools
- **Export Scorecard** — Branded PNG downloads

## 📊 The 22 Algorithm Signals

From `weighted_scorer.rs` + `ranking_scorer.rs`:

| Signal | Weight | What It Means |
|--------|--------|---------------|
| Reply | **27.0×** | #1 signal — end every post with a question |
| Bookmark | **10.0×** | Save-worthy content gets massive boost |
| Follow | **4.0×** | "I want more" — the career signal |
| Dwell (Binary) | **2.0×** | Multi-line posts earn more read time |
| Cont. Dwell Time | **1.5×** | Longer reads score higher |
| Click-Dwell Time | **1.5×** | Deep interest after expanding |
| Report | **-369×** | Nuclear penalty — content becomes invisible |
| Not Interested | **-74×** | Off-topic = algorithmic death |
| Scrolled Past | **-11×** | Weak hooks trigger this |

*+ 13 more signals (Like, Repost, Quote, Quoted Click, Share, DM Share, Copy Link, Click, Profile Click, Photo Expand, Video Quality View)*

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/MrChartist/x-algorithm-toolkit.git
cd x-algorithm-toolkit

# Install & Run
npm install
npm run dev
```

Open `http://localhost:5173` — no API key needed for scoring, filters, and analysis.

For AI features (Rewrite, Generate, Thread), add an API key in Settings (Groq free tier recommended).

---

## 🔧 MCP Server (npm)

Install the MCP server to connect the algorithm engine to any AI assistant:

### Option 1: Via npx (Recommended)

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

### Option 2: Global Install

```bash
npm install -g x-algorithm-mcp
```

### Option 3: From Source

```bash
cd mcp && npm install && npm run build
```

**11 Tools**: `score_tweet`, `check_filters`, `analyze_hook`, `get_signals`, `get_optimal_schedule`, `compare_tweets`, `detect_spam_patterns`, `diversity_penalty`, `classify_niche`, `get_thread_strategy`, `full_audit`

**3 Resources**: `x-algorithm://weights`, `x-algorithm://filters`, `x-algorithm://niches`

---

## 🎯 AI Skill (Antigravity / Gemini CLI)

400+ lines of domain expertise that makes any AI an X algorithm expert:

### Install Globally

```bash
mkdir -p ~/.gemini/antigravity/skills/x-algorithm-expert
curl -o ~/.gemini/antigravity/skills/x-algorithm-expert/SKILL.md \
  https://raw.githubusercontent.com/MrChartist/x-algorithm-toolkit/master/skill/SKILL.md
```

### What's Covered:
- All 22 signal weights with optimization strategies
- Phoenix Grok-based transformer architecture
- 77+ topic categories from `topic_ids_filter.rs`
- 10-point scoring system with letter grades
- Hook writing rules and 7 templates
- Author diversity decay formula
- OON viral mechanics
- Thread building strategy (6 templates)
- 18 safety filter checklist
- Niche-specific optimization (7 niches)

---

## 📁 Architecture

```
x-algo-toolkit/
├── src/                    # React Web App (13 tabs)
│   ├── engine/             # Scoring engine + AI abstraction
│   └── components/         # 15 UI components
├── mcp/                    # MCP Server (11 tools, 3 resources)
│   ├── src/                # TypeScript source
│   ├── dist/               # Compiled output
│   └── package.json        # npm: x-algorithm-mcp
├── skill/                  # AI Skill
│   └── SKILL.md            # 400+ line expertise file
└── public/                 # Static assets
```

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Animations**: Framer Motion
- **AI**: Multi-provider (Groq/Gemini/OpenAI/Claude)
- **MCP**: `@modelcontextprotocol/sdk` v1.12+
- **Storage**: localStorage (no backend needed)

## 📜 License

MIT — Built by [@Mr_Chartist](https://x.com/Mr_Chartist)

---

*Data sourced from X's open-source algorithm: `weighted_scorer.rs`, `ranking_scorer.rs`, `author_diversity_scorer.rs`, `oon_scorer.rs`, `topic_ids_filter.rs`, `recsys_model.py`*
