# Reputation System - Reposts Calculation

## v3.0 - Simplified & Inflation-Controlled

## 📊 Overview

This document outlines the calculation system for reputation points earned from **Reposts** (shares). When users repost content, the **original author** earns reputation based on the reposter's influence. This rewards quality content creation and encourages valuable contributions.

---

## 🎯 Core Formula (Twitter/X Model - Reach Amplification)

```javascript
// REPOST ACTION: Creates visibility, NO direct reputation
// Value comes from ENGAGEMENT on the repost, not the repost itself

// When post is REPOSTED (initial action):
- Repost appears in reposter's followers' Home Feed
- Original post shown with "User B reposted" header
- NO immediate reputation awarded
- Repost tracked for virality metrics

// When ENGAGEMENT happens on repost (likes, comments, etc.):

// Original Author (OP) earns 90%:
OPValue =
  getBaseValue() *                      // 0.4-1.0 for likes (normal values)
  getProgressiveWeight(liker.rep) *     // 0.5x-3.0x based on liker
  getEngagementMultiplier(post) *       // Small engagement bonus
  calculateAgeMultiplier(postAge) *     // 1.0x → 0.3x for old posts
  (1 - downvotesPenalty) *              // Downvotes affect OP
  applySoftCapIfFlagged(OP);            // Only if OP is flagged
// NO early vote bonus (OP already got it on original post)

// Reposter earns 10% (curation bonus):
reposterValue = OPValue × 0.10;         // 10% of engagement value
reposterValue = applySoftCapIfFlagged(reposter, reposterValue); // Check reposter flags
```

**Key Principles**:

1. **Twitter/X Model** - reposts appear in followers' Home Feed (massive reach)
2. **No direct reputation** - repost action itself gives 0 points (prevents farming)
3. **Value from engagement** - OP gets 90%, reposter gets 10% of likes/comments
4. **Weighted by liker** - veteran likes > newcomer likes (as normal)
5. **Age decay applies** - older reposts less valuable
6. **Anti-self-repost** - cannot repost your own content

---

## 💎 Component 1: Twitter/X Model - Feed Display

### Purpose

Explain how reposts create value through reach amplification, not direct reputation.

### How Reposts Work

```javascript
// Step 1: User B reposts User A's post
router.post("/api/posts/:postId/repost", async (req, res) => {
  // Create repost record
  const repost = await Repost.create({
    originalPost: postId,
    reposter: reposterId,
    repostChainDepth: 0,
    createdAt: Date.now(),
  });

  // NO reputation awarded at this point ✅
  // Value comes from engagement that follows

  return { reposted: true, repostCount: post.reposts.length + 1 };
});
```

### Feed Display Logic

```javascript
// Home Feed Query (shows posts + reposts from followed users)
const feedPosts = await Post.find({
  $or: [
    // Original posts from followed users
    { author: { $in: followedUserIds } },

    // Posts reposted by followed users
    { "reposts.userId": { $in: followedUserIds } },
  ],
}).sort({ createdAt: -1 });

// Display in feed
feedPosts.forEach((post) => {
  const repostByFollowed = post.reposts.find((r) =>
    followedUserIds.includes(r.userId)
  );

  if (repostByFollowed) {
    // Show: "User B reposted" above the post
    renderRepostHeader(repostByFollowed.userId);
  }

  // Show original post with full engagement
  renderPost(post);
});
```

### Value Creation

**Repost Action Itself**: 0 points ❌

**Engagement on Repost**:

- Like on repost: OP gets 90%, reposter gets 10% ✅
- Comment on repost: OP gets 90%, reposter gets 10% ✅
- Bookmark on repost: OP gets 90%, reposter gets 10% ✅

**Why This Model**:

- Prevents "repost farming" (repost without real reach)
- Real value comes from amplified engagement
- Encourages quality content sharing
- 10% curation bonus rewards thoughtful amplification
- Discourages spam (only 10% return)

---

