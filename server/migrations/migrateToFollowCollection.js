// server/migrations/migrateToFollowCollection.js

/**
 * Migration script to convert array-based follows to Follow collection
 *
 * This script:
 * 1. Reads followers/following arrays from User documents
 * 2. Creates Follow documents for each relationship
 * 3. Calculates and sets denormalized counts in stats field
 * 4. Verifies data integrity
 * 5. Optionally archives old arrays
 *
 * Usage:
 *   node server/migrations/migrateToFollowCollection.js
 *
 * Flags:
 *   --dry-run: Show what would be migrated without making changes
 *   --archive: Archive old arrays after migration (recommended)
 *   --verify-only: Only verify existing data, don't migrate
 */

import mongoose from "mongoose";
import "dotenv/config";
import Follow from "../models/Follow.js";
import User from "../models/User.js";

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const shouldArchive = args.includes("--archive");
const verifyOnly = args.includes("--verify-only");

console.log("=".repeat(60));
console.log("Follow System Migration Script");
console.log("=".repeat(60));
console.log(
  `Mode: ${
    isDryRun ? "DRY RUN" : verifyOnly ? "VERIFY ONLY" : "LIVE MIGRATION"
  }`
);
console.log(`Archive old arrays: ${shouldArchive}`);
console.log("=".repeat(60));
console.log("");

// Statistics
const stats = {
  usersProcessed: 0,
  followsCreated: 0,
  followsAlreadyExist: 0,
  errors: 0,
  countsUpdated: 0,
  usersWithMismatches: 0,
};

/**
 * Connect to MongoDB
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
 * Verify data integrity
 */
async function verifyIntegrity() {
  console.log("Verifying data integrity...");
  console.log("");

  const users = await User.find({}).select("_id username socialStats stats");

  for (const user of users) {
    const userId = user._id;

    // Count actual Follow documents
    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: userId, status: "active" }),
      Follow.countDocuments({ follower: userId, status: "active" }),
    ]);

    // Check against denormalized counts
    const statsFollowersCount = user.stats?.followersCount || 0;
    const statsFollowingCount = user.stats?.followingCount || 0;

    if (
      followersCount !== statsFollowersCount ||
      followingCount !== statsFollowingCount
    ) {
      console.log(`⚠ Mismatch for user ${user.username}:`);
      console.log(
        `  Followers: ${followersCount} (actual) vs ${statsFollowersCount} (stats)`
      );
      console.log(
        `  Following: ${followingCount} (actual) vs ${statsFollowingCount} (stats)`
      );
      stats.usersWithMismatches++;
    }
  }

  console.log("");
  if (stats.usersWithMismatches === 0) {
    console.log("✓ All counts match! Data integrity verified.");
  } else {
    console.log(
      `⚠ Found ${stats.usersWithMismatches} users with count mismatches.`
    );
    console.log("  Run migration without --verify-only to fix.");
  }
}

/**
 * Migrate a single user's follow relationships
 */
async function migrateUser(user) {
  const userId = user._id;
  const followers = user.socialStats?.followers || [];
  const following = user.socialStats?.following || [];

  console.log(`Processing user: ${user.username} (${userId})`);
  console.log(
    `  Old followers: ${followers.length}, following: ${following.length}`
  );

  // Create Follow documents for each follower
  for (const followerId of followers) {
    if (!followerId) continue;

    try {
      // Check if already exists
      const exists = await Follow.findOne({
        follower: followerId,
        following: userId,
      });

      if (exists) {
        stats.followsAlreadyExist++;
        continue;
      }

      if (!isDryRun) {
        await Follow.create({
          follower: followerId,
          following: userId,
          status: "active",
          source: "migration",
          createdAt: user.registeredAt || new Date(),
        });
      }

      stats.followsCreated++;
    } catch (error) {
      console.error(`  ✗ Error creating follower relationship:`, error.message);
      stats.errors++;
    }
  }

  // Create Follow documents for each following
  for (const followingId of following) {
    if (!followingId) continue;

    try {
      // Check if already exists
      const exists = await Follow.findOne({
        follower: userId,
        following: followingId,
      });

      if (exists) {
        stats.followsAlreadyExist++;
        continue;
      }

      if (!isDryRun) {
        await Follow.create({
          follower: userId,
          following: followingId,
          status: "active",
          source: "migration",
          createdAt: user.registeredAt || new Date(),
        });
      }

      stats.followsCreated++;
    } catch (error) {
      console.error(
        `  ✗ Error creating following relationship:`,
        error.message
      );
      stats.errors++;
    }
  }

  // Calculate actual counts from Follow collection
  if (!isDryRun) {
    const [actualFollowersCount, actualFollowingCount] = await Promise.all([
      Follow.countDocuments({ following: userId, status: "active" }),
      Follow.countDocuments({ follower: userId, status: "active" }),
    ]);

    // Update denormalized counts
    await User.findByIdAndUpdate(userId, {
      $set: {
        "stats.followersCount": actualFollowersCount,
        "stats.followingCount": actualFollowingCount,
        "stats.lastActive": new Date(),
      },
    });

    stats.countsUpdated++;
    console.log(
      `  ✓ Updated counts: ${actualFollowersCount} followers, ${actualFollowingCount} following`
    );

    // Archive old arrays if requested
    if (shouldArchive) {
      await User.findByIdAndUpdate(userId, {
        $set: {
          "socialStats.followers_archived": followers,
          "socialStats.following_archived": following,
          "socialStats.followers": [],
          "socialStats.following": [],
        },
      });
      console.log(`  ✓ Archived old arrays`);
    }
  }

  stats.usersProcessed++;
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log("Starting migration...");
  console.log("");

  // Get all users with followers or following
  const users = await User.find({
    $or: [
      { "socialStats.followers.0": { $exists: true } },
      { "socialStats.following.0": { $exists: true } },
    ],
  }).select("username socialStats registeredAt");

  console.log(`Found ${users.length} users to process`);
  console.log("");

  for (const user of users) {
    await migrateUser(user);
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("Migration Summary");
  console.log("=".repeat(60));
  console.log(`Users processed: ${stats.usersProcessed}`);
  console.log(`Follow relationships created: ${stats.followsCreated}`);
  console.log(
    `Follow relationships already existed: ${stats.followsAlreadyExist}`
  );
  console.log(`User counts updated: ${stats.countsUpdated}`);
  console.log(`Errors: ${stats.errors}`);
  console.log("=".repeat(60));
  console.log("");

  if (isDryRun) {
    console.log("⚠ This was a DRY RUN. No changes were made.");
    console.log("  Run without --dry-run to apply changes.");
  } else {
    console.log("✓ Migration completed successfully!");
  }
}

/**
 * Main execution
 */
async function main() {
  await connectDatabase();

  if (verifyOnly) {
    await verifyIntegrity();
  } else {
    await runMigration();

    // Run verification after migration
    console.log("");
    await verifyIntegrity();
  }

  await mongoose.connection.close();
  console.log("");
  console.log("✓ Database connection closed");
  process.exit(0);
}

// Run migration
main().catch((error) => {
  console.error("");
  console.error("✗ Migration failed:", error);
  console.error("");
  mongoose.connection.close();
  process.exit(1);
});
