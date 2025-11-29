<!-- NotificationToast.vue -->
<template>
  <div
    class="notification-toast"
    :class="{ 'toast-dismissing': isDismissing }"
    @click="handleClick"
    @mouseenter="pauseTimer"
    @mouseleave="resumeTimer"
  >
    <div class="toast-content">
      <div class="toast-icon">
        <font-awesome-icon :icon="getNotificationIcon" />
      </div>
      <div class="toast-message">
        <div class="toast-title">
          <span v-if="isBulkNotification">{{ getBulkTitle }}</span>
          <span v-else>{{ getSingleTitle }}</span>
        </div>
        <div class="toast-description">
          <span v-if="isBulkNotification">{{ getBulkDescription }}</span>
          <span v-else>{{ getSingleDescription }}</span>
        </div>
      </div>
      <button
        class="toast-dismiss"
        @click.stop="dismissToast"
        aria-label="Dismiss notification"
      >
        <font-awesome-icon :icon="['fas', 'times']" />
      </button>
    </div>
    <div class="toast-progress" :style="{ width: progressWidth + '%' }"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
  duration: {
    type: Number,
    default: 5000,
  },
  index: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["dismiss", "click"]);

const router = useRouter();
const dismissTimer = ref(null);
const isDismissing = ref(false);
const progressWidth = ref(100);
const progressInterval = ref(null);
const isPaused = ref(false);

// Computed properties for notification display
const isBulkNotification = computed(() => {
  return props.notification.type === "bulk";
});

const getNotificationIcon = computed(() => {
  if (isBulkNotification.value) {
    return ["fas", "bell"];
  }

  const typeIcons = {
    like: ["fas", "heart"],
    comment: ["fas", "comment"],
    follow: ["fas", "user-check"],
    repost: ["fas", "retweet"],
    quote: ["fas", "quote-left"],
  };

  return typeIcons[props.notification.type] || ["fas", "bell"];
});

const getSingleTitle = computed(() => {
  const titles = {
    like: "New Like",
    comment: "New Comment",
    follow: "New Follower",
    repost: "New Repost",
    quote: "New Quote",
  };
  return titles[props.notification.type] || "New Notification";
});

const getSingleDescription = computed(() => {
  if (props.notification.actor && props.notification.actor.username) {
    return `${props.notification.actor.username} ${getActionText()}`;
  }
  return getActionText();
});

const getActionText = computed(() => {
  const actions = {
    like: "liked your post",
    comment: "commented on your post",
    follow: "started following you",
    repost: "reposted your post",
    quote: "quoted your post",
  };
  return actions[props.notification.type] || "interacted with your content";
});

const getBulkTitle = computed(() => {
  return `${props.notification.totalCount} New Notifications`;
});

const getBulkDescription = computed(() => {
  const parts = [];
  if (props.notification.likes > 0) {
    parts.push(
      `${props.notification.likes} like${
        props.notification.likes > 1 ? "s" : ""
      }`
    );
  }
  if (props.notification.comments > 0) {
    parts.push(
      `${props.notification.comments} comment${
        props.notification.comments > 1 ? "s" : ""
      }`
    );
  }
  if (props.notification.follows > 0) {
    parts.push(
      `${props.notification.follows} new follower${
        props.notification.follows > 1 ? "s" : ""
      }`
    );
  }
  if (props.notification.reposts > 0) {
    parts.push(
      `${props.notification.reposts} repost${
        props.notification.reposts > 1 ? "s" : ""
      }`
    );
  }
  if (props.notification.quotes > 0) {
    parts.push(
      `${props.notification.quotes} quote${
        props.notification.quotes > 1 ? "s" : ""
      }`
    );
  }

  return parts.join(", ");
});

// Timer management
const startTimer = () => {
  if (dismissTimer.value) {
    clearTimeout(dismissTimer.value);
  }

  dismissTimer.value = setTimeout(() => {
    dismissToast();
  }, props.duration);

  // Start progress bar animation
  startProgressBar();
};

