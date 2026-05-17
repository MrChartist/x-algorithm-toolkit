# ⚡ X Algorithm Toolkit

> Score, optimize, and generate tweets using the **actual signal weights** from X's open-source recommendation algorithm.

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

## 📊 The Algorithm Weights

From `weighted_scorer.rs`:

| Signal | Weight | What It Means |
|--------|--------|---------------|
| Reply | **27.0×** | The #1 signal — end every post with a question |
| Bookmark | **10.0×** | Share save-worthy content |
| Follow | **4.0×** | Create follow-worthy expertise posts |
| Dwell Time | **2.0×** | Multi-line posts earn more read time |
| Report | **-369.0×** | Nuclear penalty — never trigger this |
| Not Interested | **-74.0×** | Stay on-topic or get suppressed |
| Scrolled Past | **-11.0×** | Weak hooks = algorithmic death |

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

## 🔧 MCP Server

Connect the algorithm engine to any AI assistant (Claude, Cursor, Windsurf):

```bash
cd mcp
npm install
npm run build
```

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "x-algorithm": {
      "command": "node",
      "args": ["/path/to/x-algorithm-toolkit/mcp/dist/index.js"]
    }
  }
}
```

**8 Tools**: `score_tweet`, `check_filters`, `analyze_hook`, `get_signals`, `get_optimal_schedule`, `compare_tweets`, `detect_spam_patterns`, `diversity_penalty`

## 🎯 AI Skill

Drop `skill/SKILL.md` into any AI environment to inject algorithmic expertise:
- All 19 signal weights with optimization strategies
- 10-point scoring system
- Hook writing rules and templates
- Diversity penalty formula
- 18 safety filter checklist

## 📁 Architecture

```
x-algo-toolkit/
├── src/                    # React Web App (13 tabs)
│   ├── engine/             # Scoring engine + AI abstraction
│   └── components/         # 15 UI components
├── mcp/                    # MCP Server (8 tools)
│   └── src/                # Standalone scoring engine
├── skill/                  # AI Skill file
│   └── SKILL.md            # Store-uploadable skill definition
└── public/                 # Static assets
```

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Animations**: Framer Motion
- **AI**: Multi-provider (Groq/Gemini/OpenAI/Claude)
- **MCP**: `@modelcontextprotocol/sdk`
- **Storage**: localStorage (no backend needed)

## 📜 License

MIT — Built by [@Mr_Chartist](https://x.com/Mr_Chartist)

---

*Data sourced from X's open-source algorithm: `weighted_scorer.rs`, `author_diversity_scorer.rs`, `topic_ids_filter.rs`*
