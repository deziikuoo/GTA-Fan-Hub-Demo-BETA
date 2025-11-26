# Reputation System - Likes Calculation

## ✨ Updated with Reddit-Inspired Enhancements

## 📊 Overview

This document outlines the professional calculation system for reputation points earned from **Likes Received** on posts. This system combines our sophisticated quality metrics with Reddit's battle-tested anti-gaming techniques.

---

## 🎯 Core Formula (Hybrid System - Inflation-Controlled)

```javascript
// Per-engagement calculation
engagementValue =
  getBaseValue(engagementType) *              // Random 0.4-1.0 (likes), scaled for others
  getProgressiveWeight(liker.reputation) *    // Logarithmic, caps at 3.0x
  earlyVoteBonus(post, engagement) *          // 2.0x → 0.8x over 6 hours
  calculateAgeMultiplier(postAge) *           // 1.0x → 0.3x floor for old posts
  getEngagementMultiplier(post) *             // Small 1.05x bonus for high engagement
  (1 - downvotesPenalty(post)) *              // 0.4 flat per downvote (unweighted)
  applySoftCapIfFlagged(user);                // Only for suspicious accounts

// Aggregate reputation
activeReputation = Σ(engagementValue for last 180 days with decay);
legacyReputation = Σ(all-time engagementValue) * 0.2;
totalReputation = activeReputation + legacyReputation;

// Display with stable fuzzing (anti-gaming)
displayedReputation = stableFuzzValue(totalReputation); // Fixed until rep changes
```

**Timeline Goal**: Heavy users reach ~500k reputation in 5 years

---

## 💎 Component 1: Progressive Weight System

### Purpose

Prevent reputation inflation while rewarding quality engagement. Uses **logarithmic scaling** instead of fixed tiers to ensure sustainable growth even after years of use.

### Progressive Weight Formula

```javascript
function getProgressiveWeight(likerReputation) {
  // Logarithmic scaling prevents indefinite inflation
  // As reputation grows, weight increases but with diminishing returns

  const baseWeight = Math.log10(Math.max(likerReputation, 1)) / 2;

  // Cap at 3.0x to prevent obscene multipliers from ancient accounts
  const cappedWeight = Math.min(baseWeight, 3.0);

  // Minimum floor for new users
  return Math.max(cappedWeight, 0.3);
}
```

### Weight Scaling Table

| Liker Reputation | Log Calculation | Raw Weight | Final Weight   | Tier Label  |
| ---------------- | --------------- | ---------- | -------------- | ----------- |
| 10               | log10(10)/2     | 0.5        | 0.5x           | Newcomer    |
| 100              | log10(100)/2    | 1.0        | 1.0x           | Regular     |
| 500              | log10(500)/2    | 1.35       | 1.35x          | Active      |
| 1,000            | log10(1000)/2   | 1.5        | 1.5x           | Established |
| 5,000            | log10(5000)/2   | 1.85       | 1.85x          | Veteran     |
| 10,000           | log10(10000)/2  | 2.0        | 2.0x           | Elite       |
| 50,000           | log10(50000)/2  | 2.35       | 2.35x          | Master      |
| 100,000          | log10(100k)/2   | 2.5        | 2.5x           | Legend      |
| 1,000,000        | log10(1M)/2     | 3.0        | **3.0x (CAP)** | Immortal    |
| 10,000,000       | log10(10M)/2    | 3.5        | **3.0x (CAP)** | Immortal    |

### Why Logarithmic Scaling?

**Problem with Fixed Tiers (Old Plan):**

```javascript
// After 5 years, if you have 1000 legendary users (10k+ rep)
// Each like from legendary = 5x weight
// A post with 100 legendary likes = 500 weighted points
// This causes OBSCENE inflation over time ❌
```

**Solution with Logarithmic (New Plan):**

```javascript
// Even users with 1M reputation only give 3x weight
// Natural diminishing returns
// Sustainable even after decades ✅
```

**Visual Curve:**

```
Weight
3.0 |                    _______________  (cap)
2.5 |              _____/
2.0 |         ____/
1.5 |    ____/
1.0 |___/
0.5 |/
    |_________________________________
    10  100  1K   10K  100K  1M  10M  Reputation
```

### Reputation Tier Labels (Display Only)

```javascript
function getReputationTierLabel(reputation) {
  if (reputation >= 100000)
    return { tier: "Immortal", badge: "🏆", color: "gold" };
  if (reputation >= 50000)
    return { tier: "Legend", badge: "💎", color: "platinum" };
  if (reputation >= 10000)
    return { tier: "Elite", badge: "👑", color: "purple" };
  if (reputation >= 5000)
    return { tier: "Veteran", badge: "⭐", color: "blue" };
  if (reputation >= 1000)
    return { tier: "Established", badge: "🔥", color: "orange" };
  if (reputation >= 500) return { tier: "Active", badge: "✨", color: "green" };
  if (reputation >= 100) return { tier: "Regular", badge: "📈", color: "teal" };
  return { tier: "Newcomer", badge: "🌱", color: "gray" };
}
```

---

## 🎲 Component 2: Base Reputation Values (Foundation)

### Purpose

Establish base values for each engagement type. Random range prevents gaming and adds natural variance.

### Base Value System

```javascript
// Random base values per engagement type
const BASE_REPUTATION = {
  LIKE: () => random(0.4, 1.0), // 0.4-1.0 points
  COMMENT: () => random(1.2, 3.0), // 3x like value
  REPOST: () => random(2.0, 5.0), // 5x like value
  BOOKMARK: () => random(0.5, 1.2), // Slightly higher than like
};

function getBaseValue(engagementType) {
  return BASE_REPUTATION[engagementType]();
}

// Example calls:
getBaseValue("LIKE"); // Returns: 0.73 (random)
getBaseValue("COMMENT"); // Returns: 2.15 (random)
getBaseValue("REPOST"); // Returns: 3.84 (random)
getBaseValue("BOOKMARK"); // Returns: 0.91 (random)
```

### Why Random Range?

**Benefits:**

1. **Anti-Gaming**: Users can't calculate exact reputation gain
2. **Natural Variance**: Mimics real-world unpredictability
3. **Reduces Obsession**: Small variations aren't meaningful
4. **Complements Fuzzing**: Double layer of obfuscation

**Example:**

```javascript
// Same post, 2 different likes
Like A: 0.68 base × 1.5 weight = 1.02 points
Like B: 0.91 base × 1.5 weight = 1.37 points

// Both from same tier user, but natural variance
```

---

## 🌟 Component 3: Early Vote Bonus (Reddit's Discovery Incentive)

### Purpose

Reward users who discover and upvote quality content early. This is **Reddit's secret to effective crowdsourced curation**.

### Formula

```javascript
function calculateEarlyVoteBonus(post, like) {
  const postAgeMinutes = (like.timestamp - post.createdAt) / 60000;

  // First hour is CRITICAL
  if (postAgeMinutes < 60) {
    // Bonus decreases linearly from 2.0x → 1.25x over first hour
    const bonus = 2.0 - (postAgeMinutes / 60) * 0.75;
    return bonus;
  }

  // Hours 1-2: Final early window
  if (postAgeMinutes < 120) {
    // 1.25x → 1.0x over second hour
    const bonus = 1.25 - ((postAgeMinutes - 60) / 60) * 0.25;
    return bonus;
  }

  // After 2 hours: Standard weight (no bonus)
  return 1.0; // No penalty or bonus after 2 hours
}
```

### Early Vote Bonus Schedule

| Time Since Post | Bonus Multiplier | Why                       |
| --------------- | ---------------- | ------------------------- |
| 0-15 minutes    | 2.0x - 1.75x     | Critical discovery window |
| 15-30 minutes   | 1.75x - 1.5x     | Early adopter bonus       |
| 30-60 minutes   | 1.5x - 1.25x     | Still early, good timing  |
| 1-2 hours       | 1.25x - 1.0x     | Final early window        |
| 2+ hours        | 1.0x             | Standard engagement (no bonus) |

### Why This Matters

**Without early bonus:**

- Users wait to see what's popular
- Good content dies before discovery
- No incentive to sort by "New"

**With early bonus:**

- Users actively seek quality content
- Good posts rise faster
- Community becomes active curators
- Prevents herd mentality

**Example:**

```javascript
// Post A: User likes in first 5 minutes
reputationGain = baseValue * 1.9x (early bonus)

// Post B: User likes after 12 hours
reputationGain = baseValue * 0.8x (late penalty)

// Same weighted user, but early discovery rewarded!
```

---

## 📊 Component 4: Dual Engagement Systems

### Purpose

Separate **post visibility (trending)** from **author rewards (reputation)** for clarity and control.

### System 1: Trending Score (Post Priority in Feed)

```javascript
function calculateTrendingScore(post) {
  const engagementRatio =
    (post.likes * 1 +
      post.comments * 2 +
      post.reposts * 3 +
      post.bookmarks * 1.5) /
    post.views;

  const ageDecay = 1 / (hoursSincePost + 1); // Newer = higher priority

  return engagementRatio * ageDecay * 1000; // Higher score = more visible
}

// Used for: Feed ordering, "Trending" section, discovery algorithms
```

### System 2: Engagement Multiplier (Author Reputation Bonus)

