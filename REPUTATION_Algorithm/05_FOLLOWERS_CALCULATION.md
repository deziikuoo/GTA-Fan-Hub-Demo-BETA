# Reputation System - Followers Calculation

## v3.0 - Organic Influence Building

## 📊 Overview

This document outlines the calculation system for reputation points earned from **Followers**. Building a genuine following demonstrates influence, trust, and consistent quality contributions. Unlike other engagement types (likes, comments), followers represent **long-term relationships** and **sustained trust** in a user's content.

---

## 🎯 Core Formula (Influence Building)

```javascript
// User earns reputation from gaining followers
followerValue =
  getBaseValue() *                      // Random 1.0-3.0 (significant relationship)
  getFollowerQualityScore(follower) *   // 0.3x-2.0x based on follower activity
  getMutualFollowBonus(user, follower) * // 1.0x or 1.3x (mutual respect)
  applySoftCapIfFlagged(user);          // Only if user is flagged

// Total follower reputation
totalFollowerRep = Σ(followers) × calculated values;

// NO age decay (followers don't expire)
// NO early bonus (follower relationships aren't time-sensitive)
// NO engagement multiplier (follower count is independent)
```

**Key Principles**:

1. **Organic growth** - rewards genuine influence building
2. **Quality over quantity** - active followers > inactive followers
3. **Mutual respect bonus** - mutual follows worth more
4. **Long-term value** - no age decay, followers are permanent relationships
5. **Anti-bot protection** - follower quality score filters fake accounts
6. **Anti-follow-spam** - cannot mass follow/unfollow for gaming

---

## 💎 Component 1: Follower Base Values (Random)

### Purpose

Establish base reputation values for followers that reflect the significance of building genuine influence.

### Base Value System

```javascript
const BASE_REPUTATION = {
  FOLLOWER: () => random(1.0, 3.0),  // Significant relationship (higher than bookmarks)
};

function getBaseValue() {
  return random(1.0, 3.0); // Natural variance
}
```

### Why 1.0-3.0 (Higher Than All Other Engagement)?

**Comparison**:
- Like: 0.4-1.0 base (avg ~0.7)
- Bookmark: 0.5-1.2 base (avg ~0.85)
- Comment like: 0.35 flat
- **Follower: 1.0-3.0 (avg ~2.0)**
- Repost: Engagement-based (0 direct value)

**Reasoning**:
- Followers represent **sustained trust** (ongoing relationship)
- Following is a **commitment** (see all future content)
- Indicates **consistent quality** (not just one good post)
- **Long-term investment** in a user's content
- **Harder to earn** than likes or bookmarks

### Follower Value Curve

```javascript
// Example follower values
Follower 1: random(1.0, 3.0) = 1.4 points
Follower 2: random(1.0, 3.0) = 2.7 points
Follower 3: random(1.0, 3.0) = 1.9 points
Average: ~2.0 points per follower (before quality/mutual bonus)
```

---

## 💪 Component 2: Follower Quality Score (Anti-Bot)

### Purpose

Weight followers by their activity level to prevent bot follower farms and reward genuine, engaged followers.

### Quality Score Formula

