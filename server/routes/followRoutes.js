// server/routes/followRoutes.js

import express from "express";
import mongoose from "mongoose";
import Follow from "../models/Follow.js";
import User from "../models/User.js";
import { CacheService } from "../services/cacheService.js";
import { NotificationQueueService } from "../services/notificationQueueService.js";
import { authenticateToken } from "../../authMiddleware.js";

const router = express.Router();

// ==================== FOLLOW ACTIONS ====================

/**
 * @route   POST /api/users/:userId/follow
 * @desc    Follow a user
 * @access  Private (requires JWT)
 * @body    { source?: string }
 */
router.post("/users/:userId/follow", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const targetUserId = req.params.userId;

    // Validation
    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId,
    });

    if (existingFollow && existingFollow.status === "active") {
      return res.status(400).json({ error: "Already following this user" });
    }

    if (existingFollow && existingFollow.status === "pending") {
      return res.status(400).json({
        error: "Follow request already pending",
        status: "pending",
      });
    }

    // Check if target account is private
    const isPrivateAccount =
      targetUser.preferences?.privacy?.accountType === "private";

    // Determine initial status based on account type
    const initialStatus = isPrivateAccount ? "pending" : "active";

    // Create or update follow relationship
    let follow;
    if (existingFollow) {
      // Reactivate if it was previously inactive
      existingFollow.status = initialStatus;
      existingFollow.source = req.body.source || "profile";
      follow = await existingFollow.save();
    } else {
      follow = await Follow.create({
        follower: currentUserId,
        following: targetUserId,
        status: initialStatus,
        source: req.body.source || "profile",
      });
    }

    // Update denormalized counts only if status is active
    if (initialStatus === "active") {
      await Promise.all([
        User.findByIdAndUpdate(currentUserId, {
          $inc: { "stats.followingCount": 1 },
        }),
        User.findByIdAndUpdate(targetUserId, {
          $inc: { "stats.followersCount": 1 },
        }),
      ]);

      // Check if mutual and update
      const mutualFollow = await Follow.findOne({
        follower: targetUserId,
        following: currentUserId,
        status: "active",
      });

      if (mutualFollow) {
        const now = new Date();
        follow.mutualFollowDate = now;
        mutualFollow.mutualFollowDate = now;
        await Promise.all([follow.save(), mutualFollow.save()]);
      }

      // Invalidate caches
      await Promise.all([
        CacheService.invalidateUserCache(currentUserId),
        CacheService.invalidateUserCache(targetUserId),
        CacheService.invalidateFollowStatus(currentUserId, targetUserId),
      ]);

      console.log(`[Follow] User ${currentUserId} followed ${targetUserId}`);

      // Queue notification instead of sending immediately
      const io = req.app.get("io");
      if (io) {
        const currentUser = await User.findById(currentUserId).select(
          "username profile.profilePicture"
        );

        NotificationQueueService.queueNotification(io, targetUserId, {
          type: "follow",
          follower: {
            userId: currentUserId,
            username: currentUser.username,
            profilePicture:
              currentUser.profile?.profilePicture ||
              "/src/assets/images/user.png",
          },
        });
      }
    } else {
      // Status is pending - send follow request notification
      console.log(
        `[Follow] User ${currentUserId} sent follow request to ${targetUserId}`
      );

      const io = req.app.get("io");
      if (io) {
        const currentUser = await User.findById(currentUserId).select(
          "username profile.profilePicture"
        );

        NotificationQueueService.queueNotification(io, targetUserId, {
          type: "follow_request",
          requester: {
            userId: currentUserId,
            username: currentUser.username,
            profilePicture:
              currentUser.profile?.profilePicture ||
              "/src/assets/images/user.png",
          },
          requestId: follow._id,
        });
      }
    }

    res.status(201).json({
      message: initialStatus === "active" ? "Following" : "Follow request sent",
      status: initialStatus,
      isMutual: initialStatus === "active" ? false : undefined,
      follow: {
        id: follow._id,
        follower: currentUserId,
        following: targetUserId,
        status: follow.status,
        createdAt: follow.createdAt,
      },
    });
  } catch (error) {
    console.error("[Follow] Error following user:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

/**
 * @route   DELETE /api/users/:userId/follow
 * @desc    Unfollow a user
 * @access  Private
 */
router.delete("/users/:userId/follow", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const targetUserId = req.params.userId;

    const follow = await Follow.findOneAndDelete({
      follower: currentUserId,
      following: targetUserId,
    });

    if (!follow) {
      return res.status(404).json({ error: "Not following this user" });
    }

    // Update counts (only if was active)
    if (follow.status === "active") {
      await Promise.all([
        User.findByIdAndUpdate(currentUserId, {
          $inc: { "stats.followingCount": -1 },
        }),
        User.findByIdAndUpdate(targetUserId, {
          $inc: { "stats.followersCount": -1 },
        }),
      ]);

      // Clear mutual follow date from reverse follow if exists
      await Follow.findOneAndUpdate(
        {
          follower: targetUserId,
          following: currentUserId,
        },
        {
          $unset: { mutualFollowDate: 1 },
        }
      );
    }

    // Invalidate caches
    await Promise.all([
      CacheService.invalidateUserCache(currentUserId),
      CacheService.invalidateUserCache(targetUserId),
      CacheService.invalidateFollowStatus(currentUserId, targetUserId),
    ]);

    console.log(`[Follow] User ${currentUserId} unfollowed ${targetUserId}`);

    // Queue unfollow notification
    const io = req.app.get("io");
    if (io) {
      const currentUser = await User.findById(currentUserId).select("username");

      NotificationQueueService.queueNotification(io, targetUserId, {
        type: "unfollow",
        unfollower: {
          userId: currentUserId,
          username: currentUser.username,
        },
      });
    }

    res.json({
      message: "Unfollowed successfully",
      unfollowedAt: new Date(),
    });
  } catch (error) {
    console.error("[Follow] Error unfollowing user:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

// ==================== FOLLOWERS & FOLLOWING LISTS ====================

/**
 * @route   GET /api/users/:userId/followers
 * @desc    Get user's followers with pagination
 * @access  Public
 * @query   { page?: number, limit?: number }
 */
router.get("/users/:userId/followers", async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Try cache first for page 1
    let cachedFollowers = null;
    if (page === 1) {
      cachedFollowers = await CacheService.getRecentFollowers(userId, limit);
    }

    let followers;
    let totalCount;

    if (cachedFollowers) {
      // Fetch user details for cached IDs
      followers = await User.find({
        _id: { $in: cachedFollowers },
      }).select(
        "username profile.profilePicture profile.displayName stats.followersCount"
      );

      totalCount = await Follow.countDocuments({
        following: userId,
        status: "active",
      });
    } else {
      // Fetch from database
      const followDocs = await Follow.find({
        following: userId,
        status: "active",
      })
        .populate(
          "follower",
          "username profile.profilePicture profile.displayName stats.followersCount"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      followers = followDocs.map((doc) => doc.follower);
      totalCount = await Follow.countDocuments({
        following: userId,
        status: "active",
      });

      // Cache for future requests
      if (page === 1) {
        await CacheService.cacheRecentFollowers(
          userId,
          followDocs.map((doc) => ({
            follower: doc.follower._id,
            createdAt: doc.createdAt,
          }))
        );
      }
    }

    res.json({
      followers,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: skip + followers.length < totalCount,
    });
  } catch (error) {
    console.error("[Follow] Error fetching followers:", error);
    res.status(500).json({ error: "Failed to fetch followers" });
  }
});

/**
 * @route   GET /api/users/:userId/following
 * @desc    Get user's following with pagination
 * @access  Public
 * @query   { page?: number, limit?: number }
 */
router.get("/users/:userId/following", async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const followDocs = await Follow.find({
      follower: userId,
      status: "active",
    })
      .populate(
        "following",
        "username profile.profilePicture profile.displayName stats.followersCount"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const following = followDocs.map((doc) => doc.following);
    const totalCount = await Follow.countDocuments({
      follower: userId,
      status: "active",
    });

    res.json({
      following,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: skip + following.length < totalCount,
    });
  } catch (error) {
    console.error("[Follow] Error fetching following:", error);
    res.status(500).json({ error: "Failed to fetch following" });
  }
});

// ==================== FOLLOW STATUS & RELATIONSHIPS ====================

/**
 * @route   GET /api/users/:userId/follow-status
 * @desc    Check if current user follows target user
 * @access  Private
 */
router.get(
  "/users/:userId/follow-status",
  authenticateToken,
  async (req, res) => {
    try {
      const currentUserId = req.user.userId;
      const targetUserId = req.params.userId;

      if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Try cache first
      let isFollowing = await CacheService.getFollowStatus(
        currentUserId,
        targetUserId
      );

      if (isFollowing === null) {
        // Cache miss, query database
        isFollowing = await Follow.isFollowing(currentUserId, targetUserId);

        // Cache the result
        await CacheService.cacheFollowStatus(
          currentUserId,
          targetUserId,
          isFollowing
        );
      }

      // Check if mutual
      let isMutual = false;
      if (isFollowing) {
        isMutual = await Follow.isFollowing(targetUserId, currentUserId);
      }

      res.json({
        isFollowing,
        isMutual,
        userId: targetUserId,
      });
    } catch (error) {
      console.error("[Follow] Error checking follow status:", error);
      res.status(500).json({ error: "Failed to check follow status" });
    }
  }
);

/**
 * @route   GET /api/users/:userId/mutual-followers
 * @desc    Get mutual followers between current user and target user
 * @access  Private
 * @query   { limit?: number }
 */
router.get(
  "/users/:userId/mutual-followers",
  authenticateToken,
  async (req, res) => {
    try {
      const currentUserId = req.user.userId;
      const targetUserId = req.params.userId;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100);

      if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Try cache first
      let mutualIds = await CacheService.getMutualFollowers(
        currentUserId,
        targetUserId
      );

      if (!mutualIds) {
        // Cache miss, calculate from database
        // Get followers of current user
        const currentUserFollowers = await Follow.find({
          following: currentUserId,
          status: "active",
        }).select("follower");

        // Get followers of target user
        const targetUserFollowers = await Follow.find({
          following: targetUserId,
          status: "active",
        }).select("follower");

        // Find intersection
        const currentFollowerIds = new Set(
          currentUserFollowers.map((f) => f.follower.toString())
        );
        mutualIds = targetUserFollowers
          .filter((f) => currentFollowerIds.has(f.follower.toString()))
          .map((f) => f.follower.toString());

        // Cache the result
        await CacheService.cacheMutualFollowers(
          currentUserId,
          targetUserId,
          mutualIds
        );
      }

      // Fetch user details (limited)
      const mutualFollowers = await User.find({
        _id: { $in: mutualIds.slice(0, limit) },
      }).select("username profile.profilePicture profile.displayName");

      res.json({
        mutualFollowers,
        totalCount: mutualIds.length,
        showing: Math.min(limit, mutualIds.length),
      });
    } catch (error) {
      console.error("[Follow] Error fetching mutual followers:", error);
      res.status(500).json({ error: "Failed to fetch mutual followers" });
    }
  }
);

/**
 * @route   POST /api/users/bulk-follow-status
 * @desc    Check follow status for multiple users at once
 * @access  Private
 * @body    { userIds: string[] }
 */
router.post(
  "/users/bulk-follow-status",
  authenticateToken,
  async (req, res) => {
    try {
      const currentUserId = req.user.userId;
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: "userIds array required" });
      }

      // Limit to 100 users per request
      const limitedIds = userIds.slice(0, 100);

      // Try cache first
      const cachedStatuses = await CacheService.getBulkFollowStatus(
        currentUserId,
        limitedIds
      );

      // Find which ones need DB lookup (cache miss)
      const uncachedIds = limitedIds.filter(
        (id) => cachedStatuses[id] === undefined
      );

      if (uncachedIds.length > 0) {
        // Query DB for uncached
        const follows = await Follow.find({
          follower: currentUserId,
          following: { $in: uncachedIds },
          status: "active",
        }).select("following");

        const dbStatuses = {};
        uncachedIds.forEach((id) => {
          const isFollowing = follows.some(
            (f) => f.following.toString() === id
          );
          dbStatuses[id] = isFollowing;

          // Cache the result
          CacheService.cacheFollowStatus(currentUserId, id, isFollowing);
        });

        // Merge cached and DB results
        Object.assign(cachedStatuses, dbStatuses);
      }

      res.json({ followStatuses: cachedStatuses });
    } catch (error) {
      console.error("[Follow] Bulk follow status error:", error);
      res.status(500).json({ error: "Failed to get follow statuses" });
    }
  }
);