```javascript
function getEngagementMultiplier(post) {
  const ratio = calculateEngagementRatio(post); // Same calculation as trending

  // Small bonus for high-engagement posts (reduced from 2.0x)
  return 1.0 + ratio * 0.05; // Max 1.05x bonus
}

// Used for: Author reputation calculation (minor inflation-controlled bonus)
```

**Example:**

- Post with 10% engagement ratio:
  - **Trending Score**: High (appears at top of feed)
  - **Rep Multiplier**: 1.005x (tiny bonus to author)

**Both systems use same ratio, different purposes!**

---

## ⏰ Component 5: Age-Based Diminishing (Old Post Penalty)

### Purpose

Reward new content while allowing old posts to still earn reputation (with floor). Prevents like spamming on old posts.

### Age Multiplier Formula

```javascript
function calculateAgeMultiplier(postAgeInDays) {
  if (postAgeInDays <= 7) return 1.0; // New: full value
  if (postAgeInDays <= 30) return 0.8; // Month old: 80%
  if (postAgeInDays <= 90) return 0.4; // 3 months: 40%
  return 0.3; // Old: 30% floor
}
```

### Age Multiplier Schedule

| Post Age   | Multiplier | Rationale                              |
| ---------- | ---------- | -------------------------------------- |
| 0-7 days   | 1.0x       | Fresh content - full value             |
| 8-30 days  | 0.8x       | Month old - slight reduction           |
| 31-90 days | 0.4x       | Quarter old - significant reduction    |
| 91+ days   | 0.3x       | Old - floor (still earns, but minimal) |

### Why Age-Based (Not Evergreen)?

**Old System (Evergreen Bonus):**

- ❌ Rewards old posts that still get engagement
- ❌ Allows like circles to spam old posts for points
- ❌ No floor - can be gamed

**New System (Age Penalty with Floor):**

- ✅ Prioritizes new content (full value)
- ✅ Old posts still earn (30% floor is fair)
- ✅ Prevents old post spam (diminishing returns)
- ✅ Simple and predictable

**Example:**

```javascript
// 60-day-old post gets liked
Base: 0.7 points × Age: 0.4 × Weight: 1.2 = 0.336 points

// Same post if it were new (7 days)
Base: 0.7 points × Age: 1.0 × Weight: 1.2 = 0.840 points

// Creator still rewarded for old quality content, just less
```

---

## ⏰ Component 6: Hybrid Time System (Active + Legacy)

### Purpose

Balance between rewarding current activity and respecting historical contributions.

### Split Reputation Model

```javascript
// Active Reputation (Decays)
function calculateActiveReputation(user) {
  const cutoffDate = Date.now() - 180 * 24 * 60 * 60 * 1000; // 180 days

  let activeRep = 0;

  // Sum all reputation from last 6 months with decay
  for (const event of user.reputationHistory) {
    if (event.timestamp > cutoffDate) {
      const daysSince = (Date.now() - event.timestamp) / (1000 * 60 * 60 * 24);
      const decayFactor = calculateTimeDecay(daysSince);
      activeRep += event.value * decayFactor;
    }
  }

  return activeRep;
}

// Legacy Reputation (Permanent)
function calculateLegacyReputation(user) {
  // Sum ALL historical reputation earnings
  const allTimeEarned = user.reputationHistory.reduce((sum, event) => {
    return sum + Math.max(0, event.value); // Only positive gains count toward legacy
  }, 0);

  // Legacy = 20% of all-time earned (permanent bonus)
  return allTimeEarned * 0.2;
}

// Total Reputation
function calculateTotalReputation(user) {
  const active = calculateActiveReputation(user);
  const legacy = calculateLegacyReputation(user);

  return {
    active: Math.round(active),
    legacy: Math.round(legacy),
    total: Math.round(active + legacy),
    breakdown: {
      activePercentage: ((active / (active + legacy)) * 100).toFixed(1),
      legacyPercentage: ((legacy / (active + legacy)) * 100).toFixed(1),
    },
  };
}
```

### Display Format

```javascript
// In UI, show breakdown
<div class="reputation-display">
  <div class="total-reputation">2,547</div>
  <div class="reputation-breakdown">
    <span class="active-rep">2,047 Active</span>
    <span class="legacy-rep">500 Legacy</span>
  </div>
</div>

// Tooltip on hover:
"Active: Reputation from last 6 months
Legacy: 20% of all-time earned (permanent)"
```

### Reverse Engineering Risk: **4/10 - Low-Medium**

**What Users See:**

- Active: 2,047
- Legacy: 500
- Total: 2,547

**What They Can Guess:**

- Legacy is ~20% of historical earnings
- Active is recent activity
- Approximate ratio

**What They CANNOT Determine:**

- Exact decay rate (hidden constant)
- Individual contribution values (fuzzing)
- Which source (likes vs comments vs posts)
- Exact cutoff date for "active" period
- Historical all-time total (legacy only shows 20%)

**Protection Layers:**

1. ✅ Vote fuzzing (±5% variance)
2. ✅ Multiple hidden variables
3. ✅ Logarithmic formulas (non-obvious)
4. ✅ Can't see individual transaction values
5. ✅ Legacy is derivative (20% of unknown total)

**Verdict**: Would require extensive data collection over months and sophisticated statistical analysis to approximate. Not worth the effort for most users.

---

## ⏱️ Component 7: Time Decay Factor

### Purpose

Recent activity should matter more than old activity. Keeps reputation dynamic and current.

### Decay Formula

```javascript
function calculateTimeDecay(daysSinceLike) {
  // Exponential decay with gentle slope
  const DECAY_RATE = 0.0005; // Hidden constant
  return Math.exp(-DECAY_RATE * daysSinceLike);
}
```

### Decay Schedule (Active Reputation Only)

| Days Since Like | Decay Factor | Effective Weight |
| --------------- | ------------ | ---------------- |
| 0 (today)       | 1.000        | 100%             |
| 30 days         | 0.985        | 98.5%            |
| 90 days         | 0.956        | 95.6%            |
| 180 days        | 0.914        | 91.4%            |
| 365 days        | 0.835        | 83.5%\*          |
| 730 days (2yr)  | 0.698        | 69.8%\*          |

\*After 180 days, moves to Legacy (permanent 20%)

### Why This Decay Curve?

1. **Gentle Decline**: Doesn't punish historical contributions too harshly
2. **Meaningful**: Old likes still matter (via Legacy component)
3. **Incentivizes Activity**: Keeps users engaged for reputation maintenance
4. **Fair**: Historical achievements preserved as Legacy
5. **Dynamic**: Active reputation reflects current standing

---

## 🔻 Component 8: Downvotes (Unweighted Community Feedback)

### Purpose

Community self-policing with **equal voting power for all users**. Prevents veteran opinion dominance.

### Downvote System (UNWEIGHTED)

```javascript
// When user downvotes a post
async function handleDownvote(postId, voterId) {
  const post = await Post.findById(postId);
  const voter = await User.findById(voterId);

  // Prevent self-downvoting
  if (post.author.equals(voterId)) {
    throw new Error("Cannot downvote your own post");
  }

  // Downvote value (FLAT - not weighted by reputation)
  const DOWNVOTE_VALUE = -0.4; // Fixed value for all users

  // Apply to post author
  const author = await User.findById(post.author);
  author.socialStats.reputation += DOWNVOTE_VALUE;

  // Floor reputation at 0 (cannot go negative)
  if (author.socialStats.reputation < 0) {
    author.socialStats.reputation = 0;
  }

  // Track downvote
  post.downvotes.push({
    userId: voterId,
    timestamp: Date.now(),
    reputationImpact: DOWNVOTE_VALUE,
  });

  post.engagement.downvotes = post.downvotes.length;

  await author.save();
  await post.save();

  return {
    downvoted: true,
    reputationChange: DOWNVOTE_VALUE,
    postScore: calculatePostScore(post),
  };
}
```

### Downvote Rules

```javascript
const DOWNVOTE_RULES = {
  // Downvote costs nothing to voter
  costToVoter: 0,

  // Flat value (not weighted by reputation)
  downvoteValue: -0.4, // All users equal voting power

  // Limited to prevent abuse
  maxDownvotesPerDay: 50,
  maxDownvotesPerHour: 10,

  // Heavily downvoted posts get hidden
  hideThreshold: -10, // 25 downvotes required to hide

  // Auto-flag for review
  autoFlagThreshold: -50, // 125 downvotes = moderator review
};
```

### Post Score Calculation (Unweighted Downvotes)

```javascript
function calculatePostScore(post) {
  // Upvotes: Weighted by reputation (rewards quality engagement)
  const upvoteScore = post.likes.reduce((sum, like) => {
    return sum + getProgressiveWeight(like.userReputation);
  }, 0);

  // Downvotes: Unweighted (all users equal power)
  const downvoteScore = post.downvotes.length * 0.4; // Flat 0.4 per downvote

  return upvoteScore - downvoteScore;
}
```

### Why Unweighted Downvotes?

**Reasoning:**

- ✅ **Fair**: Newcomers and veterans have equal say in quality control
- ✅ **Encourages Participation**: New users aren't afraid to voice concerns
- ✅ **Community-Driven**: Majority opinion, not veteran elite
- ✅ **Prevents Gatekeeping**: High-rep users can't silence content alone

