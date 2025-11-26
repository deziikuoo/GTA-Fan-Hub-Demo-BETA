# Reputation System - Comments Calculation

## v3.0 - Simplified & Inflation-Controlled

## 📊 Overview

This document outlines the **simplified** calculation system for reputation points earned from **Comments**. Users earn reputation ONLY from likes received ON their comments (not from posting comments). This system integrates seamlessly with the Likes Calculation (v3.0).

---

## 🎯 Core Formula (Ultra-Simplified)

```javascript
// Users earn reputation ONLY from likes on their comments
commentLikeValue = 0.35; // FLAT value for all users

// Per comment like:
reputationGain = 0.35 points (always, regardless of:
  - Liker's reputation (unweighted)
  - Comment age (no decay)
  - Comment quality (no bonuses)
  - Reply depth (no bonuses)
)

// Total comment reputation
totalCommentRep = Σ(comment likes) × 0.35;
```

**Key Principles**:

1. **No rep for posting comments** - only for likes received
2. **Flat 0.35 value** - unweighted, fair for all
3. **Half of post likes** - 0.35 vs ~0.7 average
4. **No age decay** - comments harder to discover
5. **No bonuses** - simple and clean

---

## 💎 Component 1: Comment Like Value (Fixed)

### Purpose

Establish a simple, fair value for comment likes that rewards engagement without complexity.

### Comment Like System

```javascript
const COMMENT_LIKE_VALUE = 0.35; // Fixed value for all users

async function handleCommentLike(commentId, likerId) {
  const comment = await Comment.findById(commentId);
  const commentAuthor = await User.findById(comment.author);

  // Award flat 0.35 reputation (no weight, no decay, no bonuses)
  const reputation Gain = 0.35;

  // Check soft cap (only for flagged accounts)
  const finalValue = await applySoftCapIfFlagged(commentAuthor.id, reputationGain);

  // Add like to comment
  comment.likes.push({
    userId: likerId,
    timestamp: Date.now(),
    reputationValue: finalValue,
  });

  comment.engagement.likes = comment.likes.length;

  // Update author's comment reputation counter
  commentAuthor.socialStats.commentsReputation += finalValue;
  commentAuthor.socialStats.reputation += finalValue;

  // Add to reputation history
  commentAuthor.reputationHistory.push({
    timestamp: Date.now(),
    change: finalValue,
    source: 'comment_like',
    sourceId: commentId,
    sourceUserId: likerId,
  });

  // Recalculate active/legacy
  const { active, legacy, total } = calculateTotalReputation(commentAuthor);
  commentAuthor.socialStats.activeReputation = active;
  commentAuthor.socialStats.legacyReputation = legacy;

  await comment.save();
  await commentAuthor.save();

  return finalValue;
}
```

### Why 0.35 (Half of Post Likes)?

**Post Likes** (Weighted):

- Base: 0.4-1.0 (random)
- Weight: 0.5x-3.0x
- Average: ~0.7 points per like

**Comment Likes** (Flat):

- Fixed: 0.35 points per like
- **50% of post like average**

**Reasoning**:

- Comments are **secondary content** (responses, not original posts)
- Comments **harder to discover** (nested in threads)
- **Simpler system** (no complex calculations)
- **Fair for all** (unweighted - newcomer and veteran give same value)

---

## 📊 Reputation Tracking: Source-Based Breakdown

### Purpose

Track reputation by source for transparency and gamification. Users see where their reputation comes from.

### Source Counters (Schema)

```javascript
// User Schema Addition
socialStats: {
  reputation: Number,              // Total (all sources)
  activeReputation: Number,        // Last 180 days
  legacyReputation: Number,        // 20% all-time

  // Source-based breakdown (NEW)
  postsReputation: Number,         // From post likes ✨
  commentsReputation: Number,      // From comment likes ✨
  bookmarksReputation: Number,     // From bookmarks ✨
  repostsReputation: Number,       // From reposts (future) ✨
  followersReputation: Number,     // From followers (future) ✨
}
```

### Display Format

```javascript
// User profile display
Total Reputation: 2,547
├─ Active (6 months): 2,047
├─ Legacy (All-time): 500
└─ By Source:
   📝 Posts: 1,800 (71%)
   💬 Comments: 150 (6%)
   🔖 Bookmarks: 97 (4%)
   🔁 Reposts: 0 (0%)
```

