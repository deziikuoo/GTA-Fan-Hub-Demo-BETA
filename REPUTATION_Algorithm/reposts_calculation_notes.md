# Reposts Calculation System - Q&A & Status Tracking

## ✅ **APPROVED - No Changes Needed**

### **Q1: Repost System Model**

**DECISION**: Twitter/X Model (High Value, High Reach) with optional commentary

**DETAILS**:

- Reposts appear in Home Feed of all followers
- Reposts appear on reposter's profile in "Posts & Reposts" section
- Clear attribution to original author
- All engagement on repost transfers to original post
- Optional: Reposter can add 1-2 sentences of commentary

**REASONING**:

- Massive reach amplification justifies reputation rewards
- Real discoverability for original content
- Encourages quality content creation
- Follows proven social media patterns

**STATUS**: ✅ Approved - Twitter/X model with optional commentary

---

### **Q2: Reposter Reputation Rewards**

**DECISION**: Reposter earns 10% of engagement value (0.04-0.10 per like)

**FORMULA**:

```javascript
// Original like value: 0.4-1.0
// Reposter gets 10% of that
reposterShare = likeValue × 0.10; // 0.04-0.10 points per like on repost
```

**REASONING**:

- Small curation reward encourages thoughtful sharing
- 10% is low enough to discourage spam
- Incentivizes original posting over constant reposting
- Rewards users who amplify quality content

**STATUS**: ✅ Approved - 10% curation bonus

---

### **Q3: Original Poster Reputation (from engagement on reposts)**

**DECISION**: OP earns from: base values, liker weights, engagement multiplier, age multiplier (NO early vote bonus)

**FORMULA**:

```javascript
// On reposted content, OP earns from likes
OPValue =
  getBaseValue() * // 0.4-1.0 for likes
  getProgressiveWeight(liker.rep) * // 0.5x-3.0x based on liker
  getEngagementMultiplier(post) * // Small engagement bonus
  calculateAgeMultiplier(postAge) * // 1.0x → 0.3x for old posts
  (1 - downvotesPenalty) * // Downvotes affect OP
  applySoftCapIfFlagged(OP); // Only if OP is flagged

// NO early vote bonus on reposts (already got it on original)
```

**REASONING**:

- OP already got early vote bonus on original post
- Reposts extend content lifespan, so no need for urgency bonus
- Age multiplier still applies (older reposts less valuable)
- All other normal like mechanics apply

**STATUS**: ✅ Approved - Standard engagement rewards minus early vote

---

### **Q4: Downvote Penalties**

**DECISION**: Downvotes on reposted content affect BOTH original poster AND reposter

**IMPLEMENTATION**:

```javascript
// User downvotes a reposted post
downvoteValue = -0.4; // Unweighted

// Apply to BOTH users
originalPoster.reputation += downvoteValue * 0.9; // 90% share
reposter.reputation += downvoteValue * 0.1; // 10% share
```

**REASONING**:

- Both users put their reputation on the line
- OP for creating content
- Reposter for endorsing/amplifying it
- Fair distribution based on their reputation shares

**STATUS**: ✅ Approved - Both users affected by downvotes

---

### **Q5: Soft Cap Application**

**DECISION**: Apply `applySoftCapIfFlagged` individually for OP and reposter

**IMPLEMENTATION**:

```javascript
// Calculate OP's share
let OPShare = calculateEngagementValue(like, post);
OPShare = await applySoftCapIfFlagged(OP.id, OPShare); // Check OP's flags

// Calculate reposter's share
let reposterShare = OPShare * 0.1;
reposterShare = await applySoftCapIfFlagged(reposter.id, reposterShare); // Check reposter's flags
```

**REASONING**:

- Each user has independent suspicion flags
- One user being flagged shouldn't affect the other
- Fair and accurate bot detection

**STATUS**: ✅ Approved - Individual soft cap checks

---

### **Q6: Repost Chains**

**DECISION**: Yes, track repost chains for virality metrics

**IMPLEMENTATION**:

```javascript
// Track repost chain
const repost = await Repost.create({
  originalPost: postId,
  reposter: reposterId,
  repostChainDepth: 0, // Direct repost
  parentRepost: null,
});

// If someone reposts the repost
const chainedRepost = await Repost.create({
  originalPost: postId, // Still points to original
  reposter: thirdUserId,
  repostChainDepth: 1, // Second level
  parentRepost: firstRepostId, // Track chain
});
```

**BENEFITS**:

- Track virality spread
- Analyze content distribution patterns
- Potential future feature: "Repost chain visualization"
- Useful for trending algorithms

**STATUS**: ✅ Approved - Track repost chains

---

### **Q7: Repost Base Value**

**DECISION**: Reduce from 2.0-5.0 to **0.7-1.3**

**OLD**:

```javascript
repostBaseValue = random(2.0, 5.0); // Too high
```

**NEW**:

```javascript
repostBaseValue = random(0.7, 1.3); // More balanced
```

**COMPARISON**:

- Like: 0.4-1.0 base
- Comment like: 0.35 flat
- **Repost: 0.7-1.3** (slightly higher than like, reflects stronger endorsement)
- Bookmark: 0.5-1.2 (future)

**REASONING**:

- With Twitter model, value comes from REACH not base points
- Engagement on repost is what matters
- Base repost action should be modest
- Still higher than like (more deliberate action)

**STATUS**: ✅ Approved - 0.7-1.3 base value

---

### **Q8: Early Vote Bonus Duration**

**DECISION**: Change from 6 hours to **2 hours** (affects likes AND reposts)

**OLD**:

```javascript
// 0-15 min: 2.0x → 1.75x
// 15-30 min: 1.75x → 1.5x
// 30-60 min: 1.5x → 1.25x
// 1-2 hours: 1.25x → 1.0x
// 2-6 hours: 1.0x → 0.8x
// 6+ hours: 0.8x (floor)
```

**NEW**:

```javascript
// 0-15 min: 2.0x → 1.75x
// 15-30 min: 1.75x → 1.5x
// 30-60 min: 1.5x → 1.25x
// 1-2 hours: 1.25x → 1.0x
// 2+ hours: 1.0x (no bonus)
```

**REASONING**:

- Tighter window creates more urgency
- Rewards truly early discovery (first 2 hours)
- Simpler calculation (no gradual decay after 2 hours)
- Applies to original posts, NOT reposts (OP already got bonus)

**STATUS**: ✅ Approved - 2 hour early vote window

---

### **Q9: Remove Direct OP Reputation on Repost**

**DECISION**: Remove lines 228-244 (direct reputation award to OP when reposted)

**OLD (WRONG)**:

```javascript
// When repost happens, OP immediately gets 0.7-1.3 points
originalAuthor.socialStats.reputation += reputationGain; // ❌ Remove this
```

**NEW (CORRECT)**:

```javascript
// OP earns reputation from ENGAGEMENT on the repost, not the repost itself
// Likes, comments, bookmarks on repost → OP gets 90% of those
// No immediate reputation on repost action
```

**REASONING**:

- Repost is just amplification, not engagement itself
- Real value comes from likes/comments on the repost
- Prevents "repost farming" (repost without real reach)
- More accurate measure of content value

**STATUS**: ✅ Approved - Remove direct repost reputation

---

### **Q10: Rate Limit - Reposts Per Minute**

**DECISION**: Change from 2 to **5 reposts/minute**

**OLD**:

```javascript
MAX_REPOSTS_PER_IP_PER_MINUTE: 2, // Too restrictive
```

**NEW**:

```javascript
MAX_REPOSTS_PER_IP_PER_MINUTE: 5, // More reasonable
```

**REASONING**:

- 2/min was too strict (blocks legitimate users scrolling and sharing)
- 5/min allows rapid sharing of multiple good posts
- Still fast enough to catch bots (5 × 60 = 300/hour is suspicious)
- Aligns with likes rate limit (10/min)

**STATUS**: ✅ Approved - 5 reposts per minute

