// server/models/Post.js

import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      text: {
        type: String,
        maxlength: 5000,
        trim: true,
      },
      mentions: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      hashtags: [
        {
          type: String,
          lowercase: true,
          trim: true,
        },
      ],
      links: [
        {
          url: { type: String, required: true },
          title: String,
          description: String,
          image: String,
          domain: String,
        },
      ],
    },

    media: [
      {
        type: {
          type: String,
          enum: ["image", "video", "gif"],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        thumbnail: String,
        dimensions: {
          width: Number,
          height: Number,
        },
        altText: {
          type: String,
          maxlength: 500,
        },
        duration: Number, // For videos (in seconds)
        size: Number, // File size in bytes
      },
    ],

    type: {
      type: String,
      enum: ["post", "repost", "quote"],
      default: "post",
      index: true,
    },

    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      index: true,
    },

    // Denormalized engagement counts for fast reads
    engagement: {
      likes: {
        type: Number,
        default: 0,
        min: 0,
        index: true,
      },
      comments: {
        type: Number,
        default: 0,
        min: 0,
      },
      reposts: {
        type: Number,
        default: 0,
        min: 0,
      },
      quotes: {
        type: Number,
        default: 0,
        min: 0,
      },
      bookmarks: {
        type: Number,
        default: 0,
        min: 0,
      },
      views: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Algorithm scoring for For You feed
    engagementScore: {
      type: Number,
      default: 0,
      index: true,
    },

    privacy: {
      type: String,
      enum: ["public", "followers"],
      default: "public",
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "deleted", "hidden"],
      default: "active",
      index: true,
    },

    // Moderation flags
    flags: {
      reported: {
        type: Boolean,
        default: false,
        index: true,
      },
      reportCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      underReview: {
        type: Boolean,
        default: false,
        index: true,
      },
    },

    // Track if post can be edited (within 15min window)
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
  },
  {
    timestamps: true, // Creates createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient queries
PostSchema.index({ author: 1, createdAt: -1 }); // User's posts timeline
PostSchema.index({ createdAt: -1, status: 1 }); // Recent active posts
PostSchema.index({ engagementScore: -1, createdAt: -1 }); // For You feed
PostSchema.index({ "content.hashtags": 1, createdAt: -1 }); // Hashtag search
PostSchema.index({ status: 1, createdAt: -1, privacy: 1 }); // Feed queries

// Text search index for post content
PostSchema.index({ "content.text": "text" });

// Virtual for checking if post is editable (within 15min)
PostSchema.virtual("isEditable").get(function () {
  if (this.isEdited) return false; // Can only edit once
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  return this.createdAt > fifteenMinutesAgo;
});

// Virtual for getting all engagement count
PostSchema.virtual("totalEngagement").get(function () {
  return (
    this.engagement.likes +
    this.engagement.comments +
    this.engagement.reposts +
    this.engagement.quotes
  );
});

// Method to calculate engagement score
PostSchema.methods.calculateEngagementScore = function () {
  const ageInHours = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
  const recencyFactor = 1 / (ageInHours + 1);

  this.engagementScore =
    (this.engagement.likes * 1 +
      this.engagement.comments * 3 +
      this.engagement.reposts * 5 +
      this.engagement.quotes * 4 +
      this.engagement.views * 0.01) *
    recencyFactor;

  return this.engagementScore;
};

// Method to increment engagement count atomically
PostSchema.methods.incrementEngagement = async function (type, value = 1) {
  const updateField = `engagement.${type}`;
  await this.constructor.findByIdAndUpdate(
    this._id,
    { $inc: { [updateField]: value } },
    { new: true }
  );
  // Recalculate engagement score
  this.calculateEngagementScore();
  await this.save();
};

// Pre-save hook to calculate initial engagement score
PostSchema.pre("save", function (next) {
  if (this.isNew || this.isModified("engagement")) {
    this.calculateEngagementScore();
  }
  next();
});

// Static method to get feed posts with author populated
PostSchema.statics.getFeedPosts = async function (query, options = {}) {
  const {
    limit = 20,
    skip = 0,
    sort = { createdAt: -1 },
    populate = true,
  } = options;

  let queryBuilder = this.find(query)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .select("-__v");

  if (populate) {
    queryBuilder = queryBuilder.populate(
      "author",
      "username profile.displayName profile.profilePicture profile.verified"
    );

    // Populate original post for reposts/quotes
    queryBuilder = queryBuilder.populate({
      path: "originalPost",
      select: "author content media createdAt engagement privacy status",
      populate: {
        path: "author",
        select: "username profile.displayName profile.profilePicture",
      },
    });
  }

  return await queryBuilder.exec();
};

const Post = mongoose.model("Post", PostSchema);
export default Post;