### Source Counter Updates

```javascript
// When user receives like on comment
user.socialStats.commentsReputation += 0.35;
user.socialStats.reputation += 0.35;

// When user receives like on post
user.socialStats.postsReputation += calculatedValue;
user.socialStats.reputation += calculatedValue;

// When user receives bookmark
user.socialStats.bookmarksReputation += calculatedValue;
user.socialStats.reputation += calculatedValue;

// Total is sum of all sources
total = posts + comments + bookmarks + reposts + followers;
```

---

## 🔻 Component 2: Comment Downvotes (Unweighted)

### Purpose

Allow community to downvote poor-quality or off-topic comments. Downvotes affect multiple reputation values.

### Comment Downvote System

```javascript
const COMMENT_DOWNVOTE_RULES = {
  downvoteValue: -0.4, // Same as post downvotes (unweighted)
  maxDownvotesPerDay: 50, // Shared with post downvotes
  hideThreshold: -5, // Hide after 13 downvotes
  // NO auto-delete (just hide)
};

async function handleCommentDownvote(commentId, voterId) {
  const comment = await Comment.findById(commentId);
  const author = await User.findById(comment.author);

  // Prevent self-downvoting
  if (comment.author.equals(voterId)) {
    throw new Error("Cannot downvote your own comment");
  }

  // Flat -0.4 penalty (same as posts)
  const DOWNVOTE_VALUE = -0.4;

  // Deduct from multiple counters
  author.socialStats.reputation += DOWNVOTE_VALUE; // Total
  author.socialStats.legacyReputation += DOWNVOTE_VALUE; // Legacy
  author.socialStats.commentsReputation += DOWNVOTE_VALUE; // Comments counter
  // Active recalculates automatically from events

  // Floor at 0 for all
  if (author.socialStats.reputation < 0) author.socialStats.reputation = 0;
  if (author.socialStats.legacyReputation < 0)
    author.socialStats.legacyReputation = 0;
  if (author.socialStats.commentsReputation < 0)
    author.socialStats.commentsReputation = 0;

  // Track downvote
  comment.downvotes.push({
    userId: voterId,
    timestamp: Date.now(),
    reputationImpact: DOWNVOTE_VALUE,
  });

  comment.engagement.downvotes = comment.downvotes.length;

  // Calculate comment score
  const commentScore = calculateCommentScore(comment);

  // Auto-hide if heavily downvoted
  if (commentScore < COMMENT_DOWNVOTE_RULES.hideThreshold) {
    comment.visibility = "hidden";
    comment.hideReason = "community_downvoted";
  }

  await author.save();
  await comment.save();

  return { downvoted: true, commentScore: commentScore };
}

function calculateCommentScore(comment) {
  // Simple: likes - downvotes (both unweighted for comments)
  const likeScore = comment.likes.length * 0.35;
  const downvoteScore = comment.downvotes.length * 0.4;

  return likeScore - downvoteScore;
}
```

### Comment Auto-Moderation

**-5 Score**: Comment hidden (collapsed by default)

- Requires: ~13 downvotes (since likes are 0.35 and downvotes are 0.4)
- Effect: Comment collapses, users can expand to read
- NO auto-delete (hiding is sufficient)

**Why Lower Threshold Than Posts?**

- Comments are smaller, easier to judge
- Spam comments more common
- Less investment than full posts
- Faster community moderation

---

## 🛡️ Bot Defense (Inherited from Likes System)

### Purpose

Comments use the same 4-layer bot defense as likes for consistency.

### Layer 1: IP Rate Limiting (Stricter for Comments)

