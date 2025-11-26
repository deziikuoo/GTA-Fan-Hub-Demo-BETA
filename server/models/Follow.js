// server/models/Follow.js

import mongoose from "mongoose";

const FollowSchema = new mongoose.Schema(
  {
    // Core relationship
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Relationship status
    status: {
      type: String,
      enum: ["active", "pending", "blocked"],
      default: "active",
      index: true,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Modern features
    source: {
      type: String,
      enum: [
        "profile",
        "search",
        "suggestions",
        "post",
        "comment",
        "seed",
        "migration",
        "followers_list",
        "following_list",
        "test",
        "debug",
      ],
      default: "profile",
      description: "Where the follow originated from - useful for analytics",
    },

    mutualFollowDate: {
      type: Date,
      description: "When the relationship became mutual",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performance
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
FollowSchema.index({ following: 1, createdAt: -1 }); // Get followers sorted by date
FollowSchema.index({ follower: 1, status: 1 }); // Get active follows
FollowSchema.index({ following: 1, status: 1 }); // Get active followers

// Static methods

/**
 * Check if user A is following user B
 * @param {ObjectId} followerId - The user who might be following
 * @param {ObjectId} followingId - The user who might be followed
 * @returns {Promise<boolean>}
 */
FollowSchema.statics.isFollowing = async function (followerId, followingId) {
  const follow = await this.findOne({
    follower: followerId,
    following: followingId,
    status: "active",
  });
  return !!follow;
};

/**
 * Check if two users are mutual followers
 * @param {ObjectId} user1Id - First user
 * @param {ObjectId} user2Id - Second user
 * @returns {Promise<boolean>}
 */
FollowSchema.statics.areMutual = async function (user1Id, user2Id) {
  const [follow1, follow2] = await Promise.all([
    this.findOne({ follower: user1Id, following: user2Id, status: "active" }),
    this.findOne({ follower: user2Id, following: user1Id, status: "active" }),
  ]);
  return !!(follow1 && follow2);
};

/**
 * Get follower count for a user
 * @param {ObjectId} userId - The user ID
 * @returns {Promise<number>}
 */
FollowSchema.statics.getFollowerCount = async function (userId) {
  return await this.countDocuments({
    following: userId,
    status: "active",
  });
};

/**
 * Get following count for a user
 * @param {ObjectId} userId - The user ID
 * @returns {Promise<number>}
 */
FollowSchema.statics.getFollowingCount = async function (userId) {
  return await this.countDocuments({
    follower: userId,
    status: "active",
  });
};

const Follow = mongoose.model("Follow", FollowSchema);
export default Follow;
