// server/routes/userRoutes.js

import express from "express";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import User from "../models/User.js";
import Block from "../models/Block.js";
import Follow from "../models/Follow.js";
import { optionalAuth } from "../../authMiddleware.js";

const router = express.Router();

// Rate limiter for search endpoint - differentiated by user type
const anonymousSearchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute for anonymous users
  message: "Too many search requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
});

const authenticatedSearchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute for authenticated users
  message: "Too many search requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip,
});

// Dynamic rate limiter based on authentication status
const searchLimiter = (req, res, next) => {
  if (req.user?.userId) {
    return authenticatedSearchLimiter(req, res, next);
  }
  return anonymousSearchLimiter(req, res, next);
};

/**
 * Calculate relevance score for search results
 * @param {Object} user - User object from database
 * @param {string} query - Search query (sanitized)
 * @param {Object} socialContext - Social graph context (isFollowing, followsYou, isMutual, mutualCount)
 * @returns {number} - Relevance score (0-200+)
 */
function calculateRelevanceScore(user, query, socialContext = {}) {
  let score = 0;
  const queryLower = query.toLowerCase();
  const username = (user.username || '').toLowerCase();
  const displayName = (user.profile?.displayName || '').toLowerCase();

  // Text Matching Score (100-50 points)
  // Exact matches get highest priority
  if (username === queryLower) {
    score += 100;
  } else if (displayName === queryLower) {
    score += 95;
  } else if (username.startsWith(queryLower)) {
    score += 80;
  } else if (displayName.startsWith(queryLower)) {
    score += 75;
  } else if (username.includes(queryLower)) {
    score += 50;
  } else if (displayName.includes(queryLower)) {
    score += 45;
  }

  // Social Graph Score (0-35 points if authenticated)
  if (socialContext.isMutual) {
    score += 35; // Mutual follow is highest priority
  } else if (socialContext.isFollowing) {
    score += 30; // You follow them
  } else if (socialContext.followsYou) {
    score += 25; // They follow you
  }

  // Mutual connections bonus (max 20 points)
  if (socialContext.mutualCount > 0) {
    score += Math.min(socialContext.mutualCount * 2, 20);
  }

  // Account Signals Score (0-40 points)
  // Verified badge
  if (user.profile?.verified) {
    score += 15;
  }

  // Follower count (logarithmic scale to prevent dominance)
  const followerCount = user.followerCount || 0;
  if (followerCount > 0) {
    score += Math.min(Math.log10(followerCount + 1) * 5, 25);
  }

  // Recent activity bonus
  if (user.lastActive) {
    const daysSinceActive = (Date.now() - new Date(user.lastActive).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActive < 7) {
      score += 10; // Active in last week
    } else if (daysSinceActive < 30) {
      score += 5; // Active in last month
    }
  }

  return score;
}

/**
 * Calculate mutual connections for all search results (optimized batch query)
 * @param {string} currentUserId - Current user's ID
 * @param {Array} searchResultUserIds - Array of user IDs from search results
 * @returns {Promise<Object>} - Map of userId -> mutual connection count
 */