```javascript
function getFollowerQualityScore(follower) {
  const accountAge = (Date.now() - follower.createdAt) / (1000 * 60 * 60 * 24); // days
  const postsCount = follower.socialStats.postsCreated || 0;
  const engagementCount = follower.socialStats.likesGiven + 
                          follower.socialStats.commentsGiven + 
                          follower.socialStats.bookmarksGiven || 0;
  const followerRep = follower.socialStats.reputation || 0;
  
  // NEW ACCOUNT CHECK (potential bot)
  if (accountAge < 7) {
    return 0.3; // New accounts worth 30% (anti-bot, can grow later)
  }
  
  // INACTIVE ACCOUNT CHECK (abandoned/fake)
  if (accountAge > 90 && postsCount === 0 && engagementCount < 10) {
    return 0.3; // Inactive accounts worth 30% (likely abandoned or fake)
  }
  
  // CALCULATE ACTIVITY SCORE
  
  // Posts created (shows content contribution)
  const postsScore = Math.min(postsCount / 50, 1.0); // Maxes at 50 posts
  
  // Engagement given (shows active participation)
  const engagementScore = Math.min(engagementCount / 200, 1.0); // Maxes at 200 engagements
  
  // Reputation earned (shows quality contributions)
  const repScore = Math.min(followerRep / 1000, 1.0); // Maxes at 1k rep
  
  // Combined quality score (weighted average)
  const qualityScore = (postsScore * 0.3) + (engagementScore * 0.4) + (repScore * 0.3);
  
  // Map to quality multiplier (0.3x minimum, 2.0x maximum)
  const qualityMultiplier = 0.3 + (qualityScore * 1.7);
  
  return qualityMultiplier; // Range: 0.3x - 2.0x
}
```

### Quality Score Examples

**Bot/New Account** (created yesterday, 0 posts, 0 engagement):
```javascript
accountAge: 1 day
Quality: 0.3x (minimum)
Final value: 2.0 base × 0.3 = 0.6 points
```

**Lurker Account** (6 months old, 0 posts, 50 likes given):
```javascript
accountAge: 180 days ✅
postsScore: 0/50 = 0
engagementScore: 50/200 = 0.25
repScore: 0/1000 = 0
Quality: (0 × 0.3) + (0.25 × 0.4) + (0 × 0.3) = 0.1
Multiplier: 0.3 + (0.1 × 1.7) = 0.47x
Final value: 2.0 base × 0.47 = 0.94 points
```

**Active User** (1 year old, 20 posts, 150 engagements, 500 rep):
```javascript
postsScore: 20/50 = 0.4
engagementScore: 150/200 = 0.75
repScore: 500/1000 = 0.5
Quality: (0.4 × 0.3) + (0.75 × 0.4) + (0.5 × 0.3) = 0.57
Multiplier: 0.3 + (0.57 × 1.7) = 1.27x
Final value: 2.0 base × 1.27 = 2.54 points
```

**Power User** (2 years old, 100+ posts, 500+ engagements, 5k+ rep):
```javascript
postsScore: 100/50 = 1.0 (capped)
engagementScore: 500/200 = 1.0 (capped)
repScore: 5000/1000 = 1.0 (capped)
Quality: (1.0 × 0.3) + (1.0 × 0.4) + (1.0 × 0.3) = 1.0
Multiplier: 0.3 + (1.0 × 1.7) = 2.0x (maximum)
Final value: 2.0 base × 2.0 = 4.0 points
```

**Key**: Quality score ranges from **0.3x to 2.0x**, rewarding active, engaged followers while giving minimal value to bots/inactive accounts.

---

## 🤝 Component 3: Mutual Follow Bonus

### Purpose

Reward mutual follows as they represent stronger relationships and reciprocal trust.

### Mutual Follow Logic

```javascript
function getMutualFollowBonus(userA, userB) {
  const userAFollowsB = userA.following.includes(userB._id);
  const userBFollowsA = userB.following.includes(userA._id);
  
  if (userAFollowsB && userBFollowsA) {
    return 1.3; // 30% bonus for mutual follow
  }
  
  return 1.0; // No bonus for one-way follow
}
```

### Example

**One-Way Follow:**
```javascript
User B follows User A (User A doesn't follow back)
Base: 2.0
Quality: 1.5x (active user)
Mutual: 1.0x (no bonus)
Final: 2.0 × 1.5 × 1.0 = 3.0 points
```

**Mutual Follow:**
```javascript
User B follows User A (User A follows back)
Base: 2.0
Quality: 1.5x (active user)
Mutual: 1.3x (bonus!)
Final: 2.0 × 1.5 × 1.3 = 3.9 points
```

