<!-- App.vue -->
<script setup>
import { useStore } from "vuex";
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios, { refreshAccessToken } from "@/utils/axios";
import { parseApiError } from "@/utils/api";
import {
  faSun,
  faMoon,
  faRightToBracket,
  faUserPlus,
  faBell,
} from "@fortawesome/free-solid-svg-icons";
import "./assets/main.css";
import LoginAndRegModal from "./components/loginAndRegModal.vue";
import NotificationToastContainer from "./components/NotificationToastContainer.vue";
import NotificationDropdown from "./components/NotificationDropdown.vue";
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

const loginFlip = ref(false);
const registerFlip = ref(false);
const homeFlip = ref(false);
const spinOnce = ref(false);
const isDark = ref(getInitialDarkMode());
const isMinimized = ref(false);
const showLoginModal = ref(false);
const showRegisterModal = ref(false);

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
const isLoggedIn = computed(() => store.getters.isLoggedIn);
const currentUser = computed(() => store.state.user);
const unreadCount = computed(() => store.getters["notifications/unreadCount"]);

// Notification dropdown state
const showNotificationDropdown = ref(false);

const toggleNotificationDropdown = () => {
  showNotificationDropdown.value = !showNotificationDropdown.value;
};

const closeNotificationDropdown = () => {
  showNotificationDropdown.value = false;
};

// Dynamic keep-alive: check if component declares it needs caching
const getCachedComponents = (Component) => {
  if (!Component) return [];
  // Check if component declares it needs caching
  return Component.keepAlive === true ? [Component.name] : [];
};

// Route key - increment to force reload on same-route clicks
const routeKey = ref(0);