// ==================== FOLLOW REQUEST MANAGEMENT ====================

/**
 * @route   GET /api/follow-requests
 * @desc    Get pending follow requests for current user
 * @access  Private
 */
router.get("/follow-requests", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get pending follow requests where current user is being followed
    const requests = await Follow.find({
      following: userId,
      status: "pending",
    })
      .populate(
        "follower",
        "username profile.displayName profile.profilePicture profile.verified stats.followersCount"
      )
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalCount = await Follow.countDocuments({
      following: userId,
      status: "pending",
    });

    res.json({
      requests: requests.map((req) => ({
        id: req._id,
        requester: req.follower,
        createdAt: req.createdAt,
      })),
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error("[Follow] Error fetching follow requests:", error);
    res.status(500).json({ error: "Failed to fetch follow requests" });
  }
});

/**
 * @route   GET /api/follow-requests/sent
 * @desc    Get sent follow requests by current user
 * @access  Private
 */
router.get("/follow-requests/sent", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get pending follow requests sent by current user
    const requests = await Follow.find({
      follower: userId,
      status: "pending",
    })
      .populate(
        "following",
        "username profile.displayName profile.profilePicture profile.verified"
      )
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalCount = await Follow.countDocuments({
      follower: userId,
      status: "pending",
    });

    res.json({
      requests: requests.map((req) => ({
        id: req._id,
        targetUser: req.following,
        createdAt: req.createdAt,
      })),
      totalCount,
      page: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
    });
  } catch (error) {
    console.error("[Follow] Error fetching sent requests:", error);
    res.status(500).json({ error: "Failed to fetch sent requests" });
  }
});