## 💪 Component 2: Progressive Weight System (Inherited)

### Purpose

Weight reposts by the reposter's reputation to reward endorsements from established users while giving newcomers fair influence.

### Weight Formula (Same as Likes)

```javascript
function getProgressiveWeight(reposterReputation) {
  if (reposterReputation < 100) {
    return 0.5; // Newcomers give 50% value (anti-bot)
  }

  const weight = Math.log10(reposterReputation) / 2;
  return Math.min(weight, 3.0); // Cap at 3.0x
}
```

### Weight Scaling Table

| Reposter Rep | Formula       | Weight | Final Value (avg 3.5 base) | Tier        |
| ------------ | ------------- | ------ | -------------------------- | ----------- |
| 0-99         | Fixed         | 0.5x   | 1.75 points                | Newcomer    |
| 100          | log10(100)/2  | 1.0x   | 3.5 points                 | Established |
| 1,000        | log10(1K)/2   | 1.5x   | 5.25 points                | Veteran     |
| 10,000       | log10(10K)/2  | 2.0x   | 7.0 points                 | Expert      |
| 100,000      | log10(100K)/2 | 2.5x   | 8.75 points                | Elite       |
| 1,000,000    | log10(1M)/2   | 3.0x   | **10.5 points CAPPED**     | Legendary   |

**Key**: A legendary user's repost can be worth **10.5 points** (15x a like!), but this is intentional for quality content amplification.

---

## ⏱️ Component 3: Age-Based Diminishing (Same as Likes)

### Purpose

Prioritize resharing newer content to keep the feed fresh and encourage timely engagement.

### Age Multiplier

```javascript
function calculateAgeMultiplier(postAgeInDays) {
  if (postAgeInDays <= 7) return 1.0; // New: full value
  if (postAgeInDays <= 30) return 0.8; // Month old: 80%
  if (postAgeInDays <= 90) return 0.4; // 3 months: 40%
  return 0.3; // Old: 30% floor (evergreen allowed)
}
```

### Example Age Impact

```javascript
// Post is 2 days old
Repost by 10k rep user: 3.5 base × 2.0 weight × 1.0 age = 7.0 points

// Post is 40 days old
Repost by 10k rep user: 3.5 base × 2.0 weight × 0.8 age = 5.6 points

// Post is 100 days old
Repost by 10k rep user: 3.5 base × 2.0 weight × 0.3 age = 2.1 points
```

**Floor at 0.3x allows "evergreen" content to still earn some reputation!**

---

## 🔄 Component 4: Repost Logic & Anti-Spam

### Purpose

Allow users to reshare content to their followers while preventing abuse.

### Repost System

```javascript
async function handleRepost(postId, reposterId) {
  const post = await Post.findById(postId);
  const originalAuthor = await User.findById(post.author);
  const reposter = await User.findById(reposterId);

  // ANTI-SPAM CHECKS

  // 1. Cannot repost own content
  if (post.author.equals(reposterId)) {
    throw new Error("Cannot repost your own content");
  }

  // 2. Cannot repost same post twice
  const existingRepost = await Repost.findOne({
    originalPost: postId,
    reposter: reposterId,
  });

  if (existingRepost) {
    throw new Error("Already reposted this post");
  }

  // 3. Cannot repost deleted posts
  if (post.status !== "active") {
    throw new Error("Cannot repost deleted content");
  }

  // CALCULATE REPUTATION

  const baseValue = random(2.0, 5.0);
  const weight = getProgressiveWeight(reposter.socialStats.reputation);
  const postAge = (Date.now() - post.createdAt) / (1000 * 60 * 60 * 24);
  const ageMultiplier = calculateAgeMultiplier(postAge);

  let reputationGain = baseValue * weight * ageMultiplier;

  // Apply soft cap (only for flagged accounts)
  reputationGain = await applySoftCapIfFlagged(
    originalAuthor.id,
    reputationGain
  );

  // CREATE REPOST RECORD

  const repost = await Repost.create({
    originalPost: postId,
    reposter: reposterId,
    createdAt: Date.now(),
    reputationValue: reputationGain,
    calculation: {
      baseValue: baseValue,
      reposterWeight: weight,
      reposterReputation: reposter.socialStats.reputation,
      ageMultiplier: ageMultiplier,
      postAgeInDays: postAge,
      finalValue: reputationGain,
    },
  });

  // UPDATE POST

  post.reposts.push({
    userId: reposterId,
    timestamp: Date.now(),
    reputationValue: reputationGain,
  });

  post.engagement.reposts = post.reposts.length;
  await post.save();

  // NO REPUTATION AWARDED AT THIS POINT ✅
  // Reputation comes from ENGAGEMENT on the repost (likes, comments, bookmarks)
  // OP will earn 90% of engagement, reposter will earn 10%

  return {
    repost: repost,
    repostCount: post.engagement.reposts,
    // Reputation tracking happens when users engage with the repost
  };
}
```

