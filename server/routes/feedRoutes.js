// server/routes/feedRoutes.js

import express from "express";
import FeedService from "../services/feedService.js";
import { authenticateToken, optionalAuth } from "../../authMiddleware.js";

const router = express.Router();

// ==================== FOLLOWING FEED ====================
// GET /api/feed/following
router.get("/following", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, lastPostId, lastPostDate } = req.query;

    const posts = await FeedService.getFollowingFeed(userId, {
      limit: parseInt(limit),
      lastPostId,
      lastPostDate,
    });

    res.json({
      posts,
      hasMore: posts.length >= parseInt(limit),
      nextCursor:
        posts.length > 0
          ? {
              lastPostId: posts[posts.length - 1]._id,
              lastPostDate: posts[posts.length - 1].createdAt,
            }
          : null,
    });
  } catch (error) {
    console.error("Error fetching following feed:", error);
    res.status(500).json({ error: "Failed to fetch following feed" });
  }
});

// ==================== FOR YOU FEED ====================
// GET /api/feed/for-you
router.get("/for-you", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await FeedService.getForYouFeed(userId, {
      limit: parseInt(limit),
      skip,
    });

    res.json({
      posts,
      hasMore: posts.length >= parseInt(limit),
      page: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching For You feed:", error);
    res.status(500).json({ error: "Failed to fetch For You feed" });
  }
});

// ==================== TRENDING FEED ====================
// GET /api/feed/trending
router.get("/trending", optionalAuth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await FeedService.getTrendingFeed({
      limit: parseInt(limit),
      skip,
    });

    res.json({
      posts,
      hasMore: posts.length >= parseInt(limit),
      page: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching trending feed:", error);
    res.status(500).json({ error: "Failed to fetch trending feed" });
  }
});

// ==================== HASHTAG FEED ====================
// GET /api/feed/hashtag/:tag
router.get("/hashtag/:tag", optionalAuth, async (req, res) => {
  try {
    const { tag } = req.params;
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Remove # if included
    const cleanTag = tag.replace(/^#/, "");

    const posts = await FeedService.getHashtagFeed(cleanTag, {
      limit: parseInt(limit),
      skip,
    });

    res.json({
      posts,
      hashtag: cleanTag,
      hasMore: posts.length >= parseInt(limit),
      page: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching hashtag feed:", error);
    res.status(500).json({ error: "Failed to fetch hashtag feed" });
  }
});

// ==================== USER POSTS ====================
// GET /api/feed/user/:userId
router.get("/user/:userId", optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user?.userId || null;
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await FeedService.getUserPosts(userId, requesterId, {
      limit: parseInt(limit),
      skip,
    });

    res.json({
      posts,
      hasMore: posts.length >= parseInt(limit),
      page: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
});

// ==================== SEARCH POSTS ====================
// GET /api/feed/search
router.get("/search", optionalAuth, async (req, res) => {
  try {
    const { q, limit = 20, page = 1 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await FeedService.searchPosts(q, {
      limit: parseInt(limit),
      skip,
    });

    res.json({
      posts,
      query: q,
      hasMore: posts.length >= parseInt(limit),
      page: parseInt(page),
    });
  } catch (error) {
    console.error("Error searching posts:", error);
    res.status(500).json({ error: "Failed to search posts" });
  }
});

export default router;