/**
 * @route   PUT /api/follow-requests/:requestId/approve
 * @desc    Approve a follow request
 * @access  Private
 */
router.put(
  "/follow-requests/:requestId/approve",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { requestId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }

      // Find the follow request
      const followRequest = await Follow.findById(requestId);

      if (!followRequest) {
        return res.status(404).json({ error: "Follow request not found" });
      }

      // Verify that the current user is the one being followed
      if (followRequest.following.toString() !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to approve this request" });
      }

      // Verify status is pending
      if (followRequest.status !== "pending") {
        return res.status(400).json({ error: "Request is not pending" });
      }

      // Approve the request
      followRequest.status = "active";
      await followRequest.save();

      // Update denormalized counts
      await Promise.all([
        User.findByIdAndUpdate(followRequest.follower, {
          $inc: { "stats.followingCount": 1 },
        }),
        User.findByIdAndUpdate(userId, {
          $inc: { "stats.followersCount": 1 },
        }),
      ]);

      // Check if mutual
      const mutualFollow = await Follow.findOne({
        follower: userId,
        following: followRequest.follower,
        status: "active",
      });

      if (mutualFollow) {
        const now = new Date();
        followRequest.mutualFollowDate = now;
        mutualFollow.mutualFollowDate = now;
        await Promise.all([followRequest.save(), mutualFollow.save()]);
      }

      // Invalidate caches
      await Promise.all([
        CacheService.invalidateUserCache(userId),
        CacheService.invalidateUserCache(followRequest.follower.toString()),
        CacheService.invalidateFollowStatus(
          followRequest.follower.toString(),
          userId
        ),
      ]);

      console.log(
        `[Follow] User ${userId} approved follow request from ${followRequest.follower}`
      );

      // Send notification to requester
      const io = req.app.get("io");
      if (io) {
        const currentUser = await User.findById(userId).select(
          "username profile.profilePicture"
        );

        NotificationQueueService.queueNotification(
          io,
          followRequest.follower.toString(),
          {
            type: "follow_request_approved",
            approver: {
              userId: userId,
              username: currentUser.username,
              profilePicture:
                currentUser.profile?.profilePicture ||
                "/src/assets/images/user.png",
            },
          }
        );
      }

      res.json({
        message: "Follow request approved",
        followId: followRequest._id,
        isMutual: !!mutualFollow,
      });
    } catch (error) {
      console.error("[Follow] Error approving request:", error);
      res.status(500).json({ error: "Failed to approve follow request" });
    }
  }
);

