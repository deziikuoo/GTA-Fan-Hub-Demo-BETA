<template>
  <div class="settings-modal-overlay" @click="handleClose">
    <div class="settings-modal-content" @click.stop>
      <div class="settings-header">
        <h2>Settings</h2>
        <button @click="handleClose" class="close-btn">
          <font-awesome-icon icon="times" />
        </button>
      </div>

      <div class="settings-body">
        <div class="settings-section">
          <h3>Account</h3>
          <div class="settings-options">
            <button
              @click="handleLogout"
              class="logout-btn"
              :disabled="isLoggingOut"
            >
              <font-awesome-icon icon="sign-out-alt" />
              {{ isLoggingOut ? "Logging out..." : "Logout" }}
            </button>
          </div>
        </div>

        <div class="settings-section">
          <h3>Preferences</h3>
          <div class="settings-options">
            <div class="setting-item">
              <label>Dark Mode</label>
              <button @click="toggleDarkMode" class="toggle-btn">
                <font-awesome-icon :icon="isDark ? 'sun' : 'moon'" />
                {{ isDark ? "Light Mode" : "Dark Mode" }}
              </button>
            </div>

            <div class="setting-item">
              <label>Notification Sounds</label>
              <button @click="toggleNotificationSound" class="toggle-btn">
                <font-awesome-icon
                  :icon="soundEnabled ? 'volume-up' : 'volume-mute'"
                />
                {{ soundEnabled ? "Sound On" : "Sound Off" }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-footer">
        <button @click="handleClose" class="cancel-btn">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import axios from "@/utils/axios";

export default {
  name: "SettingsModal",
  emits: ["close"],
  setup(props, { emit }) {
    const store = useStore();
    const router = useRouter();
    const isLoggingOut = ref(false);
    const logoutError = ref(null);

    // Get initial dark mode state from localStorage and sync with document
    const getInitialDarkMode = () => {
      const savedMode = localStorage.getItem("darkMode");
      const darkMode = savedMode ? JSON.parse(savedMode) : false;
      // Ensure document class is synced
      document.documentElement.classList.toggle("dark-mode", darkMode);
      return darkMode;
    };

    const isDark = ref(getInitialDarkMode());

    const handleClose = () => {
      emit("close");
    };

    const handleLogout = async () => {
      isLoggingOut.value = true;
      logoutError.value = null;

      try {
        // Call server logout endpoint
        await axios.post("/api/logout");

        // Clear all client-side authentication state
        store.dispatch("logoutUser");

        // Redirect to home page
        router.push("/");
        console.log("Logout successful");
      } catch (error) {
        // Even if server logout fails, clear client state
        console.error("Server logout error:", error);
        store.dispatch("logoutUser");
        router.push("/");
        console.log("Client-side logout completed");
      } finally {
        isLoggingOut.value = false;
      }
    };

    const toggleDarkMode = () => {
      isDark.value = !isDark.value;
      localStorage.setItem("darkMode", JSON.stringify(isDark.value));

      // Update document class immediately
      document.documentElement.classList.toggle("dark-mode", isDark.value);

      // Also update the app's background image filter if it exists
      const bgImg = document.querySelector(".BGimg");
      if (bgImg) {
        bgImg.classList.toggle("dark-mode-image", isDark.value);
      }

      console.log("Dark mode toggled:", isDark.value ? "ON" : "OFF");
    };

    // Notification sound toggle
    const soundEnabled = computed(
      () => store.getters["notifications/soundEnabled"]
    );

    const toggleNotificationSound = () => {
      store.dispatch("notifications/toggleSound");
    };

    // Ensure dark mode state is synced when modal opens
    onMounted(() => {
      const savedMode = localStorage.getItem("darkMode");
      const darkMode = savedMode ? JSON.parse(savedMode) : false;
      isDark.value = darkMode;
      document.documentElement.classList.toggle("dark-mode", darkMode);

      const bgImg = document.querySelector(".BGimg");
      if (bgImg) {
        bgImg.classList.toggle("dark-mode-image", darkMode);
      }
    });

    return {
      isLoggingOut,
      logoutError,
      isDark,
      soundEnabled,
      handleClose,
      handleLogout,
      toggleDarkMode,
      toggleNotificationSound,
    };
  },
};
</script>

<style scoped>
.settings-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.settings-modal-content {
  background: var(--card-background);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-color);
}

.settings-header h2 {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--bright-white);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: var(--steel-gray);
  font-size: var(--text-xl);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
}

.close-btn:hover {
  background: var(--steel-gray);
  color: var(--bright-white);
}

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
}

.settings-section {
  margin-bottom: var(--space-xl);
}

.settings-section h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--bright-white);
  margin: 0 0 var(--space-md) 0;
}

.settings-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 8px 20px;
  background: var(--glass-morphism-bg);
  color: var(--bright-white);
  border: 1px solid var(--coral-red);
  border-radius: var(--radius-full);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.logout-btn:hover:not(:disabled) {
  border: 1px solid var(--bright-white);
}

.logout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.setting-item label {
  font-size: var(--text-base);
  color: var(--bright-white);
  font-weight: 500;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 8px 20px;
  background: var(--glass-morphism-bg);
  color: var(--bright-white);
  border: 1px solid var(--sunset-orange);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.toggle-btn:hover {
  border: 1px solid var(--bright-white);
}

.settings-footer {
  padding: var(--space-lg);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 8px 20px;
  background: var(--glass-morphism-bg);
  color: var(--bright-white);
  border: 1px solid var(--sunset-orange);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.cancel-btn:hover {
  border: 1px solid var(--bright-white);
}

/* Responsive Design */
@media (max-width: 768px) {
  .settings-modal-overlay {
    padding: var(--space-sm);
  }

  .settings-modal-content {
    max-height: 90vh;
  }

  .settings-header,
  .settings-body,
  .settings-footer {
    padding: var(--space-md);
  }
}
</style>
