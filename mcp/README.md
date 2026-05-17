# X Algorithm MCP Server

> Score, analyze, and optimize tweets using the **actual signal weights** from X's open-source recommendation algorithm (`weighted_scorer.rs`).

## 🚀 Quick Start

```bash
cd mcp && npm install && npm run build
```

## 🔧 Configuration

### Claude Desktop
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

### Cursor / Windsurf / Gemini
Add to `.cursor/mcp.json` or equivalent:

```json
{
  "mcpServers": {
    "x-algorithm": {
      "command": "node",
      "args": ["./mcp/dist/index.js"]
    }
  }
}
```

## 📋 Tools (11)

| # | Tool | Description |
|---|------|-------------|
| 1 | `score_tweet` | Score a tweet (0-100) with grade, checks, penalties, suggestions |
| 2 | `check_filters` | Run tweet against 18 safety/quality filters |
| 3 | `analyze_hook` | Score opening line (0-10) with improvement advice |
| 4 | `get_signals` | Get all 19 algorithm signal weights with explanations |
| 5 | `get_optimal_schedule` | Calculate posting schedule to avoid diversity penalty |
| 6 | `compare_tweets` | Score 2 versions side-by-side with winner verdict |
| 7 | `detect_spam_patterns` | Scan for muted keywords, spam, and penalty triggers |
| 8 | `diversity_penalty` | Calculate exact decay for a specific post position |
| 9 | `classify_niche` | Classify tweet into niche + get optimization advice |
| 10 | `get_thread_strategy` | Get thread templates and best practices |
| 11 | `full_audit` | Complete pre-publish audit (score + filters + hook + niche + spam) |

## 📚 Resources (3)

| Resource URI | Description |
|-------------|-------------|
| `x-algorithm://weights` | All 19 engagement signal weights from weighted_scorer.rs |
| `x-algorithm://filters` | All 18 safety/quality filter definitions |
| `x-algorithm://niches` | 7 niche topic classifications with optimization advice |

## 📊 Example Usage

Ask your AI assistant:
- *"Score this tweet: I analyzed 500+ viral threads..."*
- *"Run a full audit on my tweet before I post it"*
- *"Compare these two versions of my tweet"*
- *"What's the optimal posting schedule for 4 posts today?"*
- *"Classify this tweet's niche and give me optimization tips"*
- *"Give me thread strategy templates for a tech topic"*
- *"Check this tweet for spam patterns"*

## 🧠 Algorithm Source

All weights and formulas extracted from X's open-source algorithm:
- `weighted_scorer.rs` — 19 engagement signal weights
- `author_diversity_scorer.rs` — Post frequency decay formula
- `topic_ids_filter.rs` — Content categorization
- `oon_scorer.rs` — Out-of-network viral mechanics

## License

MIT — Built by [@Mr_Chartist](https://x.com/Mr_Chartist)
