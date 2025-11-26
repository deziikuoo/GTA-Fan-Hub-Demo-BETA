# Reputation System - Quick Reference Guide
## v3.0 - Inflation-Controlled + Bot Defense

## 🎯 Core Formula

```javascript
// Per-engagement value
engagementValue = 
  getBaseValue(type) *                   // Random 0.4-1.0 (likes), scaled for others
  getProgressiveWeight(user.rep) *       // Logarithmic, caps at 3.0x
  earlyVoteBonus(post, engagement) *     // 0.8x-2.0x over 6 hours
  calculateAgeMultiplier(postAge) *      // 0.3x-1.0x (old posts penalized)
  getEngagementMultiplier(post) *        // 1.0x-1.05x (tiny bonus)
  (1 - downvotesPenalty) *               // 0.4 flat per downvote
  applySoftCapIfFlagged(user);           // Only for suspicious accounts

// Aggregate
ACTIVE_REPUTATION = Σ(engagementValue for last 180 days with decay)
LEGACY_REPUTATION = Σ(all-time engagementValue) * 0.2
TOTAL_REPUTATION = ACTIVE + LEGACY

// Display (stable fuzz - fixed until rep changes)
DISPLAYED = stableFuzzValue(TOTAL)
```

---

## 🎲 Base Values (Random Range)

| Engagement | Base Value | Avg | Notes |
|------------|------------|-----|-------|
| Like | 0.4-1.0 | ~0.7 | Foundation |
| Comment | 1.2-3.0 | ~2.1 | 3x like value |
| Repost | 2.0-5.0 | ~3.5 | 5x like value |
| Bookmark | 0.5-1.2 | ~0.85 | Slightly > like |
| Downvote | -0.4 (flat) | -0.4 | Unweighted! |

**Why Random?** Prevents gaming, adds natural variance, complements fuzzing

---

## 📊 Progressive Weight Table (Logarithmic - Capped)

| Liker Reputation | Formula | Weight | Tier | Notes |
|-----------------|---------|--------|------|-------|
| 10 | log10(10)/2 | 0.5x | Newcomer 🌱 | |
| 100 | log10(100)/2 | 1.0x | Regular 📈 | Baseline |
| 1,000 | log10(1k)/2 | 1.5x | Established 🔥 | |
| 10,000 | log10(10k)/2 | 2.0x | Elite 👑 | |
| 100,000 | log10(100k)/2 | 2.5x | Legend 💎 | |
| 1,000,000 | log10(1M)/2 | 3.0x | **CAPPED** 🏆 | Immortal |
| 10,000,000 | log10(10M)/2 | 3.0x | **CAPPED** 🏆 | Still 3.0x |

**Key**: Weight locked at 3.0x forever after 1M rep (prevents inflation)

---

## 💬 Comments Calculation (Ultra-Simplified)

```javascript
// Users earn rep ONLY from likes on their comments
commentLikeValue = 0.35; // FLAT value (unweighted, always)

// No rep for:
- Posting comments (0 rep)
- Comment quality (no bonuses)
- Reply depth (no bonuses)
- Comment age (no decay)

// Example:
Comment gets 10 likes → 10 × 0.35 = 3.5 rep
Comment gets 100 likes → 100 × 0.35 = 35 rep
```

### Comment Likes vs Post Likes

| Engagement | Value | Weighted? | Age Decay? |
|------------|-------|-----------|------------|
| Like on post | 0.4-1.0 base × 0.5-3.0 weight | ✅ Yes | ✅ Yes |
| Like on comment | 0.35 flat | ❌ No | ❌ No |

**Why Different?**
- Comments harder to discover (no weighting needed)
- Secondary content (half value)
- Simpler system (no calculations)
- Fair for all users

### Comment Downvotes

```javascript
// Same as posts
downvoteValue = -0.4 (unweighted)
hideThreshold = -5 (13 downvotes)

// Deducts from:
total reputation ✅
legacy reputation ✅
comments counter ✅
// Active recalculates automatically
```

---

## 🔄 Reposts Calculation (Quality Endorsement)

```javascript
// Original author earns rep when their post is reposted
repostValue =
  random(2.0, 5.0) *                      // High base (strong endorsement)
  getProgressiveWeight(reposter.rep) *    // Weighted 0.5x-3.0x
  calculateAgeMultiplier(postAge) *       // Age decay 1.0x → 0.3x
  applySoftCapIfFlagged(author);          // Only for flagged

// Reposter earns 0 reputation (prevents spam)
```

### Repost Values vs Other Engagement

| Engagement | Base Value | Weighted? | Age Decay? | Author Gets? |
|------------|-----------|-----------|------------|--------------|
| Like | 0.4-1.0 | ✅ Yes | ✅ Yes | ✅ Yes |
| Comment like | 0.35 flat | ❌ No | ❌ No | ✅ Yes |
| **Repost** | **2.0-5.0** | **✅ Yes** | **✅ Yes** | **✅ Yes** |
| Bookmark | 0.5-1.2 | TBD | TBD | ✅ Yes |

### Why 2.0-5.0 (Much Higher)?

**1 repost ≈ 10 likes in value!**

