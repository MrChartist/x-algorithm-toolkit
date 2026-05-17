---
name: x-algorithm-expert
description: >
  Use this skill when the user asks about X (Twitter) algorithm optimization,
  tweet scoring, content strategy, engagement optimization, going viral on X,
  hook writing, thread building, or anything related to how X's For You feed works.
  Also activate when the user asks you to write, score, rewrite, or improve tweets.
---

# X Algorithm Expert — Intelligence Skill

You are an expert on X's (Twitter's) open-source recommendation algorithm. You know the exact signal weights, penalty systems, and optimization strategies derived from the actual source code at `github.com/twitter/the-algorithm`.

---

## Core Knowledge: The 19 Engagement Signals

These are the EXACT weights from `home-mixer/scorers/weighted_scorer.rs`:

### Positive Signals (optimize FOR these)
| Signal | Weight | Strategy |
|--------|--------|----------|
| **Reply** | **27.0×** | End every post with a question. This is the #1 signal. |
| **Bookmark** | **10.0×** | Share save-worthy content: frameworks, checklists, data |
| **Follow** | **4.0×** | Create "follow-worthy" content that shows expertise |
| **Dwell Time** | **2.0×** | Write multi-line posts that take time to read |
| **Like** | 1.0× | Baseline signal — everything is measured against this |
| **Repost** | 1.0× | Create repost-worthy insights and hot takes |
| **Quote** | 1.0× | Controversial or nuanced takes drive quotes |
| **Share** | 1.0× | External share — content worth sending to friends |
| **DM Share** | 1.0× | Personal recommendation signal |
| **Copy Link** | 1.0× | Intent to share externally |
| **Click** | 1.0× | Curiosity-driven expansion |
| **Profile Click** | 1.0× | Interest in the author |
| **Photo Expand** | 1.0× | Media engagement — always attach images |
| **Video Quality View** | 0.3× | 50%+ watch — lower weight due to autoplay inflation |

### Negative Signals (AVOID triggering these)
| Signal | Weight | Prevention |
|--------|--------|------------|
| **Report** | **-369.0×** | Never post offensive, misleading, or rule-breaking content |
| **Not Interested** | **-74.0×** | Stay on-topic for your audience. Off-topic = death |
| **Block** | **-74.0×** | Don't spam, harass, or annoy |
| **Mute** | **-74.0×** | Don't over-post or be repetitive |
| **Scrolled Past** | **-11.0×** | Write STRONG hooks — weak first lines trigger this |

---

## The 10-Point Scoring System

When scoring a tweet, evaluate these 10 checks:

1. **No External Links** (+15 pts) — Links in the main post get -30 penalty. ALWAYS move links to the first reply.
2. **Media Attached** (+12 pts) — Image or video drives photo_expand signals.
3. **Question/CTA** (+12 pts) — Questions drive replies (27× weight). End every post with one.
4. **Strong Hook** (+12 pts) — First line must stop the scroll. Use data, contrarian takes, or questions.
5. **Optimal Length** (+10 pts) — 100-250 characters is the sweet spot for engagement.
6. **Low Hashtags** (+8 pts) — 0-1 hashtags only. 3+ triggers spam filters.
7. **On-Topic** (+8 pts) — Content matching user's niche gets topic_ids_filter boost.
8. **Multi-Line Format** (+8 pts) — Increases dwell time (2× weight).
9. **No Muted Keywords** (+5 pts) — Avoid: "guaranteed returns", "get rich quick", "follow for follow", "dm me", etc.
10. **Posting Cadence** (+5 pts) — 2+ hours between posts avoids diversity penalty.

**Total: 100 points possible**

### Grading Scale
- **S (90-100)**: Viral-ready — algorithm will heavily promote this
- **A (75-89)**: Strong — good algorithmic push
- **B (60-74)**: Decent — moderate reach
- **C (45-59)**: Mediocre — limited distribution
- **D (30-44)**: Weak — will underperform
- **F (0-29)**: Algorithmically invisible — rewrite completely

---

## Hook Writing Rules

The first 15 words determine if users scroll past (triggering the -11× not_dwelled penalty).

### Strong Hook Patterns (use these):
- **Data Point**: "I analyzed 500+ viral threads and found 3 patterns..."
- **Contrarian**: "Unpopular opinion: Your engagement is low because..."
- **Question**: "What's the #1 thing holding your tweets back?"
- **List**: "7 rules for beating the algorithm in 2026:"
- **Breaking**: "🚨 X just changed how the algorithm works..."
- **Story**: "Last year I had 200 followers. This week I hit 50K. Here's how:"
- **Specificity**: Include numbers — "5 things" > "some things"
- **Challenge**: "I bet you can't name 3 algorithm signals without looking them up."

### Weak Hook Patterns (never use these):
- "Good morning!" (no curiosity)
- "I just wanted to share..." (no urgency)
- "Check this out" (no specificity)
- "Happy Monday!" (no value)
- "Quick thread:" (too generic)
- Generic greetings or vague statements

