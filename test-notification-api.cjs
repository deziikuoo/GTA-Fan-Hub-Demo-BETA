// test-notification-api.js
// Automated API test script for notification system
// Run with: node test-notification-api.js

const axios = require("axios");

// Configuration
const BASE_URL = process.env.BASE_URL || "http://localhost:3003";
const API_URL = `${BASE_URL}/api`;

// Test users (using existing users in database)
const TEST_USERS = {
  user1: {
    username: "testuser1",
    password: "test123",
  },
  user2: {
    username: "testuser2",
    password: "test123",
  },
};

// Store authentication tokens
const tokens = {};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log("\n" + "─".repeat(60));
  log(`🧪 TEST: ${name}`, "cyan");
  console.log("─".repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

function logWarning(message) {
  log(`⚠️  ${message}`, "yellow");
}

// Test 1: Login users
async function testLogin() {
  logTest("User Authentication");

  for (const [key, user] of Object.entries(TEST_USERS)) {
    try {
      const response = await axios.post(
        `${API_URL}/login`,
        {
          username: user.username,
          password: user.password,
        },
        {
          withCredentials: true,
        }
      );

      tokens[key] =
        response.data.accessToken || extractTokenFromCookies(response);

      if (tokens[key]) {
        logSuccess(`Logged in as ${user.username}`);
        logInfo(`User ID: ${response.data.user.id}`);
        // Store user ID for later use
        TEST_USERS[key].userId = response.data.user.id;
      } else {
        logError(`No token received for ${user.username}`);
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.message ||
        error.message;
      logError(`Login failed for ${user.username}: ${errorMsg}`);
      if (error.response?.data) {
        console.log(
          "Server response:",
          JSON.stringify(error.response.data, null, 2)
        );
      }
      throw error;
    }
  }
}

// Extract token from cookies if not in response body
function extractTokenFromCookies(response) {
  const cookies = response.headers["set-cookie"];
  if (cookies) {
    const accessTokenCookie = cookies.find((c) => c.startsWith("accessToken="));
    if (accessTokenCookie) {
      return accessTokenCookie.split(";")[0].split("=")[1];
    }
  }
  return null;
}

// Test 2: Get notifications (should be empty initially)
async function testGetNotifications() {
  logTest("Fetch Notifications");

  try {
    const response = await axios.get(`${API_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${tokens.user1}`,
      },
      withCredentials: true,
    });

    logSuccess(`Fetched notifications successfully`);
    logInfo(`Total notifications: ${response.data.notifications.length}`);
    logInfo(
      `Pagination: Page ${response.data.pagination.currentPage} of ${response.data.pagination.totalPages}`
    );

    return response.data.notifications;
  } catch (error) {
    logError(
      `Failed to fetch notifications: ${
        error.response?.data?.error || error.message
      }`
    );
    throw error;
  }
}

// Test 3: Get unread count
async function testGetUnreadCount() {
  logTest("Get Unread Count");

  try {
    const response = await axios.get(`${API_URL}/notifications/unread-count`, {
      headers: {
        Authorization: `Bearer ${tokens.user1}`,
      },
      withCredentials: true,
    });

    logSuccess(`Unread count retrieved successfully`);
    logInfo(`Unread notifications: ${response.data.count}`);

    return response.data.count;
  } catch (error) {
    logError(
      `Failed to get unread count: ${
        error.response?.data?.error || error.message
      }`
    );
    throw error;
  }
}

// Test 4: Create a post (to generate notifications later)
async function testCreatePost() {
  logTest("Create Test Post");

  try {
    const response = await axios.post(
      `${API_URL}/posts`,
      {
        text: "This is a test post for notification testing! #GTA6",
      },
      {
        headers: {
          Authorization: `Bearer ${tokens.user1}`,
        },
        withCredentials: true,
      }
    );

    logSuccess(`Post created successfully`);
    logInfo(`Post ID: ${response.data.post._id}`);

    return response.data.post;
  } catch (error) {
    logError(
      `Failed to create post: ${error.response?.data?.error || error.message}`
    );
    throw error;
  }
}

