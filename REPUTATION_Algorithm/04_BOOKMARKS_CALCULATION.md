# Reputation System - Bookmarks Calculation

## v3.0 - Quality Content Indicator

## 📊 Overview

This document outlines the calculation system for reputation points earned from **Bookmarks** (saves). When users bookmark content, the **original author** earns reputation. Bookmarks indicate high-quality, valuable content worth revisiting. Unlike likes (quick engagement), bookmarks represent deeper value and intent to reference later.

---

## 🎯 Core Formula (Quality Signal)

```javascript
// Original author earns reputation when their post is bookmarked
bookmarkValue =
  getBaseValue() * // Random 0.5-1.2 (between like avg and comment)
  getProgressiveWeight(bookmarker.rep) * // 0.5x-3.0x based on bookmarker
  calculateAgeMultiplier(postAge) * // 1.0x → 0.3x for old posts
  (1 - downvotesPenalty) * // Downvotes affect author
  applySoftCapIfFlagged(author); // Only if author is flagged

// NO early vote bonus (bookmarks are deliberate, not time-sensitive)
// NO engagement multiplier (bookmark is independent of post popularity)
```

**Key Principles**:

1. **Quality indicator** - bookmarks show content worth saving
2. **Higher than likes** - 0.5-1.2 base (more deliberate than quick like)
3. **Weighted by bookmarker** - veteran bookmark > newcomer bookmark
4. **Age decay applies** - evergreen content still valuable
5. **No early bonus** - bookmarks aren't time-sensitive
6. **Anti-self-bookmark** - cannot bookmark your own content

---

## 💎 Component 1: Bookmark Base Values (Random)

### Purpose

Establish base reputation values for bookmarks that reflect their quality signaling while maintaining natural variance.

### Base Value System

```javascript
const BASE_REPUTATION = {
  BOOKMARK: () => random(0.5, 1.2), // Slightly higher than like average (~0.7)
};

function getBaseValue() {
  return random(0.5, 1.2); // Natural variance
}
```

### Why 0.5-1.2 (Higher Than Likes)?

**Comparison**:

- Like: 0.4-1.0 base (avg ~0.7)
- **Bookmark: 0.5-1.2 (avg ~0.85)**
- Comment like: 0.35 flat
- Repost: Engagement-based (0 direct value)

**Reasoning**:

- Bookmarks are **more deliberate** than likes (takes extra step)
- Indicates **reference-worthy content** (long-term value)
- Shows **intent to revisit** (deeper engagement)
- **Less frequent** than likes (higher value per action)
- **Quality signal** for content creators

### Bookmark Value Curve

```javascript
// Example bookmark values
Bookmark 1: random(0.5, 1.2) = 0.7 points
Bookmark 2: random(0.5, 1.2) = 1.1 points
Bookmark 3: random(0.5, 1.2) = 0.9 points
Average: ~0.85 points per bookmark (before weight/decay)
```

---

## 💪 Component 2: Progressive Weight System (Inherited)

### Purpose

Weight bookmarks by the bookmarker's reputation to reward endorsements from established users while giving newcomers fair influence.

### Weight Formula (Same as Likes)

```javascript
function getProgressiveWeight(bookmarkerReputation) {
  if (bookmarkerReputation < 100) {
    return 0.5; // Newcomers give 50% value (anti-bot)
  }

  const weight = Math.log10(bookmarkerReputation) / 2;
  return Math.min(weight, 3.0); // Cap at 3.0x
}
```

### Weight Scaling Table

| Bookmarker Rep | Formula       | Weight | Final Value (avg 0.85 base) | Tier        |
| -------------- | ------------- | ------ | --------------------------- | ----------- |
| 0-99           | Fixed         | 0.5x   | 0.43 points                 | Newcomer    |
| 100            | log10(100)/2  | 1.0x   | 0.85 points                 | Established |
| 1,000          | log10(1K)/2   | 1.5x   | 1.28 points                 | Veteran     |
| 10,000         | log10(10K)/2  | 2.0x   | 1.7 points                  | Expert      |
| 100,000        | log10(100K)/2 | 2.5x   | 2.13 points                 | Elite       |
| 1,000,000      | log10(1M)/2   | 3.0x   | **2.55 points CAPPED**      | Legendary   |