### Anti-Spam Rules

```javascript
const REPOST_RULES = {
  NO_SELF_REPOST: true, // Cannot repost own content
  NO_DUPLICATE_REPOST: true, // Cannot repost same post twice
  NO_DELETED_POSTS: true, // Cannot repost deleted posts
  NO_HIDDEN_POSTS: true, // Cannot repost hidden posts (-10 score)
};
```

---

## 🔄 Component 5: Undo Repost (Unlike Equivalent)

### Purpose

Allow users to undo reposts and reverse reputation awarded.

### Undo Repost Logic

```javascript
async function handleUndoRepost(postId, reposterId) {
  const post = await Post.findById(postId);
  const repost = await Repost.findOne({
    originalPost: postId,
    reposter: reposterId,
  });

  if (!repost) {
    throw new Error("Repost not found");
  }

  const reposter = await User.findById(reposterId);

  // ONLY REMOVE REPOSTER'S 10% CURATION BONUS ✅
  // OP KEEPS their 90% - it came from real engagement!

  // Calculate reposter's total curation bonus from this repost
  const reposterCurationBonus = await ReputationHistory.aggregate([
    {
      $match: {
        userId: reposterId,
        source: "repost_curation", // Separate source for reposter's 10%
        repostId: repost._id,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$change" },
      },
    },
  ]);

  const bonusToRemove = reposterCurationBonus[0]?.total || 0;

  // Remove from reposter's reputation only
  reposter.socialStats.reputation -= bonusToRemove;
  reposter.socialStats.repostsReputation -= bonusToRemove;

  // Update reputation history (mark as unreposted for context)
  await ReputationHistory.updateMany(
    {
      userId: reposterId,
      source: "repost_curation",
      repostId: repost._id,
    },
    {
      $set: { eventType: "unreposted" }, // Mark for auditing, value unchanged
    }
  );

  // Recalculate reposter's active/legacy
  const { active, legacy, total } = calculateTotalReputation(reposter);
  reposter.socialStats.activeReputation = active;
  reposter.socialStats.legacyReputation = legacy;
  reposter.socialStats.reputation = total;

  // Floor at 0
  if (reposter.socialStats.reputation < 0) {
    reposter.socialStats.reputation = 0;
  }
  if (reposter.socialStats.repostsReputation < 0) {
    reposter.socialStats.repostsReputation = 0;
  }

  // Remove repost from post
  post.reposts = post.reposts.filter((r) => !r.userId.equals(reposterId));
  post.engagement.reposts = post.reposts.length;

  // Delete repost record
  await repost.deleteOne();
  await post.save();
  await reposter.save();

  // OP's reputation UNCHANGED ✅
  // They earned it from real engagement that already happened

  return { undone: true, reposterPenalty: bonusToRemove };
}
```

---

## 🛡️ Bot Defense (Inherited from Likes System)

### Purpose

Prevent bot networks from artificially inflating reputation through mass reposts.