// Test 5: Like the post (should generate notification)
async function testLikePost(postId) {
  logTest("Like Post (Generate Notification)");

  try {
    const response = await axios.post(
      `${API_URL}/posts/${postId}/like`,
      { postId },
      {
        headers: {
          Authorization: `Bearer ${tokens.user2}`,
        },
        withCredentials: true,
      }
    );

    logSuccess(`Post liked successfully by user2`);
    logInfo(`This should generate a notification for user1`);

    // Wait a bit for notification to be created
    await sleep(1000);

    return response.data;
  } catch (error) {
    logError(
      `Failed to like post: ${error.response?.data?.error || error.message}`
    );
    // Don't throw - this might fail if route doesn't exist yet
  }
}

// Test 6: Comment on post (should generate notification)
async function testCommentOnPost(postId) {
  logTest("Comment on Post (Generate Notification)");

  try {
    const response = await axios.post(
      `${API_URL}/posts/${postId}/comments`,
      {
        text: "Great post! I agree with you!",
      },
      {
        headers: {
          Authorization: `Bearer ${tokens.user2}`,
        },
        withCredentials: true,
      }
    );

    logSuccess(`Comment posted successfully by user2`);
    logInfo(`This should generate a notification for user1`);

    // Wait a bit for notification to be created
    await sleep(1000);

    return response.data;
  } catch (error) {
    logError(
      `Failed to comment on post: ${
        error.response?.data?.error || error.message
      }`
    );
    // Don't throw - this might fail if route doesn't exist yet
  }
}

// Test 7: Follow user (should generate notification)
async function testFollowUser() {
  logTest("Follow User (Generate Notification)");

  try {
    const response = await axios.post(
      `${API_URL}/users/${TEST_USERS.user1.userId}/follow`,
      {},
      {
        headers: {
          Authorization: `Bearer ${tokens.user2}`,
        },
        withCredentials: true,
      }
    );

    logSuccess(`User2 followed user1 successfully`);
    logInfo(`This should generate a notification for user1`);

    // Wait a bit for notification to be created
    await sleep(1000);

    return response.data;
  } catch (error) {
    logError(
      `Failed to follow user: ${error.response?.data?.error || error.message}`
    );
    // Don't throw - this might fail if route doesn't exist yet
  }
}

// Test 8: Check notifications after actions
async function testCheckNotificationsAfterActions() {
  logTest("Check Notifications After Actions");

  try {
    const response = await axios.get(`${API_URL}/notifications`, {
      headers: {
        Authorization: `Bearer ${tokens.user1}`,
      },
      withCredentials: true,
    });

    const notifications = response.data.notifications;
    logSuccess(`Fetched notifications successfully`);
    logInfo(`Total notifications: ${notifications.length}`);

    if (notifications.length > 0) {
      logInfo("Recent notifications:");
      notifications.slice(0, 5).forEach((notif, idx) => {
        console.log(
          `  ${idx + 1}. [${notif.read ? "Read" : "Unread"}] ${
            notif.actor?.username
          } ${notif.type}`
        );
      });
    } else {
      logWarning(
        "No notifications found. Make sure notification creation is working."
      );
    }

    return notifications;
  } catch (error) {
    logError(
      `Failed to fetch notifications: ${
        error.response?.data?.error || error.message
      }`
    );
    throw error;
  }
}

// Test 9: Mark notification as read
async function testMarkAsRead(notificationId) {
  logTest("Mark Notification as Read");

  try {
    const response = await axios.patch(
      `${API_URL}/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${tokens.user1}`,
        },
        withCredentials: true,
      }
    );

    logSuccess(`Notification marked as read`);
    logInfo(`New unread count: ${response.data.unreadCount}`);

    return response.data;
  } catch (error) {
    logError(
      `Failed to mark as read: ${error.response?.data?.error || error.message}`
    );
    throw error;
  }
}

