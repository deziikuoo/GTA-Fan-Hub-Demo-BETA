# GTA FanHub - Professional Reputation System

## 🎯 Overview

A comprehensive, abuse-resistant reputation system that fairly rewards quality contributions to the GTA FanHub community.

---

## 📚 Documentation Structure

### Phase 1: Planning & Design ✅

- **[01_LIKES_CALCULATION.md](./01_LIKES_CALCULATION.md)** - ✅ Complete (v3.0 - Inflation-Controlled)
  - Random base values (0.4-1.0) - prevents gaming
  - Age-based diminishing (prioritizes new content)
  - 4-layer bot defense (no hard caps for clean users)
  - Unweighted downvotes (fair community policing)
  - Bookmark tracking (saves count toward reputation)
  - Stable fuzzing (consistent UX)
  - Timeline: 500k reputation in 5 years for heavy users
- **[02_COMMENTS_CALCULATION.md](./02_COMMENTS_CALCULATION.md)** - ✅ Complete (v3.0 - Ultra-Simplified)
  - Flat 0.35 rep per comment like (unweighted, always)
  - No rep for posting comments (only likes received)
  - Half value of post likes (0.35 vs ~0.7 avg)
  - No age decay (comments always worth 0.35)
  - Source-based tracking (posts, comments, bookmarks counters)
  - Integrated with likes system (same bot defense)
  - Comments contribute ~5k-16k rep in 5 years (light to heavy user)
