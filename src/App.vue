<!-- App.vue -->
<script setup>
import { useStore } from "vuex";
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios, { refreshAccessToken } from "@/utils/axios";
import { parseApiError } from "@/utils/api";
import {
  faSun,
  faMoon,
  faRightToBracket,
  faUserPlus,
  faBell,
  faCog,
  faEllipsisH,
  faTimes,
  faSquare,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import LoginAndRegModal from "./components/loginAndRegModal.vue";
import CreatePostModal from "./components/CreatePostModal.vue";
import NotificationToastContainer from "./components/NotificationToastContainer.vue";
import NotificationDropdown from "./components/NotificationDropdown.vue";
import SettingsModal from "./components/SettingsModal.vue";
import UserSearch from "./components/UserSearch.vue";
import { socket, connectSocket, disconnectSocket } from "@/plugins/socket";

const store = useStore();
const router = useRouter();
const route = useRoute();
const isLoggingOut = ref(false);
const loginError = ref(null);
const logoutError = ref(null);

// Token refresh interval (10 minutes)
let tokenRefreshInterval = null;

// Start proactive token refresh
const startTokenRefresh = () => {
  // Clear any existing interval
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
  }

  // Refresh token every 10 minutes (access token expires in 15 minutes)
  tokenRefreshInterval = setInterval(async () => {
    if (store.getters.isLoggedIn && localStorage.getItem("accessToken")) {
      try {
        await refreshAccessToken();
      } catch (error) {
        console.error(
          "[App] Proactive token refresh failed, user may be logged out"
        );
        // If refresh fails, the axios interceptor will handle cleanup
      }
    }
  }, 10 * 60 * 1000); // 10 minutes

  console.log("[App] Proactive token refresh started (10 minute interval)");
};

// Stop proactive token refresh
const stopTokenRefresh = () => {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
    console.log("[App] Proactive token refresh stopped");
  }
};

// Setup Socket.io event listeners
const setupSocketListeners = () => {
  console.log("[App] Setting up Socket.io event listeners...");

  // New follower event
  socket.on("new_follower", (data) => {
    console.log(
      "[App:Socket] ========== NEW_FOLLOWER EVENT RECEIVED =========="
    );
    console.log("[App:Socket] Event data:", data);
    console.log("[App:Socket] Dispatching to Vuex...");
    store.dispatch("social/handleSocketNewFollower", data);
    console.log("[App:Socket] ========== EVENT DISPATCHED ==========");
  });

  // Unfollowed event
  socket.on("unfollowed", (data) => {
    console.log("[App:Socket] ========== UNFOLLOWED EVENT RECEIVED ==========");
    console.log("[App:Socket] Event data:", data);
    console.log("[App:Socket] Dispatching to Vuex...");
    store.dispatch("social/handleSocketUnfollowed", data);
    console.log("[App:Socket] ========== EVENT DISPATCHED ==========");
  });

  // Notification event (for likes, comments, reposts, etc.)
  socket.on("notification", (data) => {
    console.log(
      "[App:Socket] ========== NOTIFICATION EVENT RECEIVED =========="
    );
    console.log("[App:Socket] Notification data:", data);

    // Add to notification list and update count
    store.dispatch("notifications/addNotification", data.notification);
    store.dispatch("notifications/setUnreadCount", data.unreadCount);

    // Show toast notification
    store.dispatch("notifications/showToast", {
      type: data.notification.type,
      actor: data.notification.actor,
      post: data.notification.post,
      timestamp: Date.now(),
    });

    console.log("[App:Socket] ========== NOTIFICATION PROCESSED ==========");
  });

  // REMOVED: Count update listeners
  // Socket.io is now only used for notifications, not real-time count updates
  // Counts update only from user's own actions, other users' changes require refresh

  console.log("[App] Socket.io event listeners set up complete");
};

// Remove Socket.io event listeners
const removeSocketListeners = () => {
  socket.off("new_follower");
  socket.off("unfollowed");
  socket.off("notification");
  // REMOVED: Count update listeners
};

const login = async (credentials) => {
  loginError.value = null;
  try {
    console.log("Sending login request with credentials:", credentials);
    const response = await axios.post("/api/login", credentials);
    store.dispatch("loginUser", response.data.user);

    // Start proactive token refresh after successful login
    startTokenRefresh();

    // Connect Socket.io and set up listeners
    setupSocketListeners();
    connectSocket();

    // Load unread notification count
    store.dispatch("notifications/fetchUnreadCount");

    closeModal();
    console.log("Login successful");
  } catch (error) {
    loginError.value = "Login failed. Please check your credentials.";
    console.error("Login error:", error.response?.data || error.message);
    if (error.response?.status === 400) {
      loginError.value = error.response.data.error || loginError.value;
    }
  }
};

const logout = async () => {
  isLoggingOut.value = true;
  logoutError.value = null;

  try {
    // Stop proactive token refresh
    stopTokenRefresh();

    // Disconnect Socket.io
    removeSocketListeners();
    disconnectSocket();

    // Call server logout endpoint
    await axios.post("/api/logout");

    // Clear all client-side authentication state
    store.dispatch("logoutUser");

    // Reset notifications
    store.dispatch("notifications/resetNotifications");

    // Redirect to home page
    router.push("/");
    console.log("Logout successful");
  } catch (error) {
    // Even if server logout fails, clear client state
    console.error("Server logout error:", error);
    stopTokenRefresh();
    removeSocketListeners();
    disconnectSocket();
    store.dispatch("logoutUser");
    store.dispatch("notifications/resetNotifications");
    router.push("/");
    console.log("Client-side logout completed");
  } finally {
    isLoggingOut.value = false;
  }
};

const getInitialDarkMode = () => {
  const savedMode = localStorage.getItem("darkMode");
  return savedMode ? JSON.parse(savedMode) : false;
};

const handleLoginClick = () => {
  showLoginModal.value = true;
  loginFlip.value = true;
  setTimeout(() => {
    loginFlip.value = false;
  }, 1000);
};

