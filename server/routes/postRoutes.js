// server/routes/postRoutes.js

import express from "express";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Engagement from "../models/Engagement.js";
import Block from "../models/Block.js";
import Follow from "../models/Follow.js";
import { authenticateToken, optionalAuth } from "../../authMiddleware.js";
import sanitizeHtml from "sanitize-html";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { NotificationQueueService } from "../services/notificationQueueService.js";

const router = express.Router();

// Store io instance
let ioInstance = null;

// Function to set io instance
export function setIoInstance(io) {
  ioInstance = io;
  // Removed verbose socket.io log
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for media uploads
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB max
    files: 4, // Max 4 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images and videos are allowed"));
    }
  },
});

// Helper function to extract mentions from text
function extractMentions(text) {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]); // username without @
  }

  return [...new Set(mentions)]; // Remove duplicates
}

// Helper function to extract hashtags from text
function extractHashtags(text) {
  const hashtagRegex = /#(\w+)/g;
  const hashtags = [];
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1].toLowerCase());
  }

  return [...new Set(hashtags)]; // Remove duplicates
}

// Helper function to extract URLs from text
function extractURLs(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

// Helper function to sanitize post content
function sanitizeContent(text) {
  return sanitizeHtml(text, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {},
  });
}

// ==================== CREATE POST ====================
// POST /api/posts
router.post(
  "/",
  authenticateToken,
  upload.array("media", 4),
  async (req, res) => {
    try {
      const userId = req.user.userId;
      let {
        text,
        privacy = "public",
        originalPostId = null,
        type = "post",
      } = req.body;

      // Validate content
      if (!text && (!req.files || req.files.length === 0)) {
        return res.status(400).json({ error: "Post must have text or media" });
      }

      // Sanitize text
      if (text) {
        text = sanitizeContent(text);
        if (text.length > 5000) {
          return res
            .status(400)
            .json({ error: "Text exceeds 5000 characters" });
        }
      }

      // Extract mentions and hashtags
      const mentionUsernames = text ? extractMentions(text) : [];
      const hashtags = text ? extractHashtags(text) : [];
      const urls = text ? extractURLs(text) : [];

      // Convert mention usernames to user IDs
      const mentionedUsers =
        mentionUsernames.length > 0
          ? await User.find({ username: { $in: mentionUsernames } }).select(
              "_id"
            )
          : [];
      const mentions = mentionedUsers.map((u) => u._id);

      // Process media files
      const media = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const mediaType = file.mimetype.startsWith("image/")
            ? "image"
            : file.mimetype.startsWith("video/")
            ? "video"
            : "gif";

          media.push({
            type: mediaType,
            url: `/uploads/${file.filename}`,
            thumbnail:
              mediaType === "video" ? `/uploads/${file.filename}` : null, // TODO: Generate video thumbnails
            dimensions: { width: 0, height: 0 }, // TODO: Extract dimensions
            size: file.size,
          });
        }
      }

      // Validate post type
      if (type !== "post" && type !== "repost" && type !== "quote") {
        type = "post";
      }

      // Validate originalPost for reposts/quotes
      if ((type === "repost" || type === "quote") && !originalPostId) {
        return res
          .status(400)
          .json({ error: "Original post required for repost/quote" });
      }

      // Create post
      const post = new Post({
        author: userId,
        content: {
          text: text || "",
          mentions,
          hashtags,
          links: [], // TODO: Implement link preview service
        },
        media,
        type,
        originalPost: originalPostId || null,
        privacy,
      });

      await post.save();

      // Populate author info
      await post.populate(
        "author",
        "username profile.displayName profile.profilePicture profile.verified"
      );

      // If repost or quote, increment original post engagement
      if (originalPostId) {
        const originalPost = await Post.findById(originalPostId);
        if (originalPost) {
          const engagementType = type === "repost" ? "reposts" : "quotes";
          await originalPost.incrementEngagement(engagementType, 1);

          // Notify original author (if not self-repost/quote)
          if (originalPost.author.toString() !== userId && ioInstance) {
            NotificationQueueService.queueNotification(
              ioInstance,
              originalPost.author.toString(),
              {
                type: type, // 'repost' or 'quote'
                sender: userId,
                post: post._id,
              }
            );
          }
        }
      }

      // Update user's post count
      await User.findByIdAndUpdate(userId, {
        $inc: { "socialStats.totalPosts": 1, "stats.postsCount": 1 },
      });

      // TODO: Emit Socket.io event to followers
      // TODO: Notify mentioned users

      res.status(201).json({
        message: "Post created successfully",
        post,
      });
    } catch (error) {
      console.error("Error creating post:", error);

      // Clean up uploaded files on error
      if (req.files) {
        req.files.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        });
      }

      res
        .status(500)
        .json({ error: "Failed to create post", details: error.message });
    }
  }
);

