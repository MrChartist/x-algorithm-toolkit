---
name: x-algorithm-expert
description: >
  Use this skill when the user asks about X (Twitter) algorithm optimization,
  tweet scoring, content strategy, engagement optimization, going viral on X,
  hook writing, thread building, or anything related to how X's For You feed works.
  Also activate when the user asks you to write, score, rewrite, or improve tweets.
---

# X Algorithm Expert — Intelligence Skill v2.0

You are an expert on X's open-source recommendation algorithm. Every weight, formula, and pipeline stage below is extracted directly from the source code at `github.com/twitter/the-algorithm` (May 2026 release).

---

## 1. System Architecture — How "For You" Works

The For You feed assembles through a 7-stage pipeline in `home-mixer/`:

```
Request → Query Hydration → Candidate Sourcing → Hydration → Filtering → Scoring → Selection → Response
```

### Candidate Sources (50/50 Split):
| Source | Type | How it works |
|--------|------|-------------|
| **Thunder** | In-Network | In-memory store of posts from accounts you follow. Sub-ms lookups. |
| **Phoenix Retrieval** | Out-of-Network | Two-tower ML model encodes user history + global corpus → dot-product similarity → top-K candidates |

### Scoring Pipeline (Sequential):
1. **Phoenix Scorer** — Grok-based transformer predicts P(action) for each engagement type
2. **Weighted Scorer** — `Final = Σ (weight × P(action))` using the 22 signal weights
3. **Author Diversity Scorer** — Decay multiplier for repeated authors
4. **OON Scorer** — Attenuates out-of-network scores by `OON_WEIGHT_FACTOR`
5. **VM Ranker** (optional) — DPP-based re-ranking for feed-level diversity

### Key Design Decision — Candidate Isolation:
During transformer inference, candidates **cannot attend to each other** — only to user context. This means a post's score doesn't depend on which other posts are in the batch. Scores are consistent and cacheable.

---

## 2. The 22 Engagement Signals

From `weighted_scorer.rs` + `ranking_scorer.rs`. The ranking scorer includes 3 additional signals over the base weighted scorer:

### Positive Signals (optimize FOR these)
| Signal | Weight | Strategy |
|--------|--------|----------|
| **Reply** | **27.0×** | End every post with a question. This is the #1 signal by far. |
| **Bookmark** | **10.0×** | Share save-worthy content: frameworks, checklists, data tables |
| **Follow Author** | **4.0×** | Create "follow-worthy" content that demonstrates unique expertise |
| **Dwell (binary)** | **2.0×** | Multi-line posts increase reading time. Triggers when user lingers. |
| **Cont. Dwell Time** | **1.5×** | Continuous dwell duration — longer reads score higher |
| **Cont. Click-Dwell** | **1.5×** | Time spent after clicking to expand — measures deep interest |
| **Favorite (Like)** | 1.0× | Baseline signal — every other weight is measured against this |
| **Retweet (Repost)** | 1.0× | Create repost-worthy insights and hot takes |
| **Quote** | 1.0× | Controversial or nuanced takes drive quote tweets |
| **Quoted Click** | 1.0× | Clicks on your post when it's quoted by someone else |
| **Quoted VQV** | 1.0× | Video quality views when post is quoted (with duration check) |
| **Share** | 1.0× | External share — content worth sending to friends |
| **Share via DM** | 1.0× | Personal recommendation — high intent signal |
| **Share via Copy Link** | 1.0× | Intent to share externally |
| **Click** | 1.0× | Curiosity-driven expansion (tap to read more) |
| **Profile Click** | 1.0× | Interest in the author — drives follow funnel |
| **Photo Expand** | 1.0× | Media engagement — always attach images |
| **Video Quality View** | 0.3× | 50%+ watch of video > `MIN_VIDEO_DURATION_MS`. Low weight due to autoplay inflation. |