**Upvotes remain weighted** to reward quality engagement and prevent new account spam.

### Auto-Hide Logic

```javascript
// Posts with negative score get hidden
if (calculatePostScore(post) < DOWNVOTE_RULES.hideThreshold) {
  post.visibility = "hidden";
  post.hideReason = "community_downvoted";
}

// Severe cases get flagged
if (calculatePostScore(post) < DOWNVOTE_RULES.autoFlagThreshold) {
  post.status = "under_review";
  await notifyModerators(post, "heavily_downvoted");
}
```

---

## 🎭 Component 9: Stable Vote Fuzzing (Anti-Gaming)

### Purpose

Prevent users from A/B testing manipulation tactics by hiding exact reputation values.

### Stable Fuzzing Formula (Improved)

```javascript
function stableFuzzValue(actualValue) {
  // Generate stable fuzz based on value itself (not random)
  const seed = Math.floor(actualValue / 10); // Changes only when rep changes by 10+
  const fuzzOffset = (seed % 11) - 5; // -5 to +5 range

  return actualValue + fuzzOffset;
}

// Apply to displayed values
const displayedReputation = {
  active: stableFuzzValue(actualActive),
  legacy: stableFuzzValue(actualLegacy),
  total: stableFuzzValue(actualTotal),
};
```

### Stable Fuzzing Strategy

```javascript
// Fuzz displayed values
displayToUser: fuzzed (STABLE until reputation actually changes)
storeInDatabase: actual (never fuzzed)
useForCalculations: actual (accurate)
showInAdminPanel: actual (for moderation)

// Fuzzing characteristics
fuzzAmount: ±5 points (fixed offset based on value)
regenerateOn: When reputation changes by 10+ points
consistent: true (same value across page loads until rep changes)
```

### Example (Stable Fuzzing)

```
Actual Reputation: 2,547
User sees:
- Load 1: 2,552 (consistent)
- Load 2: 2,552 (same value)
- Load 3: 2,552 (still same)
- After gaining 15 rep → 2,562 actual → displayed: 2,567

Fuzzed value stays consistent until actual changes
Much better UX than random changes
```

### Why Stable Over Random?

**Old (Random Every Load):**

- ❌ Confusing UX (why does it keep changing?)
- ❌ Users refresh obsessively to see "real" value
- ❌ Feels buggy/broken

**New (Stable Until Change):**

- ✅ Consistent experience
- ✅ Users trust the displayed value
- ✅ Still prevents reverse engineering (offset is deterministic but obscure)
- ✅ Changes only when reputation actually changes

### Anti-Gaming Benefits

1. **Can't Test Manipulation**: User can't tell if their bot worked or if it's just fuzzing
2. **Reduces Obsession**: Small changes aren't worth worrying about
3. **Prevents Coordination**: Groups can't precisely track their impact
4. **Statistical Noise**: Makes reverse engineering much harder

---

## 🛡️ 4-Layer Bot Defense System

### Philosophy

**Allow organic viral growth** while catching and banning bots efficiently. No hard reputation caps for clean users. Soft caps only for flagged accounts.

---

### Layer 1: IP Rate Limiting (First Defense)

```javascript
const IP_LIMITS = {
  // Engagement rate limits (prevent bot spam)
  MAX_LIKES_PER_IP_PER_MINUTE: 10, // Strict per-minute
  MAX_LIKES_PER_IP_PER_HOUR: 60, // Instagram-style hourly

  // CAPTCHA system (rate-based, not count-based)
  REQUIRE_CAPTCHA_AFTER: 20, // 20 likes in rolling window
  CAPTCHA_ROLLING_WINDOW: 10, // 10-minute window
  CAPTCHA_COOLDOWN: 60, // Solved = good for 60 minutes

  // Progressive tier system (NO instant ban)
  TIER_1_THRESHOLD: 50, // 50 likes/minute = Tier 1

  // Downvote limits (prevent downvote abuse)
  MAX_DOWNVOTES_PER_DAY: 50,
  MAX_DOWNVOTES_PER_HOUR: 10,
};

// Progressive Tier System (Replaces Instant Ban)
const RATE_LIMIT_TIERS = {
  TIER_1: {
    trigger: 50, // 50 likes/minute
    punishment: 'LIKE_PAUSE',
    duration: 5 * 60 * 60 * 1000, // 5 hours
    message: 'Liking paused for 5 hours. Please slow down.',
  },
  
  TIER_2: {
    trigger: 'TIER_1_WITHIN_7_DAYS',
    punishment: 'LIKE_PAUSE',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    message: 'Liking paused for 24 hours. Repeated violations detected.',
  },
  
  TIER_3: {
    trigger: 'TIER_2_WITHIN_30_DAYS',
    punishment: 'LIKE_PAUSE',
    duration: 72 * 60 * 60 * 1000, // 72 hours
    message: 'Liking paused for 72 hours. ⚠️ WARNING: Account suspension pending.',
    emailNotification: true,
  },
  
  TIER_4: {
    trigger: 'TIER_3_WITHIN_60_DAYS',
    punishment: 'ACCOUNT_SUSPENSION',
    duration: 14 * 24 * 60 * 60 * 1000, // 2 weeks
    message: '⚠️ SUSPENDED: Your account is suspended for 2 weeks. Final warning.',
    emailNotification: true,
  },
  
  TIER_5: {
    trigger: 'TIER_4_VIOLATION',
    punishment: 'PERMANENT_BAN',
    message: '🚫 BANNED: Your account has been permanently banned. Account will be deleted in 30 days.',
    accountDeletion: 30, // days grace period
    emailNotification: true,
  },
};

// Track violation history per user
user.violationHistory = [
  { type: 'like_rate_limit', tier: 1, timestamp: Date.now() },
  { type: 'like_rate_limit', tier: 2, timestamp: Date.now() },
];

// Reset after 6 months clean
if (lastViolation > 6 months ago) {
  user.currentTier = 0; // Reset to clean slate
}

// CAPTCHA logic (rate-based)
async function checkCaptchaRequired(userId) {
  const likesInLast10Min = await getLikeCount(userId, 10); // Last 10 minutes
  const lastCaptchaSolved = await getLastCaptchaTime(userId);
  const minutesSinceCaptcha = (Date.now() - lastCaptchaSolved) / 60000;

  // Need CAPTCHA if:
  // - 20+ likes in last 10 minutes AND
  // - More than 60 minutes since last CAPTCHA solved
  if (likesInLast10Min >= 20 && minutesSinceCaptcha > 60) {
    return true;
  }

  return false;
}

// Example flow:
// User likes 20 posts in 5 minutes → CAPTCHA required
// Solves CAPTCHA → Can like 200 posts in next hour without CAPTCHA
// After 60 minutes, if they hit 20 in 10 min again → new CAPTCHA
```

---

### Layer 2: Real-Time Bot Detection (Technical Checks)

```javascript
async function detectBot(req) {
  const flags = [];

  // Check 1: Automation headers (Puppeteer, Playwright, Selenium)
  if (
    req.headers["user-agent"].includes("HeadlessChrome") ||
    req.headers["user-agent"].includes("Selenium") ||
    req.headers["webdriver"]
  ) {
    flags.push("automation");
  }

  // Check 2: Request timing patterns (too perfect/consistent)
  const requestTimes = await getRecentRequestTimes(req.user.id, 10);
  const timingsIdentical = requestTimes.every(
    (time, i, arr) => i === 0 || Math.abs(time - arr[i - 1]) < 10
  ); // <10ms variance = bot

  if (timingsIdentical) {
    flags.push("scripted");
  }

  // Check 3: IP reputation (known bot farms/proxies)
  if (await checkIPBlacklist(req.ip)) {
    flags.push("blacklisted_ip");
  }

  // Check 4: Device fingerprint (duplicate devices)
  const duplicateCount = await checkDuplicateFingerprint(req.fingerprint);
  if (duplicateCount > 3) {
    // Same fingerprint from 4+ accounts
    flags.push("clone_device");
  }

  // 2+ flags = instant ban
  if (flags.length >= 2) {
    await banIPAndAccount(req.ip, req.user.id);
    return { isBot: true, action: "banned", flags };
  }

  return { isBot: false, suspicionFlags: flags.length };
}
```

---

### Layer 3: Soft Caps (Fallback for Flagged Accounts Only)

```javascript
// ONLY applies to accounts with 2+ suspicion flags
// Clean accounts: NEVER experience any caps

async function applySoftCapIfFlagged(userId, reputationGain) {
  const flags = await getSuspicionFlags(userId);

  if (flags.count < 2) {
    return reputationGain; // Clean account - FULL VALUE ALWAYS
  }

  // Account has 2+ suspicion flags (suspicious but not banned yet)
  const dailyGain = await getDailyReputationGain(userId);

  if (dailyGain < 100) {
    return reputationGain; // Under 100 points today, still full value
  }

  // Over 100 points today with 2+ flags - apply logarithmic slowdown
  const slowdownFactor = 100 / dailyGain;
  return reputationGain * Math.max(slowdownFactor, 0.1); // Min 10% value
}

// Applied to: REPUTATION POINTS RECEIVED (not likes themselves)
// Likes are still counted and displayed normally
```

**Example:**