const handleRegisterClick = () => {
  showRegisterModal.value = true;
  registerFlip.value = true;
  setTimeout(() => {
    registerFlip.value = false;
  }, 1000);
};

const closeModal = () => {
  showLoginModal.value = false;
  showRegisterModal.value = false;
  loginError.value = null;
};

const openCreatePostModal = () => {
  showCreatePostModal.value = true;
};

const closeCreatePostModal = () => {
  showCreatePostModal.value = false;
};

const handlePostCreated = (post) => {
  // Optionally handle post creation (e.g., refresh feed, show notification)
  console.log("Post created:", post);
  // If on Social page, we can trigger a refresh there
  if (route.name === "Social") {
    // The Social component should handle this via router-view
    router.go(0); // Refresh the page to show new post
  }
  closeCreatePostModal();
};

const loginFlip = ref(false);
const registerFlip = ref(false);
const homeFlip = ref(false);
const spinOnce = ref(false);
const isDark = ref(getInitialDarkMode());
const isMinimized = ref(false);
const showLoginModal = ref(false);
const showRegisterModal = ref(false);
const showCreatePostModal = ref(false);

// Add handleHomeClick function
const handleHomeClick = () => {
  homeFlip.value = true;
  setTimeout(() => {
    homeFlip.value = false;
  }, 1000);
};

// Expose login method to LoginAndRegModal
defineExpose({ login });

const toggleDark = () => {
  isDark.value = !isDark.value;
  localStorage.setItem("darkMode", JSON.stringify(isDark.value));
  spinOnce.value = true;
  setTimeout(() => {
    spinOnce.value = false;
  }, 1000);
};

const isHomePage = computed(() => route.name === "Home");
const isCharactersPage = computed(() => route.name === "Characters");
const showLeftSidebar = computed(() => !isCharactersPage.value);
const isLoggedIn = computed(() => store.getters.isLoggedIn);
const currentUser = computed(() => store.state.user);
const unreadCount = computed(() => store.getters["notifications/unreadCount"]);

// Helper to get user avatar URL
const getUserAvatarUrl = computed(() => {
  if (!currentUser.value) return "/images/user.png";

  const profilePicture =
    currentUser.value?.profile?.profilePicture ||
    currentUser.value?.profilePicture;

  if (!profilePicture || profilePicture === "/images/user.png") {
    return "/images/user.png";
  }

  // If it's an upload path, return as-is (no backend in demo)
  if (profilePicture.startsWith("/uploads/")) {
    return profilePicture;
  }

  return profilePicture;
});

// Notification dropdown state
const showNotificationDropdown = ref(false);

const toggleNotificationDropdown = () => {
  showNotificationDropdown.value = !showNotificationDropdown.value;
};

const closeNotificationDropdown = () => {
  showNotificationDropdown.value = false;
};

// Profile display preferences
// Generate user-specific localStorage key
const getProfileDisplayModeKey = (userId) => {
  return userId ? `profileDisplayMode_${userId}` : "profileDisplayMode_default";
};

// Initialize with current user's preference or default
const getProfileDisplayMode = () => {
  if (!currentUser.value?.id) {
    return localStorage.getItem("profileDisplayMode_default") || "default";
  }
  return (
    localStorage.getItem(getProfileDisplayModeKey(currentUser.value.id)) ||
    "default"
  );
};

const profileDisplayMode = ref(getProfileDisplayMode());
const isExpandedProfileMode = computed(
  () => profileDisplayMode.value === "expanded"
);
const profileBackgroundStyle = computed(() => ({
  backgroundImage: getUserAvatarUrl.value
    ? `url(${getUserAvatarUrl.value})`
    : "none",
}));
const showProfileOptions = ref(false);
const showProfileSettings = ref(false);

// Background image URL from API
// Set background image directly to BG4.jpg for demo
const backgroundImageUrl = ref("/images/BG4.jpg");
const backgroundImageLoading = ref(false);

// No need to fetch from API in demo mode
const fetchBackgroundImage = async () => {
  // Background is set directly to BG4.jpg
  backgroundImageUrl.value = "/images/BG4.jpg";
  backgroundImageLoading.value = false;
};

// Computed style for background image
const backgroundImageStyle = computed(() => ({
  backgroundImage: backgroundImageUrl.value
    ? `url(${backgroundImageUrl.value})`
    : "none",
}));

// Watch for user changes to reload their preference
watch(
  () => currentUser.value?.id,
  (newUserId, oldUserId) => {
    if (newUserId !== oldUserId) {
      profileDisplayMode.value = getProfileDisplayMode();
    }
  },
  { immediate: false }
);

const toggleProfileOptions = (event) => {
  event.preventDefault();
  event.stopPropagation();
  showProfileOptions.value = !showProfileOptions.value;
};

const setProfileDisplayMode = (mode) => {
  profileDisplayMode.value = mode;
  const userId = currentUser.value?.id;
  const key = getProfileDisplayModeKey(userId);
  localStorage.setItem(key, mode);
  showProfileOptions.value = false;
  showProfileSettings.value = false;
};

const closeProfileOptions = () => {
  showProfileOptions.value = false;
};

const toggleProfileSettings = () => {
  showProfileSettings.value = !showProfileSettings.value;
};

const handleProfileLinkClick = (event) => {
  if (showProfileOptions.value) {
    event.preventDefault();
  }
};

// Dynamic keep-alive: only cache Home component
const getCachedComponents = (Component) => {
  if (!Component) return [];
  // Only keep Home component alive, let others update normally
  const componentName = Component.name || Component.__name;
  return componentName === 'Home' ? ['Home'] : [];
};

// Watch route changes to ensure components update
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    console.log("[App] Route changed from", oldPath, "to", newPath);
    // Force scroll to top on route change
    nextTick(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  },
  { immediate: true }
);

// Watch for login state changes and connect socket
watch(
  () => store.getters.isLoggedIn,
  (newValue, oldValue) => {
    if (newValue && !oldValue) {
      // User just logged in
      console.log("[App] User logged in, setting up Socket.io...");
      setupSocketListeners();
      connectSocket();
    } else if (!newValue && oldValue) {
      // User just logged out
      console.log("[App] User logged out, disconnecting Socket.io...");
      removeSocketListeners();
      disconnectSocket();
    }
  }
);