**Why 30% Bonus?**
- Mutual follows show reciprocal respect
- Stronger relationship than one-way follow
- Both users trust each other's content
- Encourages community building

---

## 🔄 Component 4: Follow/Unfollow Logic & Anti-Spam

### Purpose

Allow users to follow others while preventing follow-spam gaming.

### Follow System

```javascript
async function handleFollow(userId, followerId) {
  const user = await User.findById(userId);
  const follower = await User.findById(followerId);
  
  // ANTI-SPAM CHECKS
  
  // 1. Cannot follow yourself
  if (userId.equals(followerId)) {
    throw new Error("Cannot follow yourself");
  }
  
  // 2. Cannot follow same user twice
  if (user.followers.includes(followerId)) {
    throw new Error("Already following this user");
  }
  
  // 3. Check for follow-spam patterns (Phase 2)
  // - Skip for MVP, rely on rate limits and quality scores
  
  // CALCULATE REPUTATION
  
  const baseValue = random(1.0, 3.0);
  const qualityScore = getFollowerQualityScore(follower);
  const mutualBonus = getMutualFollowBonus(user, follower);
  
  let reputationGain = baseValue * qualityScore * mutualBonus;
  
  // Apply soft cap (only for flagged accounts)
  reputationGain = await applySoftCapIfFlagged(user.id, reputationGain);
  
  // UPDATE USER'S FOLLOWERS
  
  user.followers.push({
    userId: followerId,
    timestamp: Date.now(),
    reputationValue: reputationGain,
    qualityScore: qualityScore,
    isMutual: mutualBonus > 1.0,
  });
  
  user.socialStats.followersCount = user.followers.length;
  
  // UPDATE FOLLOWER'S FOLLOWING
  
  follower.following.push({
    userId: userId,
    timestamp: Date.now(),
  });
  
  follower.socialStats.followingCount = follower.following.length;
  
  // AWARD REPUTATION TO USER
  
  user.socialStats.reputation += reputationGain;
  user.socialStats.followersReputation += reputationGain;
  
  user.reputationHistory.push({
    timestamp: Date.now(),
    change: reputationGain,
    source: 'follower',
    sourceId: followerId,
    sourceUserId: followerId,
    eventType: 'active',
    details: {
      baseValue: baseValue,
      qualityScore: qualityScore,
      mutualBonus: mutualBonus,
    }
  });
  
  // Recalculate active/legacy
  const { active, legacy, total } = calculateTotalReputation(user);
  user.socialStats.activeReputation = active;
  user.socialStats.legacyReputation = legacy;
  
  await user.save();
  await follower.save();
  
  return {
    follow: true,
    reputationGain: reputationGain,
  };
}
```

### Anti-Spam Rules

```javascript
const FOLLOWER_RULES = {
  NO_SELF_FOLLOW: true,              // Cannot follow yourself
  NO_DUPLICATE_FOLLOW: true,         // Cannot follow same user twice
  
  // Follow-spam detection (Phase 2)
  MAX_FOLLOWS_PER_DAY: 100,          // Reasonable for organic growth
  FOLLOW_UNFOLLOW_PATTERN: true,     // Detect follow/unfollow cycles (Phase 2)
};
```

---

## 🔄 Component 5: Unfollow Logic

### Purpose

Allow users to unfollow others and reverse reputation awarded.

### Unfollow Behavior