// Handle navigation clicks to force reload when clicking same route
const handleNavClick = (targetPath) => {
  if (route.path === targetPath) {
    // Same route clicked - force reload
    routeKey.value++;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

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
  <div class="app" :class="{ 'dark-mode': isDark }">
    <img
      class="BGimg"
      src="/src/assets/images/BG.jpg"
      :class="{ 'dark-mode-image': isDark }"
    />
    <!-- Home Page -->
    <div v-if="isHomePage" class="home-bar">
      <div v-if="!isLoggedIn" class="auth-buttons">
        <router-link
          to="/"
          class="home-btn sidebar-btn"
          @click="handleHomeClick"
        >
          <font-awesome-icon
            :icon="['fas', 'house-chimney']"
            :class="{ 'flip-once': homeFlip, 'button-icons': true }"
            style="color: #ffffff"
          />
        </router-link>
        <router-link to="/News" class="news-btn sidebar-btn">
          <font-awesome-icon
            :icon="['fas', 'newspaper']"
            :class="{ 'flip-once': homeFlip, 'button-icons': true }"
            style="color: #ffffff"
            alt="News"
          />
        </router-link>

        <router-link to="/About" class="about-btn sidebar-btn">
          <font-awesome-icon
            :icon="['fas', 'circle-info']"
            :class="{ 'flip-once': homeFlip, 'button-icons': true }"
            style="color: #ffffff"
            alt="About"
          />
        </router-link>

        <button @click="handleRegisterClick" class="register-btn sidebar-btn">
          <transition name="fade" mode="out-in">
            <font-awesome-icon
              :icon="faUserPlus"
              :class="{ 'flip-once': registerFlip, 'button-icons': true }"
              style="color: #ffffff"
            />
          </transition>
        </button>
        <button
          @click="toggleDark"
          class="toggle-dark-btn sidebar-btn"
          aria-label="Toggle dark mode"
        >
          <transition name="fade" mode="out-in">
            <font-awesome-icon
              v-if="isDark"
              :icon="faSun"
              :class="{ 'spin-once': spinOnce, 'button-icons': true }"
              style="color: #ffffff"
            />
            <font-awesome-icon
              v-else
              :icon="faMoon"
              :class="{ 'spin-once-reverse': spinOnce, 'button-icons': true }"
              style="color: #ffffff"
            />
          </transition>
        </button>
        <button @click="handleLoginClick" class="login-btn sidebar-btn">
          <transition name="fade" mode="out-in">
            <font-awesome-icon
              :icon="faRightToBracket"
              :class="{ 'flip-once': loginFlip, 'button-icons': true }"
              style="color: #ffffff"
            />
          </transition>
        </button>
      </div>

      <div v-else class="User-buttons">
        <router-link
          :to="`/profile/${currentUser?.username}`"
          class="profile-btn sidebar-btn"
          :class="{ 'flip-once': homeFlip, 'button-icons': true }"
          aria-label="Profile"
        >
          <font-awesome-icon
            :icon="['fas', 'user']"
            :class="{ 'flip-once': homeFlip, 'button-icons': true }"
            style="color: #ffffff"
          />
        </router-link>
        <div class="notification-bell-container">
          <button
            @click="toggleNotificationDropdown"
            class="notification-bell-btn toggle-dark-btn sidebar-btn"
            aria-label="Notifications"
          >
            <font-awesome-icon
              :icon="faBell"
              :class="{ 'button-icons': true }"
              style="color: #ffffff"
            />
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
          class="toggle-dark-btn sidebar-btn"
          aria-label="Toggle dark mode"
        >
          <transition name="fade" mode="out-in">
            <font-awesome-icon
              v-if="isDark"
              :icon="faSun"
              :class="{ 'spin-once': spinOnce, 'button-icons': true }"
              style="color: #fddb59"
            />
            <font-awesome-icon
              v-else
              :icon="faMoon"
              :class="{ 'spin-once-reverse': spinOnce, 'button-icons': true }"
              style="color: #ffffff"
            />
          </transition>
        </button>
      </div>
    </div>
    <!-- Not Home Page -->
    <div v-else class="navBar-container">
      <nav class="navbar">
        <router-link
          to="/"
          class="nav-icon"
          data-text="Home"
          @click="handleNavClick('/')"
          ><span>HOME</span></router-link
        >
        <router-link
          to="/news"
          class="nav-icon"
          data-text="News"
          @click="handleNavClick('/news')"
          ><span>NEWS</span></router-link
        >
        <router-link
          to="/Characters"
          class="nav-icon"
          data-text="Characters"
          @click="handleNavClick('/Characters')"
          ><span>CHARACTERS</span></router-link
        >
        <router-link
          to="/Missions"
          class="nav-icon"
          data-text="Missions"
          @click="handleNavClick('/Missions')"
          ><span>MISSIONS</span></router-link
        >
        <router-link
          to="/Story"
          class="nav-icon"
          data-text="Story"
          @click="handleNavClick('/Story')"
          ><span>STORY</span></router-link
        >
        <router-link
          to="/Lore"
          class="nav-icon"
          data-text="Lore"
          @click="handleNavClick('/Lore')"
          ><span>LORE</span></router-link
        >
        <router-link
          to="/About"
          class="nav-icon"
          data-text="About"
          @click="handleNavClick('/About')"
          ><span>ABOUT</span></router-link
        >
        <router-link
          v-if="isLoggedIn"
          :to="`/profile/${currentUser?.username}`"
          class="nav-icon"
          data-text="Profile"
          @click="handleNavClick(`/profile/${currentUser?.username}`)"
        >
          <span>PROFILE</span>
        </router-link>
      </nav>
      <div v-if="!isLoggedIn" class="auth-buttons">
        <button @click="handleRegisterClick" class="register-btn">
          <transition name="fade" mode="out-in">
            <font-awesome-icon
              :icon="faUserPlus"
              :class="{ 'flip-once': registerFlip, 'button-icons': true }"
              style="color: #fddb59"
            />
          </transition>
        </button>
        <button
          @click="toggleDark"
          class="toggle-dark-btn"
          aria-label="Toggle dark mode"
        >
          <transition name="fade" mode="out-in">
            <font-awesome-icon
              v-if="isDark"
              :icon="faSun"
              :class="{ 'spin-once': spinOnce, 'button-icons': true }"
              style="color: #fddb59"
            />
            <font-awesome-icon
              v-else
              :icon="faMoon"
              :class="{ 'spin-once-reverse': spinOnce, 'button-icons': true }"
              style="color: #ffffff"
            />
          </transition>
        </button>
        <button @click="handleLoginClick" class="login-btn">
          <transition name="fade" mode="out-in">
            <font-awesome-icon
              :icon="faRightToBracket"
              :class="{ 'flip-once': loginFlip, 'button-icons': true }"
              style="color: #fddb59"
            />
          </transition>
        </button>
      </div>
      <div v-else class="naved-home-bar User-buttons">
        <router-link
          :to="`/profile/${currentUser?.username}`"
          class="profile-btn sidebar-btn"
          :class="{ 'flip-once': homeFlip, 'button-icons': true }"
        >
          <font-awesome-icon
            :icon="['fas', 'user']"
            :class="{ 'flip-once': homeFlip, 'button-icons': true }"
            style="color: #fddb59"
          />
        </router-link>
        <div class="notification-bell-container">
          <button
            @click="toggleNotificationDropdown"
            class="notification-bell-btn toggle-dark-btn"
            aria-label="Notifications"
          >
            <font-awesome-icon
              :icon="faBell"
              :class="{ 'button-icons': true }"
              style="color: #fddb59"
            />
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
          class="toggle-dark-btn"
          aria-label="Toggle dark mode"
        >
          <transition name="fade" mode="out-in">
            <font-awesome-icon
              v-if="isDark"
              :icon="faSun"
              :class="{ 'spin-once': spinOnce, 'button-icons': true }"
              style="color: #fddb59"
            />
            <font-awesome-icon
              v-else
              :icon="faMoon"
              :class="{ 'spin-once-reverse': spinOnce, 'button-icons': true }"
              style="color: #ffffff"
            />
          </transition>
        </button>
      </div>
    </div>
    <LoginAndRegModal
      v-if="showLoginModal || showRegisterModal"
      :mode="showLoginModal ? 'login' : 'register'"
      :loginError="loginError"
      @close="closeModal"
      @registered="closeModal"
      @logged-in="closeModal"
    />

    <!-- Real-time Notification Toasts -->
    <NotificationToastContainer v-if="isLoggedIn" />

    <router-view class="components-routerView" v-slot="{ Component, route }">
      <keep-alive :include="getCachedComponents(Component)">
        <component
          :is="Component"
          :key="`${
            route.name === 'ArticleDetails' ? route.name : route.fullPath
          }-${routeKey}`"
        />
      </keep-alive>
    </router-view>
  </div>
</template>

<style scoped>
:root {
  --deep-black: rgb(0, 0, 0); /* Deep Black */
  --deep-black2: rgb(60, 60, 60);
  --vibrant-purple: rgb(128, 0, 128); /* Vibrant Purple */
  --soft-lavender: rgb(230, 230, 250); /* Soft Lavender */
  --lavender: rgb(175, 175, 215); /* Soft Lavender */
  --bright-white: rgb(255, 255, 255); /* Bright White */
  --neon-pink: rgb(255, 20, 147); /* Neon Pink */
  --neon-pink2: rgb(231, 22, 225); /* Neon Pink2 */
  --electric-blue: rgb(0, 191, 255); /* Electric Blue */
  --sunset-orange: rgb(255, 99, 71); /* Sunset Orange */
  --mint-green: rgb(152, 255, 152); /* Mint Green */
  --steel-gray: rgb(119, 136, 153); /* Steel Gray */
  --coral-red: rgb(255, 64, 64); /* Coral Red */

  --skyPurp: #454383;
  --skyBlue: #547b98;
  --skyPink: #c56aa8;
  --skyOrange: #fbbd59;

  --background-primary: #ffffff;
  --text-primary: #000000;
}
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

.login-btn,
.register-btn,
.home-btn,
.news-btn,
.characters-btn,
.lore-btn,
.missions-btn,
.events-btn,
.social-btn,
.city-btn,
.story-btn,
.about-btn,
.profile-btn,
.toggle-dark-btn {
  position: relative;
  background: none;
  display: flex;
  padding: 0%;
  height: 100%;
  width: 100%;
  border: none;
  border-top: 1px solid transparent;
  border-bottom: 1px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
  justify-content: center;
  align-items: center;
}
.home-btn:hover {
  border-top: none !important;
}
.login-btn:hover {
  border-bottom: none !important;
}
.home-btn:hover,
.login-btn:hover,
.news-btn:hover,
.characters-btn:hover,
.lore-btn:hover,
.missions-btn:hover,
.events-btn:hover,
.social-btn:hover,
.city-btn:hover,
.story-btn:hover,
.about-btn:hover,
.profile-btn:hover,
.register-btn:hover,
.toggle-dark-btn:hover {
  border-top: 1px solid var(--bright-white);
  border-bottom: 1px solid var(--bright-white);
  background: var(--glass-morphism-bg-lite);
}

.navBar-container {
  position: fixed;
  top: 0%;
  display: flex;
  justify-content: space-around;
  flex-direction: column;
  align-items: center;
  z-index: 20;
  width: 100%;
}
.navbar {
  position: relative;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-direction: row;
  background: var(--glass-morphism-bg);
  backdrop-filter: blur(2.2px);
  border: 1px solid transparent;
  box-shadow: 8px 8px 24px rgba(0, 0, 0, 0.3),
    -8px -8px 24px rgba(80, 80, 90, 0.05);
  transition: all 0.3s ease;
  z-index: 20;
  width: 100%;
  height: 70%;
}
.naved-home-bar {
  z-index: 50;
  position: relative;
  display: flex;
  flex-grow: 1;
  width: 100%;
  height: 30%;
  bottom: 0%;
  border-radius: 0 0 1.2rem 1.2rem;
  backdrop-filter: blur(2.2px);
  background: var(--glass-morphism-bg);
  border: 1px solid transparent;
  box-shadow: 8px 8px 24px rgba(0, 0, 0, 0.3),
    -8px -8px 24px rgba(80, 80, 90, 0.05);
  transition: all 0.3s ease;
}
.naved-home-bar {
  height: auto;
  width: 100%;
  display: flex;
  flex-direction: row;
  flex-grow: 1;
}
.nav-icon[data-text] {
  font-family: "Montserrat";
  font-weight: bold;
  font-size: 1.5rem;
  text-decoration: none;
  color: var(--skyOrange);
  letter-spacing: -1.5px;
}
.home-bar {
  position: fixed;
  left: 0%;
  margin-left: var(--space-lg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 85vh;
  min-height: 85vh;
  max-height: 85vh;
  width: 62px;
  min-width: 62px;
  max-width: 62px;
  background: var(--glass-morphism-bg);
  box-shadow: 8px 8px 24px rgba(0, 0, 0, 0.3),
    -8px -8px 24px rgba(80, 80, 90, 0.05);
  z-index: 50;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(2.2px);
}

.home-bar .auth-buttons,
.home-bar .User-buttons {
  height: 85vh;
  width: 100%;
  min-width: 40px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.sidebar-btn {
  /* Common class for all home-bar buttons */
  position: relative;
  flex: 1;
  min-height: 50px;
}

.button-icons {
  height: 15px;
  min-height: 25px;
  max-height: 35px;
}
.navBar-container .auth-buttons {
  width: 100%;
  display: flex;
  flex-direction: row;
  flex-grow: 1;
}

.BGimg {
  position: fixed;
  width: 100%;
  height: 100vh;
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
.components-routerView {
  background-color: transparent; /* Remove hardcoded background */
  position: relative; /* Change to relative to respect parent flow */
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100%;
  min-height: 100vh; /* Ensure it can grow with content */
}

/* Notification Bell Styles */
.notification-bell-container {
  position: relative;
  display: flex;
  height: 100%;
  width: 100%;
}

.notification-bell-btn {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: #ff4458;
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
</style>