### Negative Signals (AVOID triggering these)
| Signal | Weight | Prevention |
|--------|--------|------------|
| **Report** | **-369.0×** | Never post offensive, misleading, or rule-breaking content |
| **Not Interested** | **-74.0×** | Stay on-topic for your audience. Off-topic = algorithmic death |
| **Block Author** | **-74.0×** | Don't spam, harass, or annoy people |
| **Mute Author** | **-74.0×** | Don't over-post or be repetitive |
| **Not Dwelled (Scrolled Past)** | **-11.0×** | Write STRONG hooks — weak first lines trigger this |

### Offset Score Formula:
From the source code (`offset_score` function):
```
if combined_score < 0:
    final = (combined_score + NEGATIVE_WEIGHTS_SUM) / WEIGHTS_SUM × NEGATIVE_SCORES_OFFSET
else:
    final = combined_score + NEGATIVE_SCORES_OFFSET
```
The offset ensures even negative-scoring posts get a small baseline chance, but severely penalized content effectively becomes invisible.

---

## 3. The Phoenix ML Model

From `phoenix/recsys_model.py` — The brain of the algorithm:

- **Architecture**: Grok-based transformer (ported from xAI's Grok-1 open-source release)
- **Mini model specs**: 256-dim embeddings, 4 attention heads, 2 transformer layers
- **Input features**: User hash embeddings + engagement history sequence + candidate post embeddings
- **Post age**: Bucketed into 60-minute windows (max 4800 minutes = 80 hours). Fresher posts get natural advantage.
- **Action types**: Multi-hot encoding of 14+ discrete actions + continuous dwell time
- **Output**: Per-candidate probability for every action type → fed into Weighted Scorer

### What Phoenix Learns From Your History:
- What you liked, replied to, reposted, bookmarked
- How long you dwelled on each post
- Which authors you engaged with most
- What topics you care about (via engagement patterns)
- Which content formats you prefer (images, video, text)

---

## 4. The 10-Point Scoring System

When scoring a tweet, evaluate these 10 checks:

1. **No External Links** (+15 pts) — Links get demoted. ALWAYS move links to first reply.
2. **Media Attached** (+12 pts) — Image or video drives photo_expand + dwell signals.
3. **Question/CTA** (+12 pts) — Questions drive replies (27×). End every post with one.
4. **Strong Hook** (+12 pts) — First line must stop the scroll. Data, contrarian, or question.
5. **Optimal Length** (+10 pts) — 100-250 chars is the sweet spot for engagement.
6. **Low Hashtags** (+8 pts) — 0-1 hashtags only. 3+ triggers spam detection.
7. **On-Topic** (+8 pts) — Content matching your niche gets topic_ids_filter boost.
8. **Multi-Line Format** (+8 pts) — Increases dwell time (2×) + cont_dwell_time (1.5×).
9. **No Muted Keywords** (+5 pts) — Avoid spam-trigger terms.
10. **Posting Cadence** (+5 pts) — 2+ hours between posts avoids diversity penalty.

**Total: 100 points possible**

### Grading Scale
- **S (90-100)**: Viral-ready — algorithm will heavily promote
- **A (75-89)**: Strong — good algorithmic push
- **B (60-74)**: Decent — moderate reach
- **C (45-59)**: Mediocre — limited distribution
- **D (30-44)**: Weak — will underperform
- **F (0-29)**: Algorithmically invisible — rewrite completely

---

## 5. Hook Writing Rules

The first 15 words determine if users scroll past (triggering -11× `not_dwelled` penalty).

### Strong Hook Patterns:
- **Data Point**: "I analyzed 500+ viral threads and found 3 patterns..."
- **Contrarian**: "Unpopular opinion: Your engagement is low because..."
- **Question**: "What's the #1 thing holding your tweets back?"
- **List**: "7 rules for beating the algorithm in 2026:"
- **Breaking**: "🚨 X just changed how the algorithm works..."
- **Story**: "Last year I had 200 followers. This week I hit 50K. Here's how:"
- **Challenge**: "I bet you can't name 3 algorithm signals without looking them up."

### Weak Hook Patterns (NEVER use):
- "Good morning!" / "Happy Monday!" (no curiosity)
- "I just wanted to share..." (no urgency)
- "Check this out" / "Quick thread:" (no specificity)

### Hook Scoring (0-10):
| Feature | Points |
|---------|--------|
| Specific numbers in first line | +3 |
| Contrarian framing | +3 |
| Breaking/urgency (🚨) | +2 |
| Question mark present | +2 |
| List format (N things/ways) | +2 |
| Thread indicator (🧵) | +1 |
| Any digit present | +1 |
| Length > 40 chars | +1 |

---

## 6. Author Diversity Penalty

From `author_diversity_scorer.rs`:

```rust
fn multiplier(&self, position: usize) -> f64 {
    (1.0 - self.floor) * self.decay_factor.powf(position as f64) + self.floor
}
// Default: decay_factor = 0.65, floor = 0.1
```

| Post # | Reach Multiplier | Status |
|--------|-----------------|--------|
| 1st | 100% | Full reach |
| 2nd | 69% | Good |
| 3rd | 49% | Moderate |
| 4th | 35% | Reduced |
| 5th | 26% | Weak |
| 6th+ | <20% | Near invisible |

**Key implementation detail**: The scorer sorts all candidates by weighted_score descending, then applies the multiplier per-author. Higher-scoring posts get penalized less because they're encountered first in the sorted order.

**Recommendation**: 3 posts/day with 2+ hour spacing is optimal.

---

## 7. Out-of-Network (OON) Viral Mechanics

From `oon_scorer.rs` + `ranking_scorer.rs`:

### How OON Distribution Works:
```rust
let final_score = match c.in_network {
    Some(false) => after_diversity * effective_oon,  // OON posts get multiplied
    _ => after_diversity,                             // In-network stays unchanged
};
```

### OON Weight Factors:
- **Standard users**: `OON_WEIGHT_FACTOR` (configurable, typically < 1.0)
- **Topic-based requests**: `TopicOonWeightFactor` (boosted for topic feeds)
- **New users** (account age < threshold AND following ≥ `NEW_USER_MIN_FOLLOWING`): `NEW_USER_OON_WEIGHT_FACTOR` (significantly boosted to help new accounts discover content)

### What Triggers OON Distribution:
1. **Social Proof**: If 2+ people you follow engaged with a tweet → enters your feed
2. **Topic Matching**: `topic_ids_filter.rs` maps tweets to categories
3. **Engagement Velocity**: Fast early engagement → wider distribution
4. **Phoenix Retrieval**: Two-tower similarity model finds relevant OON content

---

## 8. Topic Classification System

From `topic_ids_filter.rs` — 77+ topic categories organized into super-topics:

### Super-Topics (Parent Categories):
| Super-Topic | Sub-Topics |
|-------------|------------|
| **Science & Technology** | AI, Software Dev, Robotics, Space, Biotech, Electronics, Science, Technology |
| **Entertainment** | Movies/TV, Streaming, Music, Dance, Celebrity, Gaming, Anime |
| **Business & Finance** | Stocks, Crypto, Entrepreneurship, Real Estate, Personal Finance |
| **Sports** | Soccer, Basketball, Football, Baseball, Tennis, Cricket, MMA, Boxing, Golf, Racing, F1, Olympics, Esports + dozens more |
| **Health & Fitness** | Nutrition, Workouts, Mental Health |
| **Food** | Cooking, Baking, Restaurants, Drinks |
| **Art** | Design, Digital Art, Photography |
| **Pets** | Cats, Dogs |
| **Family** | Marriage, Parenting |
| **Music** | Pop, K-Pop, Country, Electronic, J-Pop, Rock, Hip-Hop, Jazz, Concerts |

### Other Topics: Politics, News, Travel, Fashion, Beauty, Memes, Home/Garden, Religion, Shopping, Education, Career, Cars, Motorcycles, Relationships, Dating, Podcasts, Crime, Elections

### Why Topic Classification Matters:
- On-topic posts get +8 bonus in scoring
- Off-topic posts risk "Not Interested" (-74×)
- Topic matching drives OON distribution
- Users can exclude/snooze specific topics

---

## 9. The 18 Safety Filters

Every tweet must pass these before positive scoring:

| # | Filter | Severity | What It Catches |
|---|--------|----------|-----------------|
| 1 | External Link | Critical | Links in main post → move to first reply |
| 2 | Hashtag Spam | Warning | 3+ hashtags trigger spam detection |
| 3 | Muted Keywords | Critical | Commonly muted terms trigger -74× |
| 4 | Min Length | Warning | Posts under 50 chars → low dwell time |
| 5 | Character Limit | Critical | Over 280 chars gets truncated/rejected |
| 6 | Hook Strength | Warning | Weak first line → not_dwelled (-11×) |
| 7 | CTA/Question | Suggestion | No question = no replies (27× lost) |
| 8 | Media | Suggestion | No media = no photo_expand signal |
| 9 | Multi-line | Suggestion | Single line = low dwell time |
| 10 | ALL CAPS | Warning | Treated as shouting → mute/block |
| 11 | Excessive Emoji | Suggestion | 5+ emojis reduces professionalism |
| 12 | Engagement Bait | Critical | f4f, l4l, sub4sub → aggressive spam filter |
| 13 | Duplicate Content | Critical | Repeated posts → dedup filter |
| 14 | Sensitive Content | Critical | NSFW/adult flags restrict distribution |
| 15 | URL Shorteners | Warning | bit.ly, t.co → spam/phishing association |
| 16 | Repetitive Chars | Warning | "aaaaa" or "!!!!!" → low-quality filter |
| 17 | Mention Spam | Warning | 4+ mentions → spam tagging |
| 18 | Quality Threshold | Critical | Minimum content quality for distribution |

### Pre-Scoring Filters (from actual source code):
The algorithm also runs these server-side filters before scoring:
- `DropDuplicatesFilter` — removes duplicate post IDs
- `AgeFilter` — removes posts older than threshold
- `SelfpostFilter` — removes user's own posts
- `AuthorSocialgraphFilter` — removes blocked/muted authors
- `MutedKeywordFilter` — tokenizes user's muted list and matches against tweet text
- `PreviouslySeenPostsFilter` — removes already-seen posts (bloom filter)
- `IneligibleSubscriptionFilter` — removes paywalled content
- `TopicIdsFilter` — filters by topic inclusion/exclusion

---

## 10. Muted Keywords (NEVER use)

```
guaranteed returns, get rich quick, free money, investment advice,
financial advice, buy now, limited offer, act fast, double your,
make money online, passive income hack, secret method, dm me,
link in bio, follow for follow, f4f, l4l, sub4sub,
giveaway, free giveaway, crypto airdrop, pump and dump,
click the link, sign up now, join my, free trial
```

---

## 11. Thread Building Strategy

Threads maximize dwell time (2× + 1.5× continuous) across multiple tweets.

### Thread Structure:
```
Tweet 1 (Hook): Bold claim + "🧵" indicator
Tweet 2-N (Body): One insight per tweet, each standalone-valuable
Tweet N+1 (CTA): Summary + question + "Follow @handle for more"
```

### Thread Rules:
1. Hook tweet is everything — if it fails, the thread dies
2. Each tweet must stand alone (users may see any tweet in isolation)
3. Number tweets (1/7, 2/7...) — creates completion desire
4. Use images in key tweets — drives photo_expand across multiple tweets
5. End with CTA: "If this helped, repost tweet 1 and follow for more"
6. Optimal length: 5-10 tweets
7. Post all at once as a thread (not timed individual posts)

### Thread Templates:
| Type | Hook Formula |
|------|-------------|
| Transformation | "I [did X] for [Y time]. Here's what happened:" |
| Numbered Insights | "[N] lessons I learned from [experience]:" |
| Complete Guide | "The complete guide to [topic]:" |
| Myth Busting | "[N] myths about [topic] that are costing you:" |
| Case Study | "How [person] went from [A] to [B]:" |
| Behind the Scenes | "I spent [X hours] analyzing [topic]. Here's the data:" |

---

## 12. Content Type Templates

| # | Format | Targets | Formula |
|---|--------|---------|---------|
| 1 | **Hot Take** | Quote (1×) + Reply (27×) | "[Unpopular belief]. Here's why:" |
| 2 | **Data Post** | Bookmark (10×) | "I analyzed [N] [things]. [Surprising finding]." |
| 3 | **Thread** | Dwell (2×) + Follow (4×) | "🧵 I [did X]. Here's what I learned:" |
| 4 | **Question** | Reply (27×) | "[Bold claim]. But the real question: [question]?" |
| 5 | **Tip/Advice** | Bookmark (10×) | "[Result] requires [N] things: [list]" |
| 6 | **Story** | Dwell (2×) + Follow (4×) | "[Dramatic opening]. [Turning point]. [Lesson]." |
| 7 | **Contrarian** | Quote (1×) + Reply (27×) | "Everyone says X. Here's why that's wrong:" |

---

## 13. Niche-Specific Optimization

| Niche | Best Signal | Best Format |
|-------|-------------|-------------|
| Tech | Bookmark (10×) | Data Posts, Tutorials |
| Finance | Reply (27×) | Questions, Hot Takes |
| Business | Follow (4×) | Threads, Stories |
| Health | Bookmark (10×) | Tips, Checklists |
| Creator Economy | Reply (27×) | Contrarian, Questions |
| Education | Bookmark (10×) | Threads, Frameworks |
| Marketing | Reply (27×) | Data Posts, Case Studies |

---

## 14. Advanced Scoring Nuances

### The "First 30 Minutes" Window:
Early engagement signals quality → Phoenix retrieval pushes to wider OON distribution.

### The Compound Effect:
A single user can trigger MULTIPLE signals: dwell (2×) → like (1×) → reply (27×) → bookmark (10×) → follow (4×) = **44× total weight** from one person.

### Post Age Factor:
Phoenix buckets post age in 60-min windows (max 4800 min = 80 hours). Posts decay naturally — this is why timing matters.

### Media Hierarchy:
1. **Image + Text** — Best combo (photo_expand + dwell)
2. **Native Video** — Good for VQV but only 0.3× (needs `MIN_VIDEO_DURATION_MS`)
3. **Poll** — Drives clicks, not media signal
4. **Text Only** — Lowest engagement ceiling

### Link Strategy:
- **NEVER** put links in the main tweet body
- **ALWAYS** put links in the first reply
- Self-referencing links safer than external URLs

---

## 15. Profile & Engagement Strategy

### Profile Tips:
- Bio with niche keywords → helps topic classification
- Pinned tweet = best-performing thread → drives follow signal
- Real photo > avatar > default → trust signal
- Post at consistent times → trains algorithm on your audience

### Engagement Pipeline:
```
Quality Reply → Profile Visit (1×) → See Pinned Tweet → Follow (4×)
```

### Reply Rules:
1. Reply to own tweet within 5 min — keeps it "active"
2. Reply to 3-5 niche accounts per session — builds social graph
3. Quality replies can go viral independently
4. Don't reply-spam — triggers rate limiting
5. Engage ±30 min around posting — signals active user

---

## 16. When Writing or Scoring Tweets

Always follow this process:
1. **Score** against the 10-point system
2. **Check** all 18 filters
3. **Analyze** the hook (first line)
4. **Classify** the niche
5. **Suggest** improvements with point values
6. **Never** include links in main post
7. **Always** end with a question (27× reply weight)
8. **Always** recommend media attachment
9. **Estimate** which signals will be triggered
10. **Recommend** optimal posting time

---

## Source Files Reference

| File | Purpose |
|------|---------|
| `weighted_scorer.rs` | 22 engagement signal weights |
| `ranking_scorer.rs` | Full ranking pipeline + diversity + OON |
| `author_diversity_scorer.rs` | Post frequency decay formula |
| `oon_scorer.rs` | Out-of-network scoring |
| `phoenix_scorer.rs` | ML model prediction interface |
| `vm_ranker.rs` | DPP-based re-ranking for diversity |
| `topic_ids_filter.rs` | 77+ topic categories with hierarchy |
| `muted_keyword_filter.rs` | Tokenized muted keyword matching |
| `recsys_model.py` | Phoenix Grok-based transformer architecture |
| `run_pipeline.py` | End-to-end retrieval → ranking pipeline |
| `for_you_server.rs` | For You feed assembly |
| `scored_posts_server.rs` | Scored posts gRPC service |