---

### **Q11: No Repost Analytics**

**DECISION**: Skip detailed analytics for MVP

**SKIPPED FEATURES**:

- ❌ Repost source tracking (which followers saw it)
- ❌ Engagement attribution (likes from this repost vs that repost)
- ❌ Reach metrics (follower count × repost count)

**REASONING**:

- Keeps system simple
- Can add later if needed
- Focus on core functionality first

**STATUS**: ✅ Approved - No analytics for MVP

---

### **Q12: No Anti-Spam Features (Beyond Rate Limits)**

**DECISION**: Skip advanced anti-spam for MVP

**SKIPPED FEATURES**:

- ❌ "Show less from User B" (too many reposts)
- ❌ Repost spam detection
- ❌ Quality score based on repost engagement

**REASONING**:

- 4-layer bot defense + rate limits sufficient
- 10% curation bonus naturally discourages spam
- Can add later if abuse detected

**STATUS**: ✅ Approved - Basic anti-spam only

---

### **Q13: Age Multiplier Mechanics**

**DECISION**: Age multiplier is applied to the ENTIRE final value after all other calculations

**FORMULA FLOW**:

```javascript
// Step 1: Base value
baseValue = random(0.4, 1.0);

// Step 2: Apply weight
weightedValue = baseValue × getProgressiveWeight(liker.rep);

// Step 3: Apply early vote bonus (if within 2 hours)
earlyVoteValue = weightedValue × earlyVoteBonus(post, engagement);

// Step 4: Apply engagement multiplier
engagementValue = earlyVoteValue × getEngagementMultiplier(post);

// Step 5: Apply AGE MULTIPLIER (diminishes everything above)
ageAdjustedValue = engagementValue × calculateAgeMultiplier(postAge);

// Step 6: Apply downvote penalty
finalValue = ageAdjustedValue × (1 - downvotesPenalty);

// Step 7: Apply soft cap if flagged
finalValue = applySoftCapIfFlagged(user, finalValue);
```

**KEY POINT**: Old posts earn proportionally less across ALL reward mechanisms.

**STATUS**: ✅ Approved - Age multiplier affects everything

---

### **Q14: Unrepost Behavior**

**DECISION**: Original poster KEEPS all reputation when reposter unreposts. Only reposter loses their 10% share.

**OLD (WRONG)**:

```javascript
// Unrepost removes ALL reputation from OP
originalAuthor.reputation -= reputationGain; // ❌ Unfair!
```

**NEW (CORRECT)**:

```javascript
// Unrepost only removes reposter's 10% curation bonus
reposter.reputation -= reposterShare; // Only their share
// OP keeps their 90% - they earned it from real engagement!
```

**REASONING**:

- Engagement already happened (100 likes on repost are REAL)
- Those users engaged with the content
- OP earned that reputation legitimately
- Only the reposter's curation bonus should be revoked
- Prevents unfair reputation loss for OP

**STATUS**: ✅ Approved - OP keeps reputation on unrepost

---

### **Q15: Calculation Logic & Deleted Posts**

**DECISION**: Use `reputationHistory` with timestamps and values only. `sourceId` is optional for auditing.

**SAFE APPROACH**:

```javascript
// Store reputation changes as events (no post references needed)
user.reputationHistory = [
  {
    timestamp: Date.now(),
    change: +2.5,
    source: "like",
    sourceId: "post123", // OPTIONAL - for transparency only
    eventType: "active", // or "deleted", "unreposted" for context
  },
  {
    timestamp: Date.now(),
    change: +0.35,
    source: "comment_like",
    sourceId: "comment456", // OPTIONAL
    eventType: "active",
  },
];

// Calculate active/legacy from events, not posts
function calculateTotalReputation(user) {
  const events = user.reputationHistory;
  const now = Date.now();
  const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;

  let active = 0;
  let legacy = 0;

  events.forEach((event) => {
    if (event.timestamp >= sixMonthsAgo) {
      active += event.change;
    }
    legacy += event.change * 0.2;
  });

  return { active, legacy, total: active + legacy };
}

// When post deleted or unreposted, UPDATE eventType for context
// But NEVER remove the reputation history event
await ReputationHistory.updateOne(
  { sourceId: deletedPostId },
  { $set: { eventType: "post_deleted" } }
  // Value remains unchanged for calculations!
);
```