```javascript
// Viral post gets 1000 likes

Clean account (0 flags):
- Like #1-1000: All award full reputation
- Total: ~700 rep points
- NO RESTRICTIONS EVER

Flagged account (2+ flags):
- Like #1-250: Full value → 100 rep points
- Like #251-1000: Soft capped → 50 additional rep
- Total: 150 rep points
- Post still shows 1000 likes (not affected)
```

---

### Layer 4: Reputation Reversal (Post-Ban Cleanup)

```javascript
async function reverseBotReputation(bannedUserId) {
  // Find all engagements from banned user
  const posts = await Post.find({
    $or: [
      { "likes.userId": bannedUserId },
      { "comments.userId": bannedUserId },
      { "reposts.userId": bannedUserId },
      { "bookmarks.userId": bannedUserId },
    ],
  });

  let totalReputationRemoved = 0;
  const affectedAuthors = new Set();

  for (const post of posts) {
    // Remove likes
    const likes = post.likes.filter((l) => l.userId.equals(bannedUserId));
    for (const like of likes) {
      totalReputationRemoved += like.reputationValue || 0;
      affectedAuthors.add(post.author.toString());
    }
    post.likes = post.likes.filter((l) => !l.userId.equals(bannedUserId));
    post.engagement.likes = post.likes.length;

    // Remove comments, reposts, bookmarks similarly...
    // [Implementation details omitted for brevity]

    await post.save();
  }

  // Subtract reputation from all affected authors
  for (const authorId of affectedAuthors) {
    const author = await User.findById(authorId);
    author.reputationHistory = author.reputationHistory.filter(
      (event) => event.sourceUserId?.toString() !== bannedUserId.toString()
    );

    // Recalculate with remaining events
    const { total } = calculateTotalReputation(author);
    author.socialStats.reputation = total;

    await author.save();
  }

  // Log the cleanup
  await BanHistory.create({
    bannedUserId: bannedUserId,
    affectedAuthors: Array.from(affectedAuthors),
    reputationRemoved: totalReputationRemoved,
    postsAffected: posts.length,
    timestamp: Date.now(),
  });

  console.log(
    `✅ Reversed ${totalReputationRemoved} rep from ${affectedAuthors.size} users`
  );
}
```

---

### Ban/Suspension System (Tiered Response)

```javascript
async function handleSuspiciousActivity(userId, suspicionScore, flags) {
  // Level 1: Silent weight reduction (no notification)
  if (suspicionScore >= 0.5 && suspicionScore < 1.0) {
    await applyWeightPenalty(userId, 0.6); // 40% reduction
    // User doesn't know, just earns less
  }

  // Level 2: Warning + moderate reduction
  if (suspicionScore >= 1.0 && suspicionScore < 2.0) {
    await warnUser(userId, "Suspicious activity detected");
    await applyWeightPenalty(userId, 0.3); // 70% reduction
    await logWarning(userId, flags);
  }

  // Level 3: 24-hour suspension
  if (suspicionScore >= 2.0 && suspicionScore < 3.0) {
    await suspendUser(userId, duration: 24 * 60 * 60 * 1000); // 24 hours
    await notifyUser(userId, "Account suspended for 24 hours due to bot-like behavior");
  }

  // Level 4: 7-day suspension (2nd offense)
  const previousSuspensions = await getSuspensionCount(userId);
  if (suspicionScore >= 2.0 && previousSuspensions >= 1) {
    await suspendUser(userId, duration: 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  // Level 5: Permanent ban (3+ suspensions OR extreme bot score)
  if (previousSuspensions >= 3 || suspicionScore >= 4.0) {
    await permanentBan(userId);
    await reverseBotReputation(userId); // Clean up all their activity
  }
}
```

---

### Phase 2: Advanced Pattern Detection (Future Implementation)

**STATUS**: Moved to Phase 2 to avoid false positives on popular users with large fanbases.

**Planned Features:**

- Pattern 1: 30+ likes to same author within 2 minutes
- Source diversity analysis
- Velocity spike detection (20x average, not 10x)
- Machine learning models
- Behavioral analysis

**MVP Relies On**: IP rate limiting + technical bot detection (Layers 1-2) instead of pattern-based penalties.

---

## 🔄 Edge Cases & Handling

### Case 1: Post Deleted

**Scenario**: User deletes a post that earned reputation

```javascript
async function handlePostDeletion(postId) {
  const post = await Post.findById(postId);
  const author = await User.findById(post.author);

  // Only remove ACTIVE reputation (legacy stays)
  const reputationToRemove = post.reputationEarned || 0;

  // Find and remove from active reputation only
  author.reputationHistory = author.reputationHistory.filter(
    (event) => event.sourceId?.toString() !== postId.toString()
  );

  // Recalculate active (legacy unaffected)
  const { active, legacy, total } = calculateTotalReputation(author);
  author.socialStats.reputation = total;

  // Log the change
  await ReputationHistory.create({
    userId: author.id,
    change: -reputationToRemove,
    source: "post_deleted",
    sourceId: postId,
    timestamp: Date.now(),
    metadata: {
      originalReputation: post.reputationEarned,
      reason: "user_deleted_post",
      legacyUnaffected: true,
    },
  });

  await author.save();
}
```

### Case 2: Like Removed (Unlike)

**Scenario**: User unlikes a post

```javascript
async function handleUnlike(postId, likerId, authorId) {
  const post = await Post.findById(postId);
  const like = post.likes.find((l) => l.userId.equals(likerId));

  if (!like) return; // Already removed

  // Calculate what this like was worth (recalculate with current time decay)
  const daysSinceLike = (Date.now() - like.timestamp) / (1000 * 60 * 60 * 24);
  const currentValue =
    like.baseReputationValue * calculateTimeDecay(daysSinceLike);

  // Remove from author's reputation
  const author = await User.findById(authorId);

  // Remove from history
  author.reputationHistory = author.reputationHistory.filter(
    (event) => event.sourceId?.toString() !== like._id.toString()
  );

  // Recalculate
  const { total } = calculateTotalReputation(author);
  author.socialStats.reputation = total;

  // Update post's earned reputation
  post.reputationEarned -= currentValue;
  post.likes = post.likes.filter((l) => !l.userId.equals(likerId));
  post.engagement.likes = post.likes.length;

  // Log the change
  await ReputationHistory.create({
    userId: authorId,
    change: -currentValue,
    source: "like_removed",
    sourceId: like._id,
    timestamp: Date.now(),
    metadata: {
      likerId: likerId,
      postId: postId,
      ageAtRemoval: daysSinceLike,
    },
  });

  await author.save();
  await post.save();
}
```

### Case 3: Mass Unlike Event

**Scenario**: User unlikes 10+ posts at once (suspicious or account cleanup)

```javascript
async function handleMassUnlike(unlikeData) {
  const { userId, postIds } = unlikeData;

  if (postIds.length < 10) {
    // Handle individually
    for (const postId of postIds) {
      await handleUnlike(postId, userId, authorId);
    }
    return;
  }

  // Batch process for performance
  const posts = await Post.find({ _id: { $in: postIds } });
  const affectedAuthors = new Map();

  for (const post of posts) {
    const like = post.likes.find((l) => l.userId.equals(userId));
    if (!like) continue;

    // Calculate current value with decay
    const daysSince = (Date.now() - like.timestamp) / (1000 * 60 * 60 * 24);
    const currentValue =
      like.baseReputationValue * calculateTimeDecay(daysSince);

    // Accumulate reputation loss per author
    if (!affectedAuthors.has(post.author.toString())) {
      affectedAuthors.set(post.author.toString(), 0);
    }
    affectedAuthors.set(
      post.author.toString(),
      affectedAuthors.get(post.author.toString()) + currentValue
    );

    // Update post
    post.reputationEarned -= currentValue;
    post.likes = post.likes.filter((l) => !l.userId.equals(userId));
    post.engagement.likes = post.likes.length;
    await post.save();
  }

  // Batch update authors
  for (const [authorId, reputationLoss] of affectedAuthors) {
    const author = await User.findById(authorId);

    // Remove from history
    author.reputationHistory = author.reputationHistory.filter(
      (event) => !postIds.includes(event.sourceId?.toString())
    );

    // Recalculate
    const { total } = calculateTotalReputation(author);
    author.socialStats.reputation = total;

    await author.save();
  }

  // Log the mass unlike event
  await ReputationHistory.create({
    userId: userId,
    change: "mass_unlike",
    affectedUsers: Array.from(affectedAuthors.keys()),
    timestamp: Date.now(),
    metadata: {
      postCount: postIds.length,
      flaggedForReview: true,
    },
  });
}
```

### Case 4: Self-Likes

**Scenario**: User tries to like their own post

```javascript
function preventSelfLike(postAuthorId, likerId) {
  if (postAuthorId.equals(likerId)) {
    throw new Error("Cannot like your own post");
  }
}

// Double-check in calculation (if somehow bypassed)
function calculateLikeReputation({ post, likerId }) {
  if (post.author.equals(likerId)) {
    return 0; // Self-likes give no reputation
  }
  // ... continue with normal calculation
}
```

### Case 5: New Account Surge (REMOVED)

**Scenario**: Brand new account getting abnormal likes (bot farm or purchased)

**DECISION**: **No penalties for new accounts!**

**Reasoning:**