```javascript
async function handleUnfollow(userId, followerId) {
  const user = await User.findById(userId);
  const follower = await User.findById(followerId);
  
  const follow = user.followers.find(f => f.userId.equals(followerId));
  
  if (!follow) {
    throw new Error("Not following this user");
  }
  
  const reputationToRemove = follow.reputationValue;
  
  // Remove from user's reputation
  user.socialStats.reputation -= reputationToRemove;
  user.socialStats.followersReputation -= reputationToRemove;
  
  // Update reputation history (mark as unfollowed for context)
  await ReputationHistory.updateOne(
    {
      userId: user._id,
      source: 'follower',
      sourceUserId: followerId,
    },
    {
      $set: { eventType: 'unfollowed' } // Mark for auditing, value unchanged
    }
  );
  
  // Recalculate active/legacy
  const { active, legacy, total } = calculateTotalReputation(user);
  user.socialStats.activeReputation = active;
  user.socialStats.legacyReputation = legacy;
  user.socialStats.reputation = total;
  
  // Floor at 0
  if (user.socialStats.reputation < 0) {
    user.socialStats.reputation = 0;
  }
  if (user.socialStats.followersReputation < 0) {
    user.socialStats.followersReputation = 0;
  }
  
  // Remove follower relationship
  user.followers = user.followers.filter(f => !f.userId.equals(followerId));
  user.socialStats.followersCount = user.followers.length;
  
  // Remove following relationship
  follower.following = follower.following.filter(f => !f.userId.equals(userId));
  follower.socialStats.followingCount = follower.following.length;
  
  await user.save();
  await follower.save();
  
  return { unfollowed: true };
}
```

**Important**: Unlike reposts, unfollowing DOES remove reputation because:
- The relationship is broken (no longer following)
- No sustained engagement remains
- Fair to reverse the trust signal

---

## 🛡️ Bot Defense (Adapted for Followers)

### Purpose

Prevent bot follower farms from artificially inflating reputation.

### Layer 1: IP Rate Limiting

```javascript
const IP_LIMITS_FOLLOWERS = {
  MAX_FOLLOWS_PER_IP_PER_MINUTE: 2,    // Very deliberate (finding users to follow)
  MAX_FOLLOWS_PER_IP_PER_HOUR: 30,     // 30 follows/hour reasonable
  MAX_FOLLOWS_PER_DAY: 100,            // 100 follows/day (organic growth)

  // CAPTCHA (same rate-based system)
  REQUIRE_CAPTCHA_AFTER: 20,            // 20 follows in 10-minute window
  CAPTCHA_ROLLING_WINDOW: 10,
  CAPTCHA_COOLDOWN: 60,

  // Progressive tiers (NO instant ban)
  TIER_1_THRESHOLD: 10,                 // 10 follows/minute = Tier 1
};
```

**Progressive Tier System**:

```javascript
const RATE_LIMIT_TIERS = {
  TIER_1: {
    trigger: 10, // 10 follows/minute
    punishment: 'FOLLOW_PAUSE',
    duration: 5 * 60 * 60 * 1000, // 5 hours
    message: 'Following paused for 5 hours. Please slow down.',
  },
  
  TIER_2: {
    trigger: 'TIER_1_WITHIN_7_DAYS',
    punishment: 'FOLLOW_PAUSE',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    message: 'Following paused for 24 hours. Repeated violations detected.',
  },
  
  TIER_3: {
    trigger: 'TIER_2_WITHIN_30_DAYS',
    punishment: 'FOLLOW_PAUSE',
    duration: 72 * 60 * 60 * 1000, // 72 hours
    message: 'Following paused for 72 hours. ⚠️ WARNING: Account suspension pending.',
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

// Track violation history
user.violationHistory = [
  { type: 'follow_rate_limit', tier: 1, timestamp: Date.now() },
  { type: 'follow_rate_limit', tier: 2, timestamp: Date.now() },
];

// Reset after 6 months clean
if (lastViolation > 6 months ago) {
  user.currentTier = 0; // Reset to clean slate
}
```

### Layer 2: Technical Bot Detection

Same as likes/comments/reposts:
- Automation headers (Selenium, Puppeteer, etc.)
- Request timing patterns
- IP blacklist check
- Device fingerprint duplication

### Layer 3: Follower Quality Score (NEW)

**Automatic filtering via quality score:**
- Bot followers automatically worth 0.3x (minimal value)
- New accounts worth 0.3x until they prove activity
- Inactive accounts worth 0.3x (abandoned or fake)
- Active, genuine users worth 1.5x-2.0x

