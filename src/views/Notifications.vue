<!-- Notifications.vue -->
<template>
  <div class="notifications-page">
    <div class="notifications-container">
      <div class="page-header">
        <h1>Notifications</h1>
        <div class="header-actions">
          <button
            v-if="unreadCount > 0"
            @click="markAllAsRead"
            class="mark-all-btn"
            title="Mark all as read"
          >
            <font-awesome-icon :icon="['fas', 'check-double']" />
            Mark all as read
          </button>
        </div>
      </div>

      <!-- Filter tabs -->
      <div class="filter-tabs">
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="activeFilter = filter.value"
          class="filter-tab"
          :class="{ active: activeFilter === filter.value }"
        >
          {{ filter.label }}
          <span
            v-if="filter.value === 'unread' && unreadCount > 0"
            class="count-badge"
          >
            {{ unreadCount > 99 ? "99+" : unreadCount }}
          </span>
        </button>
      </div>

      <!-- Notifications content -->
      <div class="notifications-content">
        <!-- Loading state -->
        <div v-if="loading && currentPage === 1" class="loading-state">
          <div class="spinner"></div>
          <p>Loading notifications...</p>
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredNotifications.length === 0" class="empty-state">
          <font-awesome-icon :icon="['fas', 'bell']" class="empty-icon" />
          <h3>{{ getEmptyStateTitle }}</h3>
          <p>{{ getEmptyStateMessage }}</p>
        </div>

        <!-- Notifications list -->
        <div v-else class="notifications-list">
          <NotificationItem
            v-for="notification in filteredNotifications"
            :key="notification._id"
            :notification="notification"
            :show-delete="true"
          />

          <!-- Load more button -->
          <div v-if="hasMore" class="load-more-container">
            <button @click="loadMore" :disabled="loading" class="load-more-btn">
              <span v-if="loading" class="loading-dots"
                >Loading<span class="dots"></span
              ></span>
              <span v-else>Load more</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { useStore } from "vuex";
import NotificationItem from "@/components/NotificationItem.vue";

const store = useStore();

// State
const activeFilter = ref("all");
const currentPage = ref(1);

// Filter options
const filters = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Likes", value: "like" },
  { label: "Comments", value: "comment" },
  { label: "Reposts", value: "repost" },
  { label: "Follows", value: "follow" },
];

// Vuex state
const notifications = computed(
  () => store.getters["notifications/allNotifications"]
);
const unreadCount = computed(() => store.getters["notifications/unreadCount"]);
const loading = computed(() => store.getters["notifications/isLoading"]);
const hasMore = computed(() => store.getters["notifications/hasMore"]);

// Filtered notifications
const filteredNotifications = computed(() => {
  let filtered = notifications.value;

  if (activeFilter.value === "unread") {
    filtered = filtered.filter((n) => !n.read);
  } else if (activeFilter.value !== "all") {
    // Filter by type (like, comment, repost, follow)
    filtered = filtered.filter(
      (n) =>
        n.type === activeFilter.value ||
        (activeFilter.value === "repost" && n.type === "quote")
    );
  }

  return filtered;
});

// Empty state messages
const getEmptyStateTitle = computed(() => {
  if (activeFilter.value === "unread") return "All caught up!";
  if (activeFilter.value === "all") return "No notifications yet";
  return `No ${activeFilter.value} notifications`;
});

const getEmptyStateMessage = computed(() => {
  if (activeFilter.value === "unread")
    return "You have no unread notifications.";
  if (activeFilter.value === "all")
    return "When you get notifications, they'll show up here.";
  return `You don't have any ${activeFilter.value} notifications yet.`;
});

// Mark all as read
const markAllAsRead = async () => {
  await store.dispatch("notifications/markAllAsRead");
};

// Load more notifications
const loadMore = async () => {
  const nextPage = currentPage.value + 1;
  await store.dispatch("notifications/fetchNotifications", {
    page: nextPage,
    type:
      activeFilter.value === "all" || activeFilter.value === "unread"
        ? null
        : activeFilter.value,
    unreadOnly: activeFilter.value === "unread",
  });
  currentPage.value = nextPage;
};

// Watch filter changes
watch(activeFilter, async () => {
  currentPage.value = 1;
  await store.dispatch("notifications/fetchNotifications", {
    page: 1,
    type:
      activeFilter.value === "all" || activeFilter.value === "unread"
        ? null
        : activeFilter.value,
    unreadOnly: activeFilter.value === "unread",
  });
});

// Fetch notifications on mount
onMounted(async () => {
  currentPage.value = 1;
  await store.dispatch("notifications/fetchNotifications", { page: 1 });
  await store.dispatch("notifications/fetchUnreadCount");
});
</script>

<style scoped>
.notifications-page {
  min-height: 100vh;
  padding: 80px 20px 40px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.notifications-container {
  max-width: 600px;
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.mark-all-btn {
  padding: 10px 16px;
  background: rgba(29, 161, 242, 0.1);
  border: 1px solid rgba(29, 161, 242, 0.3);
  border-radius: 8px;
  cursor: pointer;
  color: #1da1f2;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mark-all-btn:hover {
  background: rgba(29, 161, 242, 0.2);
  border-color: rgba(29, 161, 242, 0.5);
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding: 0 16px;
  scrollbar-width: none;
}

.filter-tabs::-webkit-scrollbar {
  display: none;
}

.filter-tab {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.filter-tab.active {
  background: rgba(29, 161, 242, 0.2);
  border-color: #1da1f2;
  color: #1da1f2;
}

.count-badge {
  background: #1da1f2;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
}

.notifications-content {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #1da1f2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.2);
}

.empty-state h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: var(--text-primary);
}

.empty-state p,
.loading-state p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.notifications-list {
  /* NotificationItem handles its own styling */
}

.load-more-container {
  padding: 20px;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.load-more-btn {
  padding: 12px 24px;
  background: rgba(29, 161, 242, 0.1);
  border: 1px solid rgba(29, 161, 242, 0.3);
  border-radius: 8px;
  cursor: pointer;
  color: #1da1f2;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  min-width: 120px;
}

.load-more-btn:hover:not(:disabled) {
  background: rgba(29, 161, 242, 0.2);
  border-color: rgba(29, 161, 242, 0.5);
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-dots .dots::after {
  content: "";
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0%,
  20% {
    content: "";
  }
  40% {
    content: ".";
  }
  60% {
    content: "..";
  }
  80%,
  100% {
    content: "...";
  }
}

/* Dark mode compatibility */
.dark-mode .notifications-content {
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.08);
}

.dark-mode .filter-tab {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
}

.dark-mode .filter-tab:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .notifications-page {
    padding: 100px 10px 20px;
  }

  .page-header h1 {
    font-size: 24px;
  }

  .mark-all-btn span {
    display: none;
  }
}
</style>
