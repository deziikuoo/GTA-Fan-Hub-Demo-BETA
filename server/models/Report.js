// server/models/Report.js

import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Can report posts, comments, or users
    targetType: {
      type: String,
      enum: ["post", "comment", "user"],
      required: true,
    },

    target: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
      index: true,
    },

    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "hate_speech",
        "violence",
        "misinformation",
        "nudity",
        "copyright",
        "self_harm",
        "other",
      ],
      required: true,
    },

    description: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "dismissed"],
      default: "pending",
      index: true,
    },

    resolution: {
      action: {
        type: String,
        enum: [
          "none",
          "warning",
          "content_removed",
          "content_hidden",
          "user_suspended",
          "user_banned",
        ],
      },
      note: String,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      resolvedAt: Date,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
ReportSchema.index({ status: 1, priority: -1, createdAt: -1 }); // Admin queue
ReportSchema.index({ target: 1, targetType: 1, createdAt: -1 }); // Reports for specific content
ReportSchema.index({ reporter: 1, createdAt: -1 }); // User's report history

// Prevent duplicate reports from same user for same target
ReportSchema.index({ reporter: 1, target: 1, targetType: 1 }, { unique: true });

// Static method to create report and update target flags
ReportSchema.statics.createReport = async function (reportData) {
  const report = await this.create(reportData);

  // Update target's report count and flags
  if (reportData.targetType === "post") {
    const Post = mongoose.model("Post");
    const post = await Post.findByIdAndUpdate(
      reportData.target,
      {
        $inc: { "flags.reportCount": 1 },
        $set: { "flags.reported": true },
      },
      { new: true }
    );

    // Auto-flag for review if high report count
    if (post && post.flags.reportCount >= 10 && !post.flags.underReview) {
      await Post.findByIdAndUpdate(post._id, {
        $set: { "flags.underReview": true },
      });
      // Update report priority to high
      report.priority = "high";
      await report.save();
    }
  }

  return report;
};

// Static method to get pending reports for admin
ReportSchema.statics.getPendingReports = async function (options = {}) {
  const { limit = 20, skip = 0, priority = null } = options;

  const query = { status: { $in: ["pending", "reviewing"] } };
  if (priority) {
    query.priority = priority;
  }

  return await this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate("reporter", "username profile.profilePicture")
    .populate({
      path: "target",
      populate:
        this.targetType === "post" || this.targetType === "comment"
          ? { path: "author", select: "username profile.profilePicture" }
          : null,
    })
    .populate("resolution.resolvedBy", "username");
};

// Method to resolve report
ReportSchema.methods.resolve = async function (action, note, adminId) {
  this.status = "resolved";
  this.resolution = {
    action,
    note,
    resolvedBy: adminId,
    resolvedAt: new Date(),
  };

  // Apply resolution action
  if (action === "content_removed" || action === "content_hidden") {
    const status = action === "content_removed" ? "deleted" : "hidden";

    if (this.targetType === "post") {
      const Post = mongoose.model("Post");
      await Post.findByIdAndUpdate(this.target, { status });
    } else if (this.targetType === "comment") {
      const Comment = mongoose.model("Comment");
      await Comment.findByIdAndUpdate(this.target, { status });
    }
  }

  await this.save();
  return this;
};

// Method to dismiss report
ReportSchema.methods.dismiss = async function (note, adminId) {
  this.status = "dismissed";
  this.resolution = {
    action: "none",
    note,
    resolvedBy: adminId,
    resolvedAt: new Date(),
  };
  await this.save();
  return this;
};

const Report = mongoose.model("Report", ReportSchema);
export default Report;