```javascript
const IP_LIMITS_COMMENTS = {
  MAX_COMMENTS_PER_IP_PER_MINUTE: 3, // Stricter (typing takes longer)
  MAX_COMMENTS_PER_IP_PER_HOUR: 30, // 30 comments/hour reasonable

  // CAPTCHA (same rate-based system)
  REQUIRE_CAPTCHA_AFTER: 10, // 10 comments in 10-minute window
  CAPTCHA_ROLLING_WINDOW: 10,
  CAPTCHA_COOLDOWN: 60,

  // Progressive tier system (NO instant ban)
  TIER_1_THRESHOLD: 20, // 20 comments/minute = Tier 1
};

// Progressive Tier System (Replaces Instant Ban)
const RATE_LIMIT_TIERS = {
  TIER_1: {
    trigger: 20, // 20 comments/minute
    punishment: 'COMMENT_PAUSE',
    duration: 5 * 60 * 60 * 1000, // 5 hours
    message: 'Commenting paused for 5 hours. Please slow down.',
  },
  
  TIER_2: {
    trigger: 'TIER_1_WITHIN_7_DAYS',
    punishment: 'COMMENT_PAUSE',
    duration: 24 * 60 * 60 * 1000, // 24 hours
    message: 'Commenting paused for 24 hours. Repeated violations detected.',
  },
  
  TIER_3: {
    trigger: 'TIER_2_WITHIN_30_DAYS',
    punishment: 'COMMENT_PAUSE',
    duration: 72 * 60 * 60 * 1000, // 72 hours
    message: 'Commenting paused for 72 hours. ⚠️ WARNING: Account suspension pending.',
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
  { type: 'comment_rate_limit', tier: 1, timestamp: Date.now() },
  { type: 'comment_rate_limit', tier: 2, timestamp: Date.now() },
];

// Reset after 6 months clean
if (lastViolation > 6 months ago) {
  user.currentTier = 0; // Reset to clean slate
}
```

**Why Stricter Than Likes?**

- Typing comments takes longer than clicking like (3/min is fast)
- Copy-paste spam is common attack vector
- Quality > quantity for comments

**Progressive System Benefits:**
- Fair warning for legitimate users
- Prevents accidental permanent bans
- Clear escalation path
- Email notifications at serious tiers
- Appeal system for false positives
- 30-day grace period before deletion

### Layers 2-4: Same as Likes

- **Layer 2**: Technical bot detection (automation headers, timing, fingerprints)
- **Layer 3**: Soft caps for flagged accounts (2+ flags, 100 rep/day threshold)
- **Layer 4**: Reputation reversal after ban (removes all comment likes, reverses rep)

**All bot defense functions from likes system apply to comments!**

---

## 🔄 Edge Cases & Handling

### Case 1: Comment Deleted by Author

```javascript
async function handleCommentDeletion(commentId) {
  const comment = await Comment.findById(commentId);
  const author = await User.findById(comment.author);

  // Calculate total reputation earned from this comment
  const reputationToRemove = comment.likes.reduce(
    (sum, like) => sum + (like.reputationValue || 0.35),
    0
  );

  // Subtract from all relevant counters
  author.socialStats.reputation -= reputationToRemove;
  author.socialStats.commentsReputation -= reputationToRemove;

  // Remove from reputation history
  author.reputationHistory = author.reputationHistory.filter(
    (event) => event.sourceId?.toString() !== commentId.toString()
  );

  // Recalculate active/legacy
  const { active, legacy, total } = calculateTotalReputation(author);
  author.socialStats.activeReputation = active;
  author.socialStats.legacyReputation = legacy;
  author.socialStats.reputation = total;

  // Floor at 0
  if (author.socialStats.reputation < 0) author.socialStats.reputation = 0;
  if (author.socialStats.commentsReputation < 0)
    author.socialStats.commentsReputation = 0;

  // Mark comment as deleted (keep for thread context)
  comment.status = "deleted";
  comment.content.text = "[deleted]";
  comment.deletedAt = Date.now();

  await author.save();
  await comment.save();

  // Don't delete replies (preserves conversation)
}
```

### Case 2: Comment Unlike

```javascript
async function handleCommentUnlike(commentId, likerId) {
  const comment = await Comment.findById(commentId);
  const like = comment.likes.find((l) => l.userId.equals(likerId));

  if (!like) return; // Already removed

  const commentAuthor = await User.findById(comment.author);
  const reputationValue = like.reputationValue || 0.35;

  // Remove from all counters
  commentAuthor.socialStats.reputation -= reputationValue;
  commentAuthor.socialStats.commentsReputation -= reputationValue;

  // Remove from history
  commentAuthor.reputationHistory = commentAuthor.reputationHistory.filter(
    (event) =>
      !(
        event.source === "comment_like" &&
        event.sourceId?.toString() === commentId.toString() &&
        event.sourceUserId?.toString() === likerId.toString()
      )
  );

  // Recalculate
  const { active, legacy, total } = calculateTotalReputation(commentAuthor);
  commentAuthor.socialStats.activeReputation = active;
  commentAuthor.socialStats.legacyReputation = legacy;
  commentAuthor.socialStats.reputation = total;

  // Floor at 0
  if (commentAuthor.socialStats.reputation < 0)
    commentAuthor.socialStats.reputation = 0;
  if (commentAuthor.socialStats.commentsReputation < 0)
    commentAuthor.socialStats.commentsReputation = 0;

  // Remove like from comment
  comment.likes = comment.likes.filter((l) => !l.userId.equals(likerId));
  comment.engagement.likes = comment.likes.length;

  await commentAuthor.save();
  await comment.save();
}
```