watch(
  () => route.path,
  (to) => {
    isMinimized.value = to === "/" ? false : true;
  }
);

onMounted(async () => {
  console.log("[App] Mounted - restoring session...");

  // Fetch background image URL
  await fetchBackgroundImage();

  // Check if user is already logged in via stored token
  const accessToken = localStorage.getItem("accessToken");
  const persistedUser = store.state.user;

  console.log(
    "[App] Access token:",
    accessToken ? "Found" : "Not found",
    "| Persisted user:",
    persistedUser ? persistedUser.username : "None"
  );

  if (accessToken && persistedUser) {
    try {
      // Try to refresh the token proactively first
      // This handles cases where the token may have expired while user was away
      console.log("[App] Attempting proactive token refresh on mount...");
      await refreshAccessToken();

      // Now validate the session with fresh token
      console.log("[App] Validating session...");
      const response = await axios.get("/api/check-session");

      if (response.data.user) {
        console.log(
          "[App] Session restored successfully:",
          response.data.user.username
        );
        store.dispatch("loginUser", response.data.user);

        // Start proactive token refresh
        startTokenRefresh();

        // Connect Socket.io and set up listeners
        setupSocketListeners();
        connectSocket();

        // Load unread notification count
        store.dispatch("notifications/fetchUnreadCount");
      } else {
        console.log("[App] Session invalid, clearing state");
        localStorage.removeItem("accessToken");
        store.dispatch("logoutUser");
      }
    } catch (error) {
      console.error("[App] Session restoration failed:", error);
      // The axios interceptor will handle token refresh automatically
      // If refresh fails, it will clear the token
      if (error.response?.status === 401) {
        console.log(
          "[App] Token refresh failed on mount, user will need to log in again"
        );
        localStorage.removeItem("accessToken");
        store.dispatch("logoutUser");
      }
    }
  } else if (!accessToken && !persistedUser) {
    console.log("[App] No session data found, user not logged in");
    // For demo mode, auto-login with demo user if not logged in
    try {
      const { getCurrentDemoUser } = await import("@/mockData/users.js");
      console.log("[App] Auto-logging in with demo user for demo mode");
      localStorage.setItem("accessToken", "demo_token_" + Date.now());
      const demoUser = getCurrentDemoUser(); // This will get/create random avatar
      store.dispatch("loginUser", demoUser);
      setupSocketListeners();
      connectSocket();
    } catch (error) {
      console.error("[App] Failed to auto-login demo user:", error);
    }
  } else {
    // Inconsistent state - clear everything
    console.log("[App] Inconsistent session state, clearing...");
    localStorage.removeItem("accessToken");
    store.dispatch("logoutUser");
  }
});

