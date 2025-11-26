// server/seed/seedFollowData.js
// Script to create random follow relationships between test users
// Usage: node server/seed/seedFollowData.js
// Run AFTER creating test users with createTestUsers.js

import mongoose from "mongoose";
import "dotenv/config";
import User from "../models/User.js";
import Follow from "../models/Follow.js";

console.log("=".repeat(60));
console.log("SEED FOLLOW DATA SCRIPT");
console.log("=".repeat(60));
console.log("");

/**
 * Generate random number between min and max
 */
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle array randomly
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Connect to database
 */
async function connectDatabase() {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING, {
      retryWrites: true,
      retryReads: true,
    });
    console.log("✓ Connected to MongoDB");
    console.log(`  Database: ${mongoose.connection.name}`);
    console.log("");
  } catch (error) {
    console.error("✗ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

/**
 * Create follow relationships
 */
async function seedFollowData() {
  // Get all test users
  const testUsers = await User.find({
    username: /^testuser\d+$/,
  }).select("_id username");

  if (testUsers.length < 2) {
    console.log("⚠ Need at least 2 test users to create follows");
    console.log("  Run: node server/seed/createTestUsers.js 10");
    return;
  }

  console.log(`Found ${testUsers.length} test users`);
  console.log("");

  const stats = {
    created: 0,
    skipped: 0,
    errors: 0,
  };

  // For each user, make them follow 30-70% of other users randomly
  for (const user of testUsers) {
    const otherUsers = testUsers.filter(
      (u) => u._id.toString() !== user._id.toString()
    );
    const shuffled = shuffleArray(otherUsers);

    // Each user follows 30-70% of other users
    const followCount = Math.floor(
      otherUsers.length * (randomNumber(30, 70) / 100)
    );
    const usersToFollow = shuffled.slice(0, followCount);

    console.log(
      `${user.username} will follow ${usersToFollow.length} users...`
    );

    for (const targetUser of usersToFollow) {
      try {
        // Check if already following
        const exists = await Follow.findOne({
          follower: user._id,
          following: targetUser._id,
        });

        if (exists) {
          stats.skipped++;
          continue;
        }

        // Create follow relationship
        await Follow.create({
          follower: user._id,
          following: targetUser._id,
          status: "active",
          source: "seed",
          createdAt: new Date(
            Date.now() - randomNumber(1, 90) * 24 * 60 * 60 * 1000
          ), // Random date within last 90 days
        });

        stats.created++;
      } catch (error) {
        console.error(`  ✗ Error creating follow:`, error.message);
        stats.errors++;
      }
    }
  }

  console.log("");
  console.log("Updating user counts...");

  // Update denormalized counts for all users
  for (const user of testUsers) {
    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: user._id, status: "active" }),
      Follow.countDocuments({ follower: user._id, status: "active" }),
    ]);

    await User.findByIdAndUpdate(user._id, {
      $set: {
        "stats.followersCount": followersCount,
        "stats.followingCount": followingCount,
        "stats.lastActive": new Date(),
      },
    });

    console.log(
      `  ${user.username}: ${followersCount} followers, ${followingCount} following`
    );
  }

  // Update mutual follow dates
  console.log("");
  console.log("Detecting mutual follows...");

  let mutualCount = 0;
  const allFollows = await Follow.find({ status: "active" });

  for (const follow of allFollows) {
    const mutualFollow = await Follow.findOne({
      follower: follow.following,
      following: follow.follower,
      status: "active",
    });

    if (mutualFollow && !follow.mutualFollowDate) {
      const laterDate =
        follow.createdAt > mutualFollow.createdAt
          ? follow.createdAt
          : mutualFollow.createdAt;

      follow.mutualFollowDate = laterDate;
      mutualFollow.mutualFollowDate = laterDate;

      await Promise.all([follow.save(), mutualFollow.save()]);
      mutualCount++;
    }
  }

  console.log(`  Found ${mutualCount} mutual follow pairs`);
  console.log("");
  console.log("=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Follow relationships created: ${stats.created}`);
  console.log(`Follow relationships skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Mutual follows detected: ${mutualCount}`);
  console.log("=".repeat(60));
  console.log("");
  console.log("✓ Follow data seeded successfully!");
}

/**
 * Main execution
 */
async function main() {
  await connectDatabase();
  await seedFollowData();

  await mongoose.connection.close();
  console.log("✓ Database connection closed");
  process.exit(0);
}

// Run script
main().catch((error) => {
  console.error("");
  console.error("✗ Script failed:", error);
  console.error("");
  mongoose.connection.close();
  process.exit(1);
});