---

## 📈 Complete Comment Calculation Example

### Scenario: User With Active Commenting

**User Profile**:

- 50 comments posted over 3 months
- Average 5 likes per comment
- Mix of short and long comments

**Calculation**:

```javascript
// Comment 1: "Great post!"
Likes: 2
Reputation: 2 × 0.35 = 0.7 points

// Comment 2: "I agree with your analysis about Vice City..."
Likes: 8
Reputation: 8 × 0.35 = 2.8 points

// Comment 3: High-quality discussion (200 chars)
Likes: 25
Reputation: 25 × 0.35 = 8.75 points

// Comment 4-50: Average 5 likes each
47 comments × 5 likes × 0.35 = 82.25 points

// TOTAL FROM 50 COMMENTS
Total: 0.7 + 2.8 + 8.75 + 82.25 = 94.5 points ✅

// 3 months = 94.5 points from comments
// Projected yearly: ~380 points
// Projected 5 years: ~1,900 points from comments
```

**Profile Display**:

```
Total Reputation: 2,547
├─ Active: 2,047
├─ Legacy: 500
└─ By Source:
   📝 Posts: 2,200 (86%)
   💬 Comments: 250 (10%)
   🔖 Bookmarks: 97 (4%)
```

---

## 📊 Comments vs Likes: Reputation Comparison

### Average User (5 Years)

**Post Likes Reputation**:

- 200 posts, 50 likes each average (~0.7/like)
- 200 × 50 × 0.7 = ~7,000 points/year
- **5 years: ~35k reputation from post likes**

**Comment Likes Reputation**:

- 600 comments, 5 likes each average (0.35/like)
- 600 × 5 × 0.35 = ~1,050 points/year
- **5 years: ~5.25k reputation from comment likes**

**Total for balanced user**: ~40k in 5 years

**Comment Reputation Contribution**: ~13% of total (fair proportion!)

---

## 🎮 Comment Reputation Timeline Projection

### Light User (10 comments/month)

```
Monthly: 10 comments × 5 likes × 0.35 = 17.5 points/month
Yearly: 210 points/year
5 Years: 1,050 points from comments
```

### Active User (50 comments/month)

```
Monthly: 50 comments × 5 likes × 0.35 = 87.5 points/month
Yearly: 1,050 points/year
5 Years: 5,250 points from comments
```

### Discussion Expert (150 comments/month)

```
Monthly: 150 comments × 5 likes × 0.35 = 262.5 points/month
Yearly: 3,150 points/year
5 Years: 15,750 points from comments
```

**Comments provide steady, reliable reputation** without overwhelming the system!

---

## 🔧 Implementation Architecture

### Database Schema Updates

```javascript
// Comment Model (Simplified)
const CommentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  parentComment: { type: Schema.Types.ObjectId, ref: 'Comment' }, // For replies

  content: {
    text: { type: String, required: true },
  },

  engagement: {
    likes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    replies: { type: Number, default: 0 },
  },

  // Likes (simplified - no need for complex breakdown)
  likes: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      timestamp: Date,
      reputationValue: { type: Number, default: 0.35 }, // Always 0.35
    }
  ],

  // Downvotes
  downvotes: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      timestamp: Date,
      reputationImpact: { type: Number, default: -0.4 },
    }
  ],

  // Metadata
  replyDepth: { type: Number, default: 0 }, // For display only (no rep impact)
  visibility: {
    type: String,
    enum: ['visible', 'hidden'],
    default: 'visible'
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  },

  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date },
});

// User Schema Addition
socialStats: {
  reputation: { type: Number, default: 0 },
  activeReputation: { type: Number, default: 0 },
  legacyReputation: { type: Number, default: 0 },

  // Source counters (NEW)
  postsReputation: { type: Number, default: 0 },
  commentsReputation: { type: Number, default: 0 },
  bookmarksReputation: { type: Number, default: 0 },
  repostsReputation: { type: Number, default: 0 },
  followersReputation: { type: Number, default: 0 },
}
```

