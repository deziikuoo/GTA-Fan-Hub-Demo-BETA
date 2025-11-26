// test-follow-system.js
// Quick test script for follow system
// Usage: node test-follow-system.js

import axios from "axios";

const API_URL = "http://localhost:3003/api";
let token = null;
let userId = null;

// Test credentials - These match the seed script defaults
const TEST_USER_1 = {
  username: "testuser1",
  password: "test123",
};

const TEST_USER_2 = {
  username: "testuser2",
  password: "test123",
};

async function login(credentials) {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    console.log("✓ Login successful:", response.data.user.username);
    return {
      token: response.data.accessToken,
      userId: response.data.user.id,
    };
  } catch (error) {
    console.error("✗ Login failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function followUser(token, targetUserId) {
  try {
    const response = await axios.post(
      `${API_URL}/users/${targetUserId}/follow`,
      { source: "test" },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("✓ Follow successful:", response.data.message);
    return response.data;
  } catch (error) {
    console.error("✗ Follow failed:", error.response?.data || error.message);
    throw error;
  }
}

async function unfollowUser(token, targetUserId) {
  try {
    const response = await axios.delete(
      `${API_URL}/users/${targetUserId}/follow`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("✓ Unfollow successful");
    return response.data;
  } catch (error) {
    console.error("✗ Unfollow failed:", error.response?.data || error.message);
    throw error;
  }
}

async function checkFollowStatus(token, targetUserId) {
  try {
    const response = await axios.get(
      `${API_URL}/users/${targetUserId}/follow-status`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("✓ Follow status:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "✗ Status check failed:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function getFollowers(userId) {
  try {
    const response = await axios.get(
      `${API_URL}/users/${userId}/followers?page=1&limit=20`
    );
    console.log(`✓ Followers: ${response.data.totalCount} total`);
    return response.data;
  } catch (error) {
    console.error(
      "✗ Get followers failed:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function runTests() {
  console.log("\n" + "=".repeat(60));
  console.log("FOLLOW SYSTEM TEST SUITE");
  console.log("=".repeat(60) + "\n");

  try {
    // Test 1: Login as User 1
    console.log("Test 1: Login as User 1");
    const user1 = await login(TEST_USER_1);
    console.log("");

    // Test 2: Login as User 2 (to get their ID)
    console.log("Test 2: Login as User 2");
    const user2 = await login(TEST_USER_2);
    console.log("");

    // Test 3: User 1 follows User 2
    console.log("Test 3: User 1 follows User 2");
    await followUser(user1.token, user2.userId);
    console.log("");

    // Test 4: Check follow status
    console.log("Test 4: Check follow status");
    const status = await checkFollowStatus(user1.token, user2.userId);
    if (status.isFollowing) {
      console.log("✓ Correctly shows as following");
    } else {
      console.log("✗ ERROR: Should be following");
    }
    console.log("");

    // Test 5: Get User 2's followers
    console.log("Test 5: Get User 2's followers");
    const followers = await getFollowers(user2.userId);
    if (followers.totalCount > 0) {
      console.log("✓ User 2 has followers");
    } else {
      console.log("✗ ERROR: User 2 should have followers");
    }
    console.log("");

    // Test 6: User 1 unfollows User 2
    console.log("Test 6: User 1 unfollows User 2");
    await unfollowUser(user1.token, user2.userId);
    console.log("");

    // Test 7: Verify unfollow
    console.log("Test 7: Verify unfollow");
    const statusAfter = await checkFollowStatus(user1.token, user2.userId);
    if (!statusAfter.isFollowing) {
      console.log("✓ Correctly shows as not following");
    } else {
      console.log("✗ ERROR: Should not be following");
    }
    console.log("");

    // Test 8: Try to follow yourself (should fail)
    console.log("Test 8: Try to follow yourself (should fail)");
    try {
      await followUser(user1.token, user1.userId);
      console.log("✗ ERROR: Should not be able to follow yourself");
    } catch (error) {
      console.log("✓ Correctly prevented self-follow");
    }
    console.log("");

    console.log("=".repeat(60));
    console.log("ALL TESTS COMPLETED!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n✗ Test suite failed:", error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