// ==================== GET SINGLE POST ====================
// GET /api/posts/:postId
router.get("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.userId; // Optional auth

    const post = await Post.findOne({ _id: postId, status: "active" })
      .populate(
        "author",
        "username profile.displayName profile.profilePicture profile.verified"
      )
      .populate({
        path: "originalPost",
        select:
          "author content media createdAt engagement privacy status isEdited editedAt",
        populate: {
          path: "author",
          select: "username profile.displayName profile.profilePicture",
        },
      });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check privacy
    if (post.privacy === "followers" && userId) {
      const isFollowing = await Follow.isFollowing(
        userId,
        post.author._id.toString()
      );
      const isOwnPost = userId === post.author._id.toString();

      if (!isFollowing && !isOwnPost) {
        return res.status(403).json({ error: "Post is private" });
      }
    } else if (post.privacy === "followers" && !userId) {
      return res.status(403).json({ error: "Authentication required" });
    }

    // Increment view count
    await Post.findByIdAndUpdate(postId, {
      $inc: { "engagement.views": 1 },
    });

    // Check if user has liked/bookmarked
    let isLiked = false;
    let isBookmarked = false;

    if (userId) {
      [isLiked, isBookmarked] = await Promise.all([
        Engagement.hasEngaged(userId, postId, "post", "like"),
        Engagement.hasEngaged(userId, postId, "post", "bookmark"),
      ]);
    }

    res.json({
      post,
      userEngagement: {
        isLiked,
        isBookmarked,
      },
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// ==================== EDIT POST ====================
// PUT /api/posts/:postId
router.put("/:postId", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    let { text } = req.body;

    // Find post
    const post = await Post.findOne({ _id: postId, status: "active" });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Verify ownership
    if (post.author.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this post" });
    }

    // Check if editable
    if (!post.isEditable) {
      return res.status(400).json({
        error: "Post can only be edited within 15 minutes of creation",
      });
    }

    // Sanitize and validate text
    if (text) {
      text = sanitizeContent(text);
      if (text.length > 5000) {
        return res.status(400).json({ error: "Text exceeds 5000 characters" });
      }
    }

    // Update post
    post.content.text = text;
    post.content.mentions = text
      ? (
          await User.find({ username: { $in: extractMentions(text) } }).select(
            "_id"
          )
        ).map((u) => u._id)
      : [];
    post.content.hashtags = text ? extractHashtags(text) : [];
    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();

    await post.populate(
      "author",
      "username profile.displayName profile.profilePicture profile.verified"
    );

    res.json({
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    console.error("Error editing post:", error);
    res.status(500).json({ error: "Failed to edit post" });
  }
});

// ==================== DELETE POST ====================
// DELETE /api/posts/:postId
router.delete("/:postId", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Verify ownership
    if (post.author.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this post" });
    }

    // Soft delete
    post.status = "deleted";
    await post.save();

    // Decrement user's post count
    await User.findByIdAndUpdate(userId, {
      $inc: { "socialStats.totalPosts": -1, "stats.postsCount": -1 },
    });

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// ==================== REPOST ====================
// POST /api/posts/:postId/repost
router.post("/:postId/repost", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // Check if original post exists
    const originalPost = await Post.findOne({ _id: postId, status: "active" });

    if (!originalPost) {
      return res.status(404).json({ error: "Original post not found" });
    }

    // Check if user already reposted
    const existingRepost = await Post.findOne({
      author: userId,
      originalPost: postId,
      type: "repost",
      status: "active",
    });

    if (existingRepost) {
      // Undo repost (delete)
      existingRepost.status = "deleted";
      await existingRepost.save();

      // Decrement original post repost count
      await originalPost.incrementEngagement("reposts", -1);

      return res.json({ message: "Repost removed", reposted: false });
    }

    // Create repost
    const repost = new Post({
      author: userId,
      content: {
        text: "",
        mentions: [],
        hashtags: [],
        links: [],
      },
      media: [],
      type: "repost",
      originalPost: postId,
      privacy: "public", // Reposts are always public
    });

    await repost.save();

    // Increment original post repost count
    await originalPost.incrementEngagement("reposts", 1);

    // Populate data
    await repost.populate(
      "author",
      "username profile.displayName profile.profilePicture profile.verified"
    );
    await repost.populate({
      path: "originalPost",
      populate: {
        path: "author",
        select: "username profile.displayName profile.profilePicture",
      },
    });

    // Notify original author (if not self-repost)
    if (originalPost.author.toString() !== userId && ioInstance) {
      NotificationQueueService.queueNotification(
        ioInstance,
        originalPost.author.toString(),
        {
          type: "repost",
          sender: userId,
          post: postId,
        }
      );
    }

    res.status(201).json({
      message: "Reposted successfully",
      repost,
      reposted: true,
    });
  } catch (error) {
    console.error("Error reposting:", error);
    res.status(500).json({ error: "Failed to repost" });
  }
});

// ==================== QUOTE POST ====================
// POST /api/posts/:postId/quote
router.post(
  "/:postId/quote",
  authenticateToken,
  upload.array("media", 4),
  async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user.userId;
      let { text } = req.body;

      // Validate
      if (!text) {
        return res.status(400).json({ error: "Quote must have text" });
      }

      // Check if original post exists
      const originalPost = await Post.findOne({
        _id: postId,
        status: "active",
      });

      if (!originalPost) {
        return res.status(404).json({ error: "Original post not found" });
      }

      // Sanitize text
      text = sanitizeContent(text);
      if (text.length > 5000) {
        return res.status(400).json({ error: "Text exceeds 5000 characters" });
      }

      // Extract mentions and hashtags
      const mentionUsernames = extractMentions(text);
      const hashtags = extractHashtags(text);

      const mentionedUsers = await User.find({
        username: { $in: mentionUsernames },
      }).select("_id");
      const mentions = mentionedUsers.map((u) => u._id);

      // Process media files
      const media = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const mediaType = file.mimetype.startsWith("image/")
            ? "image"
            : "video";
          media.push({
            type: mediaType,
            url: `/uploads/${file.filename}`,
            size: file.size,
          });
        }
      }

      // Create quote post
      const quotePost = new Post({
        author: userId,
        content: {
          text,
          mentions,
          hashtags,
          links: [],
        },
        media,
        type: "quote",
        originalPost: postId,
        privacy: "public", // Quotes are always public
      });

      await quotePost.save();

      // Increment original post quote count
      await originalPost.incrementEngagement("quotes", 1);

      // Populate data
      await quotePost.populate(
        "author",
        "username profile.displayName profile.profilePicture profile.verified"
      );
      await quotePost.populate({
        path: "originalPost",
        populate: {
          path: "author",
          select: "username profile.displayName profile.profilePicture",
        },
      });

      // Notify original author (if not self-quote)
      if (originalPost.author.toString() !== userId && ioInstance) {
        NotificationQueueService.queueNotification(
          ioInstance,
          originalPost.author.toString(),
          {
            type: "quote",
            sender: userId,
            post: quotePost._id,
          }
        );
      }

      res.status(201).json({
        message: "Quote posted successfully",
        post: quotePost,
      });
    } catch (error) {
      console.error("Error creating quote post:", error);

      // Clean up uploaded files on error
      if (req.files) {
        req.files.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        });
      }

      res.status(500).json({ error: "Failed to create quote post" });
    }
  }
);