### Layer 1: IP Rate Limiting

```javascript
const IP_LIMITS_REPOSTS = {
  MAX_REPOSTS_PER_IP_PER_MINUTE: 5, // Reasonable for legitimate users
  MAX_REPOSTS_PER_IP_PER_HOUR: 30, // 30 reposts/hour

  // CAPTCHA (same rate-based system)
  REQUIRE_CAPTCHA_AFTER: 10, // 10 reposts in 10-minute window
  CAPTCHA_ROLLING_WINDOW: 10,
  CAPTCHA_COOLDOWN: 60,

  // Progressive tiers (NO instant ban)
  TIER_1_THRESHOLD: 15, // 15 reposts/minute = Tier 1
};
```

**Progressive Tier System** (Replaces Instant Ban):

```javascript
const RATE_LIMIT_TIERS = {
  TIER_1: {
    trigger: 15, // 15 reposts/minute
    punishment: 'REPOST_PAUSE',
    duration: 5 * 60 * 60 * 1000, // 5 hours
    message: 'Reposting paused for 5 hours. Please slow down.',
  },

  TIER_2: {
    trigger: 'TIER_1_WITHIN_7_DAYS',
    punishment: 'REPOST_PAUSE',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    message: 'Reposting paused for 24 hours. Repeated violations detected.',
  },

  TIER_3: {
    trigger: 'TIER_2_WITHIN_30_DAYS',
    punishment: 'REPOST_PAUSE',
    duration: 72 * 60 * 60 * 1000, // 72 hours
    message: 'Reposting paused for 72 hours. ⚠️ WARNING: Account suspension pending.',
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
  { type: 'repost_rate_limit', tier: 1, timestamp: Date.now() },
  { type: 'repost_rate_limit', tier: 2, timestamp: Date.now() },
];

// Reset after 6 months clean
if (lastViolation > 6 months ago) {
  user.currentTier = 0; // Reset to clean slate
}
```

**Why Progressive System?**

- Fair warning for legitimate users
- Prevents accidental permanent bans
- Clear escalation path
- Email notifications at serious tiers
- Appeal system for false positives
- 30-day grace period before deletion

### Layers 2-4: Same as Likes

- **Layer 2**: Technical bot detection (automation headers, timing, fingerprints)
- **Layer 3**: Soft caps for flagged accounts (2+ flags, 100 rep/day threshold)
- **Layer 4**: Reputation reversal after ban (removes all reposts, reverses rep)

---

## 📊 Reputation Tracking: Source-Based Breakdown

### Purpose

Track reputation earned from reposts separately for transparency.

### Source Counter Updates

```javascript
// When user's post is reposted
user.socialStats.repostsReputation += calculatedValue;
user.socialStats.reputation += calculatedValue;

// Display (backend only, shown in breakdown)
By Source:
  📝 Posts: 1,800 (71%)
  💬 Comments: 150 (6%)
  🔖 Bookmarks: 97 (4%)
  🔁 Reposts: 450 (18%)  // ← NEW
```

---

## 📈 Complete Repost Calculation Example

### Scenario: Viral Post Gets Reposted

**Post Details**:

- Created 3 days ago (within 7-day window)
- High-quality discussion post
- 150 likes already

**Repost 1**: Newcomer user (50 rep)

```javascript
Base: 2.8
Weight: 0.5x (newcomer)
Age: 1.0x (3 days old)
Final: 2.8 × 0.5 × 1.0 = 1.4 points
```

**Repost 2**: Veteran user (5,000 rep)

```javascript
Base: 4.2
Weight: 1.85x (veteran)
Age: 1.0x (3 days old)
Final: 4.2 × 1.85 × 1.0 = 7.77 points
```

**Repost 3**: Legendary user (500,000 rep)

```javascript
Base: 3.9
Weight: 2.85x (near cap)
Age: 1.0x (3 days old)
Final: 3.9 × 2.85 × 1.0 = 11.1 points
```

