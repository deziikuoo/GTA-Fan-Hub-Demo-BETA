// debug-follow-system.js
// Comprehensive debugging script for follow system
// Usage: node debug-follow-system.js

import axios from "axios";

// Configure axios to handle cookies
axios.defaults.withCredentials = true;

const API_URL = "http://localhost:3003/api";

// Test credentials
const TEST_USER_1 = {
  username: "testuser1",
  password: "test123",
};

const TEST_USER_2 = {
  username: "testuser2",
  password: "test123",
};

async function login(credentials) {
  console.log(`\n[Debug] Logging in as ${credentials.username}...`);
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    console.log("✓ Login successful");
    console.log("  User ID:", response.data.user.id);
    console.log("  Username:", response.data.user.username);
    console.log("  Token:", response.data.accessToken.substring(0, 20) + "...");
    return {
      token: response.data.accessToken,
      userId: response.data.user.id,
      username: response.data.user.username,
    };
  } catch (error) {
    console.error("✗ Login failed");
    console.error("  Status:", error.response?.status);
    console.error("  Data:", error.response?.data);
    console.error("  Message:", error.message);
    console.error("  Full error:", error);
    process.exit(1);
  }
}

async function checkSocketHealth() {
  console.log("\n[Debug] Checking Socket.io health...");
  try {
    const response = await axios.get(`${API_URL}/debug/socket`);
    console.log("✓ Socket.io status:");
    console.log("  Total connections:", response.data.totalConnections);
    console.log("  Connected users:", response.data.connectedUsers);
    console.log("  Socket IDs:", response.data.socketIds);
    console.log("  Rooms:", response.data.rooms);
    console.log("  User->Socket map:", response.data.connectedUsersMap);
    return response.data;
  } catch (error) {
    console.error("✗ Socket health check failed:", error.message);
  }
}

async function followUser(token, targetUserId, targetUsername) {
  console.log(
    `\n[Debug] Following user ${targetUsername} (${targetUserId})...`
  );
  try {
    const response = await axios.post(
      `${API_URL}/users/${targetUserId}/follow`,
      { source: "test" },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("✓ Follow successful");
    console.log("  Status:", response.data.status);
    console.log("  Is mutual:", response.data.isMutual);
    console.log("  Follow ID:", response.data.follow.id);
    return response.data;
  } catch (error) {
    console.error("✗ Follow failed:", error.response?.data || error.message);
    throw error;
  }
}

async function checkFollowStatus(token, targetUserId) {
  console.log(`\n[Debug] Checking follow status for ${targetUserId}...`);
  try {
    const response = await axios.get(
      `${API_URL}/users/${targetUserId}/follow-status`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("✓ Follow status retrieved:");
    console.log("  Is following:", response.data.isFollowing);
    console.log("  Is mutual:", response.data.isMutual);
    return response.data;
  } catch (error) {
    console.error(
      "✗ Status check failed:",
      error.response?.data || error.message
    );
  }
}

async function getProfile(username) {
  console.log(`\n[Debug] Getting profile for ${username}...`);
  try {
    const response = await axios.get(`${API_URL}/profile/${username}`);
    const user = response.data.user;
    console.log("✓ Profile retrieved:");
    console.log("  User ID:", user.id);
    console.log("  Username:", user.username);
    console.log("  Followers count (stats):", user.stats?.followersCount);
    console.log("  Following count (stats):", user.stats?.followingCount);
    console.log(
      "  Followers count (socialStats):",
      user.socialStats?.followerCount
    );
    console.log(
      "  Following count (socialStats):",
      user.socialStats?.followingCount
    );
    return user;
  } catch (error) {
    console.error("✗ Get profile failed:", error.message);
  }
}

async function runDebugTests() {
  console.log("\n" + "=".repeat(70));
  console.log("FOLLOW SYSTEM DEBUG SUITE");
  console.log("=".repeat(70));

  try {
    // Login both users
    console.log("\n>>> STEP 1: Login both test users");
    const user1 = await login(TEST_USER_1);
    const user2 = await login(TEST_USER_2);

    // Check initial socket status
    console.log(
      "\n>>> STEP 2: Check Socket.io status (should be 0 - no browser connections)"
    );
    await checkSocketHealth();

    // Get initial profiles
    console.log("\n>>> STEP 3: Get initial profiles");
    await getProfile(TEST_USER_1.username);
    await getProfile(TEST_USER_2.username);

    // Check initial follow status
    console.log("\n>>> STEP 4: Check if User 1 follows User 2");
    const initialStatus = await checkFollowStatus(user1.token, user2.userId);

    // Perform follow action
    if (!initialStatus?.isFollowing) {
      console.log("\n>>> STEP 5: User 1 follows User 2");
      await followUser(user1.token, user2.userId, user2.username);

      // Wait a moment for async operations
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check status after follow
      console.log("\n>>> STEP 6: Verify follow status after action");
      await checkFollowStatus(user1.token, user2.userId);

      // Get updated profiles
      console.log("\n>>> STEP 7: Get updated profiles (check counts)");
      const user1Profile = await getProfile(TEST_USER_1.username);
      const user2Profile = await getProfile(TEST_USER_2.username);

      console.log("\n>>> ANALYSIS:");
      console.log("  User 1 following count should have increased:");
      console.log(
        "    stats.followingCount:",
        user1Profile.stats?.followingCount
      );
      console.log("  User 2 follower count should have increased:");
      console.log(
        "    stats.followersCount:",
        user2Profile.stats?.followersCount
      );
    } else {
      console.log("\n>>> User 1 already follows User 2");
      console.log(">>> Skipping follow action test");
    }

    console.log("\n" + "=".repeat(70));
    console.log("DEBUG SUITE COMPLETED");
    console.log("=".repeat(70));
    console.log(
      "\nNOTE: Socket.io real-time events can only be tested in browser"
    );
    console.log(
      "      Open 2 browser windows and follow the manual test steps."
    );
    console.log("=".repeat(70));
  } catch (error) {
    console.error("\n✗ Debug suite failed:", error.message);
    process.exit(1);
  }
}

// Run tests
runDebugTests();
