// server/models/Engagement.js

import mongoose from "mongoose";

const EngagementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Can be post or comment
    targetType: {
      type: String,
      enum: ["post", "comment"],
      required: true,
    },

    target: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
      index: true,
    },

    type: {
      type: String,
      enum: ["like", "bookmark"],
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate likes/bookmarks
EngagementSchema.index(
  { user: 1, target: 1, targetType: 1, type: 1 },
  { unique: true }
);

// Compound indexes for queries
EngagementSchema.index({ target: 1, type: 1 }); // Get all likes for a post
EngagementSchema.index({ user: 1, type: 1, createdAt: -1 }); // User's bookmarks

// Static method to toggle engagement (like/bookmark)
EngagementSchema.statics.toggle = async function (
  userId,
  targetId,
  targetType,
  engagementType
) {
  try {
    // Try to find existing engagement
    const existing = await this.findOne({
      user: userId,
      target: targetId,
      targetType: targetType,
      type: engagementType,
    });

    if (existing) {
      // Remove engagement
      await existing.deleteOne();
      return { action: "removed", engagement: null };
    } else {
      // Create engagement
      const newEngagement = await this.create({
        user: userId,
        target: targetId,
        targetType: targetType,
        type: engagementType,
      });
      return { action: "created", engagement: newEngagement };
    }
  } catch (error) {
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      const existing = await this.findOne({
        user: userId,
        target: targetId,
        targetType: targetType,
        type: engagementType,
      });
      if (existing) {
        await existing.deleteOne();
        return { action: "removed", engagement: null };
      }
    }
    throw error;
  }
};

// Static method to check if user has engaged with target
EngagementSchema.statics.hasEngaged = async function (
  userId,
  targetId,
  targetType,
  engagementType
) {
  const engagement = await this.findOne({
    user: userId,
    target: targetId,
    targetType: targetType,
    type: engagementType,
  });
  return !!engagement;
};

// Static method to get users who engaged (e.g., users who liked a post)
EngagementSchema.statics.getEngagedUsers = async function (
  targetId,
  targetType,
  engagementType,
  options = {}
) {
  const { limit = 20, skip = 0 } = options;

  const engagements = await this.find({
    target: targetId,
    targetType: targetType,
    type: engagementType,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate(
      "user",
      "username profile.displayName profile.profilePicture profile.verified"
    );

  return engagements.map((e) => e.user);
};

// Static method to get user's bookmarked posts
EngagementSchema.statics.getUserBookmarks = async function (
  userId,
  options = {}
) {
  const { limit = 20, skip = 0 } = options;

  const bookmarks = await this.find({
    user: userId,
    targetType: "post",
    type: "bookmark",
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate({
      path: "target",
      match: { status: "active" }, // Only active posts
      populate: {
        path: "author",
        select:
          "username profile.displayName profile.profilePicture profile.verified",
      },
    });

  // Filter out null targets (deleted posts)
  return bookmarks.filter((b) => b.target !== null).map((b) => b.target);
};

// Static method to bulk check engagement status for multiple targets
EngagementSchema.statics.bulkCheck = async function (
  userId,
  targetIds,
  targetType,
  engagementType
) {
  const engagements = await this.find({
    user: userId,
    target: { $in: targetIds },
    targetType: targetType,
    type: engagementType,
  }).select("target");

  const engagedMap = {};
  targetIds.forEach((id) => {
    engagedMap[id.toString()] = false;
  });

  engagements.forEach((e) => {
    engagedMap[e.target.toString()] = true;
  });

  return engagedMap;
};

const Engagement = mongoose.model("Engagement", EngagementSchema);
export default Engagement;
