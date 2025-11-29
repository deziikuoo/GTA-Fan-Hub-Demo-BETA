<!-- NotificationItem.vue -->
<template>
  <div
    class="notification-item"
    :class="{ unread: !notification.read }"
    @click="handleClick"
  >
    <div class="notification-icon">
      <font-awesome-icon
        :icon="getNotificationIcon"
        :style="{ color: getIconColor }"
      />
    </div>

    <div class="notification-content">
      <div class="notification-message">
        <router-link
          v-if="notification.actor"
          :to="`/profile/${notification.actor.username}`"
          class="actor-name"
          @click.stop
        >
          {{ notification.actor.username }}
        </router-link>
        <span class="message-text">{{ getMessage }}</span>
      </div>

      <div class="notification-time">
        {{ formatTime(notification.createdAt) }}
      </div>
    </div>

    <div class="notification-actions">
      <div v-if="!notification.read" class="unread-dot"></div>
      <button
        v-if="showDelete"
        @click.stop="handleDelete"
        class="delete-btn"
        title="Delete notification"
      >
        <font-awesome-icon :icon="['fas', 'times']" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
  showDelete: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["click", "delete"]);

const router = useRouter();
const store = useStore();

// Get notification icon based on type
const getNotificationIcon = computed(() => {
  const iconMap = {
    like: ["fas", "heart"],
    comment: ["fas", "comment"],
    reply: ["fas", "reply"],
    repost: ["fas", "retweet"],
    quote: ["fas", "retweet"],
    follow: ["fas", "user-check"],
  };
  return iconMap[props.notification.type] || ["fas", "bell"];
});

// Get icon color based on type
const getIconColor = computed(() => {
  const colorMap = {
    like: "#ff4458",
    comment: "#1da1f2",
    reply: "#1da1f2",
    repost: "#17bf63",
    quote: "#17bf63",
    follow: "#794bc4",
  };
  return colorMap[props.notification.type] || "#657786";
});

// Generate message text
const getMessage = computed(() => {
  const messageMap = {
    like: "liked your post",
    comment: "commented on your post",
    reply: "replied to your comment",
    repost: "reposted your post",
    quote: "quoted your post",
    follow: "started following you",
  };
  return messageMap[props.notification.type] || "sent you a notification";
});

// Format timestamp
const formatTime = (timestamp) => {
  const now = new Date();
  const notificationTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - notificationTime) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return notificationTime.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// Handle notification click
const handleClick = async () => {
  // Mark as read
  if (!props.notification.read) {
    await store.dispatch("notifications/markAsRead", props.notification._id);
  }

  // Navigate to relevant content
  let path = null;
  if (props.notification.type === "follow" && props.notification.actor) {
    path = `/profile/${props.notification.actor.username}`;
  } else if (props.notification.postId) {
    // Navigate to the post/social feed (assuming Social page shows posts)
    path = "/Social";
  }

  if (path) {
    router.push(path);
  }

  emit("click", props.notification);
};

// Handle delete
const handleDelete = async () => {
  await store.dispatch(
    "notifications/deleteNotification",
    props.notification._id
  );
  emit("delete", props.notification._id);
};
</script>

<style scoped>
.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  gap: 12px;
}

.notification-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.notification-item.unread {
  background-color: rgba(226, 113, 207, 0.25);
}

.notification-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  font-size: 14px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-message {
  font-size: 14px;
  line-height: 1.4;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.actor-name {
  font-weight: bold;
  color: var(--text-primary);
  text-decoration: none;
  margin-right: 4px;
}

.actor-name:hover {
  text-decoration: underline;
}

.message-text {
  color: rgba(255, 255, 255, 0.7);
}

.notification-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.notification-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--neon-pink2);
  box-shadow: 0 0 8px rgba(226, 113, 207, 0.6);
}

.delete-btn {
  padding: 4px 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.2s ease;
  opacity: 0;
  font-size: 14px;
}

.notification-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #ff4458;
}

/* Dark mode compatibility */
.dark-mode .notification-item {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.dark-mode .notification-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.dark-mode .message-text {
  color: rgba(255, 255, 255, 0.7);
}

.dark-mode .notification-time {
  color: rgba(255, 255, 255, 0.5);
}
</style>