/**
 * @route   PUT /api/follow-requests/:requestId/reject
 * @desc    Reject a follow request
 * @access  Private
 */
router.put(
  "/follow-requests/:requestId/reject",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { requestId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }

      // Find the follow request
      const followRequest = await Follow.findById(requestId);

      if (!followRequest) {
        return res.status(404).json({ error: "Follow request not found" });
      }

      // Verify that the current user is the one being followed
      if (followRequest.following.toString() !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to reject this request" });
      }

      // Verify status is pending
      if (followRequest.status !== "pending") {
        return res.status(400).json({ error: "Request is not pending" });
      }

      // Delete the request (or set status to 'rejected' if you want to keep records)
      await followRequest.deleteOne();

      console.log(
        `[Follow] User ${userId} rejected follow request from ${followRequest.follower}`
      );

      res.json({
        message: "Follow request rejected",
      });
    } catch (error) {
      console.error("[Follow] Error rejecting request:", error);
      res.status(500).json({ error: "Failed to reject follow request" });
    }
  }
);

/**
 * @route   DELETE /api/follow-requests/:requestId/cancel
 * @desc    Cancel a sent follow request
 * @access  Private
 */
router.delete(
  "/follow-requests/:requestId/cancel",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { requestId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }

      // Find the follow request
      const followRequest = await Follow.findById(requestId);

      if (!followRequest) {
        return res.status(404).json({ error: "Follow request not found" });
      }

      // Verify that the current user is the requester
      if (followRequest.follower.toString() !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to cancel this request" });
      }

      // Verify status is pending
      if (followRequest.status !== "pending") {
        return res.status(400).json({ error: "Request is not pending" });
      }

      // Delete the request
      await followRequest.deleteOne();

      console.log(
        `[Follow] User ${userId} cancelled follow request to ${followRequest.following}`
      );

      res.json({
        message: "Follow request cancelled",
      });
    } catch (error) {
      console.error("[Follow] Error cancelling request:", error);
      res.status(500).json({ error: "Failed to cancel follow request" });
    }
  }
);

export default router;
