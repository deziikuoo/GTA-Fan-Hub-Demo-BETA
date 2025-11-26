// server/seed/createTestUsers.js
// Script to create test users for development/testing
// Usage: node server/seed/createTestUsers.js [number_of_users]
// Example: node server/seed/createTestUsers.js 10

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";
import User from "../models/User.js";

// Parse command line arguments
const args = process.argv.slice(2);
const numberOfUsers = parseInt(args[0]) || 5; // Default to 5 users
const defaultPassword = args[1] || "test123"; // Default password

console.log("=".repeat(60));
console.log("TEST USER CREATION SCRIPT");
console.log("=".repeat(60));
console.log(`Creating ${numberOfUsers} test users`);
console.log(`Default password: ${defaultPassword}`);
console.log("=".repeat(60));
console.log("");

// Sample profile data
const bioTemplates = [
  "GTA enthusiast and gaming content creator 🎮",
  "Loves exploring Los Santos and causing chaos 🚗",
  "Heist master and racing champion 🏆",
  "GTA Online veteran since day one 💯",
  "Roleplay enthusiast and story mode completionist 🎭",
  "Speedrunner and achievement hunter 🏃",
  "Car collector and customization expert 🚘",
  "Stunt creator and parkour master 🤸",
  "Just here for the memes and mayhem 😎",
  "Professional virtual criminal 🔫",
];

const locations = [
  "Los Santos, San Andreas",
  "Vice City, Florida",
  "Liberty City, New York",
  "San Fierro, California",
  "Las Venturas, Nevada",
  "North Yankton",
  "Cayo Perico",
  "Diamond Casino & Resort",
];

const playStyles = ["casual", "competitive", "roleplay", "explorer"];
const skillLevels = ["beginner", "intermediate", "advanced", "expert"];
const gameModes = ["story", "online", "heists", "races", "freeroam"];

/**
 * Generate random element from array
 */
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate random number between min and max
 */
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Create a single test user
 */
async function createTestUser(index) {
  const username = `testuser${index}`;
  const email = `testuser${index}@gtafanhub.test`;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    console.log(`⚠ User ${username} already exists, skipping...`);
    return null;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(defaultPassword, salt);

  // Generate random profile data
  const userData = {
    username,
    email,
    password: hashedPassword,

    profile: {
      displayName: `Test User ${index}`,
      bio: randomElement(bioTemplates),
      location: randomElement(locations),
      profilePicture: "/src/assets/images/user.png",
      headerImage: "/default-header.jpg",
      verified: Math.random() > 0.8, // 20% chance of being verified
      joinDate: new Date(
        Date.now() - randomNumber(1, 365) * 24 * 60 * 60 * 1000
      ), // Random join date within last year
    },

    gamingProfile: {
      playStyle: randomElement(playStyles),
      skillLevel: randomElement(skillLevels),
      preferredGameMode: [randomElement(gameModes), randomElement(gameModes)],
      currentGame: randomElement(["GTA5", "GTA6", "GTAOnline", "Offline"]),
      onlineStatus: randomElement(["online", "away", "busy", "offline"]),
      lastSeen: new Date(),
    },

    socialStats: {
      followers: [],
      following: [],
      totalPosts: randomNumber(0, 100),
      totalLikes: randomNumber(0, 500),
      totalComments: randomNumber(0, 200),
      reputation: randomNumber(0, 1000),
      level: randomNumber(1, 50),
      experience: randomNumber(0, 10000),
    },

    stats: {
      followersCount: 0,
      followingCount: 0,
      postsCount: randomNumber(0, 100),
      lastActive: new Date(),
    },

    achievements: [],

    preferences: {
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

    registeredAt: new Date(
      Date.now() - randomNumber(1, 365) * 24 * 60 * 60 * 1000
    ),
  };

  const user = await User.create(userData);
  console.log(`✓ Created user: ${username} (${email})`);
  return user;
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
 * Main execution
 */
async function main() {
  await connectDatabase();

  console.log("Creating test users...");
  console.log("");

  const results = {
    created: 0,
    skipped: 0,
    errors: 0,
  };

  for (let i = 1; i <= numberOfUsers; i++) {
    try {
      const user = await createTestUser(i);
      if (user) {
        results.created++;
      } else {
        results.skipped++;
      }
    } catch (error) {
      console.error(`✗ Error creating testuser${i}:`, error.message);
      results.errors++;
    }
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Users created: ${results.created}`);
  console.log(`Users skipped (already exist): ${results.skipped}`);
  console.log(`Errors: ${results.errors}`);
  console.log("=".repeat(60));
  console.log("");

  if (results.created > 0) {
    console.log("✓ Test users created successfully!");
    console.log("");
    console.log("You can now login with:");
    console.log("  Username: testuser1, testuser2, testuser3, etc.");
    console.log(`  Password: ${defaultPassword}`);
    console.log("");
    console.log("Example:");
    console.log("  Username: testuser1");
    console.log(`  Password: ${defaultPassword}`);
  }

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
