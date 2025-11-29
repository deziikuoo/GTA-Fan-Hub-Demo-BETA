// src/store/modules/notifications.js

import axios from "@/utils/axios";

const state = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  hasMore: true,
  currentPage: 1,
  error: null,
  // Toast notification state
  toasts: [],
  soundEnabled: true,
};

const getters = {
  allNotifications: (state) => state.notifications,
  unreadCount: (state) => state.unreadCount,
  unreadNotifications: (state) => state.notifications.filter((n) => !n.read),
  isLoading: (state) => state.loading,
  hasMore: (state) => state.hasMore,
  // Toast getters
  toasts: (state) => state.toasts,
  soundEnabled: (state) => state.soundEnabled,
};

const mutations = {
  SET_NOTIFICATIONS(state, notifications) {
    state.notifications = notifications;
  },
  ADD_NOTIFICATIONS(state, notifications) {
    state.notifications.push(...notifications);
  },
  ADD_NOTIFICATION(state, notification) {
    // Add to beginning of list
    state.notifications.unshift(notification);
  },
  SET_UNREAD_COUNT(state, count) {
    state.unreadCount = count;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_HAS_MORE(state, hasMore) {
    state.hasMore = hasMore;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_PAGE(state, page) {
    state.currentPage = page;
  },
  MARK_AS_READ(state, notificationId) {
    const notification = state.notifications.find(
      (n) => n._id === notificationId
    );
    if (notification && !notification.read) {
      notification.read = true;
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    }
  },
  MARK_ALL_AS_READ(state) {
    state.notifications.forEach((n) => {
      n.read = true;
    });
    state.unreadCount = 0;
  },
  DELETE_NOTIFICATION(state, notificationId) {
    const index = state.notifications.findIndex(
      (n) => n._id === notificationId
    );
    if (index > -1) {
      const notification = state.notifications[index];
      if (!notification.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications.splice(index, 1);
    }
  },
  RESET_STATE(state) {
    state.notifications = [];
    state.unreadCount = 0;
    state.loading = false;
    state.hasMore = true;
    state.currentPage = 1;
    state.error = null;
    state.toasts = [];
  },
  // Toast mutations
  ADD_TOAST(state, toast) {
    state.toasts.push(toast);
  },
  REMOVE_TOAST(state, toastId) {
    const index = state.toasts.findIndex((t) => t.id === toastId);
    if (index > -1) {
      state.toasts.splice(index, 1);
    }
  },
  SET_SOUND_ENABLED(state, enabled) {
    state.soundEnabled = enabled;
  },
};

const actions = {
  async fetchNotifications(
    { commit, state },
    { page = 1, type = null, unreadOnly = false } = {}
  ) {
    commit("SET_LOADING", true);
    commit("SET_ERROR", null);

    try {
      const params = { page, limit: 20 };
      if (type) params.type = type;
      if (unreadOnly) params.unreadOnly = true;

      const response = await axios.get("/api/notifications", { params });

      if (page === 1) {
        commit("SET_NOTIFICATIONS", response.data.notifications);
      } else {
        commit("ADD_NOTIFICATIONS", response.data.notifications);
      }

      commit("SET_HAS_MORE", response.data.pagination.hasMore);
      commit("SET_PAGE", page);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      commit(
        "SET_ERROR",
        error.response?.data?.error || "Failed to load notifications"
      );
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async fetchUnreadCount({ commit }) {
    try {
      const response = await axios.get("/api/notifications/unread-count");
      commit("SET_UNREAD_COUNT", response.data.count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  },

  async markAsRead({ commit, dispatch }, notificationId) {
    try {
      const response = await axios.patch(
        `/api/notifications/${notificationId}/read`
      );
      commit("MARK_AS_READ", notificationId);
      commit("SET_UNREAD_COUNT", response.data.unreadCount);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  },

  async markAllAsRead({ commit }) {
    try {
      await axios.patch("/api/notifications/mark-all-read");
      commit("MARK_ALL_AS_READ");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  },

  async deleteNotification({ commit, dispatch }, notificationId) {
    try {
      const response = await axios.delete(
        `/api/notifications/${notificationId}`
      );
      commit("DELETE_NOTIFICATION", notificationId);
      commit("SET_UNREAD_COUNT", response.data.unreadCount);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  },

  // Add notification from Socket.io
  addNotification({ commit }, notification) {
    commit("ADD_NOTIFICATION", notification);
  },

  // Set unread count from Socket.io
  setUnreadCount({ commit }, count) {
    commit("SET_UNREAD_COUNT", count);
  },

  // Reset when user logs out
  resetNotifications({ commit }) {
    commit("RESET_STATE");
  },

  // Toast actions
  showToast({ commit, state }, notification) {
    // Create toast object with unique ID and timestamp
    const toast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      dismissed: false,
      duration: 5000,
      ...notification,
    };

    commit("ADD_TOAST", toast);
  },

  dismissToast({ commit }, toastId) {
    commit("REMOVE_TOAST", toastId);
  },

  toggleSound({ commit, state }) {
    const newState = !state.soundEnabled;
    commit("SET_SOUND_ENABLED", newState);

    // Save to localStorage
    localStorage.setItem("notificationSoundEnabled", newState.toString());

    return newState;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