// Cleanup on unmount
onUnmounted(() => {
  stopTokenRefresh();
  removeSocketListeners();
  disconnectSocket();
});
</script>
<template>
  <!-- Demo Mode Indicator -->
  <div class="demo-mode-banner">
    <span class="demo-mode-text">DEMO MODE - Beta Preview Only</span>
  </div>
  <div
    class="app"
    :class="{ 'dark-mode': isDark, 'has-sidebar': showLeftSidebar }"
  >
    <div
      class="BGimg"
      :class="{ 'dark-mode-image': isDark }"
      :style="backgroundImageStyle"
    ></div>
    <!-- Home Page Top Navigation Bar -->
    <div v-if="isHomePage" class="home-top-nav main-backdrop-filter">
      <div class="home-nav-container">
        <div class="home-nav-left">
          <router-link to="/" class="home-nav-logo" @click="handleHomeClick">
            <font-awesome-icon
              :icon="['fas', 'house-chimney']"
              :class="{ 'flip-once': homeFlip }"
            />
            <span class="logo-text">GTA Fan Hub</span>
          </router-link>
        </div>

        <nav class="home-nav-center">
          <router-link
            to="/Social"
            class="nav-item"
            :class="{ active: route.name === 'Social' }"
          >
            <font-awesome-icon :icon="['fas', 'user-group']" />
            <span class="nav-label">Social</span>
          </router-link>
          <router-link
            to="/Events"
            class="nav-item"
            :class="{ active: route.name === 'Events' }"
          >
            <font-awesome-icon :icon="['fas', 'calendar-day']" />
            <span class="nav-label">Events</span>
          </router-link>
          <router-link
            to="/News"
            class="nav-item"
            :class="{ active: route.name === 'News' }"
          >
            <font-awesome-icon :icon="['fas', 'newspaper']" />
            <span class="nav-label">News</span>
          </router-link>
          <router-link
            to="/Characters"
            class="nav-item"
            :class="{ active: route.name === 'Characters' }"
          >
            <font-awesome-icon :icon="['fas', 'users']" />
            <span class="nav-label">Characters</span>
          </router-link>
          <router-link
            to="/About"
            class="nav-item"
            :class="{ active: route.name === 'About' }"
          >
            <font-awesome-icon :icon="['fas', 'circle-info']" />
            <span class="nav-label">About</span>
          </router-link>
        </nav>

        <div class="home-nav-right">
          <div v-if="!isLoggedIn" class="home-nav-auth">
            <button @click="handleRegisterClick" class="nav-icon-btn">
              <font-awesome-icon
                :icon="faUserPlus"
                :class="{ 'flip-once': registerFlip }"
              />
              <span class="nav-label">Register</span>
            </button>
            <button
              @click="toggleDark"
              class="nav-icon-btn"
              aria-label="Toggle dark mode"
            >
              <transition name="fade" mode="out-in">
                <font-awesome-icon
                  v-if="isDark"
                  :icon="faSun"
                  :class="{ 'spin-once': spinOnce }"
                  style="color: #fddb59"
                />
                <font-awesome-icon
                  v-else
                  :icon="faMoon"
                  :class="{ 'spin-once-reverse': spinOnce }"
                />
              </transition>
            </button>
            <button @click="handleLoginClick" class="nav-icon-btn">
              <font-awesome-icon
                :icon="faRightToBracket"
                :class="{ 'flip-once': loginFlip }"
              />
              <span class="nav-label">Login</span>
            </button>
          </div>

          <div v-else class="home-nav-user">
            <div class="notification-bell-container">
              <button
                @click="toggleNotificationDropdown"
                class="notification-bell-btn"
                aria-label="Notifications"
              >
                <font-awesome-icon :icon="faBell" />
                <span v-if="unreadCount > 0" class="notification-badge">
                  {{ unreadCount > 99 ? "99+" : unreadCount }}
                </span>
              </button>
              <NotificationDropdown
                :is-open="showNotificationDropdown"
                @close="closeNotificationDropdown"
              />
            </div>
            <button
              @click="toggleDark"
              class="nav-icon-btn"
              aria-label="Toggle dark mode"
            >
              <transition name="fade" mode="out-in">
                <font-awesome-icon
                  v-if="isDark"
                  :icon="faSun"
                  :class="{ 'spin-once': spinOnce }"
                  style="color: #fddb59"
                />
                <font-awesome-icon
                  v-else
                  :icon="faMoon"
                  :class="{ 'spin-once-reverse': spinOnce }"
                />
              </transition>
            </button>
            <button
              @click="toggleProfileSettings"
              class="nav-icon-btn"
              aria-label="Settings"
            >
              <font-awesome-icon :icon="faCog" />
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Not Home Page -->
    <div v-else class="top-nav main-backdrop-filter">
      <div class="home-nav-container">
        <div class="home-nav-left">
          <router-link to="/" class="home-nav-logo" @click="handleHomeClick">
            <font-awesome-icon
              :icon="['fas', 'house-chimney']"
              :class="{ 'flip-once': homeFlip }"
            />
            <span class="logo-text">GTA Fan Hub</span>
          </router-link>
        </div>

        <nav class="home-nav-center">
          <router-link
            to="/Social"
            class="nav-item"
            :class="{ active: route.name === 'Social' }"
          >
            <font-awesome-icon :icon="['fas', 'user-group']" />
            <span class="nav-label">Social</span>
          </router-link>
          <router-link
            to="/Events"
            class="nav-item"
            :class="{ active: route.name === 'Events' }"
          >
            <font-awesome-icon :icon="['fas', 'calendar-day']" />
            <span class="nav-label">Events</span>
          </router-link>
          <router-link
            to="/News"
            class="nav-item"
            :class="{ active: route.name === 'News' }"
          >
            <font-awesome-icon :icon="['fas', 'newspaper']" />
            <span class="nav-label">News</span>
          </router-link>
          <router-link
            to="/Characters"
            class="nav-item"
            :class="{ active: route.name === 'Characters' }"
          >
            <font-awesome-icon :icon="['fas', 'users']" />
            <span class="nav-label">Characters</span>
          </router-link>
        </nav>

        <div class="home-nav-right">
          <div v-if="!isLoggedIn" class="home-nav-auth">
            <button @click="handleRegisterClick" class="nav-icon-btn">
              <font-awesome-icon
                :icon="faUserPlus"
                :class="{ 'flip-once': registerFlip }"
              />
              <span class="nav-label">Register</span>
            </button>
            <button
              @click="toggleDark"
              class="nav-icon-btn"
              aria-label="Toggle dark mode"
            >
              <transition name="fade" mode="out-in">
                <font-awesome-icon
                  v-if="isDark"
                  :icon="faSun"
                  :class="{ 'spin-once': spinOnce }"
                  style="color: #fddb59"
                />
                <font-awesome-icon
                  v-else
                  :icon="faMoon"
                  :class="{ 'spin-once-reverse': spinOnce }"
                />
              </transition>
            </button>
            <button @click="handleLoginClick" class="nav-icon-btn">
              <font-awesome-icon
                :icon="faRightToBracket"
                :class="{ 'flip-once': loginFlip }"
              />
              <span class="nav-label">Login</span>
            </button>
          </div>

          <div v-else class="home-nav-user">
            <div class="notification-bell-container">
              <button
                @click="toggleNotificationDropdown"
                class="notification-bell-btn"
                aria-label="Notifications"
              >
                <font-awesome-icon :icon="faBell" />
                <span v-if="unreadCount > 0" class="notification-badge">
                  {{ unreadCount > 99 ? "99+" : unreadCount }}
                </span>
              </button>
              <NotificationDropdown
                :is-open="showNotificationDropdown"
                @close="closeNotificationDropdown"
              />
            </div>
            <button
              @click="toggleDark"
              class="nav-icon-btn"
              aria-label="Toggle dark mode"
            >
              <transition name="fade" mode="out-in">
                <font-awesome-icon
                  v-if="isDark"
                  :icon="faSun"
                  :class="{ 'spin-once': spinOnce }"
                  style="color: #fddb59"
                />
                <font-awesome-icon
                  v-else
                  :icon="faMoon"
                  :class="{ 'spin-once-reverse': spinOnce }"
                />
              </transition>
            </button>
            <button
              @click="toggleProfileSettings"
              class="nav-icon-btn"
              aria-label="Settings"
            >
              <font-awesome-icon :icon="faCog" />
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Left Sidebar -->
    <aside v-if="showLeftSidebar" class="left-sidebar main-backdrop-filter">
      <div class="left-sidebar_top-content">
        <UserSearch />

        <!-- User Profile Section (if logged in) -->
        <div
          v-if="isLoggedIn && currentUser && currentUser.username"
          class="left-sidebar-profile-container"
        >
          <router-link
            :to="`/profile/${currentUser.username}`"
            class="left-sidebar-profile-link"
            :class="{ 'expanded-bg': isExpandedProfileMode }"
            @click="handleProfileLinkClick"
          >
            <!-- Background overlay for expanded mode -->
            <div
              class="profile-bg-image"
              :class="{ 'is-visible': isExpandedProfileMode }"
              :style="profileBackgroundStyle"
            >
              <div class="profile-bg-overlay"></div>
            </div>

            <div
              class="profile-content"
              :class="{ 'expanded-mode': isExpandedProfileMode }"
            >
              <div
                class="profile-avatar-wrapper"
                :class="{ 'is-hidden': isExpandedProfileMode }"
              >
                <img
                  :src="getUserAvatarUrl"
                  :alt="currentUser.username"
                  class="left-sidebar-avatar"
                />
              </div>
              <div
                class="left-sidebar-username"
                :class="{ 'expanded-username': isExpandedProfileMode }"
              >
                {{ currentUser.username }}
              </div>
            </div>

            <!-- Options button (appears on hover) -->
            <div class="profile-options">
              <button @click="toggleProfileOptions" class="profile-options-btn">
                <font-awesome-icon :icon="faEllipsisH" />
              </button>
            </div>
          </router-link>
        </div>
        <button
          v-if="isLoggedIn"
          @click="openCreatePostModal"
          class="create-post-btn left-sidebar-item"
        >
          <font-awesome-icon :icon="['fas', 'plus-circle']" />
          <span class="create-post-label left-sidebar-label">
            Create Post
            <font-awesome-icon
              :icon="['fas', 'square-plus']"
              class="create-post-icon"
            />
          </span>
        </button>
        <router-link
          to="/"
          class="left-sidebar-item"
          :class="{ active: route.name === 'Home' }"
          @click="handleHomeClick"
        >
          <font-awesome-icon :icon="['fas', 'house-chimney']" />
          <span class="left-sidebar-label">Home</span>
        </router-link>

        <router-link
          v-if="isLoggedIn && currentUser?.username"
          :to="`/profile/${currentUser.username}`"
          class="left-sidebar-item"
          :class="{ active: route.name === 'Profile' }"
        >
          <font-awesome-icon :icon="['fas', 'user']" />
          <span class="left-sidebar-label">Profile</span>
        </router-link>
        <router-link
          to="/Missions"
          class="left-sidebar-item"
          :class="{ active: route.name === 'Missions' }"
        >
          <font-awesome-icon :icon="['fas', 'tasks']" />
          <span class="left-sidebar-label">Missions</span>
        </router-link>
        <router-link
          to="/Story"
          class="left-sidebar-item"
          :class="{ active: route.name === 'Story' }"
        >
          <font-awesome-icon :icon="['fas', 'book']" />
          <span class="left-sidebar-label">Story</span>
        </router-link>
        <router-link
          to="/Lore"
          class="left-sidebar-item"
          :class="{ active: route.name === 'Lore' }"
        >
          <font-awesome-icon :icon="['fas', 'book-open']" />
          <span class="left-sidebar-label">Lore</span>
        </router-link>
        <router-link
          to="/City"
          class="left-sidebar-item"
          :class="{ active: route.name === 'City' }"
        >
          <font-awesome-icon :icon="['fas', 'city']" />
          <span class="left-sidebar-label">City</span>
        </router-link>
      </div>
      <div class="left-sidebar_bottom-content">
        <button class="left-sidebar-item">
          <font-awesome-icon :icon="['fas', 'bars']" />
          <span class="left-sidebar-label">More</span>
        </button>
        <button @click="toggleProfileSettings" class="left-sidebar-item">
          <font-awesome-icon :icon="['fas', 'cog']" />
          <span class="left-sidebar-label">Settings</span>
        </button>
        <router-link
          to="/About"
          class="left-sidebar-item"
          :class="{ active: route.name === 'About' }"
        >
          <font-awesome-icon :icon="['fas', 'circle-info']" />
          <span class="left-sidebar-label">About</span>
        </router-link>
      </div>

      <!-- Profile Settings Modal -->
      <div
        v-if="showProfileSettings"
        class="profile-settings-modal"
        @click="toggleProfileSettings"
      >
        <div class="profile-settings-content" @click.stop>
          <div class="settings-header">
            <h3>Profile Display Settings</h3>
            <button @click="toggleProfileSettings" class="close-btn">
              <font-awesome-icon :icon="faTimes" />
            </button>
          </div>
          <div class="settings-body">
            <div class="settings-section">
              <h4>Background Style</h4>
              <div class="settings-options">
                <button
                  @click="setProfileDisplayMode('default')"
                  class="settings-option-card"
                  :class="{ active: profileDisplayMode === 'default' }"
                >
                  <font-awesome-icon :icon="faSquare" />
                  <span>Default</span>
                </button>
                <button
                  @click="setProfileDisplayMode('expanded')"
                  class="settings-option-card"
                  :class="{ active: profileDisplayMode === 'expanded' }"
                >
                  <font-awesome-icon :icon="faImage" />
                  <span>Expanded Background</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Options Modal -->
      <Teleport to="body">
        <div
          v-if="showProfileOptions"
          class="profile-options-modal"
          @click="closeProfileOptions"
        >
          <div
            class="profile-options-modal-content main-backdrop-filter"
            @click.stop
          >
            <div class="profile-options-modal-header">
              <h3>Profile Display Mode</h3>
              <button @click="closeProfileOptions" class="close-btn">
                <font-awesome-icon :icon="faTimes" />
              </button>
            </div>
            <div class="profile-options-modal-body">
              <button
                @click="setProfileDisplayMode('default')"
                class="profile-option-btn"
                :class="{ active: profileDisplayMode === 'default' }"
              >
                <font-awesome-icon :icon="['fas', 'square']" />
                Default
              </button>
              <button
                @click="setProfileDisplayMode('expanded')"
                class="profile-option-btn"
                :class="{ active: profileDisplayMode === 'expanded' }"
              >
                <font-awesome-icon :icon="faImage" />
                Expanded
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </aside>
    <LoginAndRegModal
      v-if="showLoginModal || showRegisterModal"
      :mode="showLoginModal ? 'login' : 'register'"
      :loginError="loginError"
      @close="closeModal"
      @registered="closeModal"
      @logged-in="closeModal"
    />

    <!-- Create Post Modal -->
    <CreatePostModal
      v-if="showCreatePostModal"
      @close="closeCreatePostModal"
      @posted="handlePostCreated"
    />

    <!-- Settings Modal -->
    <SettingsModal v-if="showProfileSettings" @close="toggleProfileSettings" />

    <!-- Real-time Notification Toasts -->
    <NotificationToastContainer v-if="isLoggedIn" />

    <router-view 
      class="components-routerView" 
      v-slot="{ Component, route }"
    >
      <transition name="fade" mode="out-in">
        <keep-alive :include="['Home']">
          <component
            v-if="Component"
            :is="Component"
            :key="route.fullPath"
          />
          <div v-else class="route-error">
            <p>Loading route...</p>
          </div>
        </keep-alive>
      </transition>
    </router-view>
  </div>