**KEY PRINCIPLES**:

- ✅ Store reputation CHANGES, not post references
- ✅ Calculations use timestamps and numerical values only
- ✅ Post deletion doesn't break anything
- ✅ `sourceId` optional for auditing, never required for calculations
- ✅ Update `eventType` to reflect deletions/unreposts for clear context
- ✅ Never remove history events (preserve accurate timeline)

**STATUS**: ✅ Approved - Event-based calculations with optional sourceId

---

### **Q16: Progressive Rate Limiting Tiers**

**DECISION**: Implement progressive punishment tiers across all engagement types

**NEW TIER SYSTEM**:

**Tier 1: First Offense (Light Warning)**

- Trigger: 15 reposts/minute, 50 likes/minute, 20 comments/minute
- Punishment: Action pause for 5 hours
- Message: "[Action] paused for 5 hours. Please slow down."

**Tier 2: Second Offense (24 Hours)**

- Trigger: Tier 1 violation within 7 days
- Punishment: Action pause for 24 hours
- Message: "[Action] paused for 24 hours. Repeated violations detected."

**Tier 3: Third Offense (Serious Warning)**

- Trigger: Tier 2 violation within 30 days
- Punishment: Action pause for 72 hours
- Message: "[Action] paused for 72 hours. ⚠️ WARNING: Account suspension pending."
- Email notification sent

**Tier 4: Fourth Offense (Temporary Suspension)**

- Trigger: Tier 3 violation within 60 days
- Punishment: Account suspension for 2 weeks
- Message: "⚠️ SUSPENDED: Your account is suspended for 2 weeks. Final warning: Account ban next."
- Email notification sent

**Tier 5: Fifth Offense (Permanent Ban)**

- Trigger: Tier 4 violation
- Punishment: Permanent account ban
- Message: "🚫 BANNED: Your account has been permanently banned. Account will be deleted in 30 days."
- Email notification sent
- 30-day grace period for data export

**ADDITIONAL FEATURES**:

- ✅ Track violation history with timestamps
- ✅ Reset tier after clean period (6 months no violations → back to Tier 0)
- ✅ Email notifications for Tier 3+ (can't say they weren't warned)
- ✅ Appeal system for Tier 4-5 (false positives happen)
- ✅ Grace period for account deletion (can export data within 30 days)

**THRESHOLDS BY TYPE**:

- **Likes**: 50/minute → Tier 1
- **Comments**: 20/minute → Tier 1
- **Reposts**: 15/minute → Tier 1

**STATUS**: ✅ Approved - Progressive tier system for all

---

## 📊 **SUMMARY**

**✅ APPROVED (16 items total)**:

**Core System**:

1. Twitter/X model with optional commentary
2. 10% reposter bonus (0.04-0.10 per like)
3. OP rewards: base + weight + engagement + age (NO early vote)
4. Downvotes affect both OP and reposter
5. Individual soft caps
6. Repost chains tracking

**Values & Timing**: 7. Reduced base value (0.7-1.3) 8. 2-hour early vote window (down from 6 hours) 9. Remove direct repost reputation 10. 5 reposts/minute limit

**Simplifications**: 11. No analytics for MVP 12. No advanced anti-spam

**Architectural Decisions**: 13. Age multiplier affects everything (applied last) 14. OP keeps reputation on unrepost (reposter loses 10% only) 15. Event-based calculations (optional sourceId) 16. Progressive tier system for all engagement types

**Next Steps**: Update all calculation documents (`01_LIKES_CALCULATION.md`, `02_COMMENTS_CALCULATION.md`, `03_REPOSTS_CALCULATION.md`) with approved changes and implement progressive tier system across likes, comments, and reposts.
