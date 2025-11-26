// server\models\User.js

import mongoose from "mongoose";

// Enhanced User model for social media platform
const UserSchema = new mongoose.Schema(
  {
    // Basic Authentication Fields
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 30,
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    refreshToken: { type: String },

    // Profile Information
    profile: {
      displayName: { type: String, maxlength: 50 },
      bio: { type: String, maxlength: 500 },
      location: { type: String, maxlength: 100 },
      website: { type: String },
      birthDate: { type: Date },
      profilePicture: { type: String, default: "/src/assets/images/user.png" },
      headerImage: { type: String, default: "/default-header.jpg" },
      verified: { type: Boolean, default: false },
      joinDate: { type: Date, default: Date.now },
    },

    // Gaming Profile
    gamingProfile: {
      playStyle: {
        type: String,
        enum: ["casual", "competitive", "roleplay", "explorer"],
      },
      skillLevel: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      preferredGameMode: [
        {
          type: String,
          enum: ["story", "online", "heists", "races", "freeroam"],
        },
      ],
      currentGame: {
        type: String,
        enum: ["GTA5", "GTA6", "GTAOnline", "Offline"],
      },
      onlineStatus: {
        type: String,
        enum: ["online", "away", "busy", "offline"],
        default: "offline",
      },
      lastSeen: { type: Date, default: Date.now },
    },

    // Social Stats (legacy arrays for backward compatibility)
    socialStats: {
      followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      totalPosts: { type: Number, default: 0 },
      totalLikes: { type: Number, default: 0 },
      totalComments: { type: Number, default: 0 },
      reputation: { type: Number, default: 0, index: true },
      activeReputation: { type: Number, default: 0 },
      legacyReputation: { type: Number, default: 0 },
      
      // Reputation breakdown by source
      postsReputation: { type: Number, default: 0 },      // From post likes
      repostsReputation: { type: Number, default: 0 },     // From reposts
      commentsReputation: { type: Number, default: 0 },   // From comment likes
      bookmarksReputation: { type: Number, default: 0 },  // From bookmarks
      followersReputation: { type: Number, default: 0 },  // From followers
      
      level: { type: Number, default: 1 },
      experience: { type: Number, default: 0 },
      
      // Downvote limits tracking (upvotes unlimited)
      downvotesToday: { type: Number, default: 0 },
      downvotesResetAt: { type: Date, default: Date.now },
    },

    // Category & Option Selection (for tier labels)
    // Users select category + option after reaching Tier 1 (reputation 10+)
    selectedCategory: {
      type: String,
      enum: ["gangster", "killer", "money_maker", "wack_job", "reputable"],
      default: "gangster",
    },
    selectedOption: {
      type: String,
      enum: ["option1", "option2"],
      default: "option1",
    },

    // Bot detection tracking
    suspicionFlags: [
      {
        type: String,
        timestamp: Date,
        severity: Number, // 0.5, 1.0, 2.0, etc
        resolved: Boolean,
      },
    ],

    // Suspension/ban history
    moderationHistory: [
      {
        type: String, // 'warning', 'suspension', 'ban'
        duration: Number, // milliseconds (for suspensions)
        reason: String,
        timestamp: Date,
        resolvedAt: Date,
      },
    ],

    // Complete history for recalculation
    reputationHistory: [
      {
        timestamp: { type: Date, default: Date.now, index: true },
        change: { type: Number, required: true },
        source: {
          type: String,
          enum: [
            "like",
            "unlike",
            "downvote",
            "comment",
            "comment_like",
            "comment_unlike",
            "repost",
            "repost_curation",
            "bookmark",
            "unbookmark",
            "post",
            "follower",
            "unfollow",
            "penalty",
            "like_given",
            "bookmark_given",
            "unbookmark_given",
            "follow_given",
            "unfollow_given",
          ],
          required: true,
        },
        sourceId: { type: mongoose.Schema.Types.ObjectId },
        sourceUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        
        // Simplified calculation tracking
        calculation: {
          baseValue: Number,
          weight: Number,
          earlyVoteBonus: Number,
          ageMultiplier: Number,
          engagementMultiplier: Number,
          timeDecay: Number,
          softCapped: Boolean,
          finalValue: Number,
        },
      },
    ],

    // Denormalized stats for performance (using Follow collection)
    stats: {
      followersCount: {
        type: Number,
        default: 0,
        index: true,
        description: "Denormalized count from Follow collection",
      },
      followingCount: {
        type: Number,
        default: 0,
        index: true,
        description: "Denormalized count from Follow collection",
      },
      postsCount: {
        type: Number,
        default: 0,
      },
      lastActive: {
        type: Date,
        default: Date.now,
        index: true,
      },
    },

    // Achievements & Badges
    achievements: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
        icon: { type: String },
        unlockedAt: { type: Date, default: Date.now },
        rarity: {
          type: String,
          enum: ["common", "rare", "epic", "legendary"],
          default: "common",
        },
      },
    ],

    // Privacy & Preferences
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        likes: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        follows: { type: Boolean, default: true },
        gameInvites: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
      },
      privacy: {
        accountType: {
          type: String,
          enum: ["public", "private"],
          default: "public",
          description: "Public: anyone can follow, Private: requires approval",
        },
        showOnlineStatus: { type: Boolean, default: true },
        showGameActivity: { type: Boolean, default: true },
        allowDirectMessages: { type: Boolean, default: true },
        showFollowers: { type: Boolean, default: true },
        showFollowing: { type: Boolean, default: true },
        profileVisibility: {
          type: String,
          enum: ["public", "followers", "private"],
          default: "public",
        },
      },
      theme: {
        mode: {
          type: String,
          enum: ["light", "dark", "auto"],
          default: "auto",
        },
        accentColor: { type: String, default: "#FF6B35" },
      },
    },

    // Legacy fields for backward compatibility
    phoneNumber: { type: String },
    address: { type: String },
    gender: { type: String },
    registeredAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual fields
