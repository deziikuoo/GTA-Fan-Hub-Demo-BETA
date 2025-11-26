// browser-debug-helper.js
// Copy and paste this into your browser console to debug the follow system
// Usage: Open DevTools (F12) → Console → Paste this code → Press Enter

console.log("=".repeat(60));
console.log("FOLLOW SYSTEM DEBUG HELPER LOADED");
console.log("=".repeat(60));
console.log("\nAvailable commands:");
console.log("  checkState()        - Check current Vuex state");
console.log("  checkSocket()       - Check Socket.io connection");
console.log("  testFollow(userId)  - Test follow action");
console.log("  testUnfollow(userId) - Test unfollow action");
console.log("  manualIncrement()   - Test reactivity by incrementing count");
console.log("  clearState()        - Clear all local storage");
console.log("=".repeat(60));

// Access Vue app instance
const app = document.getElementById("app").__VUE_APP__;
const store = app.$store || window.__VUE_STORE__;

window.checkState = function () {
  console.log("\n========== VUEX STATE ==========");
  console.log("User:", store.state.user);
  console.log("\nSocial State:");
  console.log("  followingUsers (Set):", store.state.social.followingUsers);
  console.log(
    "  followingUsers (Array):",
    Array.from(store.state.social.followingUsers)
  );
  console.log("  followerCount:", store.state.social.followerCount);
  console.log("  followingCount:", store.state.social.followingCount);
  console.log(
    "  followActionLoading:",
    Array.from(store.state.social.followActionLoading)
  );
  console.log("\nGetters:");
  console.log("  isLoggedIn:", store.getters.isLoggedIn);
  console.log("  followingCount:", store.getters["social/getFollowingCount"]);
  console.log("  followerCount:", store.getters["social/getFollowerCount"]);
  console.log("================================\n");
};

window.checkSocket = function () {
  console.log("\n========== SOCKET.IO STATUS ==========");
  console.log("Socket imported:", typeof socket !== "undefined");
  if (typeof socket !== "undefined") {
    console.log("  Connected:", socket.connected);
    console.log("  Socket ID:", socket.id);
    console.log("  Rooms:", socket.rooms ? Array.from(socket.rooms) : "N/A");

    // Check event listeners
    const events = [
      "new_follower",
      "unfollowed",
      "follower_count_update",
      "following_count_update",
    ];
    console.log("\n  Event Listeners:");
    events.forEach((event) => {
      const listeners = socket.listeners(event);
      console.log(`    ${event}: ${listeners.length} listener(s)`);
    });
  } else {
    console.log("  Socket.io not accessible from global scope");
    console.log("  This is normal - socket is in module scope");
  }
  console.log("================================\n");
};

window.testFollow = async function (userId) {
  if (!userId) {
    console.error("Please provide a userId: testFollow('USER_ID')");
    return;
  }

  console.log("\n========== TESTING FOLLOW ==========");
  console.log("Following user:", userId);

  try {
    await store.dispatch("social/followUser", { userId, source: "debug" });
    console.log("✓ Follow action completed");
    checkState();
  } catch (error) {
    console.error("✗ Follow action failed:", error);
  }
  console.log("================================\n");
};

window.testUnfollow = async function (userId) {
  if (!userId) {
    console.error("Please provide a userId: testUnfollow('USER_ID')");
    return;
  }

  console.log("\n========== TESTING UNFOLLOW ==========");
  console.log("Unfollowing user:", userId);

  try {
    await store.dispatch("social/unfollowUser", userId);
    console.log("✓ Unfollow action completed");
    checkState();
  } catch (error) {
    console.error("✗ Unfollow action failed:", error);
  }
  console.log("================================\n");
};

window.manualIncrement = function () {
  console.log("\n========== TESTING REACTIVITY ==========");
  console.log("Manually incrementing follower count...");
  console.log("Before:", store.state.social.followerCount);

  store.commit("social/INCREMENT_FOLLOWER_COUNT");

  console.log("After:", store.state.social.followerCount);
  console.log("\nIf you see the count increase in the UI, reactivity works!");
  console.log("If not, there's a reactivity issue.");
  console.log("================================\n");
};

window.clearState = function () {
  console.log("\n========== CLEARING STATE ==========");
  localStorage.clear();
  console.log("✓ localStorage cleared");
  console.log("Reload the page to start fresh");
  console.log("================================\n");
};

// Auto-run initial checks
console.log("\n📊 Initial State Check:");
checkState();

console.log("\n🔌 Socket.io Check:");
checkSocket();

console.log(
  "\n💡 TIP: Call checkState() after any follow action to verify state changes"
);
console.log(
  "💡 TIP: Call manualIncrement() to test if UI reacts to Vuex changes"
);
