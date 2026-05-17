# X Algorithm MCP Server

> Score, analyze, and optimize tweets using the **actual signal weights** from X's open-source recommendation algorithm (`weighted_scorer.rs`).

## 🚀 Quick Start

```bash
# Install
cd mcp && npm install && npm run build

# Test
node dist/index.js
```

## 🔧 Configuration

### Claude Desktop
Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "x-algorithm": {
      "command": "node",
      "args": ["d:/AG/Twitter Algo/x-algo-toolkit/mcp/dist/index.js"]
    }
  }
}
```

### Cursor / Windsurf
Add to `.cursor/mcp.json` or similar:

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

## 📋 Tools (8)

| Tool | Description |
|------|-------------|
| `score_tweet` | Score a tweet (0-100) with grade, checks, penalties, suggestions |
| `check_filters` | Run tweet against 18 safety/quality filters |
| `analyze_hook` | Score opening line (0-10) with improvement advice |
| `get_signals` | Get all 19 algorithm signal weights with explanations |
| `get_optimal_schedule` | Calculate posting schedule to avoid diversity penalty |
| `compare_tweets` | Score 2 versions side-by-side with winner verdict |
| `detect_spam_patterns` | Scan for muted keywords, spam, and penalty triggers |
| `diversity_penalty` | Calculate exact decay for a specific post position |

## 📊 Example Usage

Ask your AI assistant:
- *"Score this tweet: I analyzed 500+ viral threads..."*
- *"Compare these two versions of my tweet"*
- *"What's the optimal posting schedule for 4 posts today?"*
- *"Check this tweet for spam patterns"*
- *"What are the top 5 algorithm signals I should optimize for?"*

## 🧠 Algorithm Source

All weights and formulas are extracted from X's open-source algorithm:
- `weighted_scorer.rs` — 19 engagement signal weights
- `author_diversity_scorer.rs` — Post frequency decay formula
- `topic_ids_filter.rs` — Content categorization

## License

MIT — Built by [@Mr_Chartist](https://x.com/Mr_Chartist)