</template>

<style scoped>
.error {
  color: var(--coral-red);
  font-size: 0.9rem;
  text-align: center;
  margin-top: 10px;
}
/* Animation for Home Bar START*/
.spin-once {
  animation: spin 1s linear;
}
.spin-once-reverse {
  animation: spin-reverse 1s linear;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes spin-reverse {
  from {
    transform: rotate(-180deg);
  }
  to {
    transform: rotate(180deg);
  }
}
@keyframes flip {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(180deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}
.flip-once {
  animation: flip 1s;
}
/* Animation for Home Bar END*/
/* Home Page Top Navigation Bar */

.home-top-nav,
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: auto;
  min-height: 64px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.home-nav-container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  gap: var(--space-lg);
}

.home-nav-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  width: 181.58px;
  max-width: 181.58px;
  height: 32px;
}

.home-nav-logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  text-decoration: none;
  color: var(--bright-white);
  font-size: var(--text-xl);
  font-weight: 700;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.home-nav-logo:hover {
  background: rgba(255, 255, 255, 0.1);
}

.home-nav-logo svg {
  font-size: var(--text-2xl);
  color: var(--electric-blue);
}

.logo-text {
  font-family: "Montserrat", sans-serif;
  letter-spacing: -0.5px;
}

.home-nav-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.3rem;
  flex: 1;
}