**This prevents bot follower farms from being effective!**

### Layer 4: Reputation Reversal After Ban

If follower is banned as bot:
```javascript
// Remove ALL follows from banned user
const bannedFollows = await Follow.find({ follower: bannedUserId });

bannedFollows.forEach(async (follow) => {
  const user = await User.findById(follow.user);
  
  // Remove reputation earned from banned bot
  user.socialStats.reputation -= follow.reputationValue;
  user.socialStats.followersReputation -= follow.reputationValue;
  
  // Mark in history
  await ReputationHistory.updateOne(
    { sourceUserId: bannedUserId, source: 'follower' },
    { $set: { eventType: 'bot_banned' } }
  );
  
  // Recalculate
  const { active, legacy, total } = calculateTotalReputation(user);
  user.socialStats.activeReputation = active;
  user.socialStats.legacyReputation = legacy;
  user.socialStats.reputation = total;
  
  await user.save();
});
```

---

## 📊 Reputation Tracking: Source-Based Breakdown

### Purpose

Track reputation earned from followers separately for transparency.

### Source Counter Updates

```javascript
// When user gains a follower
user.socialStats.followersReputation += calculatedValue;
user.socialStats.reputation += calculatedValue;

// Display (backend only, shown in breakdown)
By Source:
  📝 Posts: 1,800 (50%)
  👥 Followers: 800 (22%)  // ← NEW (significant!)
  🔖 Bookmarks: 450 (13%)
  🔁 Reposts: 350 (10%)
  💬 Comments: 150 (5%)
```

---

## 📈 Complete Follower Calculation Example

### Scenario: User Gains 3 Followers

**User Profile**: Established content creator (10k rep)

**Follower 1**: Bot/New Account (created yesterday, 0 activity)
```javascript
Base: 1.5
Quality: 0.3x (bot-like)
Mutual: 1.0x (no mutual follow)
Final: 1.5 × 0.3 × 1.0 = 0.45 points
```

**Follower 2**: Active User (1 year old, 30 posts, 200 engagements, 800 rep)
```javascript
Base: 2.3
Quality: 1.4x (active)
Mutual: 1.0x (no mutual follow)
Final: 2.3 × 1.4 × 1.0 = 3.22 points
```

**Follower 3**: Power User + Mutual Follow (2 years, 100+ posts, 5k+ rep)
```javascript
Base: 2.8
Quality: 2.0x (power user)
Mutual: 1.3x (mutual!)
Final: 2.8 × 2.0 × 1.3 = 7.28 points
```

**Total from 3 followers**: 0.45 + 3.22 + 7.28 = **10.95 reputation points**

**Comparison**:
- 3 followers = 10.95 points
- 15 likes (avg 0.7) = 10.5 points
- **1 quality follower ≈ 3-5 likes in value** ✅

---

## 🎮 Follower Reputation Timeline Projection

### Light User (5 new followers/month)

```
Monthly: 5 followers × 2.0 avg base × 0.8 avg quality × 1.05 avg mutual = 8.4 points/month
Yearly: 101 points/year
5 Years: 505 points from followers
```

### Active User (20 new followers/month)

```
Monthly: 20 followers × 2.0 avg × 1.0 avg quality × 1.1 avg mutual = 44 points/month
Yearly: 528 points/year
5 Years: 2,640 points from followers
```

### Influencer (100 new followers/month)

```
Monthly: 100 followers × 2.0 avg × 1.2 avg quality × 1.15 avg mutual = 276 points/month
Yearly: 3,312 points/year
5 Years: 16,560 points from followers
```

**Followers provide significant reputation for influential users!**

---

## 🔧 Implementation Architecture

### Database Schema Updates

