<template>
  <div class="settings-modal-overlay" @click="handleClose">
    <div class="settings-modal-content main-backdrop-filter" @click.stop>
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
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.2s ease-out;
  padding: var(--space-lg);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.settings-modal-content {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-2xl);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4),
    0 10px 10px -5px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Custom Scrollbar */
.settings-modal-content::-webkit-scrollbar {
  width: 8px;
}

.settings-modal-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-full);
}

.settings-modal-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  transition: background 0.2s ease;
}

.settings-modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.settings-modal-overlay:focus {
  outline: none;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-lg) var(--space-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.settings-header h2 {
  color: var(--bright-white);
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 600;
  text-align: center;
}

.close-btn {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--bright-white);
  font-size: var(--text-lg);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-full);
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: var(--bright-white);
  transform: rotate(90deg);
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
  color: var(--bright-white);
  margin-bottom: var(--space-lg);
  font-size: var(--text-lg);
  font-weight: 600;
  padding-bottom: var(--space-sm);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.settings-options {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-xl);
  background: rgba(255, 64, 64, 0.2);
  color: var(--coral-red);
  border: 1px solid var(--coral-red);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 140px;
}

.logout-btn:hover:not(:disabled) {
  background: var(--coral-red);
  color: var(--bright-white);
  border-color: var(--bright-white);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 64, 64, 0.3);
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
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
}

.setting-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.setting-item label {
  font-size: var(--text-base);
  color: var(--bright-white);
  font-weight: 500;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  background: rgba(255, 255, 255, 0.1);
  color: var(--bright-white);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 120px;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--mint-green);
  color: var(--mint-green);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(152, 255, 152, 0.2);
}

.settings-footer {
  padding: var(--space-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}

.cancel-btn {
  padding: var(--space-sm) var(--space-xl);
  background: transparent;
  color: var(--bright-white);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-btn:hover {
  border: 1px solid var(--bright-white);
  transform: translateY(-2px);
  color: var(--bright-white);
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