**Total from 3 reposts**: 1.4 + 7.77 + 11.1 = **20.27 reputation points**

**Comparison**:

- 3 reposts = 20.27 points
- 30 likes (avg 0.7) = 21 points
- **1 repost ≈ 10 likes in value** ✅

---

## 🎮 Repost Reputation Timeline Projection

### Light User (5 reposts received/month)

```
Monthly: 5 reposts × 3.5 avg base × 1.2 avg weight × 0.9 avg age = 18.9 points/month
Yearly: 227 points/year
5 Years: 1,135 points from reposts
```

### Active User (20 reposts received/month)

```
Monthly: 20 reposts × 3.5 avg × 1.2 avg weight × 0.9 avg age = 75.6 points/month
Yearly: 907 points/year
5 Years: 4,535 points from reposts
```

### Viral Content Creator (50 reposts received/month)

```
Monthly: 50 reposts × 3.5 avg × 1.5 avg weight × 0.95 avg age = 249 points/month
Yearly: 2,988 points/year
5 Years: 14,940 points from reposts
```

**Reposts provide significant reputation boost for quality content creators!**

---

## 🔧 Implementation Architecture

### Database Schema Updates

```javascript
// NEW: Repost Model
const RepostSchema = new Schema({
  originalPost: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  reposter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  reputationValue: { type: Number, required: true },

  calculation: {
    baseValue: Number,
    reposterWeight: Number,
    reposterReputation: Number,
    ageMultiplier: Number,
    postAgeInDays: Number,
    finalValue: Number,
  },

  createdAt: { type: Date, default: Date.now, index: true },
});

// Compound index to prevent duplicate reposts
RepostSchema.index({ originalPost: 1, reposter: 1 }, { unique: true });

// Post Schema Addition
reposts: [
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: Date,
    reputationValue: Number,
  }
],

engagement: {
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  reposts: { type: Number, default: 0 },  // ← NEW
  bookmarks: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
},

// User Schema Addition
socialStats: {
  reputation: { type: Number, default: 0 },
  activeReputation: { type: Number, default: 0 },
  legacyReputation: { type: Number, default: 0 },

  // Source counters
  postsReputation: { type: Number, default: 0 },
  commentsReputation: { type: Number, default: 0 },
  bookmarksReputation: { type: Number, default: 0 },
  repostsReputation: { type: Number, default: 0 },  // ← NEW
  followersReputation: { type: Number, default: 0 },
}
```

---

## 🔌 API Endpoints

### POST /api/posts/:postId/repost (Repost a Post)

```javascript
router.post("/api/posts/:postId/repost", async (req, res) => {
  const { postId } = req.params;
  const reposterId = req.user.id;

  // Bot detection
  const botCheck = await detectBot(req);
  if (botCheck.isBot) {
    return res.status(403).json({ error: "Bot detected" });
  }

  // IP rate limits
  const ipReposts = await countIPReposts(req.ip, 60);
  if (ipReposts >= IP_LIMITS_REPOSTS.MAX_REPOSTS_PER_IP_PER_HOUR) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  // CAPTCHA check
  if (await checkCaptchaRequired(reposterId, "reposts")) {
    return res.status(449).json({ requireCaptcha: true });
  }

  const post = await Post.findById(postId);
  const reposter = await User.findById(reposterId);

  // Anti-spam checks
  if (post.author.equals(reposterId)) {
    return res.status(400).json({ error: "Cannot repost your own content" });
  }

  const existingRepost = await Repost.findOne({
    originalPost: postId,
    reposter: reposterId,
  });

  if (existingRepost) {
    // Undo repost
    await handleUndoRepost(postId, reposterId);
    return res.json({ reposted: false });
  }

  // Repost the post
  const result = await handleRepost(postId, reposterId);

  res.json({
    reposted: true,
    postReposts: post.engagement.reposts + 1,
    authorReputation: stableFuzzValue(result.authorReputationGain),
  });
});
```

