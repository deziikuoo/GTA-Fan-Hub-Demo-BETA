import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";
import social from "./modules/social";
import notifications from "./modules/notifications";

export default createStore({
  state: {
    user: null,
  },
  modules: {
    social, // Add social module
    notifications, // Add notifications module
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    clearUser(state) {
      state.user = null;
    },
  },
  actions: {
    loginUser({ commit, dispatch }, user) {
      commit("setUser", user);

      // Initialize follow state after login
      if (user && user.id) {
        dispatch("social/initializeFollowState", user.id);
      }
    },
    logoutUser({ commit, dispatch }) {
      // Clear access token from localStorage
      localStorage.removeItem("accessToken");
      // Clear user from state
      commit("clearUser");
      // Reset social state
      dispatch("social/resetState");
      // Reset notifications state
      dispatch("notifications/resetNotifications");
    },
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
    currentUser: (state) => state.user,
  },
  plugins: [
    createPersistedState({
      key: "gtafanhub-auth",
      paths: ["user"], // Only persist user - social state reloads on login
      storage: window.localStorage,
    }),
  ],
});
