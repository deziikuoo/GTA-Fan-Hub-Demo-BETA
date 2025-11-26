// server/seed/setupTestData.js
// All-in-one script to set up complete test data
// Usage: node server/seed/setupTestData.js [number_of_users] [password]
// Example: node server/seed/setupTestData.js 20 test123

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const numberOfUsers = args[0] || "10";
const password = args[1] || "test123";

console.log("\n" + "=".repeat(60));
console.log("COMPLETE TEST DATA SETUP");
console.log("=".repeat(60));
console.log("");
console.log("This script will:");
console.log("  1. Create test users (testuser1, testuser2, etc.)");
console.log("  2. Create random follow relationships");
console.log("  3. Update all counts");
console.log("");
console.log(`Number of users: ${numberOfUsers}`);
console.log(`Password: ${password}`);
console.log("");
console.log("=".repeat(60));
console.log("");

try {
  // Step 1: Create test users
  console.log("Step 1: Creating test users...");
  console.log("");
  execSync(
    `node "${path.join(
      __dirname,
      "createTestUsers.js"
    )}" ${numberOfUsers} ${password}`,
    { stdio: "inherit" }
  );

  console.log("");
  console.log("Waiting 2 seconds...");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log("");

  // Step 2: Seed follow data
  console.log("Step 2: Creating follow relationships...");
  console.log("");
  execSync(`node "${path.join(__dirname, "seedFollowData.js")}"`, {
    stdio: "inherit",
  });

  console.log("");
  console.log("=".repeat(60));
  console.log("✓ SETUP COMPLETE!");
  console.log("=".repeat(60));
  console.log("");
  console.log("Your test environment is ready!");
  console.log("");
  console.log("Login credentials:");
  console.log(`  Username: testuser1, testuser2, testuser3, etc.`);
  console.log(`  Password: ${password}`);
  console.log("");
  console.log("What to test:");
  console.log("  1. Login as any test user");
  console.log("  2. Visit other test users' profiles");
  console.log("  3. Click Follow/Unfollow buttons");
  console.log("  4. View Followers/Following tabs");
  console.log("  5. Check mutual followers");
  console.log("");
  console.log("Run automated tests:");
  console.log("  node test-follow-system.js");
  console.log("");
  console.log("=".repeat(60));
} catch (error) {
  console.error("");
  console.error("✗ Setup failed:", error.message);
  console.error("");
  process.exit(1);
}