.home-nav-center .nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  min-width: 48px;
  height: auto;
  min-height: 48px;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--bright-white);
  transition: all 0.2s ease;
  position: relative;
}

.home-nav-center .nav-item svg {
  font-size: var(--text-xl);
  flex-shrink: 0;
}

.home-nav-center .nav-item .nav-label {
  font-size: var(--text-xs);
  font-weight: 500;
  white-space: nowrap;
  line-height: 1;
}

.home-nav-center .nav-item:hover {
  background: transparent;
  color: var(--bright-white);
}

.home-nav-center .nav-item:hover svg {
  color: var(--mint-green);
}

.home-nav-center .nav-item:hover .nav-label {
  color: var(--bright-white);
}

.home-nav-center .nav-item.active {
  color: var(--bright-white);
}

.home-nav-center .nav-item.active:hover {
  color: var(--bright-white);
}

.home-nav-center .nav-item.active:hover svg {
  color: var(--mint-green);
}

.home-nav-center .nav-item.active:hover .nav-label {
  color: var(--bright-white);
}

.home-nav-center .nav-item.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: var(--electric-blue);
  border-radius: 2px 2px 0 0;
}

.home-nav-right {
  display: flex;
  flex-shrink: 0;
  width: auto;
  height: auto;
}

.home-nav-auth,
.home-nav-user {
  width: 100%;
  display: flex;
  margin: 0;
  padding: 0;
  gap: var(--space-sm);
}

.notification-bell-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  min-width: 40px;
  height: auto;
  min-height: 40px;
  padding: var(--space-xs) var(--space-sm);
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--bright-white);
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0;
  position: relative;
  text-decoration: none;
}
.notification-bell-btn svg {
  font-size: var(--text-lg);
  margin: 0;
  padding: 0;
  flex-shrink: 0;
}
.nav-icon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  min-width: 40px;
  height: auto;
  min-height: 40px;
  padding: var(--space-xs) var(--space-sm);
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--bright-white);
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0;
  position: relative;
  text-decoration: none;
}

.nav-icon-btn svg {
  font-size: var(--text-lg);
  margin: 0;
  padding: 0;
  flex-shrink: 0;
}

.nav-icon-btn .nav-label {
  font-size: var(--text-xs);
  font-weight: 500;
  white-space: nowrap;
  line-height: 1;
  text-decoration: none;
}

/* Ensure toggle dark mode button aligns with other nav icons */
.home-top-nav .nav-icon-btn[aria-label="Toggle dark mode"],
.top-nav .nav-icon-btn[aria-label="Toggle dark mode"] {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-sm);
}

.home-top-nav .nav-icon-btn[aria-label="Toggle dark mode"] svg,
.top-nav .nav-icon-btn[aria-label="Toggle dark mode"] svg {
  margin-bottom: 6px;
}

/* Ensure settings button aligns with other nav icons */
.home-top-nav .nav-icon-btn[aria-label="Settings"],
.top-nav .nav-icon-btn[aria-label="Settings"] {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-sm);
}

.home-top-nav .nav-icon-btn[aria-label="Settings"] svg,
.top-nav .nav-icon-btn[aria-label="Settings"] svg {
  margin-bottom: 6px;
}

/* Fix transition container alignment */
.home-top-nav .nav-icon-btn[aria-label="Toggle dark mode"] .fade-enter-active,
.home-top-nav .nav-icon-btn[aria-label="Toggle dark mode"] .fade-leave-active,
.top-nav .nav-icon-btn[aria-label="Toggle dark mode"] .fade-enter-active,
.top-nav .nav-icon-btn[aria-label="Toggle dark mode"] .fade-leave-active {
  transition: opacity 0.2s;
}