```javascript
// User Schema Additions
const UserSchema = new Schema({
  // Followers array
  followers: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      timestamp: Date,
      reputationValue: Number,
      qualityScore: Number,
      isMutual: Boolean,
    }
  ],
  
  // Following array
  following: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      timestamp: Date,
    }
  ],
  
  // Social stats
  socialStats: {
    followersCount: { type: Number, default: 0, index: true },
    followingCount: { type: Number, default: 0 },
    
    // Reputation counters
    reputation: { type: Number, default: 0 },
    activeReputation: { type: Number, default: 0 },
    legacyReputation: { type: Number, default: 0 },
    
    postsReputation: { type: Number, default: 0 },
    commentsReputation: { type: Number, default: 0 },
    bookmarksReputation: { type: Number, default: 0 },
    repostsReputation: { type: Number, default: 0 },
    followersReputation: { type: Number, default: 0 },  // ← NEW
    
    // Activity tracking (for quality score)
    postsCreated: { type: Number, default: 0 },
    likesGiven: { type: Number, default: 0 },
    commentsGiven: { type: Number, default: 0 },
    bookmarksGiven: { type: Number, default: 0 },
  },
});

// Indexes
UserSchema.index({ 'followers.userId': 1 });
UserSchema.index({ 'following.userId': 1 });
```

---

## 🔌 API Endpoints

### POST /api/users/:userId/follow (Follow a User)

```javascript
router.post("/api/users/:userId/follow", async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id;
  
  // Bot detection
  const botCheck = await detectBot(req);
  if (botCheck.isBot) {
    return res.status(403).json({ error: "Bot detected" });
  }
  
  // IP rate limits
  const ipFollows = await countIPFollows(req.ip, 60);
  if (ipFollows >= IP_LIMITS_FOLLOWERS.MAX_FOLLOWS_PER_IP_PER_HOUR) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }
  
  // Daily limit check
  const dailyFollows = await countDailyFollows(followerId);
  if (dailyFollows >= IP_LIMITS_FOLLOWERS.MAX_FOLLOWS_PER_DAY) {
    return res.status(429).json({ error: "Daily follow limit reached" });
  }
  
  // CAPTCHA check
  if (await checkCaptchaRequired(followerId, 'follows')) {
    return res.status(449).json({ requireCaptcha: true });
  }
  
  const user = await User.findById(userId);
  const follower = await User.findById(followerId);
  
  // Anti-spam checks
  if (userId === followerId) {
    return res.status(400).json({ error: "Cannot follow yourself" });
  }
  
  const isFollowing = user.followers.some(f => f.userId.equals(followerId));
  
  if (isFollowing) {
    // Unfollow
    await handleUnfollow(userId, followerId);
    return res.json({ following: false });
  }
  
  // Follow the user
  const result = await handleFollow(userId, followerId);
  
  res.json({
    following: true,
    followersCount: user.socialStats.followersCount + 1,
    userReputation: stableFuzzValue(user.socialStats.reputation + result.reputationGain),
  });
});
```

### DELETE /api/users/:userId/follow (Unfollow)

```javascript
router.delete("/api/users/:userId/follow", async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id;
  
  await handleUnfollow(userId, followerId);
  
  res.json({ following: false });
});
```

### GET /api/users/:userId/followers (Get User's Followers)

```javascript
router.get("/api/users/:userId/followers", async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const user = await User.findById(userId)
    .populate({
      path: 'followers.userId',
      select: 'username displayName avatar socialStats.reputation'
    })
    .slice('followers', [(page - 1) * limit, limit]);
  
  const total = user.followers.length;
  
  res.json({
    followers: user.followers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    }
  });
});
```

---

## 📊 Implementation Checklist

### Database Changes

- [ ] Add `followers` array to User model (with quality score)
- [ ] Add `following` array to User model
- [ ] Add `followersCount` and `followingCount` to User model
- [ ] Add `followersReputation` to User model
- [ ] Add activity tracking fields (`postsCreated`, `likesGiven`, etc.)
- [ ] Update ReputationHistory enum to include `follower`
- [ ] Create indexes on `followers.userId`, `following.userId`

### Core Functions

