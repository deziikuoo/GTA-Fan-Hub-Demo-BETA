// server/routes/notificationRoutes.js

import express from "express";
import Notification from "../models/Notification.js";
import { authenticateToken } from "../../authMiddleware.js";

const router = express.Router();

// ==================== GET USER NOTIFICATIONS ====================
// GET /api/notifications
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, type, unreadOnly = false } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = { recipient: userId };
    if (type) query.type = type;
    if (unreadOnly === "true") query.read = false;

    // Get notifications with populated sender info
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: "sender",
        select:
          "username profile.displayName profile.profilePicture profile.verified",
      })
      .populate({
        path: "aggregatedSenders",
        select: "username profile.displayName profile.profilePicture",
      })
      .populate({
        path: "post",
        select: "content.text media",
      })
      .populate({
        path: "comment",
        select: "content.text",
      })
      .lean();

    // Get total count for pagination
    const totalCount = await Notification.countDocuments(query);
    const hasMore = skip + notifications.length < totalCount;

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ==================== GET UNREAD COUNT ====================
// GET /api/notifications/unread-count
router.get("/unread-count", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const count = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// ==================== MARK NOTIFICATION AS READ ====================
// PATCH /api/notifications/:id/read
router.patch("/:id/read", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.read = true;
    await notification.save();

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    res.json({
      message: "Notification marked as read",
      notification,
      unreadCount,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// ==================== MARK ALL NOTIFICATIONS AS READ ====================
// PATCH /api/notifications/mark-all-read
router.patch("/mark-all-read", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );

    res.json({
      message: "All notifications marked as read",
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

// ==================== DELETE NOTIFICATION ====================
// DELETE /api/notifications/:id
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    res.json({
      message: "Notification deleted",
      unreadCount,
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

export default router;
