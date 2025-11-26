// test-notification-system.js
// Test script for the notification system
// Run with: node test-notification-system.js

// Load environment variables
require("dotenv").config();

const mongoose = require("mongoose");
const readline = require("readline");

// MongoDB connection - use same as server
const MONGODB_URI =
  process.env.CONNECTION_STRING ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/gtafanhub";

// Models (inline definitions for testing)
const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["like", "comment", "reply", "repost", "quote", "follow"],
    required: true,
  },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 2592000 }, // 30 days TTL
});

const Notification = mongoose.model("Notification", notificationSchema);

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
});

const User = mongoose.model("User", userSchema);

const postSchema = new mongoose.Schema({
  content: {
    text: String,
    mentions: [mongoose.Schema.Types.ObjectId],
    hashtags: [String],
    links: [Object],
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.log("\n\n👋 Exiting notification test script...");
  rl.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  rl.close();
  process.exit(0);
});

// Helper function to prompt user
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

// Display menu
function displayMenu() {
  console.log("\n" + "=".repeat(60));
  console.log("📬 NOTIFICATION SYSTEM TEST MENU");
  console.log("=".repeat(60));
  console.log("1. List all users");
  console.log("2. Create test notification (single)");
  console.log("3. Create bulk test notifications");
  console.log("4. View notifications for a user");
  console.log("5. Mark notification as read");
  console.log("6. Delete notification");
  console.log("7. Clear all notifications for a user");
  console.log("8. Get unread count for a user");
  console.log("9. Create test users and posts");
  console.log("0. Exit");
  console.log("=".repeat(60) + "\n");
}

// List all users
async function listUsers() {
  try {
    const users = await User.find({}).select("_id username email");

    if (users.length === 0) {
      console.log("⚠️  No users found. Create some with option 9.");
      return null;
    }

    console.log("\n📋 Users in database:");
    console.log("-".repeat(60));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email})`);
      console.log(`   ID: ${user._id}`);
    });
    console.log("-".repeat(60));

    return users;
  } catch (error) {
    console.error("❌ Error listing users:", error);
    return null;
  }
}

// Create single notification
async function createTestNotification() {
  try {
    const users = await listUsers();
    if (!users || users.length < 2) {
      console.log("⚠️  Need at least 2 users. Create some with option 9.");
      return;
    }

    const recipientIndex =
      parseInt(await prompt("\nEnter recipient user number: ")) - 1;
    const actorIndex = parseInt(await prompt("Enter actor user number: ")) - 1;

    if (
      recipientIndex < 0 ||
      recipientIndex >= users.length ||
      actorIndex < 0 ||
      actorIndex >= users.length
    ) {
      console.log("❌ Invalid user selection");
      return;
    }

    if (recipientIndex === actorIndex) {
      console.log("⚠️  Recipient and actor should be different users");
      return;
    }

    const recipient = users[recipientIndex];
    const actor = users[actorIndex];

    console.log("\nNotification types:");
    console.log("1. like");
    console.log("2. comment");
    console.log("3. reply");
    console.log("4. repost");
    console.log("5. quote");
    console.log("6. follow");

    const typeChoice = await prompt("Select notification type (1-6): ");
    const types = ["like", "comment", "reply", "repost", "quote", "follow"];
    const type = types[parseInt(typeChoice) - 1];

    if (!type) {
      console.log("❌ Invalid type selection");
      return;
    }

    const notificationData = {
      recipient: recipient._id,
      actor: actor._id,
      type: type,
    };

    // For post-related notifications, optionally add a post
    if (type !== "follow") {
      const posts = await Post.find({ author: recipient._id }).limit(5);
      if (posts.length > 0) {
        console.log("\nAvailable posts:");
        posts.forEach((post, idx) => {
          const contentText = post.content?.text || "No content";
          console.log(`${idx + 1}. ${contentText.substring(0, 50)}...`);
        });
        const postIndex =
          parseInt(await prompt("Select post number (or 0 to skip): ")) - 1;
        if (postIndex >= 0 && postIndex < posts.length) {
          notificationData.postId = posts[postIndex]._id;
        }
      }
    }

    const notification = new Notification(notificationData);
    await notification.save();

    console.log("\n✅ Notification created successfully!");
    console.log("Details:", {
      id: notification._id,
      recipient: recipient.username,
      actor: actor.username,
      type: notification.type,
      createdAt: notification.createdAt,
    });
  } catch (error) {
    console.error("❌ Error creating notification:", error);
  }
}

// Create bulk notifications
async function createBulkNotifications() {
  try {
    const users = await listUsers();
    if (!users || users.length < 2) {
      console.log("⚠️  Need at least 2 users. Create some with option 9.");
      return;
    }

    const recipientIndex =
      parseInt(await prompt("\nEnter recipient user number: ")) - 1;
    const count = parseInt(await prompt("How many notifications to create? "));

    if (
      recipientIndex < 0 ||
      recipientIndex >= users.length ||
      isNaN(count) ||
      count < 1
    ) {
      console.log("❌ Invalid input");
      return;
    }

    const recipient = users[recipientIndex];
    const types = ["like", "comment", "reply", "repost", "quote", "follow"];
    const posts = await Post.find({ author: recipient._id }).limit(5);

    console.log(`\n⏳ Creating ${count} notifications...`);

    for (let i = 0; i < count; i++) {
      // Random actor (not the recipient)
      let actorIndex;
      do {
        actorIndex = Math.floor(Math.random() * users.length);
      } while (actorIndex === recipientIndex);

      const actor = users[actorIndex];
      const type = types[Math.floor(Math.random() * types.length)];

      const notificationData = {
        recipient: recipient._id,
        actor: actor._id,
        type: type,
        read: Math.random() > 0.7, // 30% chance of being read
      };

      // Add post for non-follow notifications
      if (type !== "follow" && posts.length > 0) {
        notificationData.postId =
          posts[Math.floor(Math.random() * posts.length)]._id;
      }

      await Notification.create(notificationData);
      process.stdout.write(`\rCreated ${i + 1}/${count} notifications...`);
    }

    console.log("\n✅ Bulk notifications created successfully!");
  } catch (error) {
    console.error("\n❌ Error creating bulk notifications:", error);
  }
}

// View notifications for user
async function viewUserNotifications() {
  try {
    const users = await listUsers();
    if (!users) return;

    const userIndex = parseInt(await prompt("\nEnter user number: ")) - 1;
    if (userIndex < 0 || userIndex >= users.length) {
      console.log("❌ Invalid user selection");
      return;
    }

    const user = users[userIndex];
    const notifications = await Notification.find({ recipient: user._id })
      .populate("actor", "username")
      .populate("postId", "content")
      .sort({ createdAt: -1 })
      .limit(20);

    if (notifications.length === 0) {
      console.log(`\n⚠️  No notifications found for ${user.username}`);
      return;
    }

    console.log(`\n📬 Notifications for ${user.username}:`);
    console.log("-".repeat(80));
    notifications.forEach((notif, idx) => {
      const readStatus = notif.read ? "✓ Read" : "● Unread";
      const postPreview = notif.postId
        ? ` | Post: "${notif.postId.content.substring(0, 30)}..."`
        : "";
      console.log(
        `${idx + 1}. [${readStatus}] ${notif.actor?.username || "Unknown"} ${
          notif.type
        }${postPreview}`
      );
      console.log(
        `   ID: ${notif._id} | Created: ${notif.createdAt.toLocaleString()}`
      );
    });
    console.log("-".repeat(80));

    const unreadCount = notifications.filter((n) => !n.read).length;
    console.log(`\n📊 Total: ${notifications.length} | Unread: ${unreadCount}`);
  } catch (error) {
    console.error("❌ Error viewing notifications:", error);
  }
}

// Mark notification as read
async function markAsRead() {
  try {
    const notificationId = await prompt(
      "\nEnter notification ID to mark as read: "
    );
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      console.log("❌ Notification not found");
      return;
    }

    console.log("✅ Notification marked as read");
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
  }
}

// Delete notification
async function deleteNotification() {
  try {
    const notificationId = await prompt("\nEnter notification ID to delete: ");
    const result = await Notification.findByIdAndDelete(notificationId);

    if (!result) {
      console.log("❌ Notification not found");
      return;
    }

    console.log("✅ Notification deleted");
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
  }
}

// Clear all notifications for user
async function clearUserNotifications() {
  try {
    const users = await listUsers();
    if (!users) return;

    const userIndex = parseInt(await prompt("\nEnter user number: ")) - 1;
    if (userIndex < 0 || userIndex >= users.length) {
      console.log("❌ Invalid user selection");
      return;
    }

    const user = users[userIndex];
    const confirm = await prompt(
      `⚠️  Delete ALL notifications for ${user.username}? (yes/no): `
    );

    if (confirm.toLowerCase() !== "yes") {
      console.log("❌ Cancelled");
      return;
    }

    const result = await Notification.deleteMany({ recipient: user._id });
    console.log(`✅ Deleted ${result.deletedCount} notifications`);
  } catch (error) {
    console.error("❌ Error clearing notifications:", error);
  }
}

// Get unread count
async function getUnreadCount() {
  try {
    const users = await listUsers();
    if (!users) return;

    const userIndex = parseInt(await prompt("\nEnter user number: ")) - 1;
    if (userIndex < 0 || userIndex >= users.length) {
      console.log("❌ Invalid user selection");
      return;
    }

    const user = users[userIndex];
    const count = await Notification.countDocuments({
      recipient: user._id,
      read: false,
    });

    console.log(`\n📊 ${user.username} has ${count} unread notification(s)`);
  } catch (error) {
    console.error("❌ Error getting unread count:", error);
  }
}

// Create test users and posts
async function createTestData() {
  try {
    console.log("\n⏳ Creating test users and posts...");

    const testUsers = [
      { username: "testuser1", email: "testuser1@example.com" },
      { username: "testuser2", email: "testuser2@example.com" },
      { username: "testuser3", email: "testuser3@example.com" },
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
      let user = await User.findOne({ username: userData.username });
      if (!user) {
        user = await User.create(userData);
        console.log(`✅ Created user: ${user.username}`);
      } else {
        console.log(`ℹ️  User already exists: ${user.username}`);
      }
      createdUsers.push(user);
    }

    // Create test posts
    const testPosts = [
      "Just saw the GTA 6 trailer! Mind blown! 🤯",
      "What do you think about the new Vice City?",
      "Lucia is going to be an amazing protagonist!",
      "The graphics look insane in GTA 6!",
      "Can't wait for the release date announcement!",
    ];

    for (let i = 0; i < testPosts.length; i++) {
      const author = createdUsers[i % createdUsers.length];
      const post = await Post.create({
        content: testPosts[i],
        author: author._id,
      });
      console.log(`✅ Created post by ${author.username}`);
    }

    console.log("\n✅ Test data created successfully!");
  } catch (error) {
    console.error("❌ Error creating test data:", error);
  }
}

// Main loop
async function main() {
  await connectDB();

  console.log("\n🎮 GTA Fan Hub - Notification System Test Script");
  console.log("This script helps you test the notification system\n");

  let running = true;
  while (running) {
    displayMenu();
    const choice = await prompt("Select an option: ");

    switch (choice) {
      case "1":
        await listUsers();
        break;
      case "2":
        await createTestNotification();
        break;
      case "3":
        await createBulkNotifications();
        break;
      case "4":
        await viewUserNotifications();
        break;
      case "5":
        await markAsRead();
        break;
      case "6":
        await deleteNotification();
        break;
      case "7":
        await clearUserNotifications();
        break;
      case "8":
        await getUnreadCount();
        break;
      case "9":
        await createTestData();
        break;
      case "0":
        console.log("\n👋 Goodbye!");
        running = false;
        break;
      default:
        console.log("❌ Invalid option");
    }
  }

  rl.close();
  await mongoose.connection.close();
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