**Key**: A legendary user's bookmark can be worth **2.55 points** (~3.6x a like!), reflecting the quality signal.

---

## ⏱️ Component 3: Age-Based Diminishing (Same as Likes)

### Purpose

Prioritize bookmarking newer content while still allowing evergreen content to earn reputation.

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
Bookmark by 10k rep user: 0.85 base × 2.0 weight × 1.0 age = 1.7 points

// Post is 40 days old
Bookmark by 10k rep user: 0.85 base × 2.0 weight × 0.8 age = 1.36 points

// Post is 100 days old (evergreen guide)
Bookmark by 10k rep user: 0.85 base × 2.0 weight × 0.3 age = 0.51 points
```

**Floor at 0.3x allows evergreen guides/tutorials to still earn reputation!**

---

## 🔖 Component 4: Bookmark Logic & Anti-Spam

### Purpose

Allow users to save valuable content for later while preventing abuse.

### Bookmark System

```javascript
async function handleBookmark(postId, bookmarkerId) {
  const post = await Post.findById(postId);
  const originalAuthor = await User.findById(post.author);
  const bookmarker = await User.findById(bookmarkerId);

  // ANTI-SPAM CHECKS

  // 1. Cannot bookmark own content
  if (post.author.equals(bookmarkerId)) {
    throw new Error("Cannot bookmark your own content");
  }

  // 2. Cannot bookmark same post twice
  const existingBookmark = await Bookmark.findOne({
    post: postId,
    user: bookmarkerId,
  });

  if (existingBookmark) {
    throw new Error("Already bookmarked this post");
  }

  // 3. Cannot bookmark deleted posts
  if (post.status !== "active") {
    throw new Error("Cannot bookmark deleted content");
  }

  // 4. Cannot bookmark hidden posts
  if (post.score < -10) {
    throw new Error("Cannot bookmark hidden content");
  }

  // CALCULATE REPUTATION

  const baseValue = random(0.5, 1.2);
  const weight = getProgressiveWeight(bookmarker.socialStats.reputation);
  const postAge = (Date.now() - post.createdAt) / (1000 * 60 * 60 * 24);
  const ageMultiplier = calculateAgeMultiplier(postAge);

  // NO early vote bonus (bookmarks aren't time-sensitive)
  // NO engagement multiplier (bookmark is independent of popularity)

  let reputationGain = baseValue * weight * ageMultiplier;

  // Apply downvote penalty
  const downvotePenalty = Math.min(post.downvotes.length * 0.01, 0.5); // Max 50% reduction
  reputationGain = reputationGain * (1 - downvotePenalty);

  // Apply soft cap (only for flagged accounts)
  reputationGain = await applySoftCapIfFlagged(
    originalAuthor.id,
    reputationGain
  );

  // CREATE BOOKMARK RECORD

  const bookmark = await Bookmark.create({
    post: postId,
    user: bookmarkerId,
    createdAt: Date.now(),
    reputationValue: reputationGain,
    calculation: {
      baseValue: baseValue,
      bookmarkerWeight: weight,
      bookmarkerReputation: bookmarker.socialStats.reputation,
      ageMultiplier: ageMultiplier,
      postAgeInDays: postAge,
      downvotePenalty: downvotePenalty,
      finalValue: reputationGain,
    },
  });

  // UPDATE POST

  post.bookmarks.push({
    userId: bookmarkerId,
    timestamp: Date.now(),
    reputationValue: reputationGain,
  });

  post.engagement.bookmarks = post.bookmarks.length;
  await post.save();

  // AWARD REPUTATION TO ORIGINAL AUTHOR

  originalAuthor.socialStats.reputation += reputationGain;
  originalAuthor.socialStats.bookmarksReputation += reputationGain;

  originalAuthor.reputationHistory.push({
    timestamp: Date.now(),
    change: reputationGain,
    source: "bookmark",
    sourceId: postId,
    sourceUserId: bookmarkerId,
    eventType: "active",
    details: {
      baseValue: baseValue,
      weight: weight,
      ageMultiplier: ageMultiplier,
    },
  });

  // Recalculate active/legacy
  const { active, legacy, total } = calculateTotalReputation(originalAuthor);
  originalAuthor.socialStats.activeReputation = active;
  originalAuthor.socialStats.legacyReputation = legacy;

  await originalAuthor.save();

  return {
    bookmark: bookmark,
    authorReputationGain: reputationGain,
  };
}
```

### Anti-Spam Rules

```javascript
const BOOKMARK_RULES = {
  NO_SELF_BOOKMARK: true, // Cannot bookmark own content
  NO_DUPLICATE_BOOKMARK: true, // Cannot bookmark same post twice
  NO_DELETED_POSTS: true, // Cannot bookmark deleted posts
  NO_HIDDEN_POSTS: true, // Cannot bookmark hidden posts (-10 score)
};
```

---

## 🔄 Component 5: Unbookmark (Unlike Equivalent)

### Purpose

Allow users to remove bookmarks and reverse reputation awarded.

### Unbookmark Logic

```javascript
async function handleUnbookmark(postId, bookmarkerId) {
  const post = await Post.findById(postId);
  const bookmark = await Bookmark.findOne({
    post: postId,
    user: bookmarkerId,
  });

  if (!bookmark) {
    throw new Error("Bookmark not found");
  }

  const originalAuthor = await User.findById(post.author);
  const reputationToRemove = bookmark.reputationValue;

  // Remove from original author's reputation
  originalAuthor.socialStats.reputation -= reputationToRemove;
  originalAuthor.socialStats.bookmarksReputation -= reputationToRemove;

  // Update reputation history (mark as unbookmarked for context)
  await ReputationHistory.updateOne(
    {
      userId: originalAuthor._id,
      source: "bookmark",
      sourceId: postId,
      sourceUserId: bookmarkerId,
    },
    {
      $set: { eventType: "unbookmarked" }, // Mark for auditing, value unchanged
    }
  );

  // Recalculate active/legacy
  const { active, legacy, total } = calculateTotalReputation(originalAuthor);
  originalAuthor.socialStats.activeReputation = active;
  originalAuthor.socialStats.legacyReputation = legacy;
  originalAuthor.socialStats.reputation = total;

  // Floor at 0
  if (originalAuthor.socialStats.reputation < 0) {
    originalAuthor.socialStats.reputation = 0;
  }
  if (originalAuthor.socialStats.bookmarksReputation < 0) {
    originalAuthor.socialStats.bookmarksReputation = 0;
  }

  // Remove bookmark from post
  post.bookmarks = post.bookmarks.filter((b) => !b.userId.equals(bookmarkerId));
  post.engagement.bookmarks = post.bookmarks.length;

  // Delete bookmark record
  await bookmark.deleteOne();
  await post.save();
  await originalAuthor.save();

  return { unbookmarked: true };
}
```

---

## 🛡️ Bot Defense (Inherited from Likes System)

### Purpose

Prevent bot networks from artificially inflating reputation through mass bookmarks.

### Layer 1: IP Rate Limiting

```javascript
const IP_LIMITS_BOOKMARKS = {
  MAX_BOOKMARKS_PER_IP_PER_MINUTE: 3, // Very deliberate action
  MAX_BOOKMARKS_PER_IP_PER_HOUR: 20, // 20 bookmarks/hour reasonable

  // CAPTCHA (same rate-based system)
  REQUIRE_CAPTCHA_AFTER: 10, // 10 bookmarks in 10-minute window
  CAPTCHA_ROLLING_WINDOW: 10,
  CAPTCHA_COOLDOWN: 60,

  // Progressive tiers (NO instant ban)
  TIER_1_THRESHOLD: 12, // 12 bookmarks/minute = Tier 1
};
```

**Progressive Tier System** (Replaces Instant Ban):

```javascript
const RATE_LIMIT_TIERS = {
  TIER_1: {
    trigger: 12, // 12 bookmarks/minute
    punishment: 'BOOKMARK_PAUSE',
    duration: 5 * 60 * 60 * 1000, // 5 hours
    message: 'Bookmarking paused for 5 hours. Please slow down.',
  },

  TIER_2: {
    trigger: 'TIER_1_WITHIN_7_DAYS',
    punishment: 'BOOKMARK_PAUSE',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    message: 'Bookmarking paused for 24 hours. Repeated violations detected.',
  },

  TIER_3: {
    trigger: 'TIER_2_WITHIN_30_DAYS',
    punishment: 'BOOKMARK_PAUSE',
    duration: 72 * 60 * 60 * 1000, // 72 hours
    message: 'Bookmarking paused for 72 hours. ⚠️ WARNING: Account suspension pending.',
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
  { type: 'bookmark_rate_limit', tier: 1, timestamp: Date.now() },
  { type: 'bookmark_rate_limit', tier: 2, timestamp: Date.now() },
];

// Reset after 6 months clean
if (lastViolation > 6 months ago) {
  user.currentTier = 0; // Reset to clean slate
}
```

**Why Stricter Than Likes?**

- Bookmarks are high-value (0.5-1.2 base)
- Should be very deliberate (saving for reference)
- Prevents "mass bookmark" bot attacks

### Layers 2-4: Same as Likes

- **Layer 2**: Technical bot detection (automation headers, timing, fingerprints)
- **Layer 3**: Soft caps for flagged accounts (2+ flags, 100 rep/day threshold)
- **Layer 4**: Reputation reversal after ban (removes all bookmarks, reverses rep)

---

## 📊 Reputation Tracking: Source-Based Breakdown

### Purpose

Track reputation earned from bookmarks separately for transparency.

### Source Counter Updates

```javascript
// When user's post is bookmarked
user.socialStats.bookmarksReputation += calculatedValue;
user.socialStats.reputation += calculatedValue;

// Display (backend only, shown in breakdown)
By Source:
  📝 Posts: 1,800 (60%)
  🔖 Bookmarks: 450 (15%)  // ← Significant contribution
  🔁 Reposts: 350 (12%)
  💬 Comments: 150 (5%)
```

---

## 📈 Complete Bookmark Calculation Example

### Scenario: Quality Guide Post Gets Bookmarked

**Post Details**:

- Created 5 days ago (within 7-day window)
- In-depth tutorial/guide
- 200 likes, 50 comments, 10 reposts already

**Bookmark 1**: Newcomer user (50 rep)

```javascript
Base: 0.7
Weight: 0.5x (newcomer)
Age: 1.0x (5 days old)
Downvotes: 0 (none)
Final: 0.7 × 0.5 × 1.0 = 0.35 points
```

**Bookmark 2**: Veteran user (5,000 rep)

```javascript
Base: 1.1
Weight: 1.85x (veteran)
Age: 1.0x (5 days old)
Downvotes: 0 (none)
Final: 1.1 × 1.85 × 1.0 = 2.04 points
```

**Bookmark 3**: Legendary user (500,000 rep)

```javascript
Base: 0.9
Weight: 2.85x (near cap)
Age: 1.0x (5 days old)
Downvotes: 0 (none)
Final: 0.9 × 2.85 × 1.0 = 2.57 points
```

**Total from 3 bookmarks**: 0.35 + 2.04 + 2.57 = **4.96 reputation points**

**Comparison**:

- 3 bookmarks = 4.96 points
- 7 likes (avg 0.7) = 4.9 points
- **1 bookmark ≈ 2-3 likes in value** ✅

---

## 🎮 Bookmark Reputation Timeline Projection

### Light User (10 bookmarks received/month)

```
Monthly: 10 bookmarks × 0.85 avg base × 1.2 avg weight × 0.9 avg age = 9.2 points/month
Yearly: 110 points/year
5 Years: 550 points from bookmarks
```

### Active User (40 bookmarks received/month)

```
Monthly: 40 bookmarks × 0.85 avg × 1.2 avg weight × 0.9 avg age = 36.7 points/month
Yearly: 440 points/year
5 Years: 2,200 points from bookmarks
```

### Quality Content Creator (100 bookmarks received/month)

```
Monthly: 100 bookmarks × 0.85 avg × 1.5 avg weight × 0.95 avg age = 121 points/month
Yearly: 1,452 points/year
5 Years: 7,260 points from bookmarks
```

**Bookmarks provide solid reputation boost for quality, reference-worthy content!**

---

## 🔧 Implementation Architecture

### Database Schema Updates

```javascript
// NEW: Bookmark Model
const BookmarkSchema = new Schema({
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  reputationValue: { type: Number, required: true },

  calculation: {
    baseValue: Number,
    bookmarkerWeight: Number,
    bookmarkerReputation: Number,
    ageMultiplier: Number,
    postAgeInDays: Number,
    downvotePenalty: Number,
    finalValue: Number,
  },

  createdAt: { type: Date, default: Date.now, index: true },
});

// Compound index to prevent duplicate bookmarks
BookmarkSchema.index({ post: 1, user: 1 }, { unique: true });

// Post Schema Addition
bookmarks: [
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    timestamp: Date,
    reputationValue: Number,
  }
],