const pauseTimer = () => {
  isPaused.value = true;
  if (dismissTimer.value) {
    clearTimeout(dismissTimer.value);
  }
  if (progressInterval.value) {
    clearInterval(progressInterval.value);
  }
};

const resumeTimer = () => {
  if (isPaused.value) {
    isPaused.value = false;
    const remainingTime = (progressWidth.value / 100) * props.duration;
    dismissTimer.value = setTimeout(() => {
      dismissToast();
    }, remainingTime);
    startProgressBar();
  }
};

const startProgressBar = () => {
  if (progressInterval.value) {
    clearInterval(progressInterval.value);
  }

  const interval = 50; // Update every 50ms
  const totalSteps = props.duration / interval;
  let currentStep = 0;

  progressInterval.value = setInterval(() => {
    if (isPaused.value) return;

    currentStep++;
    progressWidth.value = Math.max(0, 100 - (currentStep / totalSteps) * 100);

    if (progressWidth.value <= 0) {
      clearInterval(progressInterval.value);
    }
  }, interval);
};

const dismissToast = () => {
  isDismissing.value = true;

  // Clean up timers
  if (dismissTimer.value) {
    clearTimeout(dismissTimer.value);
  }
  if (progressInterval.value) {
    clearInterval(progressInterval.value);
  }

  // Emit dismiss event after animation
  setTimeout(() => {
    emit("dismiss", props.notification.id);
  }, 300); // Match CSS transition duration
};

const handleClick = () => {
  // Navigate based on notification type
  if (props.notification.post) {
    // Navigate to post
    router.push(`/posts/${props.notification.post}`);
  } else if (props.notification.actor) {
    // Navigate to user profile
    router.push(`/profile/${props.notification.actor.username}`);
  } else {
    // Navigate to notifications page
    router.push("/notifications");
  }

  emit("click", props.notification);
  dismissToast();
};

onMounted(() => {
  startTimer();
});

onBeforeUnmount(() => {
  if (dismissTimer.value) {
    clearTimeout(dismissTimer.value);
  }
  if (progressInterval.value) {
    clearInterval(progressInterval.value);
  }
});
</script>

<style scoped>
.notification-toast {
  position: relative;
  width: 350px;
  max-height: 100px;
  background: var(--toast-bg, #ffffff);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--toast-border, #e5e7eb);
  cursor: pointer;
  overflow: hidden;
  transform: translateX(0);
  opacity: 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 12px;
}

.notification-toast:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.toast-dismissing {
  transform: translateX(400px);
  opacity: 0;
}

.toast-content {
  display: flex;
  align-items: center;
  padding: 16px;
  position: relative;
  z-index: 2;
}

.toast-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--toast-icon-bg, #f3f4f6);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.toast-icon svg {
  color: var(--toast-icon-color, #6b7280);
  font-size: 18px;
}

.toast-message {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--toast-title-color, #111827);
  margin-bottom: 2px;
  line-height: 1.3;
}

.toast-description {
  font-size: 13px;
  color: var(--toast-description-color, #6b7280);
  line-height: 1.4;
  word-wrap: break-word;
}

.toast-dismiss {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
}

.notification-toast:hover .toast-dismiss {
  opacity: 1;
}

.toast-dismiss:hover {
  background: var(--toast-dismiss-hover, #f3f4f6);
}

.toast-dismiss svg {
  color: var(--toast-dismiss-color, #9ca3af);
  font-size: 12px;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--toast-progress-color, #3b82f6);
  transition: width 0.05s linear;
  z-index: 1;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .notification-toast {
    --toast-bg: #1f2937;
    --toast-border: #374151;
    --toast-icon-bg: #374151;
    --toast-icon-color: #d1d5db;
    --toast-title-color: #f9fafb;
    --toast-description-color: #9ca3af;
    --toast-dismiss-hover: #374151;
    --toast-dismiss-color: #d1d5db;
  }
}

/* Animation for slide-in */
@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-toast {
  animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
