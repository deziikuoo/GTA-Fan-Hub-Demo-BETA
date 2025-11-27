<!-- NotificationDropdown.vue -->
<template>
  <transition name="dropdown-fade">
    <div v-if="isOpen" class="notification-dropdown" ref="dropdownRef">
      <div class="dropdown-header">
        <h3>Notifications</h3>
        <button
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          class="mark-all-btn"
          title="Mark all as read"
        >
          <font-awesome-icon :icon="['fas', 'check-double']" />
        </button>
      </div>

      <div class="dropdown-body">
        <!-- Loading state -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading notifications...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="notifications.length === 0" class="empty-state">
          <font-awesome-icon :icon="['fas', 'bell']" class="empty-icon" />
          <p>No notifications yet</p>
        </div>

        <!-- Notifications list -->
        <div v-else class="notifications-list">
          <NotificationItem
            v-for="notification in recentNotifications"
            :key="notification._id"
            :notification="notification"
            @click="closeDropdown"
          />
        </div>
      </div>

      <div class="dropdown-footer">
        <router-link
          to="/notifications"
          class="view-all-link"
          @click="closeDropdown"
        >
          View all notifications
        </router-link>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { useStore } from "vuex";
import NotificationItem from "./NotificationItem.vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["close"]);

const store = useStore();
const dropdownRef = ref(null);

// Vuex state
const notifications = computed(
  () => store.getters["notifications/allNotifications"]
);
const unreadCount = computed(() => store.getters["notifications/unreadCount"]);
const loading = computed(() => store.getters["notifications/isLoading"]);

// Get recent notifications (limit to 10)
const recentNotifications = computed(() => notifications.value.slice(0, 10));

// Fetch notifications when dropdown opens
watch(
  () => props.isOpen,
  async (newValue) => {
    if (newValue) {
      // Fetch first page of notifications
      await store.dispatch("notifications/fetchNotifications", { page: 1 });
    }
  }
);

// Mark all as read
const markAllAsRead = async () => {
  await store.dispatch("notifications/markAllAsRead");
};

// Close dropdown
const closeDropdown = () => {
  emit("close");
};

// Close on click outside
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    // Check if click is not on the bell button
    const bellButton = document.querySelector(".notification-bell-btn");
    if (bellButton && !bellButton.contains(event.target)) {
      closeDropdown();
    }
  }
};

// Close on Escape key
const handleEscape = (event) => {
  if (event.key === "Escape") {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscape);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleEscape);
});
</script>

<style scoped>
.notification-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 380px;
  max-width: 90vw;
  background: rgba(22, 23, 29, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 1000;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dropdown-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: var(--text-primary);
}

.mark-all-btn {
  padding: 8px 12px;
  background: rgba(29, 161, 242, 0.1);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #1da1f2;
  transition: background-color 0.2s ease;
  font-size: 14px;
}

.mark-all-btn:hover {
  background: rgba(29, 161, 242, 0.2);
}

.dropdown-body {
  max-height: 400px;
  overflow-y: auto;
}

/* Custom scrollbar */
.dropdown-body::-webkit-scrollbar {
  width: 6px;
}

.dropdown-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.dropdown-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.dropdown-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #1da1f2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.3);
}

.empty-state p,
.loading-state p {
  margin: 0;
  font-size: 14px;
}

.notifications-list {
  /* No additional styling needed, NotificationItem handles its own */
}

.dropdown-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.view-all-link {
  display: block;
  color: var(--bright-white);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.view-all-link:hover {
  color: var(--bright-white);
  text-decoration: underline;
  opacity: 0.8;
}

/* Dropdown animation */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Dark mode compatibility */
.dark-mode .notification-dropdown {
  background: rgba(22, 23, 29, 0.98);
  border-color: rgba(255, 255, 255, 0.15);
}
</style>