- Organic viral posts from new users should be celebrated
- Bot detection (Layer 2) catches fake accounts regardless of age
- Don't want to discourage new creators
- Trust the community and bot detection

**New accounts receive FULL reputation value** from day 1. No probationary period.

### Case 6: Deleted/Banned Users

**Scenario**: User who liked gets banned for abuse

```javascript
async function handleUserBan(bannedUserId) {
  // Find all likes from this user
  const posts = await Post.find({
    "likes.userId": bannedUserId,
  });

  for (const post of posts) {
    const like = post.likes.find((l) => l.userId.equals(bannedUserId));
    if (!like) continue;

    // Calculate current value
    const daysSince = (Date.now() - like.timestamp) / (1000 * 60 * 60 * 24);
    const currentValue =
      like.baseReputationValue * calculateTimeDecay(daysSince);

    // Remove reputation from post author
    const author = await User.findById(post.author);
    author.reputationHistory = author.reputationHistory.filter(
      (event) => event.sourceId?.toString() !== like._id.toString()
    );

    // Recalculate
    const { total } = calculateTotalReputation(author);
    author.socialStats.reputation = total;

    // Remove like from post
    post.likes = post.likes.filter((l) => !l.userId.equals(bannedUserId));
    post.engagement.likes = post.likes.length;
    post.reputationEarned -= currentValue;

    await author.save();
    await post.save();
  }

  // Log the ban impact
  await ReputationHistory.create({
    type: "banned_user_cleanup",
    bannedUserId: bannedUserId,
    postsAffected: posts.length,
    timestamp: Date.now(),
  });
}
```

### Case 7: Like Spam Detection (Moved to Phase 2)

**Scenario**: User rapidly likes everything (possible bot behavior)

**DECISION**: **Moved to Phase 2** to avoid punishing enthusiastic users and those with large fanbases.

**MVP Approach**: Rely on IP rate limiting (60/hour) and technical bot detection instead of pattern-based penalties.

**Phase 2 Implementation** (after monitoring real-world usage):

- Pattern analysis: 30+ likes to same author in 2 minutes
- Diversity checks
- Timing consistency analysis
- Machine learning classification

**For now**: Technical detection (automation headers, fingerprints) handles bots without false positives.

---

## 🏗️ Implementation Architecture

### Database Schema Extensions

```javascript
// Post Schema Addition
const PostSchema = new Schema({
  // ... existing fields

  // Engagement tracking (add bookmarks to existing engagement object)
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    reposts: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 }, // NEW
    downvotes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },

  // Reputation tracking
  reputationEarned: {
    type: Number,
    default: 0,
    index: true,
  },

  // Detailed breakdown for auditing
  likeBreakdown: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      timestamp: Date,
      baseValue: Number, // Random 0.4-1.0
      weight: Number, // Liker's progressive weight
      earlyVoteBonus: Number, // 0.8x - 2.0x
      ageMultiplier: Number, // 0.3x - 1.0x
      engagementMultiplier: Number, // 1.0x - 1.05x
      finalValue: Number, // After all multipliers
      calculation: {
        likerTier: String,
        likerReputation: Number,
        postAgeInDays: Number,
        engagementRatio: Number,
        softCapped: Boolean,
        flags: [String],
      },
    },
  ],

  // Bookmark tracking
  bookmarks: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      timestamp: Date,
      baseValue: Number, // Random 0.5-1.2
      weight: Number,
      finalValue: Number,
    },
  ],

  // Downvotes tracking
  downvotes: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      timestamp: Date,
      weight: Number,
      reputationImpact: Number, // Negative value
    },
  ],

  // Post score (upvotes - downvotes weighted)
  score: {
    type: Number,
    default: 0,
    index: true,
  },

  // Visibility based on score
  visibility: {
    type: String,
    enum: ["visible", "hidden", "under_review"],
    default: "visible",
    index: true,
  },
});

// User Schema Addition - Reputation Tracking
const UserSchema = new Schema({
  // ... existing fields

  socialStats: {
    // ... existing fields
    reputation: { type: Number, default: 0, index: true },

    // Breakdown for UI display
    activeReputation: { type: Number, default: 0 },
    legacyReputation: { type: Number, default: 0 },

    // Downvote limits tracking (upvotes unlimited)
    downvotesToday: { type: Number, default: 0 },
    downvotesResetAt: { type: Date, default: Date.now },
  },

  // Bot detection tracking
  suspicionFlags: [
    {
      type: String,
      timestamp: Date,
      severity: Number, // 0.5, 1.0, 2.0, etc
      resolved: Boolean,
    },
  ],

  // Suspension/ban history
  moderationHistory: [
    {
      type: String, // 'warning', 'suspension', 'ban'
      duration: Number, // milliseconds (for suspensions)
      reason: String,
      timestamp: Date,
      resolvedAt: Date,
    },
  ],

  // Complete history for recalculation
  reputationHistory: [
    {
      timestamp: { type: Date, default: Date.now, index: true },
      change: { type: Number, required: true },
      source: {
        type: String,
        enum: [
          "like",
          "unlike",
          "downvote",
          "comment",
          "repost",
          "bookmark",
          "post",
          "follower",
          "penalty",
        ],
        required: true,
      },
      sourceId: { type: Schema.Types.ObjectId },

      // Simplified calculation tracking
      calculation: {
        baseValue: Number,
        weight: Number,
        earlyVoteBonus: Number,
        ageMultiplier: Number,
        engagementMultiplier: Number,
        timeDecay: Number,
        softCapped: Boolean,
        finalValue: Number,
      },
    },
  ],
});

// New Model: Reputation History (Separate Collection for Performance)
const ReputationHistorySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  timestamp: { type: Date, default: Date.now, index: true },
  change: { type: Number, required: true },
  source: {
    type: String,
    enum: [
      "like",
      "unlike",
      "downvote",
      "comment",
      "repost",
      "bookmark",
      "post",
      "follower",
      "time_bonus",
      "penalty",
      "adjustment",
    ],
    required: true,
    index: true,
  },
  sourceId: { type: Schema.Types.ObjectId },
  sourceUserId: { type: Schema.Types.ObjectId }, // User who engaged (for ban cleanup)

  // Simplified calculation breakdown
  calculation: {
    baseValue: Number, // Random 0.4-1.0 (or scaled for other types)
    weight: Number, // Progressive weight 0.3x-3.0x
    earlyVoteBonus: Number, // 0.8x-2.0x
    ageMultiplier: Number, // 0.3x-1.0x
    engagementMultiplier: Number, // 1.0x-1.05x
    timeDecay: Number, // Exponential decay
    softCapped: Boolean, // Was soft cap applied?
    finalValue: Number, // Actual reputation awarded
  },

  // Metadata
  metadata: {
    automated: { type: Boolean, default: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: String,
    flagged: { type: Boolean, default: false },
  },
});
```

### API Endpoint Structure