---

## 🔌 API Endpoints

### POST /api/comments (Create Comment)

```javascript
router.post("/api/comments", async (req, res) => {
  const { postId, parentCommentId, content } = req.body;
  const authorId = req.user.id;

  // Bot detection
  const botCheck = await detectBot(req);
  if (botCheck.isBot) {
    return res.status(403).json({ error: "Bot detected" });
  }

  // IP rate limits
  const ipComments = await countIPComments(req.ip, 60);
  if (ipComments >= IP_LIMITS_COMMENTS.MAX_COMMENTS_PER_IP_PER_HOUR) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  // CAPTCHA check
  if (await checkCaptchaRequired(authorId, "comments")) {
    return res.status(449).json({ requireCaptcha: true });
  }

  const post = await Post.findById(postId);

  // Calculate reply depth (for display only, not reputation)
  let replyDepth = 0;
  if (parentCommentId) {
    const parentComment = await Comment.findById(parentCommentId);
    replyDepth = parentComment.replyDepth + 1;
  }

  // Create comment (NO reputation awarded for posting)
  const comment = await Comment.create({
    author: authorId,
    post: postId,
    parentComment: parentCommentId || null,
    content: { text: content },
    replyDepth: replyDepth,
  });

  // Update post
  post.comments.push(comment._id);
  post.engagement.comments = post.comments.length;
  post.lastCommentAt = Date.now();
  await post.save();

  // Update parent comment if reply
  if (parentCommentId) {
    await Comment.findByIdAndUpdate(parentCommentId, {
      $inc: { "engagement.replies": 1 },
    });
  }

  // NO reputation awarded for posting comment
  res.json({
    comment: comment,
    reputationGain: 0, // No rep for posting
  });
});
```

### POST /api/comments/:commentId/like (Like a Comment)

```javascript
router.post("/api/comments/:commentId/like", async (req, res) => {
  const { commentId } = req.params;
  const likerId = req.user.id;

  // Bot detection (same as likes)
  const botCheck = await detectBot(req);
  if (botCheck.isBot) {
    return res.status(403).json({ error: "Bot detected" });
  }

  // IP rate limits (use like limits, not comment limits)
  const ipLikes = await countIPLikes(req.ip, 60);
  if (ipLikes >= IP_LIMITS.MAX_LIKES_PER_IP_PER_HOUR) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  const comment = await Comment.findById(commentId);
  const existingLike = comment.likes.find((l) => l.userId.equals(likerId));

  if (existingLike) {
    // Unlike
    await handleCommentUnlike(commentId, likerId);
    return res.json({ liked: false });
  }

  // Like comment (FLAT 0.35, no calculations needed)
  const commentAuthor = await User.findById(comment.author);

  const reputationGain = 0.35; // Fixed value
  const finalValue = await applySoftCapIfFlagged(
    commentAuthor.id,
    reputationGain
  );

  // Add like to comment
  comment.likes.push({
    userId: likerId,
    timestamp: Date.now(),
    reputationValue: finalValue,
  });

  comment.engagement.likes = comment.likes.length;
  await comment.save();

  // Award to comment author (update all relevant counters)
  commentAuthor.socialStats.reputation += finalValue;
  commentAuthor.socialStats.commentsReputation += finalValue;

  commentAuthor.reputationHistory.push({
    timestamp: Date.now(),
    change: finalValue,
    source: "comment_like",
    sourceId: commentId,
    sourceUserId: likerId,
  });

  // Recalculate active/legacy
  const { active, legacy, total } = calculateTotalReputation(commentAuthor);
  commentAuthor.socialStats.activeReputation = active;
  commentAuthor.socialStats.legacyReputation = legacy;

  await commentAuthor.save();

  res.json({
    liked: true,
    commentLikes: comment.engagement.likes,
    authorReputation: stableFuzzValue(total),
    estimatedGain: stableFuzzValue(finalValue),
  });
});
```