UserSchema.virtual("followerCount").get(function () {
  return this.socialStats?.followers?.length || 0;
});

UserSchema.virtual("followingCount").get(function () {
  return this.socialStats?.following?.length || 0;
});

// Helper function to normalize profile picture path
UserSchema.methods.getProfilePictureUrl = function () {
  if (!this.profile?.profilePicture) {
    return "/src/assets/images/user.png";
  }

  // If it's already a web path, return as is
  if (this.profile.profilePicture.startsWith("/")) {
    return this.profile.profilePicture;
  }

  // If it's a local file path, convert to web path
  if (
    this.profile.profilePicture.includes("\\") ||
    this.profile.profilePicture.includes("/")
  ) {
    const fileName = this.profile.profilePicture.split(/[\\\/]/).pop();
    return `/uploads/${fileName}`;
  }

  return this.profile.profilePicture;
};

UserSchema.virtual("fullProfile").get(function () {
  return {
    id: this._id,
    username: this.username,
    profile: {
      displayName: this.profile?.displayName || this.username,
      bio: this.profile?.bio || "",
      location: this.profile?.location || "",
      website: this.profile?.website || "",
      birthDate: this.profile?.birthDate || null,
      profilePicture: this.getProfilePictureUrl(),
      headerImage: this.profile?.headerImage || "/default-header.jpg",
      verified: this.profile?.verified || false,
      joinDate: this.profile?.joinDate || this.registeredAt || new Date(),
    },
    gamingProfile: this.gamingProfile || {
      playStyle: "casual",
      skillLevel: "beginner",
      preferredGameMode: [],
      currentGame: "Offline",
      onlineStatus: "offline",
      lastSeen: new Date(),
    },
    // Modern denormalized stats (from Follow collection)
    stats: {
      followersCount: this.stats?.followersCount || 0,
      followingCount: this.stats?.followingCount || 0,
      postsCount: this.stats?.postsCount || 0,
      lastActive: this.stats?.lastActive || new Date(),
    },
    // Legacy social stats (for backward compatibility)
    socialStats: {
      followers: this.socialStats?.followers || [],
      following: this.socialStats?.following || [],
      totalPosts: this.socialStats?.totalPosts || 0,
      totalLikes: this.socialStats?.totalLikes || 0,
      totalComments: this.socialStats?.totalComments || 0,
      reputation: this.socialStats?.reputation || 0,
      level: this.socialStats?.level || 1,
      experience: this.socialStats?.experience || 0,
      followerCount: this.followerCount || 0,
      followingCount: this.followingCount || 0,
    },
    achievements: this.achievements || [],
    preferences: this.preferences || {
      notifications: {
        email: true,
        push: true,
        likes: true,
        comments: true,
        follows: true,
        gameInvites: true,
        mentions: true,
      },
      privacy: {
        accountType: "public",
        showOnlineStatus: true,
        showGameActivity: true,
        allowDirectMessages: true,
        showFollowers: true,
        showFollowing: true,
        profileVisibility: "public",
      },
      theme: {
        mode: "auto",
        accentColor: "#FF6B35",
      },
    },
  };
});

// Indexes for better performance
// Note: username and email indexes are automatically created due to unique: true in schema
UserSchema.index({ "profile.displayName": "text", "profile.bio": "text" });
UserSchema.index({ "gamingProfile.currentGame": 1 });
UserSchema.index({ "gamingProfile.onlineStatus": 1 });
UserSchema.index({ "stats.followersCount": -1 }); // Sort users by popularity
UserSchema.index({ "stats.lastActive": -1 }); // Sort by activity

// Search optimization indexes (Instagram-like search system)
UserSchema.index({ username: 'text', 'profile.displayName': 'text' }, {
  weights: {
    username: 10,  // Username matches weighted higher
    'profile.displayName': 5
  },
  name: 'user_search_text_index'
});
UserSchema.index({ 'profile.verified': 1, username: 1 }, { name: 'verified_username_index' });
UserSchema.index({ 'socialStats.reputation': -1 }, { name: 'reputation_index' });

// Virtual for getting followers from Follow collection
UserSchema.virtual("followers", {
  ref: "Follow",
  localField: "_id",
  foreignField: "following",
  match: { status: "active" },
  options: { sort: { createdAt: -1 } },
});

// Virtual for getting following from Follow collection
UserSchema.virtual("following", {
  ref: "Follow",
  localField: "_id",
  foreignField: "follower",
  match: { status: "active" },
  options: { sort: { createdAt: -1 } },
});

const User = mongoose.model("User", UserSchema);
export default User;
