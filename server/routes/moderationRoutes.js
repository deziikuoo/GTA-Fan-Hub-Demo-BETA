// server/routes/moderationRoutes.js

import express from "express";
import Report from "../models/Report.js";
import Block from "../models/Block.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import { authenticateToken } from "../../authMiddleware.js";

const router = express.Router();

// ==================== REPORT POST ====================
// POST /api/posts/:postId/report
router.post("/posts/:postId/report", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    const { reason, description = "" } = req.body;

    // Validate reason
    const validReasons = [
      "spam",
      "harassment",
      "hate_speech",
      "violence",
      "misinformation",
      "nudity",
      "copyright",
      "self_harm",
      "other",
    ];

    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({ error: "Invalid or missing reason" });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Cannot report own posts
    if (post.author.toString() === userId) {
      return res.status(400).json({ error: "Cannot report your own post" });
    }

    try {
      // Create report (will throw error if duplicate)
      const report = await Report.createReport({
        reporter: userId,
        targetType: "post",
        target: postId,
        reason,
        description,
      });

      res.status(201).json({
        message: "Report submitted successfully",
        reportId: report._id,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ error: "You have already reported this post" });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error reporting post:", error);
    res.status(500).json({ error: "Failed to report post" });
  }
});

// ==================== REPORT COMMENT ====================
// POST /api/comments/:commentId/report
router.post(
  "/comments/:commentId/report",
  authenticateToken,
  async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.user.userId;
      const { reason, description = "" } = req.body;

      const validReasons = [
        "spam",
        "harassment",
        "hate_speech",
        "violence",
        "misinformation",
        "nudity",
        "copyright",
        "self_harm",
        "other",
      ];

      if (!reason || !validReasons.includes(reason)) {
        return res.status(400).json({ error: "Invalid or missing reason" });
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      if (comment.author.toString() === userId) {
        return res
          .status(400)
          .json({ error: "Cannot report your own comment" });
      }

      try {
        const report = await Report.create({
          reporter: userId,
          targetType: "comment",
          target: commentId,
          reason,
          description,
        });

        res.status(201).json({
          message: "Report submitted successfully",
          reportId: report._id,
        });
      } catch (error) {
        if (error.code === 11000) {
          return res
            .status(400)
            .json({ error: "You have already reported this comment" });
        }
        throw error;
      }
    } catch (error) {
      console.error("Error reporting comment:", error);
      res.status(500).json({ error: "Failed to report comment" });
    }
  }
);

// ==================== REPORT USER ====================
// POST /api/users/:userId/report
router.post("/users/:userId/report", authenticateToken, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const userId = req.user.userId;
    const { reason, description = "" } = req.body;

    const validReasons = [
      "spam",
      "harassment",
      "hate_speech",
      "violence",
      "misinformation",
      "nudity",
      "copyright",
      "self_harm",
      "other",
    ];

    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({ error: "Invalid or missing reason" });
    }

    if (targetUserId === userId) {
      return res.status(400).json({ error: "Cannot report yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    try {
      const report = await Report.create({
        reporter: userId,
        targetType: "user",
        target: targetUserId,
        reason,
        description,
      });

      res.status(201).json({
        message: "Report submitted successfully",
        reportId: report._id,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ error: "You have already reported this user" });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error reporting user:", error);
    res.status(500).json({ error: "Failed to report user" });
  }
});

// ==================== BLOCK USER ====================
// POST /api/users/:userId/block
router.post("/users/:userId/block", authenticateToken, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const userId = req.user.userId;
    const { reason = "" } = req.body;

    if (targetUserId === userId) {
      return res.status(400).json({ error: "Cannot block yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = await Block.blockUser(userId, targetUserId, reason);

    if (result.alreadyBlocked) {
      return res.status(200).json({
        message: "User is already blocked",
        blocked: true,
      });
    }

    res.status(201).json({
      message: "User blocked successfully",
      blocked: true,
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ error: "Failed to block user" });
  }
});

// ==================== UNBLOCK USER ====================
// DELETE /api/users/:userId/block
router.delete("/users/:userId/block", authenticateToken, async (req, res) => {
  try {
    const { userId: targetUserId } = req.params;
    const userId = req.user.userId;

    const unblocked = await Block.unblockUser(userId, targetUserId);

    if (!unblocked) {
      return res.status(404).json({ error: "User is not blocked" });
    }

    res.json({
      message: "User unblocked successfully",
      blocked: false,
    });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({ error: "Failed to unblock user" });
  }
});

// ==================== GET BLOCKED USERS ====================
// GET /api/blocked-users
router.get("/blocked-users", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await Block.getBlockedUsers(userId, {
      limit: parseInt(limit),
      skip,
    });

    const totalCount = await Block.countDocuments({ blocker: userId });

    res.json({
      users,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    res.status(500).json({ error: "Failed to fetch blocked users" });
  }
});

// ==================== CHECK BLOCK STATUS ====================
// GET /api/users/:userId/block-status
router.get(
  "/users/:userId/block-status",
  authenticateToken,
  async (req, res) => {
    try {
      const { userId: targetUserId } = req.params;
      const userId = req.user.userId;

      const hasBlock = await Block.hasBlockBetween(userId, targetUserId);

      res.json({
        blocked: hasBlock,
      });
    } catch (error) {
      console.error("Error checking block status:", error);
      res.status(500).json({ error: "Failed to check block status" });
    }
  }
);

// ==================== HIDE POST (Client-side only) ====================
// Note: Hide functionality is implemented client-side with local storage or Redis
// This endpoint is for tracking hidden posts server-side (optional)

// POST /api/posts/:postId/hide
router.post("/posts/:postId/hide", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // TODO: Store hidden posts in Redis set
    // const redis = getRedisClient();
    // await redis.sadd(`user:${userId}:hidden:posts`, postId);

    res.json({
      message: "Post hidden successfully",
      postId,
    });
  } catch (error) {
    console.error("Error hiding post:", error);
    res.status(500).json({ error: "Failed to hide post" });
  }
});

export default router;