- [ ] `handleFollow(userId, followerId)` - Calculate and award reputation
- [ ] `handleUnfollow(userId, followerId)` - Remove reputation
- [ ] `getFollowerQualityScore(follower)` - Calculate follower quality (0.3x-2.0x)
- [ ] `getMutualFollowBonus(userA, userB)` - Check mutual follow (1.3x bonus)
- [ ] `countIPFollows(ip, minutes)` - IP rate limiting
- [ ] `countDailyFollows(userId)` - Daily follow limit

### API Endpoints

- [ ] `POST /api/users/:id/follow` - Follow a user (toggle behavior)
- [ ] `DELETE /api/users/:id/follow` - Unfollow a user
- [ ] `GET /api/users/:id/followers` - Get user's followers
- [ ] `GET /api/users/:id/following` - Get users being followed

### Testing

- [ ] Unit tests for random base values (1.0-3.0)
- [ ] Quality score calculation (0.3x-2.0x based on activity)
- [ ] Mutual follow bonus (1.3x)
- [ ] Anti-spam (no self-follow, no duplicates)
- [ ] Source counter updates (followersReputation)
- [ ] Unfollow (reputation reversal)
- [ ] Bot defense integration (4 layers)

---

## ✅ Summary - Followers System

### **Key Design Decisions:**

**Influence Building:**
- ✅ Random base 1.0-3.0 (avg ~2.0)
- ✅ Highest base value of all engagement types
- ✅ Quality score 0.3x-2.0x (based on follower activity)
- ✅ Mutual follow bonus 1.3x
- ✅ 1 quality follower ≈ 3-5 likes in value

**Long-Term Relationships:**
- ✅ NO age decay (followers are permanent relationships)
- ✅ NO early vote bonus (not time-sensitive)
- ✅ NO engagement multiplier (independent of popularity)
- ✅ Rewards sustained trust and consistent quality

**Quality Over Quantity:**
- ✅ Follower quality score prevents bot farm value
- ✅ New accounts worth 30% until they prove activity
- ✅ Inactive accounts worth 30% (abandoned/fake)
- ✅ Active users worth 1.5x-2.0x (genuine followers)

**Anti-Spam:**
- ✅ Cannot follow yourself
- ✅ Cannot follow same user twice
- ✅ Daily limit (100 follows/day)
- ✅ Quality score filters bots automatically

**Bot Defense:**
- ✅ Stricter IP limits (2 follows/min, 30/hour, 100/day)
- ✅ Same 4-layer system as other engagement
- ✅ CAPTCHA after 20 follows in 10 minutes
- ✅ Progressive tiers (10 follows/min = Tier 1)

**Source Tracking:**
- ✅ Separate `followersReputation` counter
- ✅ Backend tracking, shown in breakdown
- ✅ Transparent reputation sources

**Timeline Contribution:**
- Light user: ~505 rep in 5 years (~5% of total)
- Active user: ~2,640 rep in 5 years (~5-10% of total)
- Influencer: ~16,560 rep in 5 years (~15-20% of total)
- **Rewards influence building** ✅

---

## 🚀 Next Steps

1. ✅ **Likes System**: Complete (v3.1)
2. ✅ **Comments System**: Complete (v3.0 Simplified)
3. ✅ **Reposts System**: Complete (v3.1 Twitter/X Model)
4. ✅ **Bookmarks System**: Complete (v3.0)
5. ✅ **Followers System**: Complete (v3.0)
6. **Engagement Patterns** (Optional): Consistency bonuses
7. **Implementation**: Code all systems

---

**Status**: Design Complete - Ready for Review  
**Last Updated**: November 13, 2025  
**Version**: 3.0 (Inflation-Controlled + Bot Defense + Quality Filtering)  
**Integration**: Seamlessly ties into All Reputation Systems  
**Follower Value**: 1.0-3.0 base × 0.3-2.0 quality × 1.0-1.3 mutual  
**Author**: GTA FanHub Development Team