// ==================== TRACK POST VIEW ====================
// POST /api/posts/:postId/view
router.post("/:postId/view", optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.userId;
    const { timestamp, forced = false } = req.body;

    // Validate post exists and is active
    const post = await Post.findOne({ _id: postId, status: "active" });
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check privacy for followers-only posts
    if (post.privacy === "followers" && userId) {
      const isFollowing = await Follow.isFollowing(
        userId,
        post.author._id.toString()
      );
      const isOwnPost = userId === post.author._id.toString();

      if (!isFollowing && !isOwnPost) {
        return res.status(403).json({ error: "Post is private" });
      }
    } else if (post.privacy === "followers" && !userId) {
      return res.status(403).json({ error: "Authentication required" });
    }

    // Rate limiting: Prevent spam views from same user/IP
    // In production, you'd want to use Redis for this
    const viewKey = userId
      ? `user:${userId}:${postId}`
      : `ip:${req.ip}:${postId}`;
    const now = Date.now();

    // Simple in-memory rate limiting (in production, use Redis)
    if (!global.viewRateLimit) {
      global.viewRateLimit = new Map();
    }

    const lastView = global.viewRateLimit.get(viewKey);
    if (lastView && now - lastView < 30000) {
      // 30 seconds cooldown
      return res.status(429).json({ error: "View rate limited" });
    }

    global.viewRateLimit.set(viewKey, now);

    // Increment view count
    await Post.findByIdAndUpdate(postId, {
      $inc: { "engagement.views": 1 },
    });

    // TODO: Track detailed analytics (user demographics, time spent, etc.)
    // TODO: Emit real-time view updates via Socket.io

    res.json({
      message: "View tracked successfully",
      postId,
      views: post.engagement.views + 1,
    });
  } catch (error) {
    console.error("Error tracking view:", error);
    res.status(500).json({ error: "Failed to track view" });
  }
});

export default router;
