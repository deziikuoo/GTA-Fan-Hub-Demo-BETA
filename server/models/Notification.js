// server/models/Notification.js

import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "like",
        "comment",
        "reply",
        "repost",
        "quote",
        "follow",
        "mention",
      ],
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    // For batched notifications (e.g., "5 people liked your post")
    aggregated: {
      type: Boolean,
      default: false,
    },
    aggregatedSenders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    aggregatedCount: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, type: 1, post: 1, read: 1 });

// TTL index - auto-delete notifications after 30 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

// Virtual for checking if notification is recent (for batching purposes)
NotificationSchema.virtual("isRecent").get(function () {
  const tenSecondsAgo = new Date(Date.now() - 10000);
  return this.createdAt > tenSecondsAgo;
});

// Method to aggregate similar notifications
NotificationSchema.statics.findSimilarRecent = async function (
  recipient,
  type,
  post,
  comment = null
) {
  const tenSecondsAgo = new Date(Date.now() - 10000);

  const query = {
    recipient,
    type,
    read: false,
    createdAt: { $gte: tenSecondsAgo },
  };

  if (post) query.post = post;
  if (comment) query.comment = comment;

  return this.findOne(query);
};

// Method to update or create batched notification
NotificationSchema.statics.createOrAggregate = async function (
  notificationData
) {
  const { recipient, sender, type, post, comment } = notificationData;

  // Check for similar recent notification to batch
  const similarNotification = await this.findSimilarRecent(
    recipient,
    type,
    post,
    comment
  );

  if (similarNotification) {
    // Update existing notification with aggregation
    if (!similarNotification.aggregated) {
      // First aggregation - add both original sender and new sender
      similarNotification.aggregated = true;
      similarNotification.aggregatedSenders = [
        similarNotification.sender,
        sender,
      ];
      similarNotification.aggregatedCount = 2;
    } else {
      // Already aggregated - add new sender
      if (!similarNotification.aggregatedSenders.includes(sender)) {
        similarNotification.aggregatedSenders.push(sender);
        similarNotification.aggregatedCount =
          similarNotification.aggregatedSenders.length;
      }
    }

    // Update timestamp to keep it at the top
    similarNotification.createdAt = new Date();
    await similarNotification.save();

    return { notification: similarNotification, isNew: false };
  }

  // No similar notification - create new one
  const notification = await this.create({
    ...notificationData,
    aggregatedCount: 1,
  });

  return { notification, isNew: true };
};

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