.home-top-nav .nav-icon-btn[aria-label="Toggle dark mode"] .fade-enter-from,
.home-top-nav .nav-icon-btn[aria-label="Toggle dark mode"] .fade-leave-to,
.top-nav .nav-icon-btn[aria-label="Toggle dark mode"] .fade-enter-from,
.top-nav .nav-icon-btn[aria-label="Toggle dark mode"] .fade-leave-to {
  opacity: 0;
}
/* Responsive adjustments for home top nav and top nav */
@media (max-width: 768px) {
  .home-nav-container {
    padding: 0 var(--space-md);
    gap: var(--space-md);
  }

  .logo-text {
    display: none;
  }

  .home-nav-center {
    gap: var(--space-xs);
  }

  .home-nav-center .nav-item {
    min-width: 40px;
    min-height: 40px;
    height: auto;
    padding: var(--space-xs);
  }

  .home-nav-center .nav-item svg {
    font-size: var(--text-lg);
  }

  .home-nav-center .nav-item .nav-label {
    display: none;
  }

  .nav-icon-btn {
    min-width: 36px;
    min-height: 36px;
    height: auto;
    padding: var(--space-xs);
  }

  .nav-icon-btn svg {
    font-size: var(--text-base);
  }

  .nav-icon-btn .nav-label {
    display: none;
  }
}

@media (max-width: 640px) {
  .home-top-nav,
  .top-nav {
    height: 48px;
    min-height: 48px;
  }

  .home-nav-container {
    padding: 0 var(--space-sm);
    gap: var(--space-sm);
  }

  .home-nav-center {
    gap: 4px;
  }

  .home-nav-center .nav-item .nav-label {
    display: none;
  }

  .nav-icon-btn .nav-label {
    display: none;
  }

  .home-nav-center .nav-item {
    min-width: 36px;
    min-height: 36px;
    height: auto;
  }

  .home-nav-center .nav-item svg {
    font-size: var(--text-base);
  }

  .nav-icon-btn {
    width: 32px;
    height: 32px;
  }
}

.button-icons {
  font-size: 30px;
}

.BGimg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: brightness(1) contrast(1.2);
  transition: filter 3s ease;
  z-index: -1; /* Ensure background stays behind content */
}

/* Dark mode CSS */
.dark-mode {
  --background-primary: #16171d;
  --text-primary: #ffffff;
  /* Add more dark mode variable overrides as needed */
}

.app {
  transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
}

.app.dark-mode {
  /* Remove solid background to allow background image to show through */
  color: var(--text-primary);
  transition: color 0.3s ease-in-out;
}

.dark-mode-image {
  filter: brightness(0.3) contrast(1.1) saturate(0.8) hue-rotate(20deg);
  transition: filter 2s ease-in-out;
}

/*Animations for page browsing START */
.countdown-move-enter-active,
.countdown-move-leave-active {
  transition: all 0.5s ease;
}
.countdown-move-enter-from,
.countdown-move-leave-to {
  transform: scale(0.5);
  opacity: 0;
}
/*Animations for page browsing END */
.app {
  padding: 0%;
  margin: 0%;
  overflow-y: auto;
  display: flex;
  height: 100vh;
  min-height: 100vh;
  width: 100vw;
  justify-content: center;
  flex-direction: column;
  overflow-y: auto;
}
.app.has-sidebar {
  align-items: center;
}
.components-routerView {
  background-color: transparent; /* Remove hardcoded background */
  position: relative; /* Change to relative to respect parent flow */
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 55%;
  min-height: 100vh; /* Ensure it takes up space */
  z-index: 1; /* Ensure it's above background */
}

.components-routerView .loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: var(--space-lg);
}

.components-routerView .loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--steel-gray, #666);
  border-top: 4px solid var(--skyOrange, #ff6b6b);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Left Sidebar */
.left-sidebar {
  position: fixed;
  left: 0;
  top: 64px;
  width: 250px;
  height: calc(100vh - 64px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-lg);
  z-index: 999;
  overflow-y: auto;
  overflow-x: visible;
}

.left-sidebar_top-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.left-sidebar_bottom-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: 50px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.left-sidebar-search {
  margin-bottom: var(--space-md);
}

.left-sidebar-search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  color: var(--bright-white);
  font-size: var(--text-base);
  transition: all 0.2s ease;
}

.left-sidebar-search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.left-sidebar-search-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

.left-sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--bright-white);
  transition: all 0.2s ease;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: var(--text-base);
  font-weight: 500;
  position: relative;
}
.create-post-btn {
  justify-content: center;
  align-items: center;
  border: 1px solid transparent;
}

.create-post-btn:hover {
  background: var(--neon-pink2HeaderBtnBG);
  border: 1px solid var(--neon-pinkBoarders);
}
.create-post-btn:hover svg,
.create-post-btn:hover .create-post-icon,
.create-post-btn:hover .create-post-label,
.create-post-btn:hover .left-sidebar-label {
  color: var(--bright-white);
}
.create-post-label {
  font-family: "Montserrat";
  font-weight: 580;
  font-size: var(--text-lg);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.create-post-icon {
  font-size: var(--text-base);
  flex-shrink: 0;
}
/* Username Profile Link */
.left-sidebar-profile-link {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.left-sidebar-profile-link:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  border: 1px solid var(--neon-pinkBoarders);
}

.left-sidebar-avatar {
  width: 55px;
  height: 55px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: width 0.2s ease, height 0.2s ease, opacity 0.2s ease,
    transform 0.2s ease, border-color 0.2s ease;
}

.left-sidebar-profile-link:hover .left-sidebar-avatar {
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.05);
}

.profile-avatar-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 55px;
  transition: width 0.2s ease, opacity 0.2s ease, margin-right 0.2s ease;
  overflow: hidden;
}

.profile-avatar-wrapper.is-hidden {
  width: 0;
  margin-right: 0;
  opacity: 0;
}

.profile-avatar-wrapper.is-hidden .left-sidebar-avatar {
  opacity: 0;
  transform: scale(0.65);
}

.left-sidebar-profile-link:hover .left-sidebar-username {
  color: var(--bright-white);
}

.left-sidebar-username {
  font-weight: 600;
  font-size: var(--text-base);
  color: var(--bright-white);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  transition: all 0.2s ease;
}

/* Profile Container */
.left-sidebar-profile-container {
  position: relative;
  overflow: visible;
}