### DELETE /api/posts/:postId/repost (Undo Repost)

```javascript
router.delete("/api/posts/:postId/repost", async (req, res) => {
  const { postId } = req.params;
  const reposterId = req.user.id;

  await handleUndoRepost(postId, reposterId);

  res.json({ reposted: false });
});
```

---

## 📊 Implementation Checklist

### Database Changes

- [ ] Create `Repost` model with unique compound index
- [ ] Add `reposts` array to Post model
- [ ] Add `engagement.reposts` to Post model
- [ ] Add `repostsReputation` to User model
- [ ] Update ReputationHistory enum to include `repost`
- [ ] Create indexes on `repost.originalPost`, `repost.reposter`

### Core Functions

- [ ] `handleRepost(postId, reposterId)` - Calculate and award reputation to original author
- [ ] `handleUndoRepost(postId, reposterId)` - Remove reputation from original author
- [ ] `countIPReposts(ip, minutes)` - IP rate limiting
- [ ] `checkDuplicateRepost(postId, reposterId)` - Prevent duplicate reposts

### API Endpoints

- [ ] `POST /api/posts/:id/repost` - Repost a post (toggle behavior)
- [ ] `DELETE /api/posts/:id/repost` - Undo repost
- [ ] `GET /api/posts/:id/reposters` - Get list of users who reposted

### Testing

- [ ] Unit tests for random base values (2.0-5.0)
- [ ] Weight calculation (0.5x-3.0x based on reposter rep)
- [ ] Age decay (1.0x → 0.3x floor)
- [ ] Anti-spam (no self-repost, no duplicates)
- [ ] Source counter updates (repostsReputation)
- [ ] Undo repost (reputation reversal)
- [ ] Bot defense integration (4 layers)

---

## ✅ Summary - Reposts System

### **Key Design Decisions:**

**High Value for Quality Content:**

- ✅ Random base 2.0-5.0 (avg ~3.5)
- ✅ Weighted by reposter reputation (0.5x-3.0x)
- ✅ Age decay applies (1.0x → 0.3x floor)
- ✅ 1 repost ≈ 10 likes in value

**Original Author Earns, Reposter Does Not:**

- ✅ Original author gets ALL reputation
- ✅ Reposter earns 0 reputation (prevents spam)
- ✅ Encourages quality content creation
- ✅ Discourages mindless resharing

**Anti-Spam:**

- ✅ Cannot repost own content
- ✅ Cannot repost same post twice
- ✅ Cannot repost deleted/hidden posts
- ✅ Unique compound index enforces rules

**Bot Defense:**

- ✅ Stricter IP limits (20 reposts/hour vs 60 likes/hour)
- ✅ Same 4-layer system as likes
- ✅ CAPTCHA after 10 reposts in 10 minutes
- ✅ Instant ban at 15 reposts/minute

**Source Tracking:**

- ✅ Separate `repostsReputation` counter
- ✅ Backend tracking, shown in breakdown
- ✅ Transparent reputation sources

**Timeline Contribution:**

- Light user: ~1k rep in 5 years
- Active user: ~4.5k rep in 5 years
- Viral creator: ~15k rep in 5 years
- **Balanced with posts/comments** ✅

---

## 🚀 Next Steps

1. ✅ **Likes System**: Complete (v3.0)
2. ✅ **Comments System**: Complete (v3.0 Simplified)
3. ✅ **Reposts System**: Complete (v3.0)
4. **Bookmarks Calculation**: Design reputation for saving posts
5. **Followers Calculation**: Organic growth rewards
6. **Implementation**: Code all systems

---

**Status**: Design Complete - Ready for Review  
**Last Updated**: November 12, 2025  
**Version**: 3.0 (Inflation-Controlled + Bot Defense)  
**Integration**: Seamlessly ties into Likes & Comments Systems  
**Repost Value**: 2.0-5.0 base (weighted, age decay)  
**Author**: GTA FanHub Development Team