async function calculateMutualConnections(currentUserId, searchResultUserIds) {
  const startTime = Date.now();
  
  // Early exit if no current user or no results
  if (!currentUserId || searchResultUserIds.length === 0) {
    return {};
  }

  try {
    // Step 1: Get current user's follows ONCE
    const currentUserFollows = await Follow.find({
      follower: currentUserId,
      status: 'active'
    })
      .select('following')
      .lean()
      .limit(5000); // Safety limit

    // Early exit if user follows no one
    if (currentUserFollows.length === 0) {
      console.log(`[MutualConnections] User ${currentUserId} follows 0 people - skipping`);
      return {};
    }

    // Skip if user follows too many people (performance optimization)
    if (currentUserFollows.length > 2000) {
      console.warn(`[MutualConnections] User ${currentUserId} follows ${currentUserFollows.length} people - skipping mutual calculation`);
      return {};
    }

    // Convert to Set for O(1) lookups
    const currentUserFollowingSet = new Set(
      currentUserFollows.map(f => f.following.toString())
    );

    // Step 2: Batch query - get ALL follows for ALL search results in ONE query
    const allResultFollows = await Follow.find({
      follower: { $in: searchResultUserIds },
      status: 'active'
    })
      .select('follower following')
      .lean();

    // Step 3: Build lookup map (userId -> Set of follows)
    const followsMap = new Map();
    for (const follow of allResultFollows) {
      const followerId = follow.follower.toString();
      if (!followsMap.has(followerId)) {
        followsMap.set(followerId, new Set());
      }
      followsMap.get(followerId).add(follow.following.toString());
    }

    // Step 4: Calculate mutuals using Set intersection
    const mutualsMap = {};
    for (const resultUserId of searchResultUserIds) {
      const resultUserIdStr = resultUserId.toString();
      const resultFollowsSet = followsMap.get(resultUserIdStr) || new Set();
      
      // Count matches using Set.has() - O(1) per check
      let mutualCount = 0;
      for (const followedId of currentUserFollowingSet) {
        if (resultFollowsSet.has(followedId)) {
          mutualCount++;
        }
      }
      
      mutualsMap[resultUserIdStr] = mutualCount;
    }

    const duration = Date.now() - startTime;
    console.log(`[MutualConnections] Calculated mutuals for ${searchResultUserIds.length} users in ${duration}ms`);

    return mutualsMap;
  } catch (error) {
    console.error('[MutualConnections] Error calculating mutual connections:', error);
    return {}; // Return empty map on error, don't fail the search
  }
}

/**
 * @route   GET /api/users/search
 * @desc    Search users with Instagram-like ranking algorithm
 * @access  Public (optional authentication for enhanced results)
 * @query   { q: string, limit?: number, offset?: number }
 */