```javascript
// Real-time calculation on like (with bot detection)
router.post("/api/posts/:postId/like", async (req, res) => {
  const { postId } = req.params;
  const likerId = req.user.id;

  // Layer 1 & 2: Bot detection
  const botCheck = await detectBot(req);
  if (botCheck.isBot) {
    return res.status(403).json({ error: "Bot detected - account banned" });
  }

  // Check IP rate limits
  const ipLikes = await countIPLikes(req.ip, 60); // Last hour
  if (ipLikes >= IP_LIMITS.MAX_LIKES_PER_IP_PER_HOUR) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  // Check CAPTCHA requirement
  if (await checkCaptchaRequired(likerId)) {
    return res.status(449).json({ requireCaptcha: true });
  }

  const post = await Post.findById(postId);
  const existingLike = post.likes.find((l) => l.userId.equals(likerId));

  if (existingLike) {
    // Unlike
    await handleUnlike(postId, likerId, post.author);
    return res.json({ liked: false, action: "unliked" });
  }

  // Like
  const liker = await User.findById(likerId);
  const author = await User.findById(post.author);

  // Calculate reputation gain (with new system)
  const baseValue = getBaseValue("LIKE"); // Random 0.4-1.0
  const weight = getProgressiveWeight(liker.socialStats.reputation);
  const earlyBonus = calculateEarlyVoteBonus(post, { timestamp: Date.now() });
  const ageMultiplier = calculateAgeMultiplier(
    (Date.now() - post.createdAt) / (1000 * 60 * 60 * 24)
  );
  const engagementMultiplier = getEngagementMultiplier(post);

  let finalValue =
    baseValue * weight * earlyBonus * ageMultiplier * engagementMultiplier;

  // Layer 3: Apply soft cap if flagged
  finalValue = await applySoftCapIfFlagged(author.id, finalValue);

  // Add like to post
  const like = {
    userId: likerId,
    timestamp: Date.now(),
    baseValue: baseValue,
    weight: weight,
    earlyVoteBonus: earlyBonus,
    ageMultiplier: ageMultiplier,
    engagementMultiplier: engagementMultiplier,
    finalValue: finalValue,
    calculation: {
      likerTier: getReputationTierLabel(liker.socialStats.reputation).tier,
      likerReputation: liker.socialStats.reputation,
      postAgeInDays: (Date.now() - post.createdAt) / (1000 * 60 * 60 * 24),
      engagementRatio: calculateEngagementRatio(post),
      softCapped: botCheck.suspicionFlags >= 2,
      flags: botCheck.suspicionFlags,
    },
  };

  post.likes.push(like);
  post.engagement.likes = post.likes.length;
  post.reputationEarned += finalValue;
  post.score = calculatePostScore(post);

  // Add to author's reputation history
  author.reputationHistory.push({
    timestamp: Date.now(),
    change: finalValue,
    source: "like",
    sourceId: like._id,
    sourceUserId: likerId,
    calculation: {
      baseValue: baseValue,
      weight: weight,
      earlyVoteBonus: earlyBonus,
      ageMultiplier: ageMultiplier,
      engagementMultiplier: engagementMultiplier,
      softCapped: botCheck.suspicionFlags >= 2,
      finalValue: finalValue,
    },
  });

  // Recalculate total reputation
  const { active, legacy, total } = calculateTotalReputation(author);
  author.socialStats.activeReputation = active;
  author.socialStats.legacyReputation = legacy;
  author.socialStats.reputation = total;

  await post.save();
  await author.save();

  // Return stable fuzzed values to client
  res.json({
    liked: true,
    postLikes: post.engagement.likes,
    authorReputation: stableFuzzValue(total), // Stable fuzzing
    estimatedGain: stableFuzzValue(finalValue), // Stable fuzzing
  });
});

// Downvote endpoint (silent cap after 50/day)
router.post("/api/posts/:postId/downvote", async (req, res) => {
  const { postId } = req.params;
  const voterId = req.user.id;

  const voter = await User.findById(voterId);

  // Check daily limit (SILENT - don't notify user)
  if (voter.socialStats.downvotesToday >= DOWNVOTE_RULES.maxDownvotesPerDay) {
    // Return success, but don't actually apply downvote
    return res.json({
      downvoted: true, // Optimistic UI update
      capped: true, // Backend ignores (user doesn't see this)
    });
  }

  const result = await handleDownvote(postId, voterId);

  // Increment downvote counter
  voter.socialStats.downvotesToday += 1;
  await voter.save();

  res.json(result);
});

// Bookmark endpoint (NEW)
router.post("/api/posts/:postId/bookmark", async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  const post = await Post.findById(postId);
  const existingBookmark = post.bookmarks.find((b) => b.userId.equals(userId));

  if (existingBookmark) {
    // Unbookmark
    await handleUnbookmark(postId, userId, post.author);
    return res.json({ bookmarked: false });
  }

  // Bookmark
  const user = await User.findById(userId);
  const author = await User.findById(post.author);

  // Calculate reputation gain (similar to like, different base)
  const baseValue = getBaseValue("BOOKMARK"); // Random 0.5-1.2
  const weight = getProgressiveWeight(user.socialStats.reputation);
  const ageMultiplier = calculateAgeMultiplier(
    (Date.now() - post.createdAt) / (1000 * 60 * 60 * 24)
  );

  let finalValue = baseValue * weight * ageMultiplier;
  finalValue = await applySoftCapIfFlagged(author.id, finalValue);

  // Add bookmark
  const bookmark = {
    userId: userId,
    timestamp: Date.now(),
    baseValue: baseValue,
    weight: weight,
    finalValue: finalValue,
  };

  post.bookmarks.push(bookmark);
  post.engagement.bookmarks = post.bookmarks.length;
  post.reputationEarned += finalValue;

  // Update author reputation
  author.reputationHistory.push({
    timestamp: Date.now(),
    change: finalValue,
    source: "bookmark",
    sourceId: bookmark._id,
    sourceUserId: userId,
    calculation: {
      baseValue: baseValue,
      weight: weight,
      ageMultiplier: ageMultiplier,
      finalValue: finalValue,
    },
  });

  const { active, legacy, total } = calculateTotalReputation(author);
  author.socialStats.reputation = total;

  await post.save();
  await author.save();

  res.json({
    bookmarked: true,
    postBookmarks: post.engagement.bookmarks,
    authorReputation: stableFuzzValue(total),
  });
});
```

### Background Job - Daily Recalculation

```javascript
// Daily reputation decay update
const cron = require("node-cron");

// Run at 3 AM daily
cron.schedule("0 3 * * *", async () => {
  console.log("Starting daily reputation recalculation...");

  try {
    // Get all users with reputation > 0
    const totalUsers = await User.countDocuments({
      "socialStats.reputation": { $gt: 0 },
    });
    const batchSize = 100;
    let processedCount = 0;

    // Process in batches for performance
    for (let skip = 0; skip < totalUsers; skip += batchSize) {
      const users = await User.find({ "socialStats.reputation": { $gt: 0 } })
        .skip(skip)
        .limit(batchSize);

      // Process batch in parallel
      await Promise.all(
        users.map(async (user) => {
          const { active, legacy, total } = calculateTotalReputation(user);

          user.socialStats.activeReputation = active;
          user.socialStats.legacyReputation = legacy;
          user.socialStats.reputation = total;

          await user.save();
        })
      );

      processedCount += users.length;

      if (processedCount % 500 === 0) {
        console.log(`Processed ${processedCount}/${totalUsers} users...`);
      }
    }

    console.log(
      `✅ Daily reputation update complete. Processed ${processedCount} users.`
    );
  } catch (error) {
    console.error("❌ Error in daily reputation update:", error);
    await notifyAdmins("Reputation calculation failed", error);
  }
});

// Reset daily downvote limits at midnight (upvotes unlimited)
cron.schedule("0 0 * * *", async () => {
  await User.updateMany(
    {},
    {
      $set: {
        "socialStats.downvotesToday": 0,
        "socialStats.downvotesResetAt": new Date(),
      },
    }
  );
  console.log("✅ Daily downvote limits reset (upvotes unlimited)");
});
```

---

## 📈 Complete Calculation Example

**Note**: This section provides a REAL-WORLD walkthrough with actual numbers for implementation reference. For conceptual explanations, see Components 1-9 above.

### Scenario: Quality Post with Diverse Engagement

**Post Details:**

- Content: "Deep dive into GTA 6 Vice City map analysis" (650 characters)
- Media: 3 comparison images
- Views: 2,000
- Likes: 75 (from 75 unique users)
- Downvotes: 3 (from low-quality concerns)
- Comments: 18
- Reposts: 5
- Age: 3 days (liked after 10 minutes of posting)

**Liker Breakdown:**

- 2 users with 15k rep (weight: 2.0x each)
- 8 users with 7k rep (weight: 1.9x each)
- 15 users with 2k rep (weight: 1.65x each)
- 25 users with 800 rep (weight: 1.45x each)
- 20 users with 300 rep (weight: 1.25x each)
- 5 users with 50 rep (weight: 0.85x each)

**Downvoter Breakdown:**

- 3 users with 500 rep (weight: 1.35x each)

### Step-by-Step Calculation

#### Step 1: Calculate Weighted Likes (Logarithmic)

```javascript
weightedUpvotes =
  (2 * 2.0) +     // High rep: 4.0 points
  (8 * 1.9) +     // Veteran: 15.2 points
  (15 * 1.65) +   // Established: 24.75 points
  (25 * 1.45) +   // Active: 36.25 points
  (20 * 1.25) +   // Regular: 25.0 points
  (5 * 0.85);     // Newcomer: 4.25 points

totalWeightedUpvotes = 109.45 points

// Downvotes (50% of upvote weight)
weightedDownvotes = (3 * 1.35 * 0.5) = 2.025 points

netWeightedVotes = 109.45 - 2.025 = 107.425 points
```

#### Step 2: Early Vote Bonus

```javascript
// Liked 10 minutes after posting
postAgeMinutes = 10
earlyVoteBonus = 2.0 - (10 / 60) = 1.83x

// Most likes came early (within first hour)
averageEarlyBonus = 1.6x (weighted average)
```

#### Step 3: Age Multiplier

```javascript
postAge = 3 days
ageMultiplier = 1.0 (post is new, within 7-day window)
```

#### Step 4: Engagement Multiplier

```javascript
// Engagement ratio calculation
totalEngagement = (75 * 1) + (18 * 2) + (5 * 3) + (12 * 1.5) = 144
engagementRatio = 144 / 2000 = 0.072 (7.2%)

// Small bonus for high engagement
engagementMultiplier = 1.0 + (0.072 * 0.05) = 1.0036 (~1.004x)
```

#### Step 5: Time Decay (Active Only)

```javascript
daysSinceLike = 3
timeDecay = exp(-0.0005 * 3) = 0.9985
```

#### Step 6: Bot Detection & Soft Caps

```javascript
// Clean account (0 suspicion flags)
softCapApplied = false
softCapMultiplier = 1.0 (full value)

// No daily cap on reputation for clean users
```

#### Step 7: Final Calculation (Per Like)

```javascript
// Average like calculation with new system
avgBaseValue = 0.7 (random in 0.4-1.0 range)
avgWeight = 1.6 (mix of tiers)
avgEarlyBonus = 1.6 (most liked early)
ageMultiplier = 1.0 (new post)
engagementMultiplier = 1.004
timeDecay = 0.9985
softCap = 1.0 (not flagged)

perLikeValue = 0.7 * 1.6 * 1.6 * 1.0 * 1.004 * 0.9985 * 1.0
perLikeValue ≈ 1.79 points per like

totalReputation = 75 likes × 1.79 = ~134 points

// Downvotes penalty
downvotePenalty = 3 downvotes × 0.4 = -1.2 points

ACTIVE REPUTATION GAIN: 134 - 1.2 = 132.8 points (NO CAPS for clean users)

// Also adds to legacy calculation
// This 132.8 points will eventually become 26.6 legacy points permanently
```