/* Update existing .left-sidebar-profile-link */
.left-sidebar-profile-link {
  position: relative;
  overflow: visible;
  transition: all 0.2s ease;
}

.profile-content {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  position: relative;
  z-index: 2;
  transition: all 0.2s ease;
}

.profile-content.expanded-mode {
  justify-content: center;
  align-items: center;
  width: 100%;
  text-align: center;
  gap: 0;
}

.profile-content.expanded-mode .left-sidebar-username {
  width: 100%;
  text-align: center;
}

/* Expanded background styles */
.left-sidebar-profile-link.expanded-bg {
  min-height: 120px;
  transition: all 0.2s ease;
}

.left-sidebar-profile-link.expanded-bg:hover {
  border: 1px solid var(--neon-pinkBoarders);
}

.profile-bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  z-index: 1;
  overflow: hidden;
  border-radius: var(--radius-md);
  opacity: 0;
  pointer-events: none;
  filter: brightness(0.9) saturate(1.05);
  transition: opacity 0.2s ease, filter 0.2s ease;
}

.profile-bg-image.is-visible {
  opacity: 1;
  filter: brightness(0.7) saturate(0.95);
}

.profile-bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.55) 0%,
    rgba(0, 0, 0, 0.32) 45%,
    rgba(0, 0, 0, 0.25) 100%
  );
  opacity: 0;
  transition: opacity 0.2s ease;
}

.profile-bg-image.is-visible .profile-bg-overlay {
  opacity: 0.78;
}

.left-sidebar-profile-container:hover .profile-options,
.profile-options:focus-within {
  opacity: 1;
  pointer-events: auto;
}

.profile-options {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  z-index: 5;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.profile-options-btn {
  padding: var(--space-sm);
  color: var(--bright-white);
  cursor: pointer;
  transition: color 0.2s ease;
  background: none;
  border: none;
  outline: none;
}

.profile-options-btn:hover {
  color: var(--neon-pink2);
}

.left-sidebar-profile-link.expanded-bg .left-sidebar-username {
  font-size: var(--text-lg);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

/* Profile Options Modal */
.profile-options-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.profile-options-modal-content {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-xl);
  width: 90%;
  max-width: 400px;
  padding: var(--space-xl);
  box-shadow: var(--shadow-2xl);
}

.profile-options-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.profile-options-modal-header h3 {
  color: var(--bright-white);
  font-size: var(--text-2xl);
  margin: 0;
}

.profile-options-modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.profile-option-btn {
  width: 100%;
  padding: var(--space-lg) var(--space-xl);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  color: var(--bright-white);
  font-size: var(--text-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  transition: all 0.2s ease;
  text-align: left;
}

.profile-option-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--electric-blue);
  color: var(--bright-white);
}

.profile-option-btn.active {
  background: rgba(98, 181, 229, 0.2);
  border-color: var(--neon-pink2);
  color: var(--bright-white);
}

/* Settings Modal */
.profile-settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.profile-settings-content {
  background: var(--glass-morphism-bg);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-xl);
  width: 90%;
  max-width: 500px;
  padding: var(--space-xl);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.settings-header h3 {
  color: var(--bright-white);
  font-size: var(--text-2xl);
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--bright-white);
  font-size: var(--text-xl);
  cursor: pointer;
  padding: var(--space-sm);
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: var(--coral-red);
}

.settings-section h4 {
  color: var(--bright-white);
  font-size: var(--text-lg);
  margin-bottom: var(--space-md);
}

.settings-options {
  display: flex;
  gap: var(--space-md);
}

.settings-option-card {
  flex: 1;
  padding: var(--space-lg);
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  color: var(--bright-white);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  transition: all 0.3s ease;
}

.settings-option-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.settings-option-card.active {
  background: rgba(0, 191, 255, 0.2);
  border-color: var(--electric-blue);
}

.settings-option-card svg {
  font-size: var(--text-3xl);
}

.left-sidebar-item:hover:not(.create-post-btn) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--mint-green);
  transform: translateX(5px);
}

.left-sidebar-item:hover:not(.create-post-btn) svg {
  color: var(--mint-green);
}

.left-sidebar-item.active {
  color: var(--bright-white);
  font-weight: 600;
}

.left-sidebar-item.active::before {
  content: "";
  position: absolute;
  left: calc(-1 * var(--space-lg));
  width: 3px;
  height: 24px;
  background: var(--electric-blue);
  border-radius: 0 2px 2px 0;
}

.left-sidebar-item svg {
  font-size: var(--text-xl);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.left-sidebar-label {
  white-space: nowrap;
  color: var(--bright-white);
}

/* Position dropdown below top nav on home page and other pages */
.home-top-nav .notification-bell-container :deep(.notification-dropdown),
.top-nav .notification-bell-container :deep(.notification-dropdown) {
  position: fixed !important;
  top: calc(56px + 8px) !important;
  right: var(--space-lg) !important;
  left: auto !important;
  transform: translateX(0) !important;
  z-index: 99999 !important;
  max-width: 380px;
  width: 380px;
}

@media (max-width: 640px) {
  .home-top-nav .notification-bell-container :deep(.notification-dropdown),
  .top-nav .notification-bell-container :deep(.notification-dropdown) {
    top: calc(48px + 8px) !important;
    right: var(--space-md) !important;
    max-width: calc(100vw - var(--space-md) * 2);
    width: calc(100vw - var(--space-md) * 2);
  }
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: var(--neon-pink2);
  color: white;
  border-radius: 10px;
  padding: 2px 5px;
  font-size: 10px;
  font-weight: bold;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.demo-mode-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(90deg, var(--neon-pink2), var(--electric-blue));
  color: white;
  text-align: center;
  padding: 8px;
  font-size: 12px;
  font-weight: bold;
  z-index: 10000;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
  animation: pulse 2s ease-in-out infinite;
}

.demo-mode-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* Adjust app content to account for banner at bottom */
.app {
  padding-bottom: 32px; /* Space for demo banner at bottom */
}

/* Fade transition for router-view */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
