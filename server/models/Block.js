// server/models/Block.js

import mongoose from "mongoose";

const BlockSchema = new mongoose.Schema(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    blocked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    reason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate blocks
BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

// Compound indexes for queries
BlockSchema.index({ blocker: 1, createdAt: -1 }); // Get user's blocked list
BlockSchema.index({ blocked: 1, createdAt: -1 }); // Get users who blocked someone

// Prevent self-blocking
BlockSchema.pre("save", function (next) {
  if (this.blocker.equals(this.blocked)) {
    next(new Error("Cannot block yourself"));
  } else {
    next();
  }
});

// Static method to block a user
BlockSchema.statics.blockUser = async function (blockerId, blockedId, reason) {
  try {
    // Check if already blocked
    const existing = await this.findOne({
      blocker: blockerId,
      blocked: blockedId,
    });

    if (existing) {
      return { alreadyBlocked: true, block: existing };
    }

    // Create block
    const block = await this.create({
      blocker: blockerId,
      blocked: blockedId,
      reason,
    });

    // Remove follow relationships if they exist
    const Follow = mongoose.model("Follow");
    await Follow.deleteMany({
      $or: [
        { follower: blockerId, following: blockedId },
        { follower: blockedId, following: blockerId },
      ],
    });

    // Update denormalized follower/following counts in User model
    const User = mongoose.model("User");

    // Decrement blocker's following count and blocked's follower count
    await User.findByIdAndUpdate(blockerId, {
      $pull: { "socialStats.following": blockedId },
    });
    await User.findByIdAndUpdate(blockedId, {
      $pull: { "socialStats.followers": blockerId },
    });

    // Also remove reverse relationship
    await User.findByIdAndUpdate(blockedId, {
      $pull: { "socialStats.following": blockerId },
    });
    await User.findByIdAndUpdate(blockerId, {
      $pull: { "socialStats.followers": blockedId },
    });

    return { alreadyBlocked: false, block };
  } catch (error) {
    if (error.code === 11000) {
      const existing = await this.findOne({
        blocker: blockerId,
        blocked: blockedId,
      });
      return { alreadyBlocked: true, block: existing };
    }
    throw error;
  }
};

// Static method to unblock a user
BlockSchema.statics.unblockUser = async function (blockerId, blockedId) {
  const result = await this.findOneAndDelete({
    blocker: blockerId,
    blocked: blockedId,
  });
  return !!result;
};

// Static method to check if user is blocked
BlockSchema.statics.isBlocked = async function (blockerId, blockedId) {
  const block = await this.findOne({
    blocker: blockerId,
    blocked: blockedId,
  });
  return !!block;
};

// Static method to check if there's any block between two users (bidirectional)
BlockSchema.statics.hasBlockBetween = async function (userId1, userId2) {
  const block = await this.findOne({
    $or: [
      { blocker: userId1, blocked: userId2 },
      { blocker: userId2, blocked: userId1 },
    ],
  });
  return !!block;
};

// Static method to get user's blocked list
BlockSchema.statics.getBlockedUsers = async function (userId, options = {}) {
  const { limit = 50, skip = 0 } = options;

  const blocks = await this.find({ blocker: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate("blocked", "username profile.displayName profile.profilePicture");

  return blocks.map((b) => b.blocked);
};

// Static method to get all blocked user IDs for filtering (for feed queries)
BlockSchema.statics.getBlockedUserIds = async function (userId) {
  const blocks = await this.find({
    $or: [{ blocker: userId }, { blocked: userId }],
  }).select("blocker blocked");

  const blockedIds = new Set();
  blocks.forEach((block) => {
    if (block.blocker.equals(userId)) {
      blockedIds.add(block.blocked.toString());
    } else {
      blockedIds.add(block.blocker.toString());
    }
  });

  return Array.from(blockedIds);
};

const Block = mongoose.model("Block", BlockSchema);
export default Block;