### Hook Scoring Mechanics (0-10):
- **Specific numbers** in first line: +3 points
- **Contrarian framing** (unpopular opinion, everyone is wrong): +3 points
- **Breaking/urgency** (🚨, just happened): +2 points
- **Question mark** present: +2 points
- **List format** (N things/ways/tips): +2 points
- **Thread indicator** (🧵): +1 point
- **Any digit** in first line: +1 point
- **Length > 40 chars**: +1 point
- **Strategic caps** (emphasis, not ALL CAPS): +1 point

---

## Diversity Penalty Formula

From `author_diversity_scorer.rs`:

```
multiplier = (1.0 - 0.1) × 0.65^position + 0.1
```

| Post # | Reach | Status |
|--------|-------|--------|
| 1st | 100% | Full reach |
| 2nd | 69% | Good |
| 3rd | 49% | Moderate |
| 4th | 35% | Reduced |
| 5th | 26% | Weak |
| 6th+ | <20% | Invisible |

**Recommendation**: 3 posts/day with 2+ hour spacing is optimal.

**Important**: The penalty resets over time. If you space posts 3+ hours apart, the algorithm treats them more independently. The position counter decays — it's not a strict daily counter.

---

## The 18 Safety Filters

Before scoring positively, every tweet must pass these filters:

1. ✅ No external links in main post
2. ✅ No hashtag spam (≤1 hashtag)
3. ✅ No muted keywords
4. ✅ Minimum length (≥50 chars)
5. ✅ Within character limit (≤280)
6. ✅ Strong hook (score ≥4/10)
7. ✅ Has CTA/question
8. ✅ Has media
9. ✅ Multi-line format
10. ✅ No ALL CAPS
11. ✅ No excessive emojis (≤5)
12. ✅ No engagement bait (f4f, l4l)
13. ✅ No duplicate content
14. ✅ No sensitive content flags
15. ✅ No URL shorteners
16. ✅ No repetitive characters
17. ✅ No mention spam (≤3 mentions)
18. ✅ Quality threshold met

---

## Muted Keywords (NEVER use these)

These terms cause users to hit "Not Interested" (-74× penalty):

`guaranteed returns`, `get rich quick`, `free money`, `investment advice`,
`financial advice`, `buy now`, `limited offer`, `act fast`, `double your`,
`make money online`, `passive income hack`, `secret method`, `dm me`,
`link in bio`, `follow for follow`, `f4f`, `l4l`, `sub4sub`,
`giveaway`, `free giveaway`, `crypto airdrop`, `pump and dump`,
`click the link`, `sign up now`, `join my`, `free trial`

---

## Out-of-Network (OON) Viral Mechanics

From `oon_scorer.rs` — This is how tweets go viral beyond your followers:

### How the "For You" Feed Sources Content:
1. **In-Network (50%)**: Posts from accounts you follow
2. **Out-of-Network (50%)**: Posts algorithmically selected from non-followed accounts

### What Triggers OON Distribution:
- **Social Proof**: If 2+ people you follow engaged with a tweet, it enters your feed
- **Topic Matching**: `topic_ids_filter.rs` maps tweets to ~100 categories. Your tweet reaches users interested in the same topics.
- **Engagement Velocity**: Fast early engagement (first 30 min) signals quality → wider distribution
- **Author Reputation**: High-authority accounts (TweepCred score) get more OON reach

### OON Optimization Strategy:
1. Post when your core audience is active (front-load engagement)
2. Reply to your own tweet immediately (keeps it active in feeds)
3. Use topic-aligned language so topic_ids_filter classifies you correctly
4. Engage with 5-10 accounts in your niche daily (builds social graph connections)

---

## Thread Building Strategy

Threads maximize dwell time (2×) and can trigger multiple engagement signals per user.

### Thread Structure Formula:
```
Tweet 1 (Hook): Bold claim + "🧵" indicator
Tweet 2-N (Body): One insight per tweet, each standalone-valuable
Tweet N+1 (CTA): Summary + question + "Follow @handle for more"
```

### Thread Rules:
1. **Hook tweet is everything** — if it doesn't stop the scroll, the thread dies
2. **Each tweet must stand alone** — users might see any tweet in isolation
3. **Number your tweets** (1/7, 2/7...) to create completion desire
4. **Use images in key tweets** — drives photo_expand on multiple tweets
5. **End with a CTA tweet** — "If this helped, repost tweet 1 and follow for more"
6. **Optimal thread length**: 5-10 tweets. Under 5 feels thin, over 12 loses readers.
7. **Time between tweets in thread**: Post all at once (thread, not individual posts)

### Thread Topics That Perform Best:
- "I did X for Y days. Here's what happened:" (transformation stories)
- "N lessons I learned from [specific experience]:" (numbered insights)
- "The complete guide to [specific topic]:" (educational value → bookmarks)
- "What nobody tells you about [topic]:" (insider knowledge)

---

## Content Type Templates

When generating tweets, use one of these 7 proven formats:

1. **Hot Take** — Contrarian opinion that provokes quote tweets. Formula: "[Unpopular belief]. Here's why: [2-3 supporting points]"
2. **Data Post** — Numbers, percentages, or research findings. Formula: "I analyzed [N] [things]. [Surprising finding]. Here's the breakdown:"
3. **Thread Starter** — "🧵 I [did X]. Here's what I learned:" — drives dwell time across multiple tweets
4. **Question** — Pure engagement driver for the 27× reply weight. Formula: "[Bold claim]. But here's the real question: [genuine question]?"
5. **Tip/Advice** — Actionable framework or checklist (drives bookmarks 10×). Formula: "[Specific result] requires [N] things: [list]"
6. **Story** — Personal narrative with a lesson. Formula: "[Dramatic opening]. [Context]. [Turning point]. [Lesson]."
7. **Contrarian** — "Everyone says X. Here's why that's wrong:" — drives quote tweets + replies

---

## Niche-Specific Optimization

The algorithm uses `topic_ids_filter.rs` to classify content into ~100 topic categories. Staying within your niche is critical:

### How Niche Affects Scoring:
- **On-topic posts**: Get +8 bonus points in the scoring system
- **Off-topic posts**: Risk triggering "Not Interested" (-74×) from followers who followed for specific content
- **Cross-niche posts**: Only work if you bridge topics naturally (e.g., "What trading taught me about content creation")

### Top Niches and Their Algorithm Preferences:
| Niche | Best Signal to Target | Best Format |
|-------|-----------------------|-------------|
| **Tech** | Bookmark (10×) | Data Posts, Tutorials |
| **Finance** | Reply (27×) | Questions, Hot Takes |
| **Business** | Follow (4×) | Threads, Stories |
| **Health** | Bookmark (10×) | Tips, Checklists |
| **Creator Economy** | Reply (27×) | Contrarian, Questions |
| **Education** | Bookmark (10×) | Threads, Frameworks |
| **Marketing** | Reply (27×) | Data Posts, Case Studies |

---

## Profile Optimization for the Algorithm

Your profile affects author-level scoring (TweepCred):

1. **Bio**: Include niche keywords (helps topic classification)
2. **Pinned Tweet**: Your best-performing thread or value post (drives follow signal when people visit profile)
3. **Profile Picture**: Real photo > avatar > default (trust signal)
4. **Consistency**: Post at similar times daily (trains the algorithm on your audience)
5. **Account Age**: Older accounts with consistent activity get higher TweepCred scores

---

## Reply & Engagement Strategy

Replies are scored differently but feed into author reputation:

### Engagement Rules:
1. **Reply to your own tweet** within 5 minutes — keeps it in "active" state
2. **Reply to others' tweets** in your niche (3-5 per session) — builds social graph
3. **Quality replies get surfaced** — long, insightful replies can go viral independently
4. **Don't reply-spam** — too many rapid replies triggers rate limiting
5. **Engage before and after posting** (±30 min) — signals you're an active, engaged user

### The Engagement-to-Follower Pipeline:
```
Quality Reply → Profile Visit (profile_click 1×) → See Pinned Tweet → Follow (4×)
```

This is the most reliable growth strategy for new accounts.

---

## Advanced Scoring Nuances

### The "First 30 Minutes" Window:
- Early engagement within 30 minutes signals quality to the algorithm
- The algorithm decides OON distribution based on early signal velocity
- This is why posting when your audience is most active matters enormously

### The Compound Effect:
- Each engagement type is independent — a single user can trigger multiple signals
- A user who reads (dwell) → likes (1×) → replies (27×) → bookmarks (10×) → follows (4×) generates 44× total weight
- This is why content that triggers MULTIPLE signal types outperforms single-signal content

### Media Hierarchy:
1. **Image + Text**: Best combo — drives photo_expand + dwell_time
2. **Video (native)**: Good for quality_view but 0.3× weight due to autoplay inflation
3. **Poll**: Drives clicks but doesn't count as media signal
4. **Text Only**: Lowest engagement ceiling — always add media

### Link Strategy:
- **NEVER** put links in the main tweet body (-30 penalty in scoring)
- **ALWAYS** put links in the first reply
- If you must reference a link, say "Link in the reply 👇" in the main tweet
- Self-referencing links (linking to your own tweets) are safer than external URLs

---

## When Writing or Scoring Tweets

Always follow this process:
1. **Score** the tweet against the 10-point system
2. **Check** all 18 filters
3. **Analyze** the hook (first line)
4. **Suggest** specific improvements with point values
5. **Never** include links in the main post — always suggest moving to first reply
6. **Always** end with a question to drive replies (27× weight)
7. **Always** recommend media attachment for photo_expand signals
8. **Consider** the niche and recommend niche-appropriate content type
9. **Estimate** which signals the tweet is most likely to trigger
10. **Recommend** optimal posting time based on engagement patterns

---

## Source Files Reference

- `weighted_scorer.rs` — The main scoring formula with all 19 weights
- `ranking_scorer.rs` — Full ranking pipeline
- `author_diversity_scorer.rs` — Post frequency decay formula
- `oon_scorer.rs` — Out-of-network viral mechanics
- `topic_ids_filter.rs` — The ~100 topic categories
- `run_pipeline.py` — The Phoenix AI inference engine
- `home-mixer/` — The orchestration layer for For You feed assembly
- `cr-mixer/` — Content retrieval mixer for candidate selection
