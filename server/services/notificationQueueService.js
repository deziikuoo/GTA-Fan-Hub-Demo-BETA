// server/services/notificationQueueService.js

import Notification from "../models/Notification.js";

/**
 * Smart notification queue service with batching and database persistence
 * - Single notifications: Always sent immediately
 * - Batch notifications: Sent once after 10-second window
 * - Creates database records for notification center
 */
export class NotificationQueueService {
  static queues = new Map(); // userId -> { notifications: [], timer: null }
  static userSessions = new Map(); // userId -> { hasSentBatch: false }
  static BATCH_WINDOW = 10000; // 10 second window

  /**
   * Queue a notification for a user
   * @param {Object} io - Socket.io server instance
   * @param {string} userId - User to send notification to
   * @param {Object} notification - Notification data { type, sender, post, comment }
   */
  static queueNotification(io, userId, notification) {
    const queue = this.queues.get(userId) || { notifications: [], timer: null };

    queue.notifications.push(notification);

    // Clear existing timer and restart
    if (queue.timer) {
      clearTimeout(queue.timer);
    }

    // Set timer to send after 10-second window
    queue.timer = setTimeout(() => {
      this.sendBatchNotification(io, userId);
    }, this.BATCH_WINDOW);

    this.queues.set(userId, queue);
    console.log(
      `[NotificationQueue] Queued ${notification.type} notification for user ${userId} (${queue.notifications.length} queued, timer: 10s)`
    );
  }

  /**
   * Send batched notification to user
   * @param {Object} io - Socket.io server instance
   * @param {string} userId - User to send notification to
   */
  static async sendBatchNotification(io, userId) {
    const queue = this.queues.get(userId);
    if (!queue || queue.notifications.length === 0) return;

    const notifications = queue.notifications;

    try {
      // SINGLE NOTIFICATION: Create DB record and send with full details
      if (notifications.length === 1) {
        const notification = notifications[0];

        // Create or aggregate in database
        const { notification: dbNotification, isNew } =
          await Notification.createOrAggregate({
            type: notification.type,
            recipient: userId,
            sender: notification.sender,
            post: notification.post || null,
            comment: notification.comment || null,
          });

        // Populate sender info for socket emission
        await dbNotification.populate({
          path: "sender",
          select:
            "username profile.displayName profile.profilePicture profile.verified",
        });

        // Get updated unread count
        const unreadCount = await Notification.countDocuments({
          recipient: userId,
          read: false,
        });

        // Emit to user via Socket.io
        io.to(userId).emit("notification", {
          type: notification.type,
          notification: dbNotification,
          unreadCount,
          single: true,
        });

        console.log(
          `[NotificationQueue] Sent single ${notification.type} notification to user ${userId}`
        );
      }
      // MULTIPLE NOTIFICATIONS: Batch and create/update DB records
      else {
        // Group notifications by type and target
        const grouped = this.groupNotifications(notifications);

        for (const group of grouped) {
          // Create or update aggregated notification in database
          const { notification: dbNotification } =
            await Notification.createOrAggregate({
              type: group.type,
              recipient: userId,
              sender: group.senders[0], // Primary sender
              post: group.post || null,
              comment: group.comment || null,
            });

          // If this is now aggregated, update with all senders
          if (group.senders.length > 1) {
            dbNotification.aggregated = true;
            dbNotification.aggregatedSenders = group.senders;
            dbNotification.aggregatedCount = group.senders.length;
            await dbNotification.save();
          }

          // Populate for socket emission
          await dbNotification.populate([
            {
              path: "sender",
              select:
                "username profile.displayName profile.profilePicture profile.verified",
            },
            {
              path: "aggregatedSenders",
              select: "username profile.displayName profile.profilePicture",
            },
          ]);

          // Get updated unread count
          const unreadCount = await Notification.countDocuments({
            recipient: userId,
            read: false,
          });

          // Emit to user via Socket.io
          io.to(userId).emit("notification", {
            type: group.type,
            notification: dbNotification,
            unreadCount,
            single: false,
            count: group.senders.length,
          });

          console.log(
            `[NotificationQueue] Sent batched ${group.type} notification to user ${userId} (${group.senders.length} senders)`
          );
        }
      }
    } catch (error) {
      console.error(
        `[NotificationQueue] Error sending notifications to user ${userId}:`,
        error
      );
    }

    // Clear queue
    this.queues.delete(userId);
  }

  /**
   * Group notifications by type and target
   * @param {Array} notifications - Array of notification objects
   * @returns {Array} Grouped notifications
   */
  static groupNotifications(notifications) {
    const groups = new Map();

    for (const notif of notifications) {
      // Create unique key for grouping: type + post + comment
      const key = `${notif.type}_${notif.post || "null"}_${
        notif.comment || "null"
      }`;

      if (!groups.has(key)) {
        groups.set(key, {
          type: notif.type,
          post: notif.post,
          comment: notif.comment,
          senders: [],
        });
      }

      const group = groups.get(key);
      if (!group.senders.includes(notif.sender)) {
        group.senders.push(notif.sender);
      }
    }

    return Array.from(groups.values());
  }

  /**
   * Reset session for a user (called when user refreshes page)
   * @param {string} userId - User ID to reset
   */
  static resetUserSession(userId) {
    this.userSessions.delete(userId);
    console
      .log
      // Removed verbose notification queue log
      ();
  }

  /**
   * Get queue status for debugging
   * @param {string} userId - User ID to check
   * @returns {Object} Queue status
   */
  static getQueueStatus(userId) {
    const queue = this.queues.get(userId);
    const session = this.userSessions.get(userId) || { hasSentBatch: false };
    return {
      hasQueue: !!queue,
      notificationCount: queue ? queue.notifications.length : 0,
      hasTimer: queue ? !!queue.timer : false,
      hasSentBatch: session.hasSentBatch,
    };
  }

  /**
   * Clear all queues and sessions (for testing/cleanup)
   */
  static clearAllQueues() {
    for (const [userId, queue] of this.queues) {
      if (queue.timer) {
        clearTimeout(queue.timer);
      }
    }
    this.queues.clear();
    this.userSessions.clear();
    console.log(
      "[NotificationQueue] Cleared all notification queues and sessions"
    );
  }
}

export default NotificationQueueService;