// Test 10: Mark all as read
async function testMarkAllAsRead() {
  logTest("Mark All Notifications as Read");

  try {
    const response = await axios.patch(
      `${API_URL}/notifications/mark-all-read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${tokens.user1}`,
        },
        withCredentials: true,
      }
    );

    logSuccess(`All notifications marked as read`);

    return response.data;
  } catch (error) {
    logError(
      `Failed to mark all as read: ${
        error.response?.data?.error || error.message
      }`
    );
    throw error;
  }
}

// Test 11: Delete notification
async function testDeleteNotification(notificationId) {
  logTest("Delete Notification");

  try {
    const response = await axios.delete(
      `${API_URL}/notifications/${notificationId}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.user1}`,
        },
        withCredentials: true,
      }
    );

    logSuccess(`Notification deleted successfully`);
    logInfo(`New unread count: ${response.data.unreadCount}`);

    return response.data;
  } catch (error) {
    logError(
      `Failed to delete notification: ${
        error.response?.data?.error || error.message
      }`
    );
    throw error;
  }
}

// Test 12: Filter notifications by type
async function testFilterByType(type) {
  logTest(`Filter Notifications by Type: ${type}`);

  try {
    const response = await axios.get(`${API_URL}/notifications`, {
      params: { type },
      headers: {
        Authorization: `Bearer ${tokens.user1}`,
      },
      withCredentials: true,
    });

    logSuccess(`Filtered notifications fetched successfully`);
    logInfo(`${type} notifications: ${response.data.notifications.length}`);

    return response.data.notifications;
  } catch (error) {
    logError(
      `Failed to filter notifications: ${
        error.response?.data?.error || error.message
      }`
    );
    throw error;
  }
}

// Test 13: Get unread notifications only
async function testGetUnreadOnly() {
  logTest("Get Unread Notifications Only");

  try {
    const response = await axios.get(`${API_URL}/notifications`, {
      params: { unreadOnly: true },
      headers: {
        Authorization: `Bearer ${tokens.user1}`,
      },
      withCredentials: true,
    });

    logSuccess(`Unread notifications fetched successfully`);
    logInfo(`Unread notifications: ${response.data.notifications.length}`);

    return response.data.notifications;
  } catch (error) {
    logError(
      `Failed to get unread notifications: ${
        error.response?.data?.error || error.message
      }`
    );
    throw error;
  }
}

// Helper function to sleep
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main test runner
async function runTests() {
  console.log("\n" + "=".repeat(60));
  log("🎮 GTA FAN HUB - NOTIFICATION SYSTEM API TESTS", "cyan");
  console.log("=".repeat(60));

  logInfo(`Testing against: ${API_URL}`);
  logInfo("Make sure your server is running!");

  await sleep(2000);

  try {
    // Authentication
    await testLogin();

    // Basic operations
    await testGetNotifications();
    await testGetUnreadCount();

    // Create test content
    const post = await testCreatePost();

    if (post) {
      // Generate notifications
      await testLikePost(post._id);
      await testCommentOnPost(post._id);
    }

    await testFollowUser();

    // Check notifications
    const notifications = await testCheckNotificationsAfterActions();

    if (notifications && notifications.length > 0) {
      // Mark operations
      await testMarkAsRead(notifications[0]._id);
      await testMarkAllAsRead();

      // Create more notifications to test delete
      if (notifications.length > 1) {
        await testDeleteNotification(notifications[1]._id);
      }
    }

    // Filter tests
    await testFilterByType("like");
    await testFilterByType("comment");
    await testFilterByType("follow");

    await testGetUnreadOnly();

    // Final check
    await testGetUnreadCount();

    console.log("\n" + "=".repeat(60));
    logSuccess("ALL TESTS COMPLETED!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.log("\n" + "=".repeat(60));
    logError("TESTS FAILED!");
    console.log("=".repeat(60));
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
runTests();
