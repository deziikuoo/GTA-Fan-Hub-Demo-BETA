// server/routes/engagementRoutes.js

import express from "express";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Engagement from "../models/Engagement.js";
import User from "../models/User.js";
import { authenticateToken } from "../../authMiddleware.js";
import sanitizeHtml from "sanitize-html";
import { NotificationQueueService } from "../services/notificationQueueService.js";

const router = express.Router();

// Store io instance
let ioInstance = null;

// Function to set io instance
export function setIoInstance(io) {
  ioInstance = io;
  // Removed verbose socket.io log
}

// ==================== LIKE POST ====================
// POST /api/posts/:postId/like
router.post("/posts/:postId/like", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // Check if post exists
    const post = await Post.findOne({ _id: postId, status: "active" });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Toggle like
    const { action } = await Engagement.toggle(userId, postId, "post", "like");

    // Update post engagement count atomically
    const increment = action === "created" ? 1 : -1;
    await post.incrementEngagement("likes", increment);

    // Update user's totalLikes count
    if (action === "created" && post.author.toString() !== userId) {
      await User.findByIdAndUpdate(post.author, {
        $inc: { "socialStats.totalLikes": 1 },
      });
    } else if (action === "removed" && post.author.toString() !== userId) {
      await User.findByIdAndUpdate(post.author, {
        $inc: { "socialStats.totalLikes": -1 },
      });
    }

    // Create notification for post author (if not self-like)
    if (
      action === "created" &&
      post.author.toString() !== userId &&
      ioInstance
    ) {
      NotificationQueueService.queueNotification(
        ioInstance,
        post.author.toString(),
        {
          type: "like",
          sender: userId,
          post: postId,
        }
      );
    }

    res.json({
      message: action === "created" ? "Post liked" : "Post unliked",
      liked: action === "created",
      likesCount: post.engagement.likes + increment,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// ==================== GET POST LIKES ====================
// GET /api/posts/:postId/likes
router.get("/posts/:postId/likes", async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Get users who liked
    const users = await Engagement.getEngagedUsers(postId, "post", "like", {
      limit: parseInt(limit),
      skip,
    });

    const totalCount = await Engagement.countDocuments({
      target: postId,
      targetType: "post",
      type: "like",
    });

    res.json({
      users,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching likes:", error);
    res.status(500).json({ error: "Failed to fetch likes" });
  }
});

// ==================== BOOKMARK POST ====================
// POST /api/posts/:postId/bookmark
router.post("/posts/:postId/bookmark", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // Check if post exists
    const post = await Post.findOne({ _id: postId, status: "active" });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Toggle bookmark
    const { action } = await Engagement.toggle(
      userId,
      postId,
      "post",
      "bookmark"
    );

    // Update post engagement count atomically
    const increment = action === "created" ? 1 : -1;
    await post.incrementEngagement("bookmarks", increment);

    res.json({
      message: action === "created" ? "Post bookmarked" : "Bookmark removed",
      bookmarked: action === "created",
      bookmarksCount: post.engagement.bookmarks + increment,
    });
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    res.status(500).json({ error: "Failed to toggle bookmark" });
  }
});

// ==================== GET USER BOOKMARKS ====================
// GET /api/bookmarks
router.get("/bookmarks", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Engagement.getUserBookmarks(userId, {
      limit: parseInt(limit),
      skip,
    });

    const totalCount = await Engagement.countDocuments({
      user: userId,
      targetType: "post",
      type: "bookmark",
    });

    res.json({
      posts,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
});

// ==================== CREATE COMMENT ====================
// POST /api/posts/:postId/comments
router.post("/posts/:postId/comments", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    let { text, parentCommentId = null } = req.body;

    // Validate
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    // Check if post exists
    const post = await Post.findOne({ _id: postId, status: "active" });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Sanitize text
    text = sanitizeHtml(text, {
      allowedTags: [],
      allowedAttributes: {},
    });

    if (text.length > 2000) {
      return res.status(400).json({ error: "Comment exceeds 2000 characters" });
    }

    // Extract mentions
    const mentionRegex = /@(\w+)/g;
    const mentionUsernames = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentionUsernames.push(match[1]);
    }

    const mentionedUsers = await User.find({
      username: { $in: mentionUsernames },
    }).select("_id");
    const mentions = mentionedUsers.map((u) => u._id);

    // If replying to a comment, verify it exists
    if (parentCommentId) {
      const parentComment = await Comment.findOne({
        _id: parentCommentId,
        post: postId,
        status: "active",
      });

      if (!parentComment) {
        return res.status(404).json({ error: "Parent comment not found" });
      }
    }

    // Create comment
    const comment = new Comment({
      post: postId,
      author: userId,
      content: {
        text,
        mentions,
      },
      parentComment: parentCommentId,
    });

    await comment.save();

    // Increment post comment count
    await post.incrementEngagement("comments", 1);

    // Update user's comment count
    await User.findByIdAndUpdate(userId, {
      $inc: { "socialStats.totalComments": 1 },
    });

    // Populate author
    await comment.populate(
      "author",
      "username profile.displayName profile.profilePicture profile.verified"
    );

    // Create notifications
    if (ioInstance) {
      // Notify post author (if commenting on post, not replying to comment)
      if (!parentCommentId && post.author.toString() !== userId) {
        NotificationQueueService.queueNotification(
          ioInstance,
          post.author.toString(),
          {
            type: "comment",
            sender: userId,
            post: postId,
            comment: comment._id,
          }
        );
      }

      // Notify parent comment author (if replying to comment)
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (parentComment && parentComment.author.toString() !== userId) {
          NotificationQueueService.queueNotification(
            ioInstance,
            parentComment.author.toString(),
            {
              type: "reply",
              sender: userId,
              post: postId,
              comment: comment._id,
            }
          );
        }
      }
    }

    res.status(201).json({
      message: "Comment created successfully",
      comment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// ==================== GET POST COMMENTS ====================
// GET /api/posts/:postId/comments
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20, parentCommentId = null } = req.query;
    const skip = (page - 1) * limit;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comments = await Comment.getPostComments(postId, {
      limit: parseInt(limit),
      skip,
      parentComment: parentCommentId || null,
      includeReplies: !parentCommentId, // Include replies only for top-level comments
    });

    const totalCount = await Comment.countDocuments({
      post: postId,
      status: "active",
      parentComment: parentCommentId || null,
    });

    res.json({
      comments,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// ==================== EDIT COMMENT ====================
// PUT /api/comments/:commentId
router.put("/comments/:commentId", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;
    let { text } = req.body;

    // Validate
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    // Find comment
    const comment = await Comment.findOne({ _id: commentId, status: "active" });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Verify ownership
    if (comment.author.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this comment" });
    }

    // Check if editable
    if (!comment.isEditable) {
      return res
        .status(400)
        .json({ error: "Comment can only be edited within 15 minutes" });
    }

    // Sanitize text
    text = sanitizeHtml(text, {
      allowedTags: [],
      allowedAttributes: {},
    });

    if (text.length > 2000) {
      return res.status(400).json({ error: "Comment exceeds 2000 characters" });
    }

    // Update comment
    comment.content.text = text;
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();

    await comment.populate(
      "author",
      "username profile.displayName profile.profilePicture profile.verified"
    );

    res.json({
      message: "Comment updated successfully",
      comment,
    });
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).json({ error: "Failed to edit comment" });
  }
});

// ==================== DELETE COMMENT ====================
// DELETE /api/comments/:commentId
router.delete("/comments/:commentId", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Verify ownership
    if (comment.author.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this comment" });
    }

    // Soft delete
    comment.status = "deleted";
    await comment.save();

    // Decrement post comment count
    const post = await Post.findById(comment.post);
    if (post) {
      await post.incrementEngagement("comments", -1);
    }

    // Decrement user's comment count
    await User.findByIdAndUpdate(userId, {
      $inc: { "socialStats.totalComments": -1 },
    });

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// ==================== LIKE COMMENT ====================
// POST /api/comments/:commentId/like
router.post(
  "/comments/:commentId/like",
  authenticateToken,
  async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.user.userId;

      // Check if comment exists
      const comment = await Comment.findOne({
        _id: commentId,
        status: "active",
      });

      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      // Toggle like
      const { action } = await Engagement.toggle(
        userId,
        commentId,
        "comment",
        "like"
      );

      // Update comment like count atomically
      const increment = action === "created" ? 1 : -1;
      await comment.incrementLikes(increment);

      // Create notification for comment author (if not self-like)
      if (
        action === "created" &&
        comment.author.toString() !== userId &&
        ioInstance
      ) {
        NotificationQueueService.queueNotification(
          ioInstance,
          comment.author.toString(),
          {
            type: "like",
            sender: userId,
            post: comment.post,
            comment: commentId,
          }
        );
      }

      res.json({
        message: action === "created" ? "Comment liked" : "Comment unliked",
        liked: action === "created",
        likesCount: comment.engagement.likes + increment,
      });
    } catch (error) {
      console.error("Error toggling comment like:", error);
      res.status(500).json({ error: "Failed to toggle comment like" });
    }
  }
);

// ==================== GET COMMENT REPLIES ====================
// GET /api/comments/:commentId/replies
router.get("/comments/:commentId/replies", async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Check if parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const replies = await Comment.find({
      parentComment: commentId,
      status: "active",
    })
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate(
        "author",
        "username profile.displayName profile.profilePicture profile.verified"
      );

    const totalCount = await Comment.countDocuments({
      parentComment: commentId,
      status: "active",
    });

    res.json({
      replies,
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching replies:", error);
    res.status(500).json({ error: "Failed to fetch replies" });
  }
});

export default router;