#### Step 8: Display with Stable Fuzzing

```javascript
// User sees stable fuzzed value
actualGain = 132.8 points
displayedGain = stableFuzzValue(132.8) = 135 points (consistent until actual changes)
// Same value on every page load until reputation actually changes
```

---

## 🎮 Integration Points

### When to Calculate

1. **Real-time** (immediate feedback):

   - On like/comment/repost/bookmark received (calculate and apply)
   - On unlike/unbookmark (reverse calculation)
   - On downvote (apply flat -0.4 penalty)
   - Bot detection checks (automation headers, IP limits, CAPTCHA)
   - Display estimated reputation gain (stable fuzzed)

2. **Batch** (performance optimization):

   - **Nightly recalculation** (3 AM): Update time decay for all active reputation
   - **Daily downvote reset** (Midnight): Reset downvotesToday counter (upvotes unlimited)
   - **Weekly audit** (Optional - Sunday 2 AM): Integrity checks for production
   - **Monthly cleanup** (Optional - 1st of month): Remove transaction logs >2 years

3. **On-demand** (admin tools):
   - Manual recalculation for specific users
   - Audit trail investigation
   - Dispute resolution
   - Ban impact calculation (reputation reversal)
   - Suspicion flag review

### Performance Considerations

```javascript
// Cache expensive calculations
const NodeCache = require("node-cache");
const reputationCache = new NodeCache({
  stdTTL: 3600, // 1 hour cache
  checkperiod: 600, // Check for expired keys every 10 minutes
});

async function getCachedReputationTier(userId) {
  const cacheKey = `rep_tier_${userId}`;
  let data = reputationCache.get(cacheKey);

  if (!data) {
    const user = await User.findById(userId).select("socialStats.reputation");
    const weight = getProgressiveWeight(user.socialStats.reputation);
    const tier = getReputationTierLabel(user.socialStats.reputation);

    data = { weight, tier };
    reputationCache.set(cacheKey, data);
  }

  return data;
}

// Invalidate cache when reputation changes significantly
function invalidateReputationCache(userId) {
  reputationCache.del(`rep_tier_${userId}`);
  reputationCache.del(`rep_breakdown_${userId}`);
}

// Batch processing for performance
async function batchCalculateReputation(userIds) {
  // Process in parallel chunks
  const chunkSize = 10;
  const chunks = [];

  for (let i = 0; i < userIds.length; i += chunkSize) {
    chunks.push(userIds.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    await Promise.all(chunk.map((userId) => recalculateUserReputation(userId)));
  }
}
```

---

## 📝 Testing Strategy

### Unit Tests

```javascript
describe("Like Reputation Calculation", () => {
  test("Self-likes give 0 reputation", () => {
    const result = calculateLikeReputation({
      post: { author: "user123" },
      likerId: "user123",
    });
    expect(result.finalValue).toBe(0);
  });

  test("Logarithmic weight prevents obscene multipliers", () => {
    const weight1M = getProgressiveWeight(1000000);
    const weight10M = getProgressiveWeight(10000000);

    expect(weight1M).toBe(3.0); // Capped
    expect(weight10M).toBe(3.0); // Also capped, same as 1M
  });

  test("Early vote bonus rewards discovery", () => {
    const bonus5min = calculateEarlyVoteBonus({
      createdAt: Date.now() - 300000,
    });
    const bonus2hours = calculateEarlyVoteBonus({
      createdAt: Date.now() - 7200000,
    });

    expect(bonus5min).toBeGreaterThan(1.5);
    expect(bonus2hours).toBeLessThan(1.0);
  });

  test("Daily cap prevents unlimited growth", () => {
    const result = applyRateLimits(user, 150);
    expect(result).toBeLessThanOrEqual(100);
  });

  test("Time decay reduces old likes in active reputation", () => {
    const decay365 = calculateTimeDecay(365);
    expect(decay365).toBeCloseTo(0.835, 2);
  });

  test("Legacy reputation never decays", () => {
    const user = {
      reputationHistory: [
        { timestamp: Date.now() - 365 * 24 * 60 * 60 * 1000, change: 1000 },
      ],
    };

    const { legacy } = calculateTotalReputation(user);
    expect(legacy).toBe(200); // 20% of 1000, no decay
  });

  test("Downvotes reduce reputation", () => {
    const downvoteValue = calculateDownvoteValue({
      voterReputation: 1000,
    });
    expect(downvoteValue).toBeLessThan(0);
  });

  test("Vote fuzzing obscures exact values", () => {
    const actual = 1000;
    const fuzzed1 = fuzzValue(actual, 0.05);
    const fuzzed2 = fuzzValue(actual, 0.05);

    expect(fuzzed1).not.toBe(fuzzed2);
    expect(Math.abs(fuzzed1 - actual)).toBeLessThan(50);
  });
});
```

### Integration Tests

```javascript
describe("Reputation System Integration", () => {
  test("Full like flow: like → reputation → display", async () => {
    const post = await createTestPost();
    const liker = await createTestUser({ reputation: 5000 });

    const result = await likePost(post.id, liker.id);

    expect(result.liked).toBe(true);
    expect(result.authorReputation).toBeGreaterThan(0);
    expect(result.estimatedGain).toBeGreaterThan(0);

    // Verify database updated
    const updatedAuthor = await User.findById(post.author);
    expect(updatedAuthor.socialStats.reputation).toBeGreaterThan(0);
  });

  test("Unlike reverses reputation gain", async () => {
    const initialRep = author.socialStats.reputation;

    await likePost(post.id, liker.id);
    const afterLike = author.socialStats.reputation;

    await unlikePost(post.id, liker.id);
    const afterUnlike = author.socialStats.reputation;

    expect(afterLike).toBeGreaterThan(initialRep);
    expect(afterUnlike).toBeLessThanOrEqual(initialRep);
  });

  test("Mass unlike is handled efficiently", async () => {
    const startTime = Date.now();

    await handleMassUnlike({
      userId: liker.id,
      postIds: Array(100)
        .fill()
        .map(() => createPost().id),
    });

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // Complete in under 5 seconds
  });
});
```

---

## ✅ Summary - Enhanced Likes Calculation (v3.0 - Inflation-Controlled)

### **Key Strengths:**

**From Reddit (Battle-Tested):**

- ✅ Logarithmic scaling (sustainable forever)
- ✅ Early vote bonus (discovery incentive)
- ✅ Downvotes - unweighted (fair community policing)
- ✅ Stable vote fuzzing (anti-gaming with good UX)

**Our Innovations (GTA FanHub):**

- ✅ Random base values (0.4-1.0) - prevents gaming
- ✅ Age-based diminishing (prioritizes new content)
- ✅ Hybrid active/legacy split (balances dynamism with history)
- ✅ Dual engagement systems (trending separate from reputation)
- ✅ Bookmark tracking (saves count toward reputation)
- ✅ 4-layer bot defense (IP, technical detection, soft caps, reversal)

**Protection Against Inflation:**

- ✅ Small base values (0.4-1.0 per like)
- ✅ Minimal multipliers (1.004x engagement, 1.6x early vote max)
- ✅ Age penalty for old posts (0.3x floor)
- ✅ Logarithmic weight caps at 3.0x
- ✅ Time decay on active reputation
- ✅ Soft caps for flagged accounts only
- ✅ Timeline goal: 500k reputation in 5 years for heavy users

**Bot Defense (No Hard Caps for Clean Users):**

- ✅ IP rate limiting (60/hour)
- ✅ CAPTCHA (20 likes in 10 min, 60-min cooldown)
- ✅ Technical bot detection (automation headers, fingerprints)
- ✅ Instant bans (50 likes/min or 2+ bot flags)
- ✅ Reputation reversal after ban
- ✅ Soft caps only for suspicious accounts (2+ flags)
- ✅ Pattern detection moved to Phase 2

**Reverse Engineering Difficulty: 4/10 (Low-Medium)**

- Stable fuzzing obscures exact values
- Random base values add variance
- Multiple hidden variables
- Logarithmic curves non-obvious
- Would require extensive data collection
- Not worth the effort for bad actors

---

## 🌱 Incentives at 0 Reputation

### Purpose

Encourage users at 0 reputation to become active contributors without restrictions or punishments.

### How Users Reach 0 Reputation

1. **Downvoted to 0**: Community penalty for poor-quality content
2. **Never Posted**: Passive users who only browse/like/comment

### Key Rules

- ✅ Users can **ALWAYS post and comment** (unless banned/suspended)
- ✅ Passive users (only like/comment) stay at 0 - **no punishment**
- ✅ Reputation floors at 0 (cannot go negative)

### Auto-Triggered Incentives (When User Hits 0)