- Strong endorsement (deliberate action)
- Amplifies reach to followers
- Indicates high-quality content
- Less frequent than likes
- More effort required

### Repost Weight Examples

| Reposter Rep | Weight | Base 3.5 × Weight | Final (new post) |
|--------------|--------|-------------------|------------------|
| 50 (newcomer) | 0.5x | 1.75 points | 1.75 |
| 1,000 (veteran) | 1.5x | 5.25 points | 5.25 |
| 10,000 (expert) | 2.0x | 7.0 points | 7.0 |
| 500,000 (legendary) | 2.85x | 9.98 points | 9.98 |

**Legendary user repost = ~10 points (14x a like!)** ✅

### Anti-Spam Rules

```javascript
// Cannot repost own content ❌
// Cannot repost same post twice ❌
// Cannot repost deleted/hidden posts ❌
// Unique compound index enforces rules
```

### IP Rate Limits (Stricter)

```javascript
MAX_REPOSTS_PER_IP_PER_MINUTE: 2   // vs 10 for likes
MAX_REPOSTS_PER_IP_PER_HOUR: 20    // vs 60 for likes
CAPTCHA_AFTER: 10 reposts in 10 min
AUTO_BAN: 15 reposts/minute
```

---

## 📊 Source-Based Reputation Tracking

```javascript
// 4+ separate values displayed
Total: 3,247
├─ Active: 2,647
├─ Legacy: 600
└─ By Source:
   📝 Posts: 1,800 (55%)
   🔁 Reposts: 700 (22%)  // ← NEW
   💬 Comments: 150 (5%)
   🔖 Bookmarks: 97 (3%)
```

**Schema**:
```javascript
socialStats: {
  reputation: 3247,              // Total
  activeReputation: 2647,        // Time-based
  legacyReputation: 600,         // Historical
  
  postsReputation: 1800,         // From post likes
  repostsReputation: 700,        // From reposts ✨ NEW
  commentsReputation: 150,       // From comment likes
  bookmarksReputation: 97,       // From bookmarks
}
```

---

## 🌟 Early Vote Bonus (Discovery Incentive)

| Time Since Post | Bonus | Why |
|----------------|-------|-----|
| 0-15 min | 2.0x-1.75x | Critical discovery |
| 15-30 min | 1.75x-1.5x | Early adopter |
| 30-60 min | 1.5x-1.0x | Still early |
| 1-6 hours | 1.0x-0.8x | Standard |
| 6+ hours | 0.8x | Late penalty |

**Formula**: `2.0 - (minutesSincePost / 60)` for first hour

---

## ⏰ Age Multiplier (Old Post Penalty)

| Post Age | Multiplier | Why |
|----------|------------|-----|
| 0-7 days | 1.0x | New - full value |
| 8-30 days | 0.8x | Month old |
| 31-90 days | 0.4x | Quarter old |
| 91+ days | 0.3x | Old - floor (still earns) |

**Prevents** old post spam while allowing evergreen content to earn (at reduced rate)

---

## 📊 Engagement Systems (Dual Purpose)

### System 1: Trending Score (Feed Priority)
```javascript
trendingScore = (likes + comments*2 + reposts*3 + bookmarks*1.5) / views * ageDecay * 1000
```
**Used for**: Feed ordering, discovery, "trending" section

### System 2: Engagement Multiplier (Rep Bonus)
```javascript
engagementMultiplier = 1.0 + (ratio * 0.05) // Max 1.05x
```
**Used for**: Tiny reputation bonus for high-engagement posts

---

## 🔻 Downvotes (Unweighted - Fair for All)

```javascript
// All users have equal downvote power
downvoteValue = -0.4 (flat, not weighted)

// Post score
postScore = Σ(weighted upvotes) - Σ(flat downvotes)

// Auto-hide
if (postScore < -10) post.visibility = 'hidden'; // 25 downvotes required
```

**Why unweighted?** Prevents veteran gatekeeping, encourages newcomer participation

---

## 🛡️ 4-Layer Bot Defense (NO HARD CAPS for Clean Users)

### Layer 1: IP Rate Limiting
- 10 likes/min per IP
- 60 likes/hour per IP
- CAPTCHA after 20 likes in 10-min window (60-min cooldown)
- Instant ban at 50 likes/min

### Layer 2: Technical Bot Detection
- Automation headers (Puppeteer, Playwright)
- Request timing patterns
- IP blacklist check
- Device fingerprint duplication
- 2+ flags = instant ban

### Layer 3: Soft Caps (Flagged Accounts Only)
- ONLY for accounts with 2+ suspicion flags
- After 100 rep/day: logarithmic slowdown
- Clean users: NEVER capped

### Layer 4: Reputation Reversal
- After ban: Remove all bot engagements
- Subtract reputation from victims
- Log for audit trail

**Philosophy**: Let bots game short-term → ban efficiently → reverse damage → deter future bots

---

## 🕐 Active vs Legacy Split

```javascript
activeRep = Σ(reputationFromLast180Days * timeDecay);
legacyRep = Σ(allTimeReputation) * 0.2; // Permanent
totalRep = activeRep + legacyRep;
```