### POST /api/comments/:commentId/downvote (Downvote a Comment)

```javascript
router.post("/api/comments/:commentId/downvote", async (req, res) => {
  const { commentId } = req.params;
  const voterId = req.user.id;

  const voter = await User.findById(voterId);

  // Check daily limit (SILENT - shared with post downvotes)
  if (voter.socialStats.downvotesToday >= DOWNVOTE_RULES.maxDownvotesPerDay) {
    return res.json({
      downvoted: true, // Optimistic UI
      capped: true,
    });
  }

  const result = await handleCommentDownvote(commentId, voterId);

  // Increment counter
  voter.socialStats.downvotesToday += 1;
  await voter.save();

  res.json(result);
});
```

---

## 📊 Implementation Checklist

### Database Changes

- [ ] Create `Comment` model with simplified schema
- [ ] Add `comments` array to Post model (references)
- [ ] Add `lastCommentAt` to Post model
- [ ] Add `postsReputation`, `commentsReputation`, `bookmarksReputation` to User model (NEW)
- [ ] Update ReputationHistory enum to include `comment_like`
- [ ] Create indexes on `comment.author`, `comment.post`

### Core Functions

- [ ] `handleCommentLike(commentId, likerId)` - Award flat 0.35 rep
- [ ] `handleCommentUnlike(commentId, likerId)` - Remove flat 0.35 rep
- [ ] `handleCommentDownvote(commentId, voterId)` - Deduct from total, legacy, comments
- [ ] `calculateCommentScore(comment)` - Simple likes - downvotes
- [ ] `handleCommentDeletion(commentId)` - Remove all like rep, update counters

### API Endpoints

- [ ] `POST /api/comments` - Create comment (no rep awarded)
- [ ] `DELETE /api/comments/:id` - Delete comment (remove rep from likes)
- [ ] `POST /api/comments/:id/like` - Like comment (flat 0.35)
- [ ] `POST /api/comments/:id/downvote` - Downvote comment (-0.4 from multiple counters)

### Testing

- [ ] Unit tests for flat 0.35 value
- [ ] Source counter updates (posts, comments, bookmarks)
- [ ] Downvote deduction (total, legacy, comments counter)
- [ ] Comment deletion (removes likes rep)
- [ ] Unlike reversal
- [ ] Bot defense integration

---

## ✅ Summary - Simplified Comments System

### **Key Design Decisions:**

**Extreme Simplification:**

- ✅ Flat 0.35 rep per comment like (always)
- ✅ Unweighted (all users give same value)
- ✅ No age decay (comments always worth 0.35)
- ✅ No rep for posting comments
- ✅ No bonuses, multipliers, or special features

**Source Tracking (NEW):**

- ✅ Separate counters: posts, comments, bookmarks, reposts, followers
- ✅ Display breakdown on profile
- ✅ Downvotes affect total, legacy, AND source counter
- ✅ Transparency and gamification

**Integrated with Likes:**

- ✅ Same bot defense (4 layers)
- ✅ Same soft caps (flagged accounts only)
- ✅ Same unweighted downvotes (-0.4)
- ✅ Same stable fuzzing
- ✅ Stricter IP limits (30 comments/hour vs 60 likes/hour)

**Inflation Control:**

- ✅ Minimal value (0.35 per like)
- ✅ No multipliers or bonuses
- ✅ Comments contribute ~5k-15k in 5 years (reasonable)

**Timeline Contribution:**

- Light user: ~1k rep in 5 years
- Active user: ~5k rep in 5 years
- Heavy user: ~16k rep in 5 years
- **Balanced with posts (~35k)** ✅

---

## 🚀 Next Steps

1. ✅ **Comments System**: Complete (simplified)
2. **Reposts Calculation**: Design reputation for reposts/shares
3. **Followers Calculation**: Organic growth rewards
4. **Implementation**: Code all systems

---

**Status**: Design Complete - Simplified & Ready for Implementation  
**Last Updated**: November 12, 2025  
**Version**: 3.0 (Ultra-Simplified + Source Tracking)  
**Integration**: Seamlessly ties into Likes System v3.0  
**Comment Value**: Flat 0.35 per like (unweighted, no decay)  
**Author**: GTA FanHub Development Team