```javascript
async function handleZeroReputation(userId) {
  const user = await User.findById(userId);

  if (user.socialStats.reputation <= 0) {
    // 1. Show guided tutorial
    await showOnboardingTutorial(userId);

    // 2. Offer starter quests
    await unlockStarterQuests(userId, {
      quest1: { task: "Get 5 likes on a post", reward: 10 },
      quest2: { task: "Leave 3 helpful comments", reward: 5 },
      quest3: { task: "Follow 5 community members", reward: 3 },
    });

    // 3. Display redemption path
    await showRedemptionNotification(userId);

    // 4. Fresh Start Badge (after 7 clean days)
    const daysSinceLastViolation = await getDaysSinceLastFlag(userId);
    if (daysSinceLastViolation >= 7) {
      await awardFreshStartBadge(userId);
    }
  }
}
```

### Starter Quests (Reputation Kickstart)

```javascript
const STARTER_QUESTS = {
  firstPost: {
    description: "Create your first post",
    requirement: "1 post",
    reward: 10,
  },
  earlyEngagement: {
    description: "Get 5 likes on any post",
    requirement: "5 likes received",
    reward: 10,
  },
  helpfulComments: {
    description: "Leave 3 comments that get likes",
    requirement: "3 comments with 1+ likes each",
    reward: 5,
  },
  communityConnection: {
    description: "Follow 5 community members",
    requirement: "5 follows",
    reward: 3,
  },
};

// Total possible from quests: 28 reputation points
```

### Fresh Start Badge

**Requirements:**

- Reputation at 0
- 7 days since last suspicion flag
- No active suspensions/bans

**Benefits:**

- Visual badge on profile
- Symbol of redemption/second chance
- Community sees user is reformed

---

## 🚀 Next Phase

**Comments Calculation** (even more complex):

- Reply chain depth weighting
- Comment quality assessment
- Conversation starter bonuses
- Nested reply reputation distribution
- Answer quality (if question-answer format)

---

## 📊 Implementation Checklist

### Database Changes

- [ ] Add `engagement.bookmarks` to Post model (NEW)
- [ ] Add `reputationEarned` to Post model
- [ ] Add `likeBreakdown` array to Post model (updated schema)
- [ ] Add `bookmarks` array to Post model (NEW)
- [ ] Add `downvotes` array to Post model (unweighted)
- [ ] Add `score` and `visibility` to Post model
- [ ] Add `activeReputation` and `legacyReputation` to User model
- [ ] Add `reputationHistory` array to User model (updated schema)
- [ ] Add `downvotesToday` and `downvotesResetAt` to User model (upvotes unlimited)
- [ ] Add `suspicionFlags` array to User model (NEW)
- [ ] Add `moderationHistory` array to User model (NEW)
- [ ] Create `ReputationHistory` collection (separate for performance)
- [ ] Create `BanHistory` collection for audit trail (NEW)

### Core Functions

- [ ] `getBaseValue(engagementType)` - Random 0.4-1.0 (or scaled) (NEW)
- [ ] `getProgressiveWeight(reputation)` - Logarithmic weight (caps at 3.0x)
- [ ] `calculateEarlyVoteBonus(post, engagement)` - Discovery incentive (0.8x-2.0x)
- [ ] `calculateAgeMultiplier(postAgeInDays)` - Old post penalty (0.3x-1.0x) (NEW)
- [ ] `getEngagementMultiplier(post)` - Tiny bonus for high engagement (1.0x-1.05x) (NEW)
- [ ] `calculateTrendingScore(post)` - Feed ordering algorithm (NEW)
- [ ] `calculateTimeDecay(days)` - Exponential decay
- [ ] `calculateActiveReputation(user)` - Last 180 days with decay
- [ ] `calculateLegacyReputation(user)` - 20% of all-time
- [ ] `calculateTotalReputation(user)` - Active + Legacy split
- [ ] `stableFuzzValue(actual)` - Stable fuzzing (consistent until change) (UPDATED)
- [ ] `handleDownvote(postId, voterId)` - Flat -0.4 penalty (unweighted) (UPDATED)
- [ ] `calculatePostScore(post)` - Weighted upvotes - flat downvotes (UPDATED)

### Bot Defense Functions (NEW - 4-Layer System)

- [ ] `detectBot(req)` - Technical bot detection (headers, timing, fingerprints)
- [ ] `checkCaptchaRequired(userId)` - Rate-based CAPTCHA logic
- [ ] `checkIPBlacklist(ip)` - IP reputation check
- [ ] `checkDuplicateFingerprint(fingerprint)` - Clone device detection
- [ ] `countIPLikes(ip, minutes)` - IP rate limiting
- [ ] `applySoftCapIfFlagged(userId, gain)` - Soft caps for suspicious accounts only
- [ ] `getSuspicionFlags(userId)` - Retrieve suspicion score
- [ ] `banIPAndAccount(ip, userId)` - Instant ban
- [ ] `reverseBotReputation(bannedUserId)` - Cleanup after ban
- [ ] `handleSuspiciousActivity(userId, score, flags)` - Tiered responses

### Anti-Abuse (Phase 2 - Future)

- [ ] `detectSuspiciousLikePatterns()` - Pattern analysis (moved to Phase 2)
- [ ] `detectVelocitySpike()` - Unusual growth detection (moved to Phase 2)
- [ ] Machine learning classification (Phase 2)

### Edge Case Handlers

- [ ] `handlePostDeletion(postId)`
- [ ] `handleUnlike(postId, likerId, authorId)`
- [ ] `handleUnbookmark(postId, userId, authorId)` - NEW
- [ ] `handleMassUnlike(unlikeData)`
- [ ] `handleUserBan(bannedUserId)` - Now includes reputation reversal
- [ ] `preventSelfLike(postAuthorId, likerId)`
- [ ] `preventSelfDownvote(postAuthorId, voterId)`

### Background Jobs

- [ ] Daily reputation recalculation (3 AM) - Time decay updates
- [ ] Daily downvote limits reset (midnight) - Upvotes unlimited
- [ ] Weekly full audit (Optional - Sunday 2 AM) - Integrity checks
- [ ] Monthly data cleanup (Optional - 1st, 4 AM) - Transaction logs >2 years only

### API Endpoints

- [ ] `POST /api/posts/:postId/like` - Toggle like (with bot detection)
- [ ] `POST /api/posts/:postId/downvote` - Toggle downvote (silent cap at 50/day)
- [ ] `POST /api/posts/:postId/bookmark` - Toggle bookmark (NEW)
- [ ] `POST /api/captcha/verify` - CAPTCHA verification (NEW)
- [ ] `GET /api/users/:userId/reputation` - Get reputation breakdown
- [ ] `GET /api/users/:userId/reputation/history` - Get history
- [ ] `POST /api/admin/reputation/recalculate/:userId` - Manual recalc
- [ ] `GET /api/admin/suspicion-flags` - Review flagged accounts (NEW)
- [ ] `POST /api/admin/ban/:userId` - Manual ban with reversal (NEW)

### Testing

- [ ] Unit tests for all calculation functions
- [ ] Integration tests for full flow
- [ ] Performance tests (10k+ concurrent operations)
- [ ] Bot detection accuracy tests (NEW)
- [ ] CAPTCHA integration tests (NEW)
- [ ] Soft cap behavior tests (NEW)
- [ ] Reputation reversal tests (NEW)
- [ ] IP rate limiting tests (NEW)
- [ ] Abuse scenario tests
- [ ] Edge case tests

### Monitoring & Admin Tools

- [ ] Real-time reputation changes dashboard
- [ ] Bot detection dashboard (flags, bans, reversals) (NEW)
- [ ] IP rate limit monitoring (NEW)
- [ ] CAPTCHA solve rates tracking (NEW)
- [ ] Suspicion flag review queue (NEW)
- [ ] Reputation distribution charts
- [ ] Manual adjustment tools
- [ ] Ban impact reports (reputation reversed, users affected) (NEW)

---

## 📝 Version History & Changes

### v3.0 (Current) - Inflation-Controlled + Bot Defense

**Major Changes from v2.0:**

- ✅ Random base values (0.4-1.0) instead of fixed
- ✅ Removed content effort bonuses (text/media)
- ✅ Replaced evergreen with age-based diminishing
- ✅ Downvotes now unweighted (0.4 flat)
- ✅ Removed all hard reputation caps
- ✅ Added 4-layer bot defense system
- ✅ Added bookmark tracking and reputation
- ✅ Stable fuzzing (consistent until rep changes)
- ✅ Removed new account penalties
- ✅ Timeline goal: 500k in 5 years (not 10)
- ✅ Upvotes unlimited, downvotes capped (50/day)
- ✅ Pattern detection moved to Phase 2
- ✅ Incentives at 0 reputation
- ✅ Dual engagement systems (trending + reputation)

### v2.0 - Reddit-Enhanced Hybrid

- Logarithmic weight scaling
- Early vote bonus
- Downvotes (weighted)
- Vote fuzzing (random)
- Active/legacy split
- Time decay

### v1.0 - Initial Design

- Fixed tier weights
- Basic quality multipliers
- Single reputation value

---

**Status**: Design Complete - Ready for MVP Implementation  
**Last Updated**: November 12, 2025  
**Version**: 3.0 (Inflation-Controlled + 4-Layer Bot Defense)  
**Timeline Goal**: Heavy users reach 500k reputation in 5 years  
**Philosophy**: No hard caps for clean users, aggressive bot detection & banning  
**Author**: GTA FanHub Development Team