- **[03_REPOSTS_CALCULATION.md](./03_REPOSTS_CALCULATION.md)** - ✅ Complete (v3.1 - Twitter/X Model)
  - Twitter/X feed model (reposts in followers' feeds)
  - Engagement-based (repost action = 0 rep, value from engagement)
  - OP earns 90%, reposter earns 10% (curation bonus)
  - OP keeps rep on unrepost (only reposter loses 10%)
  - Progressive tier system (5hr → 24hr → 72hr → 2wk → ban)
  - 5 reposts/minute limit
  - Reposts contribute ~1k-15k rep in 5 years (light to viral creator)
- **[04_BOOKMARKS_CALCULATION.md](./04_BOOKMARKS_CALCULATION.md)** - ✅ Complete (v3.0 - Quality Signal)
  - Random base 0.5-1.2 (higher than likes, quality indicator)
  - Weighted by bookmarker reputation (veteran bookmark > newcomer)
  - Age decay applies (1.0x → 0.3x floor for evergreen content)
  - NO early vote bonus (bookmarks aren't time-sensitive)
  - Anti-spam (no self-bookmark, no duplicates)
  - 1 bookmark ≈ 2-3 likes in value
  - Bookmarks contribute ~550-7k rep in 5 years (light to quality creator)
- **[05_FOLLOWERS_CALCULATION.md](./05_FOLLOWERS_CALCULATION.md)** - ✅ Complete (v3.0 - Organic Influence)
  - Random base 1.0-3.0 (highest value, sustained relationship)
  - Quality score 0.3x-2.0x (filters bots/inactive accounts)
  - Mutual follow bonus 1.3x (reciprocal trust)
  - NO age decay (followers are permanent relationships)
  - Anti-spam (daily limits, quality filtering)
  - 1 quality follower ≈ 3-5 likes in value
  - Followers contribute ~505-16.5k rep in 5 years (light to influencer)
- **06_ENGAGEMENT_CALCULATION.md** - Consistent engagement patterns (Optional)

### Phase 2: Implementation (Coming Soon)

- Database migrations
- API endpoints
- Background jobs
- Admin tools
- Monitoring & alerts

### Phase 3: Testing & Deployment (Coming Soon)

- Unit tests
- Integration tests
- Performance benchmarks
- Rollout strategy

---

## 🌟 Core Principles

### 1. Quality Over Quantity

Reward meaningful contributions, not spam.

### 2. Anti-Gaming

Robust defenses against manipulation and abuse.

### 3. Transparency

All calculations are auditable and explainable.

### 4. Fairness

New users can grow; established users maintain value.

### 5. Dynamic

Reputation reflects current activity, not just historical.

### 6. Performance

Efficient calculations that scale with millions of users.

---

## 🎨 Reputation Tiers

| Tier        | Range       | Badge | Benefits                          |
| ----------- | ----------- | ----- | --------------------------------- |
| Legendary   | 10,000+     | 🏆    | Max influence, exclusive features |
| Veteran     | 5,000-9,999 | 💎    | High influence, priority support  |
| Established | 1,000-4,999 | ⭐    | Trusted member, extended limits   |
| Active      | 500-999     | 🔥    | Active contributor benefits       |
| Regular     | 100-499     | ✨    | Standard member benefits          |
| Newcomer    | 0-99        | 🌱    | Learning phase, limited features  |
| Flagged     | < 0         | ⚠️    | Restricted, under review          |

---

## 📊 Reputation Sources (Weighted Contribution)

| Source            | Weight | Max Daily | Description                    |
| ----------------- | ------ | --------- | ------------------------------ |
| Likes Received    | 30%    | 100 pts   | Quality engagement on posts    |
| Comments Received | 25%    | 80 pts    | Meaningful discussions sparked |
| Posts Created     | 20%    | 50 pts    | Original content contribution  |
| Follower Growth   | 15%    | 40 pts    | Community building             |
| Engagement Rate   | 5%     | 20 pts    | Consistency bonus              |
| Time on Platform  | 5%     | 10 pts    | Loyalty bonus                  |

**Total Max Daily Reputation**: 300 points

---

## 🛡️ Anti-Abuse Framework

### Detection Systems

1. **Pattern Recognition**

   - Bot-like behavior detection
   - Like-for-like circle identification
   - Velocity spike monitoring
   - Geographic anomaly detection

2. **Rate Limiting**

   - Per-action caps
   - Hourly/daily limits
   - Account age scaling
   - Progressive penalties

3. **Manual Review Triggers**
   - Automated flagging system
   - Admin notification pipeline
   - Dispute resolution process
   - Appeal mechanism

### Penalty System

| Violation             | First Offense            | Second              | Third             |
| --------------------- | ------------------------ | ------------------- | ----------------- |
| Like Spam             | -50 rep, 24h limit       | -200 rep, 7d limit  | -500 rep, 30d ban |
| Self-Promotion Circle | -100 rep, warning        | -500 rep, 30d limit | Account review    |
| Purchased Likes       | -1000 rep, immediate ban | Permanent ban       | -                 |
| Bot Activity          | Immediate ban            | -                   | -                 |

---

## 🚀 Implementation Roadmap

### Week 1: Likes System

- [ ] Database schema updates
- [ ] Core calculation functions
- [ ] Anti-abuse mechanisms
- [ ] Unit tests
- [ ] API integration

### Week 2: Comments System

- [ ] Reply chain algorithms
- [ ] Quality assessment
- [ ] Integration with likes
- [ ] Testing

### Week 3: Posts & Followers

- [ ] Post quality scoring
- [ ] Follower growth tracking
- [ ] Combined reputation calculation
- [ ] Performance optimization

### Week 4: Testing & Deployment

- [ ] Full system testing
- [ ] Load testing
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Monitoring & adjustments

---

## 📈 Success Metrics

### User Engagement

- 30% increase in quality post creation
- 40% reduction in spam/low-quality content
- 20% increase in meaningful comments

### System Health

- < 100ms reputation calculation time
- 99.9% uptime for reputation services
- < 1% false positive rate for abuse detection

### Community Trust

- 80%+ user satisfaction with fairness
- < 5% disputes/appeals
- Active participation from all reputation tiers

---

## 🔧 Maintenance & Support

### Regular Tasks

- **Daily**: Automated decay calculations
- **Weekly**: Abuse pattern review
- **Monthly**: Full system audit
- **Quarterly**: Algorithm tuning based on data

### Monitoring

- Real-time reputation changes dashboard
- Anomaly detection alerts
- User growth by tier tracking
- Abuse attempt frequency

---

## 📞 Contact & Contribution

For questions or suggestions about the reputation system:

- Review the detailed calculation docs
- Check edge cases in implementation notes
- Submit proposals for algorithm improvements

---

**Status**: Phase 1 (Likes) - Documentation Complete, Ready for Review
**Last Updated**: November 11, 2025
**Version**: 1.0.0