**Display**:
```
Total: 2,547
Active (80%): 2,047
Legacy (20%): 500
```

---

## ⏰ Time Decay (Active Only)

| Age | Decay | Effective | Notes |
|-----|-------|-----------|-------|
| 0d | 1.000 | 100% | |
| 30d | 0.985 | 98.5% | |
| 90d | 0.956 | 95.6% | |
| 180d | 0.914 | 91.4% | Moves to legacy |
| 365d+ | N/A | 20% as legacy | Permanent |

---

## 🎭 Stable Fuzzing

```javascript
// OLD (v2.0): Random every load
fuzzed = actual + random(-5%, +5%) // Changes constantly ❌

// NEW (v3.0): Stable until rep changes
fuzzed = actual + (seed % 11 - 5)  // Consistent ✅

// Example:
Actual: 2,547 → Displayed: 2,552 (consistent across loads)
After gaining 15 rep → Actual: 2,562 → Displayed: 2,567 (new stable value)
```

---

## 💡 Example Scenarios

### Scenario A: New User, Viral Post (Clean Account)
- Post: 100 likes in 2 hours (organic growth)
- Base: ~0.7/like × Weight: ~1.2 × Early: ~1.3 × Age: 1.0 = ~1.09/like
- Total: ~109 rep points
- **NO CAPS** (clean account) ✅

### Scenario B: Flagged Account, Viral Post
- Post: 1000 likes in 1 hour (suspicious)
- Flagged (2+ suspicion flags)
- First 250 likes: Full value → 100 rep
- Next 750 likes: Soft capped → 50 rep
- Total: 150 rep (vs 700 for clean account)

### Scenario C: Old Post Engagement
- Post: 120 days old, gets 10 likes
- Base: ~0.7/like × Weight: ~1.2 × Age: 0.3 = ~0.25/like
- Total: ~2.5 rep points (old post penalty working)

---

## 🚫 What's NOT Capped (Clean Users)

- ✅ Likes received: Unlimited
- ✅ Reputation earned per day: Unlimited
- ✅ Reputation earned per hour: Unlimited
- ✅ Reputation earned per like: Based on formula (no artificial caps)

**Only capped**: Downvotes (50/day), IP rate limits (60 likes/hour)

---

## 🔧 Quick Implementation Checklist

### MVP (Launch)
- [ ] Base value system (random 0.4-1.0)
- [ ] Progressive weight (logarithmic)
- [ ] Early vote bonus
- [ ] Age multiplier (diminishing)
- [ ] IP rate limiting (60/hour)
- [ ] CAPTCHA (20 in 10 min)
- [ ] Technical bot detection
- [ ] Instant bans (50/min or 2+ flags)
- [ ] Soft caps for flagged accounts
- [ ] Reputation reversal after ban
- [ ] Unweighted downvotes
- [ ] Stable fuzzing
- [ ] Bookmark tracking
- [ ] Incentives at 0 rep

### Phase 2 (After Monitoring)
- [ ] Pattern-based detection
- [ ] Machine learning bot classification
- [ ] Advanced velocity spike detection
- [ ] Community moderation tools

---

## 📊 Timeline Goal

**Heavy Users** (top 1% most active - viral creators):
- Posts/likes: ~400k
- Reposts: ~15k (50 reposts/month × 3.5 avg × 1.2 weight)
- Comments: ~16k (150 comments/month × 5 likes × 0.35)
- Bookmarks: ~20k
- **Year 5 Total: ~451k-500k reputation (TARGET)** ✅

**Average Active Users** (balanced engagement):
- Posts/likes: ~35k
- Reposts: ~4.5k (20 reposts/month × 3.5 avg × 1.2 weight)
- Comments: ~5k (50 comments/month × 5 likes × 0.35)
- Bookmarks: ~3k
- **Year 5 Total: ~47.5k reputation**

**Casual Users** (light engagement):
- Posts/likes: ~8k
- Reposts: ~1k (5 reposts/month × 3.5 avg × 1.0 weight)
- Comments: ~1k (10 comments/month × 5 likes × 0.35)
- Bookmarks: ~500
- **Year 5 Total: ~10.5k reputation**

### Source Breakdown (Active User, 5 Years)
- 📝 Posts: 35,000 (74%)
- 🔁 Reposts: 4,500 (9%)  // ← NEW
- 💬 Comments: 5,250 (11%)
- 🔖 Bookmarks: 3,000 (6%)

---

**For full details, see:**
- **[01_LIKES_CALCULATION.md](./01_LIKES_CALCULATION.md)** - Likes system (v3.0)
- **[02_COMMENTS_CALCULATION.md](./02_COMMENTS_CALCULATION.md)** - Comments system (v3.0 Simplified)
- **[03_REPOSTS_CALCULATION.md](./03_REPOSTS_CALCULATION.md)** - Reposts system (v3.0 Quality Endorsement)
- **[README.md](./README.md)** - Overview and roadmap

---

**Current Version**: 3.0 (Inflation-Controlled + Bot Defense + Source Tracking)  
**Status**: MVP Ready (Likes + Comments + Reposts Complete)  
**Updated**: November 12, 2025
