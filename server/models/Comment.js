// server/models/Comment.js

import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      text: {
        type: String,
        required: true,
        maxlength: 2000,
        trim: true,
      },
      mentions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },

    // For nested replies
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },

    // Denormalized engagement
    engagement: {
      likes: {
        type: Number,
        default: 0,
        min: 0,
      },
      replies: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    status: {
      type: String,
      enum: ["active", "deleted", "hidden"],
      default: "active",
      index: true,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes
CommentSchema.index({ post: 1, createdAt: -1 }); // Get post's comments
CommentSchema.index({ post: 1, parentComment: 1, createdAt: 1 }); // Threaded comments
CommentSchema.index({ author: 1, createdAt: -1 }); // User's comments

// Virtual for checking if comment is editable (within 15min)
CommentSchema.virtual("isEditable").get(function () {
  if (this.isEdited) return false;
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  return this.createdAt > fifteenMinutesAgo;
});

// Virtual to populate replies
CommentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentComment",
  options: { sort: { createdAt: 1 } },
});

// Method to increment like count atomically
CommentSchema.methods.incrementLikes = async function (value = 1) {
  await this.constructor.findByIdAndUpdate(
    this._id,
    { $inc: { "engagement.likes": value } },
    { new: true }
  );
};

// Static method to get comments with author populated
CommentSchema.statics.getPostComments = async function (postId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    parentComment = null,
    includeReplies = false,
  } = options;

  const query = {
    post: postId,
    status: "active",
    parentComment: parentComment,
  };

  let comments = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate(
      "author",
      "username profile.displayName profile.profilePicture profile.verified"
    )
    .select("-__v");

  // Optionally populate nested replies (first level only to avoid deep nesting)
  if (includeReplies) {
    for (let comment of comments) {
      await comment.populate({
        path: "replies",
        match: { status: "active" },
        options: { limit: 3, sort: { createdAt: 1 } },
        populate: {
          path: "author",
          select:
            "username profile.displayName profile.profilePicture profile.verified",
        },
      });
    }
  }

  return comments;
};

// Pre-save hook to update parent comment reply count
CommentSchema.pre("save", async function (next) {
  if (this.isNew && this.parentComment) {
    await this.constructor.findByIdAndUpdate(this.parentComment, {
      $inc: { "engagement.replies": 1 },
    });
  }
  next();
});

// Post-remove hook to decrement parent reply count
CommentSchema.post("findOneAndUpdate", async function (doc) {
  if (doc && doc.status === "deleted" && doc.parentComment) {
    await this.model.findByIdAndUpdate(doc.parentComment, {
      $inc: { "engagement.replies": -1 },
    });
  }
});

const Comment = mongoose.model("Comment", CommentSchema);
export default Comment;