engagement: {
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  reposts: { type: Number, default: 0 },
  bookmarks: { type: Number, default: 0 },  // ← NEW
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
  bookmarksReputation: { type: Number, default: 0 },  // ← NEW
  repostsReputation: { type: Number, default: 0 },
  followersReputation: { type: Number, default: 0 },
}
```

---

## 🔌 API Endpoints

### POST /api/posts/:postId/bookmark (Bookmark a Post)

```javascript
router.post("/api/posts/:postId/bookmark", async (req, res) => {
  const { postId } = req.params;
  const bookmarkerId = req.user.id;

  // Bot detection
  const botCheck = await detectBot(req);
  if (botCheck.isBot) {
    return res.status(403).json({ error: "Bot detected" });
  }

  // IP rate limits
  const ipBookmarks = await countIPBookmarks(req.ip, 60);
  if (ipBookmarks >= IP_LIMITS_BOOKMARKS.MAX_BOOKMARKS_PER_IP_PER_HOUR) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  // CAPTCHA check
  if (await checkCaptchaRequired(bookmarkerId, "bookmarks")) {
    return res.status(449).json({ requireCaptcha: true });
  }

  const post = await Post.findById(postId);
  const bookmarker = await User.findById(bookmarkerId);

  // Anti-spam checks
  if (post.author.equals(bookmarkerId)) {
    return res.status(400).json({ error: "Cannot bookmark your own content" });
  }

  const existingBookmark = await Bookmark.findOne({
    post: postId,
    user: bookmarkerId,
  });

  if (existingBookmark) {
    // Unbookmark
    await handleUnbookmark(postId, bookmarkerId);
    return res.json({ bookmarked: false });
  }

  // Bookmark the post
  const result = await handleBookmark(postId, bookmarkerId);

  res.json({
    bookmarked: true,
    postBookmarks: post.engagement.bookmarks + 1,
    authorReputation: stableFuzzValue(result.authorReputationGain),
  });
});
```

### DELETE /api/posts/:postId/bookmark (Unbookmark)

```javascript
router.delete("/api/posts/:postId/bookmark", async (req, res) => {
  const { postId } = req.params;
  const bookmarkerId = req.user.id;

  await handleUnbookmark(postId, bookmarkerId);

  res.json({ bookmarked: false });
});
```

### GET /api/user/:userId/bookmarks (Get User's Bookmarks)

```javascript
router.get("/api/user/:userId/bookmarks", async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const bookmarks = await Bookmark.find({ user: userId })
    .populate("post")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Bookmark.countDocuments({ user: userId });

  res.json({
    bookmarks,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
```

---

## 📊 Implementation Checklist

### Database Changes

- [ ] Create `Bookmark` model with unique compound index
- [ ] Add `bookmarks` array to Post model
- [ ] Add `engagement.bookmarks` to Post model
- [ ] Add `bookmarksReputation` to User model
- [ ] Update ReputationHistory enum to include `bookmark`
- [ ] Create indexes on `bookmark.post`, `bookmark.user`

### Core Functions

- [ ] `handleBookmark(postId, bookmarkerId)` - Calculate and award reputation
- [ ] `handleUnbookmark(postId, bookmarkerId)` - Remove reputation
- [ ] `countIPBookmarks(ip, minutes)` - IP rate limiting
- [ ] `checkDuplicateBookmark(postId, bookmarkerId)` - Prevent duplicates

### API Endpoints

- [ ] `POST /api/posts/:id/bookmark` - Bookmark a post (toggle behavior)
- [ ] `DELETE /api/posts/:id/bookmark` - Unbookmark
- [ ] `GET /api/user/:userId/bookmarks` - Get user's bookmarked posts

### Testing

- [ ] Unit tests for random base values (0.5-1.2)
- [ ] Weight calculation (0.5x-3.0x based on bookmarker rep)
- [ ] Age decay (1.0x → 0.3x floor)
- [ ] Anti-spam (no self-bookmark, no duplicates)
- [ ] Source counter updates (bookmarksReputation)
- [ ] Unbookmark (reputation reversal)
- [ ] Bot defense integration (4 layers)

---

## ✅ Summary - Bookmarks System

### **Key Design Decisions:**

**Quality Signal:**

- ✅ Random base 0.5-1.2 (avg ~0.85)
- ✅ Higher than likes (more deliberate action)
- ✅ Weighted by bookmarker reputation (0.5x-3.0x)
- ✅ Age decay applies (1.0x → 0.3x floor)
- ✅ 1 bookmark ≈ 2-3 likes in value

**No Time Pressure:**

- ✅ NO early vote bonus (bookmarks aren't time-sensitive)
- ✅ NO engagement multiplier (independent of popularity)
- ✅ Encourages saving genuinely useful content
- ✅ Rewards evergreen guides/tutorials

**Anti-Spam:**

- ✅ Cannot bookmark own content
- ✅ Cannot bookmark same post twice
- ✅ Cannot bookmark deleted/hidden posts
- ✅ Unique compound index enforces rules

**Bot Defense:**

- ✅ Stricter IP limits (20 bookmarks/hour vs 60 likes/hour)
- ✅ Same 4-layer system as likes
- ✅ CAPTCHA after 10 bookmarks in 10 minutes
- ✅ Progressive tiers (12 bookmarks/min = Tier 1)

**Source Tracking:**

- ✅ Separate `bookmarksReputation` counter
- ✅ Backend tracking, shown in breakdown
- ✅ Transparent reputation sources

**Timeline Contribution:**

- Light user: ~550 rep in 5 years
- Active user: ~2,200 rep in 5 years
- Quality creator: ~7,260 rep in 5 years
- **~5-15% of total reputation** ✅

---

## 🚀 Next Steps

1. ✅ **Likes System**: Complete (v3.0)
2. ✅ **Comments System**: Complete (v3.0 Simplified)
3. ✅ **Reposts System**: Complete (v3.1 Twitter/X Model)
4. ✅ **Bookmarks System**: Complete (v3.0)
5. **Followers Calculation**: Organic growth rewards
6. **Implementation**: Code all systems

---

**Status**: Design Complete - Ready for Review  
**Last Updated**: November 13, 2025  
**Version**: 3.0 (Inflation-Controlled + Bot Defense)  
**Integration**: Seamlessly ties into Likes, Comments, & Reposts Systems  
**Bookmark Value**: 0.5-1.2 base (weighted, age decay, quality signal)  
**Author**: GTA FanHub Development Team