router.get("/users/search", searchLimiter, optionalAuth, async (req, res) => {
  const queryStartTime = Date.now();
  
  try {
    const query = req.query.q?.trim();
    const limit = Math.min(parseInt(req.query.limit) || 30, 50); // Increased default to 30, max 50
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const currentUserId = req.user?.userId;

    // Validate query
    if (!query || query.length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    if (query.length > 50) {
      return res.status(400).json({ error: "Search query too long (max 50 characters)" });
    }

    // Sanitize query - prevent regex injection
    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Build search query - search both username and displayName
    const searchRegex = new RegExp(sanitizedQuery, "i");
    const userQuery = {
      $or: [
        { username: searchRegex },
        { "profile.displayName": searchRegex },
      ],
    };

    // If user is authenticated, exclude blocked users
    let blockedUserIds = [];
    if (currentUserId) {
      blockedUserIds = await Block.getBlockedUserIds(currentUserId);
      if (blockedUserIds.length > 0) {
        userQuery._id = { $nin: blockedUserIds };
      }
    }

    // Query timeout protection
    const QUERY_TIMEOUT = 5000; // 5 seconds max
    const queryPromise = User.find(userQuery)
      .select("username profile.displayName profile.profilePicture profile.verified socialStats.reputation gamingProfile.lastSeen _id createdAt")
      .lean()
      .limit(limit + offset + 20); // Fetch extra for ranking, then slice

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT)
    );

    const users = await Promise.race([queryPromise, timeoutPromise]);

    // Get follower counts in parallel (using Follow model)
    const userIds = users.map(u => u._id);
    const followerCountsPromise = Follow.aggregate([
      { $match: { following: { $in: userIds }, status: 'active' } },
      { $group: { _id: '$following', count: { $sum: 1 } } }
    ]);

    // If authenticated, get follow status and mutual connections
    let followingSet = new Set();
    let followsYouSet = new Set();
    let mutualsMap = {};

    if (currentUserId) {
      const userIdsStr = users.map((user) => user._id.toString());
      
      // Parallel queries for follow relationships
      const [followRelations, reverseFollows, followerCounts] = await Promise.all([
        Follow.find({
          follower: currentUserId,
          following: { $in: userIds },
          status: "active",
        }).select("following").lean(),
        
        Follow.find({
          follower: { $in: userIds },
          following: currentUserId,
          status: "active",
        }).select("follower").lean(),
        
        followerCountsPromise
      ]);

      followingSet = new Set(followRelations.map((f) => f.following.toString()));
      followsYouSet = new Set(reverseFollows.map((f) => f.follower.toString()));

      // Calculate mutual connections (optimized batch query)
      mutualsMap = await calculateMutualConnections(currentUserId, userIds);

      // Map follower counts
      const followerCountMap = {};
      followerCounts.forEach(item => {
        followerCountMap[item._id.toString()] = item.count;
      });

      // Enrich users with all data and calculate relevance scores
      const enrichedUsers = users.map((user) => {
        const userIdStr = user._id.toString();
        const isFollowing = followingSet.has(userIdStr);
        const followsYou = followsYouSet.has(userIdStr);
        const isMutual = isFollowing && followsYou;
        const mutualCount = mutualsMap[userIdStr] || 0;
        const followerCount = followerCountMap[userIdStr] || 0;

        // Calculate relevance score
        const relevanceScore = calculateRelevanceScore(
          { ...user, followerCount },
          sanitizedQuery,
          { isFollowing, followsYou, isMutual, mutualCount }
        );

        return {
          _id: user._id,
          username: user.username,
          profile: {
            displayName: user.profile?.displayName || user.username,
            profilePicture: user.profile?.profilePicture || "/src/assets/images/user.png",
            verified: user.profile?.verified || false,
          },
          isFollowing,
          followsYou,
          isMutual,
          mutualCount,
          followerCount,
          lastActive: user.gamingProfile?.lastSeen || user.createdAt,
          relevanceScore, // Include for debugging (can be removed in production)
        };
      });

      // Sort by relevance score (highest first), then by follower count as tiebreaker
      enrichedUsers.sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return b.followerCount - a.followerCount;
      });

      // Apply offset and limit after sorting
      const paginatedUsers = enrichedUsers.slice(offset, offset + limit);
      const hasMore = enrichedUsers.length > offset + limit;

      const queryDuration = Date.now() - queryStartTime;
      console.log(`[UserSearch] Query completed in ${queryDuration}ms for user ${currentUserId}`);

      return res.json({
        users: paginatedUsers,
        total: paginatedUsers.length,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      });
    }

    // For non-authenticated users, return basic info with relevance scoring
    const followerCounts = await followerCountsPromise;
    const followerCountMap = {};
    followerCounts.forEach(item => {
      followerCountMap[item._id.toString()] = item.count;
    });

    const basicUsers = users.map((user) => {
      const followerCount = followerCountMap[user._id.toString()] || 0;
      
      // Calculate relevance score (no social graph for anonymous users)
      const relevanceScore = calculateRelevanceScore(
        { ...user, followerCount },
        sanitizedQuery,
        {}
      );

      return {
        _id: user._id,
        username: user.username,
        profile: {
          displayName: user.profile?.displayName || user.username,
          profilePicture: user.profile?.profilePicture || "/src/assets/images/user.png",
          verified: user.profile?.verified || false,
        },
        followerCount,
        lastActive: user.gamingProfile?.lastSeen || user.createdAt,
        relevanceScore,
      };
    });

    // Sort by relevance score
    basicUsers.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return b.followerCount - a.followerCount;
    });

    // Apply offset and limit
    const paginatedUsers = basicUsers.slice(offset, offset + limit);
    const hasMore = basicUsers.length > offset + limit;

    const queryDuration = Date.now() - queryStartTime;
    console.log(`[UserSearch] Anonymous query completed in ${queryDuration}ms`);

    res.json({
      users: paginatedUsers,
      total: paginatedUsers.length,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    const queryDuration = Date.now() - queryStartTime;
    console.error(`[UserSearch] Error after ${queryDuration}ms:`, error);
    
    if (error.message === 'Query timeout') {
      return res.status(504).json({ error: "Search query timed out. Please try a more specific search." });
    }
    
    res.status(500).json({ error: "Failed to search users" });
  }
});

export default router;
