// src/store/modules/social.js

import axios from "@/utils/axios";

export default {
  namespaced: true,

  state: {
    // Follow state
    followingUsers: [], // Users current user follows (Array for Vue reactivity)
    followerCount: 0,
    followingCount: 0,

    // UI state
    followActionLoading: [], // Track loading state per user (Array for Vue reactivity)
  },

  mutations: {
    SET_FOLLOWING(state, userId) {
      const userIdStr = String(userId); // Ensure string format
      console.log("[Social:Mutation] SET_FOLLOWING - userId:", userIdStr);
      console.log(
        "[Social:Mutation] Before - Array length:",
        state.followingUsers.length
      );
      console.log("[Social:Mutation] Before - Array contents:", state.followingUsers);
      
      // Only add if not already present (using string comparison)
      if (!state.followingUsers.includes(userIdStr)) {
        state.followingUsers.push(userIdStr);
        console.log("[Social:Mutation] ✓ Added to array");
      } else {
        console.log("[Social:Mutation] Already in array, skipping");
      }
      
      console.log(
        "[Social:Mutation] After - Array length:",
        state.followingUsers.length
      );
      console.log(
        "[Social:Mutation] After - Array contents:",
        state.followingUsers
      );
    },

    REMOVE_FOLLOWING(state, userId) {
      const userIdStr = String(userId); // Ensure string format
      console.log("[Social:Mutation] REMOVE_FOLLOWING - userId:", userIdStr);
      console.log(
        "[Social:Mutation] Before - Array length:",
        state.followingUsers.length
      );
      console.log("[Social:Mutation] Before - Array contents:", state.followingUsers);
      
      const index = state.followingUsers.indexOf(userIdStr);
      if (index > -1) {
        state.followingUsers.splice(index, 1);
        console.log("[Social:Mutation] ✓ Removed from array at index:", index);
      } else {
        console.log("[Social:Mutation] Not found in array, skipping");
      }
      
      console.log(
        "[Social:Mutation] After - Array length:",
        state.followingUsers.length
      );
      console.log(
        "[Social:Mutation] After - Array contents:",
        state.followingUsers
      );
    },

    SET_FOLLOWING_LIST(state, userIds) {
      state.followingUsers = userIds.map((id) => String(id));
    },

    CLEAR_FOLLOWING_LIST(state) {
      state.followingUsers = [];
    },

    SET_COUNTS(state, { followers, following }) {
      if (followers !== undefined) state.followerCount = followers;
      if (following !== undefined) state.followingCount = following;
    },

    INCREMENT_FOLLOWER_COUNT(state) {
      console.log(
        "[Social:Mutation] INCREMENT_FOLLOWER_COUNT - Before:",
        state.followerCount
      );
      state.followerCount++;
      console.log(
        "[Social:Mutation] INCREMENT_FOLLOWER_COUNT - After:",
        state.followerCount
      );
    },

    DECREMENT_FOLLOWER_COUNT(state) {
      console.log(
        "[Social:Mutation] DECREMENT_FOLLOWER_COUNT - Before:",
        state.followerCount
      );
      if (state.followerCount > 0) state.followerCount--;
      console.log(
        "[Social:Mutation] DECREMENT_FOLLOWER_COUNT - After:",
        state.followerCount
      );
    },

    INCREMENT_FOLLOWING_COUNT(state) {
      console.log(
        "[Social:Mutation] INCREMENT_FOLLOWING_COUNT - Before:",
        state.followingCount
      );
      state.followingCount++;
      console.log(
        "[Social:Mutation] INCREMENT_FOLLOWING_COUNT - After:",
        state.followingCount
      );
    },

    DECREMENT_FOLLOWING_COUNT(state) {
      console.log(
        "[Social:Mutation] DECREMENT_FOLLOWING_COUNT - Before:",
        state.followingCount
      );
      if (state.followingCount > 0) state.followingCount--;
      console.log(
        "[Social:Mutation] DECREMENT_FOLLOWING_COUNT - After:",
        state.followingCount
      );
    },

    SET_FOLLOW_ACTION_LOADING(state, { userId, loading }) {
      const userIdStr = String(userId); // Ensure string format
      if (loading) {
        if (!state.followActionLoading.includes(userIdStr)) {
          state.followActionLoading.push(userIdStr);
        }
      } else {
        const index = state.followActionLoading.indexOf(userIdStr);
        if (index > -1) {
          state.followActionLoading.splice(index, 1);
        }
      }
    },

    RESET_STATE(state) {
      state.followingUsers = [];
      state.followerCount = 0;
      state.followingCount = 0;
      state.followActionLoading = [];
    },
  },

  actions: {
    /**
     * Follow a user
     * @param {Object} context - Vuex context
     * @param {Object} payload - { userId, source }
     */
    async followUser({ commit, state }, { userId, source = "profile" }) {
      const userIdStr = String(userId); // Ensure string format
      console.log("[Social:Action] ========== FOLLOW USER START ==========");
      console.log("[Social:Action] UserId (string):", userIdStr);
      console.log("[Social:Action] Source:", source);
      console.log("[Social:Action] Current state before:", {
        followingUsers: state.followingUsers,
        followingCount: state.followingCount,
      });

      commit("SET_FOLLOW_ACTION_LOADING", { userId: userIdStr, loading: true });

      try {
        console.log("[Social:Action] Making API call...");
        const response = await axios.post(`/api/users/${userIdStr}/follow`, {
          source,
        });
        console.log("[Social:Action] ✓ API response:", response.data);

        if (response.data.status === "active") {
          console.log(
            "[Social:Action] ✓ Status is active, committing mutations..."
          );
          commit("SET_FOLLOWING", userIdStr);
          commit("INCREMENT_FOLLOWING_COUNT");
          console.log("[Social:Action] ✓ Mutations committed successfully");
        } else {
          console.log(
            "[Social:Action] ⚠ Status is NOT active (probably pending):",
            response.data.status
          );
        }

        console.log("[Social:Action] Current state after:", {
          followingUsers: state.followingUsers,
          followingCount: state.followingCount,
        });

        return response.data;
      } catch (error) {
        console.error("[Social:Action] ✗ Follow error:", error);
        console.error("[Social:Action] ✗ Error response:", error.response?.data);
        throw error;
      } finally {
        commit("SET_FOLLOW_ACTION_LOADING", { userId: userIdStr, loading: false });
        console.log("[Social:Action] ========== FOLLOW USER END ==========");
      }
    },

    /**
     * Unfollow a user
     * @param {Object} context - Vuex context
     * @param {string} userId - User ID to unfollow
     */
    async unfollowUser({ commit, state }, userId) {
      const userIdStr = String(userId); // Ensure string format
      console.log("[Social:Action] ========== UNFOLLOW USER START ==========");
      console.log("[Social:Action] UserId (string):", userIdStr);
      console.log("[Social:Action] Current state before:", {
        followingUsers: state.followingUsers,
        followingCount: state.followingCount,
      });

      commit("SET_FOLLOW_ACTION_LOADING", { userId: userIdStr, loading: true });

      try {
        console.log("[Social:Action] Making DELETE API call...");
        const response = await axios.delete(`/api/users/${userIdStr}/follow`);
        console.log("[Social:Action] ✓ API response:", response.data);

        console.log("[Social:Action] ✓ Committing mutations...");
        commit("REMOVE_FOLLOWING", userIdStr);
        commit("DECREMENT_FOLLOWING_COUNT");
        console.log("[Social:Action] ✓ Mutations committed successfully");

        console.log("[Social:Action] Current state after:", {
          followingUsers: state.followingUsers,
          followingCount: state.followingCount,
        });
      } catch (error) {
        console.error("[Social:Action] ✗ Unfollow error:", error);
        console.error("[Social:Action] ✗ Error response:", error.response?.data);
        throw error;
      } finally {
        commit("SET_FOLLOW_ACTION_LOADING", { userId: userIdStr, loading: false });
        console.log("[Social:Action] ========== UNFOLLOW USER END ==========");
      }
    },

    /**
     * Toggle follow (convenience action)
     * @param {Object} context - Vuex context
     * @param {Object} payload - { userId, source }
     */
    async toggleFollow(
      { state, dispatch, getters },
      { userId, source = "profile" }
    ) {
      const userIdStr = String(userId); // Ensure string format
      console.log("[Social:Action] ========== TOGGLE FOLLOW ==========");
      console.log("[Social:Action] UserId (string):", userIdStr);
      const currentlyFollowing = getters.isFollowing(userIdStr);
      console.log("[Social:Action] Currently following:", currentlyFollowing);
      console.log(
        "[Social:Action] Will:",
        currentlyFollowing ? "UNFOLLOW" : "FOLLOW"
      );

      if (currentlyFollowing) {
        await dispatch("unfollowUser", userIdStr);
      } else {
        await dispatch("followUser", { userId: userIdStr, source });
      }

      const newFollowStatus = getters.isFollowing(userIdStr);
      console.log(
        "[Social:Action] ✓ Toggle complete - now following:",
        newFollowStatus
      );
      
      // Verify the state actually changed
      if (currentlyFollowing === newFollowStatus) {
        console.error("[Social:Action] ✗ WARNING: Follow state did not change!");
      }
    },

    /**
     * Check follow status for a user
     * @param {Object} context - Vuex context
     * @param {string} userId - User ID to check
     */
    async checkFollowStatus({ commit }, userId) {
      const userIdStr = String(userId); // Ensure string format
      try {
        console.log("[Social:Action] Checking follow status for:", userIdStr);
        const { data } = await axios.get(`/api/users/${userIdStr}/follow-status`);
        console.log("[Social:Action] Follow status response:", data);

        if (data.isFollowing) {
          console.log("[Social:Action] ✓ Currently following, setting in state");
          commit("SET_FOLLOWING", userIdStr);
        } else {
          console.log("[Social:Action] ✓ Not following, removing from state");
          commit("REMOVE_FOLLOWING", userIdStr);
        }

        return data;
      } catch (error) {
        console.error("[Social:Action] ✗ Failed to check follow status:", error);
        return { isFollowing: false, isMutual: false };
      }
    },

    /**
     * Bulk check follow status for multiple users
     * Useful when displaying user lists
     * @param {Object} context - Vuex context
     * @param {Array} userIds - Array of user IDs to check
     */
    async checkBulkFollowStatus({ commit }, userIds) {
      try {
        const { data } = await axios.post("/api/users/bulk-follow-status", {
          userIds,
        });

        // Update local state with results
        Object.entries(data.followStatuses).forEach(([userId, isFollowing]) => {
          const userIdStr = String(userId);
          if (isFollowing) {
            commit("SET_FOLLOWING", userIdStr);
          } else {
            commit("REMOVE_FOLLOWING", userIdStr);
          }
        });

        return data.followStatuses;
      } catch (error) {
        console.error("[Social] Failed to check bulk follow status:", error);
        return {};
      }
    },

    /**
     * Initialize follow state for current user
     * Call this after login or on app mount
     * @param {Object} context - Vuex context
     * @param {string} userId - Current user ID
     */
    async initializeFollowState({ commit }, userId) {
      const userIdStr = String(userId); // Ensure string format
      try {
        console.log("[Social:Action] Initializing follow state for user:", userIdStr);

        // Fetch user's following list (first page only for initial state)
        const { data } = await axios.get(`/api/users/${userIdStr}/following`, {
          params: { limit: 100 },
        });

        // Convert all user IDs to strings for consistency
        const followingIds = data.following.map((user) => String(user._id));
        console.log("[Social:Action] Following IDs (as strings):", followingIds);
        commit("SET_FOLLOWING_LIST", followingIds);

        // Get follower count
        const followersResponse = await axios.get(
          `/api/users/${userIdStr}/followers`,
          {
            params: { limit: 1 }, // We only need the count, not the actual list
          }
        );

        // Set both counts
        commit("SET_COUNTS", {
          following: data.totalCount,
          followers: followersResponse.data.totalCount,
        });

        console.log(
          `[Social:Action] ✓ Initialized follow state: ${followingIds.length} following, ${followersResponse.data.totalCount} followers`
        );
      } catch (error) {
        console.error("[Social:Action] ✗ Failed to initialize follow state:", error);
      }
    },

    /**
     * Update counts (useful when receiving fresh data from profile)
     * @param {Object} context - Vuex context
     * @param {Object} counts - { followers, following }
     */
    updateCounts({ commit }, counts) {
      commit("SET_COUNTS", counts);
    },

    /**
     * Reset social state (on logout)
     * @param {Object} context - Vuex context
     */
    resetState({ commit }) {
      commit("RESET_STATE");
    },

    // ==================== SOCKET.IO EVENT HANDLERS ====================

    /**
     * Handle incoming new follower event from Socket.io
     * @param {Object} context - Vuex context
     * @param {Object} data - { userId, username, profilePicture, timestamp }
     */
    handleSocketNewFollower({ commit, state, dispatch }, data) {
      console.log("[Social:Socket] ========== NEW FOLLOWER EVENT ==========");
      console.log("[Social:Socket] Event data:", data);
      console.log(
        "[Social:Socket] Before - followerCount:",
        state.followerCount
      );

      commit("INCREMENT_FOLLOWER_COUNT");

      console.log(
        "[Social:Socket] After - followerCount:",
        state.followerCount
      );
      console.log("[Social:Socket] ========== EVENT HANDLED ==========");

      // Optionally show notification
      if (window.Notification && Notification.permission === "granted") {
        new Notification("New Follower", {
          body: `${data.username} followed you`,
          icon: data.profilePicture || "/src/assets/images/user.png",
        });
      }
    },

    /**
     * Handle incoming unfollowed event from Socket.io
     * @param {Object} context - Vuex context
     * @param {Object} data - { userId, timestamp }
     */
    handleSocketUnfollowed({ commit }, data) {
      console.log("[Social] Socket: Unfollowed by user", data.userId);
      commit("DECREMENT_FOLLOWER_COUNT");
    },

    // REMOVED: Socket.io count update handlers
    // Counts now only update from user's own actions (follow/unfollow API responses)
    // Socket.io is used only for notifications, not real-time count updates
    // Other users' count changes require page refresh to see updates
  },

  getters: {
    /**
     * Check if current user is following a specific user
     * @param {Object} state - Vuex state
     * @returns {Function} Function that takes userId and returns boolean
     */
    isFollowing: (state) => (userId) => {
      const userIdStr = String(userId); // Ensure string format for comparison
      const result = state.followingUsers.includes(userIdStr);
      console.log(`[Social:Getter] isFollowing(${userIdStr}) = ${result}`);
      console.log(`[Social:Getter] Current array:`, state.followingUsers);
      return result;
    },

    /**
     * Check if follow action is loading for a specific user
     * @param {Object} state - Vuex state
     * @returns {Function} Function that takes userId and returns boolean
     */
    isFollowActionLoading: (state) => (userId) => {
      const userIdStr = String(userId); // Ensure string format for comparison
      return state.followActionLoading.includes(userIdStr);
    },

    /**
     * Get current following count
     * @param {Object} state - Vuex state
     * @returns {number} Following count
     */
    getFollowingCount: (state) => {
      return state.followingCount;
    },

    /**
     * Get current follower count
     * @param {Object} state - Vuex state
     * @returns {number} Follower count
     */
    getFollowerCount: (state) => {
      return state.followerCount;
    },

    /**
     * Get list of following user IDs
     * @param {Object} state - Vuex state
     * @returns {Array} Array of user IDs
     */
    getFollowingIds: (state) => {
      return [...state.followingUsers];
    },

    /**
     * Get number of users currently being followed
     * @param {Object} state - Vuex state
     * @returns {number} Number of users in following array
     */
    getFollowingSize: (state) => {
      return state.followingUsers.length;
    },
  },
};
