// server/services/cacheService.js

/**
 * Cache Service with optional Redis support
 * Falls back to database queries if Redis is unavailable
 */

let redis = null;
let isRedisAvailable = false;

// Try to initialize Redis if available
try {
  // Only attempt if REDIS_URL is configured
  if (process.env.REDIS_URL) {
    const Redis = await import("ioredis");
    redis = new Redis.default(process.env.REDIS_URL);

    redis.on("connect", () => {
      isRedisAvailable = true;
      console.log("[CacheService] Redis connected successfully");
    });

    redis.on("error", (err) => {
      isRedisAvailable = false;
      console.warn(
        "[CacheService] Redis error, falling back to database:",
        err.message
      );
    });

    redis.on("close", () => {
      isRedisAvailable = false;
      console.warn("[CacheService] Redis connection closed");
    });
  } else {
    // Removed verbose cache service log
  }
} catch (error) {
  console.warn(
    "[CacheService] Redis module not available, using database only"
  );
}

export const CacheService = {
  /**
   * Check if Redis is available
   */
  isAvailable() {
    return isRedisAvailable && redis !== null;
  },

  // ==================== FOLLOWER CACHING ====================

  /**
   * Cache recent followers (last 100) as sorted set by timestamp
   * @param {string} userId - User ID
   * @param {Array} followers - Array of follower objects with createdAt and follower fields
   */
  async cacheRecentFollowers(userId, followers) {
    if (!this.isAvailable()) return;

    try {
      const key = `user:${userId}:followers:recent`;
      const members = followers.flatMap((f) => [
        f.createdAt.getTime(), // score (timestamp)
        f.follower.toString(), // member (follower ID)
      ]);

      if (members.length > 0) {
        await redis.zadd(key, ...members);
        await redis.zremrangebyrank(key, 0, -101); // Keep only last 100
        await redis.expire(key, 3600); // 1 hour TTL
      }
    } catch (error) {
      console.error("[CacheService] Error caching recent followers:", error);
    }
  },

  /**
   * Get cached recent followers
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number to return
   * @returns {Promise<Array|null>} Array of follower IDs or null if cache miss
   */
  async getRecentFollowers(userId, limit = 50) {
    if (!this.isAvailable()) return null;

    try {
      const key = `user:${userId}:followers:recent`;
      const followers = await redis.zrevrange(key, 0, limit - 1);
      return followers.length > 0 ? followers : null;
    } catch (error) {
      console.error("[CacheService] Error getting recent followers:", error);
      return null;
    }
  },

  // ==================== COUNT CACHING ====================

  /**
   * Cache follower/following counts
   * @param {string} userId - User ID
   * @param {number} followersCount - Number of followers
   * @param {number} followingCount - Number of following
   */
  async cacheFollowCounts(userId, followersCount, followingCount) {
    if (!this.isAvailable()) return;

    try {
      const key = `user:${userId}:counts`;
      await redis.hmset(key, {
        followers: followersCount,
        following: followingCount,
        updated: Date.now(),
      });
      await redis.expire(key, 300); // 5 min cache
    } catch (error) {
      console.error("[CacheService] Error caching follow counts:", error);
    }
  },

  /**
   * Get cached follow counts
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Counts object or null if cache miss
   */
  async getFollowCounts(userId) {
    if (!this.isAvailable()) return null;

    try {
      const key = `user:${userId}:counts`;
      const counts = await redis.hgetall(key);

      if (!counts || !counts.followers) {
        return null; // Cache miss
      }

      return {
        followers: parseInt(counts.followers),
        following: parseInt(counts.following),
        updated: parseInt(counts.updated),
      };
    } catch (error) {
      console.error("[CacheService] Error getting follow counts:", error);
      return null;
    }
  },

  // ==================== FOLLOW STATUS CACHING ====================

  /**
   * Cache "is user A following user B" status
   * @param {string} currentUserId - Current user ID
   * @param {string} targetUserId - Target user ID
   * @param {boolean} isFollowing - Follow status
   */
  async cacheFollowStatus(currentUserId, targetUserId, isFollowing) {
    if (!this.isAvailable()) return;

    try {
      const key = `follow:${currentUserId}:${targetUserId}`;
      await redis.setex(key, 1800, isFollowing ? "1" : "0"); // 30 min
    } catch (error) {
      console.error("[CacheService] Error caching follow status:", error);
    }
  },

  /**
   * Get cached follow status
   * @param {string} currentUserId - Current user ID
   * @param {string} targetUserId - Target user ID
   * @returns {Promise<boolean|null>} Follow status or null if cache miss
   */
  async getFollowStatus(currentUserId, targetUserId) {
    if (!this.isAvailable()) return null;

    try {
      const key = `follow:${currentUserId}:${targetUserId}`;
      const status = await redis.get(key);

      if (status === null) return null; // Cache miss
      return status === "1";
    } catch (error) {
      console.error("[CacheService] Error getting follow status:", error);
      return null;
    }
  },

  // ==================== MUTUAL FOLLOWERS CACHING ====================

  /**
   * Cache mutual followers between two users
   * @param {string} user1Id - First user ID
   * @param {string} user2Id - Second user ID
   * @param {Array} mutualIds - Array of mutual follower IDs
   */
  async cacheMutualFollowers(user1Id, user2Id, mutualIds) {
    if (!this.isAvailable() || mutualIds.length === 0) return;

    try {
      const key = `mutual:${user1Id}:${user2Id}`;
      await redis.sadd(key, ...mutualIds.map((id) => id.toString()));
      await redis.expire(key, 7200); // 2 hour cache
    } catch (error) {
      console.error("[CacheService] Error caching mutual followers:", error);
    }
  },

  /**
   * Get cached mutual followers
   * @param {string} user1Id - First user ID
   * @param {string} user2Id - Second user ID
   * @returns {Promise<Array|null>} Array of mutual follower IDs or null if cache miss
   */
  async getMutualFollowers(user1Id, user2Id) {
    if (!this.isAvailable()) return null;

    try {
      const key = `mutual:${user1Id}:${user2Id}`;
      const members = await redis.smembers(key);
      return members.length > 0 ? members : null;
    } catch (error) {
      console.error("[CacheService] Error getting mutual followers:", error);
      return null;
    }
  },

  // ==================== BULK OPERATIONS ====================

  /**
   * Get follow status for multiple users at once
   * @param {string} currentUserId - Current user ID
   * @param {Array} targetUserIds - Array of target user IDs
   * @returns {Promise<Object>} Object mapping user IDs to follow status
   */
  async getBulkFollowStatus(currentUserId, targetUserIds) {
    if (!this.isAvailable()) return {};

    try {
      const pipeline = redis.pipeline();

      targetUserIds.forEach((targetId) => {
        pipeline.get(`follow:${currentUserId}:${targetId}`);
      });

      const results = await pipeline.exec();

      return targetUserIds.reduce((acc, targetId, index) => {
        const [err, value] = results[index];
        if (!err && value !== null) {
          acc[targetId] = value === "1";
        }
        return acc;
      }, {});
    } catch (error) {
      console.error("[CacheService] Error getting bulk follow status:", error);
      return {};
    }
  },

  // ==================== CACHE INVALIDATION ====================

  /**
   * Invalidate all caches related to a user
   * @param {string} userId - User ID
   */
  async invalidateUserCache(userId) {
    if (!this.isAvailable()) return;

    try {
      const keys = [
        `user:${userId}:followers:recent`,
        `user:${userId}:following:recent`,
        `user:${userId}:counts`,
      ];

      await redis.del(...keys);
    } catch (error) {
      console.error("[CacheService] Error invalidating user cache:", error);
    }
  },

  /**
   * Invalidate follow status between two users
   * @param {string} user1Id - First user ID
   * @param {string} user2Id - Second user ID
   */
  async invalidateFollowStatus(user1Id, user2Id) {
    if (!this.isAvailable()) return;

    try {
      await redis.del(
        `follow:${user1Id}:${user2Id}`,
        `follow:${user2Id}:${user1Id}`,
        `mutual:${user1Id}:${user2Id}`,
        `mutual:${user2Id}:${user1Id}`
      );
    } catch (error) {
      console.error("[CacheService] Error invalidating follow status:", error);
    }
  },
};

export default CacheService;
