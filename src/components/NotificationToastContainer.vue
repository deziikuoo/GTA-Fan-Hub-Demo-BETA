<!-- NotificationToastContainer.vue -->
<template>
  <div class="toast-container" v-if="activeToasts.length > 0">
    <NotificationToast
      v-for="(toast, index) in activeToasts"
      :key="toast.id"
      :notification="toast"
      :index="index"
      :duration="toast.duration || 5000"
      @dismiss="handleDismiss"
      @click="handleToastClick"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useStore } from "vuex";
import NotificationToast from "./NotificationToast.vue";
import notificationSound from "@/utils/notificationSound";

const store = useStore();

// Local state for toast management
const activeToasts = ref([]);
const displayQueue = ref([]);
const isProcessing = ref(false);
const aggregationWindow = ref(2000); // 2 seconds
const staggerDelay = ref(300); // 300ms between toasts

// Computed properties
const toasts = computed(() => store.getters["notifications/toasts"]);
const soundEnabled = computed(
  () => store.getters["notifications/soundEnabled"]
);

// Watch for new notifications from store
watch(
  () => store.state.notifications.toasts,
  (newToasts, oldToasts) => {
    if (newToasts.length > oldToasts.length) {
      const newToast = newToasts[newToasts.length - 1];
      handleNewToast(newToast);
    }
  },
  { deep: true }
);

// Initialize sound settings
onMounted(() => {
  // Load sound preference from localStorage
  const soundEnabled = localStorage.getItem("notificationSoundEnabled");
  if (soundEnabled !== null) {
    store.commit("notifications/SET_SOUND_ENABLED", soundEnabled === "true");
  }
});

// Toast management functions
const handleNewToast = (toast) => {
  // Check if we should aggregate with recent toasts
  const shouldAggregate = shouldAggregateToast(toast);

  if (shouldAggregate) {
    // Aggregate with existing toasts
    aggregateToast(toast);
  } else {
    // Add to display queue
    displayQueue.value.push(toast);
  }

  // Process queue if not already processing
  if (!isProcessing.value) {
    processDisplayQueue();
  }
};

const shouldAggregateToast = (newToast) => {
  const now = Date.now();
  const recentWindow = now - aggregationWindow.value;

  // Check if there are recent toasts that could be aggregated
  const recentToasts = activeToasts.value.filter(
    (toast) =>
      toast.timestamp > recentWindow &&
      !toast.dismissed &&
      toast.type !== "bulk" // Don't aggregate with existing bulk toasts
  );

  // Don't aggregate if new toast is bulk type
  if (newToast.type === "bulk") {
    return false;
  }

  // Aggregate if we have recent toasts of different types
  if (recentToasts.length > 0) {
    const hasDifferentTypes = recentToasts.some(
      (toast) => toast.type !== newToast.type
    );
    return hasDifferentTypes;
  }

  return false;
};

const aggregateToast = (newToast) => {
  const now = Date.now();
  const recentWindow = now - aggregationWindow.value;

  // Find recent toasts to aggregate with
  const recentToasts = activeToasts.value.filter(
    (toast) =>
      toast.timestamp > recentWindow &&
      !toast.dismissed &&
      toast.type !== "bulk"
  );

  // Create aggregated counts
  const aggregated = {
    likes: 0,
    comments: 0,
    follows: 0,
    reposts: 0,
    quotes: 0,
  };

  // Count existing toasts
  recentToasts.forEach((toast) => {
    if (aggregated[toast.type + "s"] !== undefined) {
      aggregated[toast.type + "s"]++;
    }
  });

  // Add new toast
  if (aggregated[newToast.type + "s"] !== undefined) {
    aggregated[newToast.type + "s"]++;
  }

  // Calculate total count
  const totalCount = Object.values(aggregated).reduce(
    (sum, count) => sum + count,
    0
  );

  // Create bulk notification
  const bulkToast = {
    id: `bulk-${Date.now()}`,
    type: "bulk",
    timestamp: now,
    duration: 7000, // Longer duration for bulk notifications
    totalCount,
    ...aggregated,
    actors: [...recentToasts.map((t) => t.actor), newToast.actor].filter(
      Boolean
    ),
    posts: [...recentToasts.map((t) => t.post), newToast.post].filter(Boolean),
  };

  // Remove recent toasts that are being aggregated
  recentToasts.forEach((toast) => {
    const index = activeToasts.value.findIndex((t) => t.id === toast.id);
    if (index !== -1) {
      activeToasts.value.splice(index, 1);
    }
  });

  // Add bulk toast to queue
  displayQueue.value.unshift(bulkToast); // Add to front of queue

  // Play sound for bulk notification
  if (soundEnabled.value) {
    notificationSound.playNotification("bulk");
  }
};

const processDisplayQueue = async () => {
  if (isProcessing.value || displayQueue.value.length === 0) {
    return;
  }

  isProcessing.value = true;

  while (displayQueue.value.length > 0) {
    const toast = displayQueue.value.shift();

    // Add toast to active display
    activeToasts.value.push(toast);

    // Play sound for individual notification (not bulk)
    if (soundEnabled.value && toast.type !== "bulk") {
      notificationSound.playNotification(toast.type);
    }

    // Wait for stagger delay before showing next toast
    if (displayQueue.value.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, staggerDelay.value));
    }
  }

  isProcessing.value = false;
};

const handleDismiss = (toastId) => {
  const index = activeToasts.value.findIndex((toast) => toast.id === toastId);
  if (index !== -1) {
    activeToasts.value.splice(index, 1);
  }

  // Also remove from store
  store.dispatch("notifications/removeToast", toastId);
};

const handleToastClick = (notification) => {
  // Handle toast click (navigation is handled in NotificationToast component)
  store.dispatch("notifications/markAsRead", notification.id);
};

// Cleanup on unmount
onBeforeUnmount(() => {
  displayQueue.value = [];
  activeToasts.value = [];
});
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.toast-container > * {
  pointer-events: auto;
}

/* Ensure toasts are above all other content */
.toast-container {
  isolation: isolate;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .toast-container {
    bottom: 10px;
    right: 10px;
    left: 10px;
  }

  .toast-container :deep(.notification-toast) {
    width: 100%;
    max-width: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .toast-container :deep(.notification-toast) {
    border: 2px solid currentColor;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .toast-container :deep(.notification-toast) {
    animation: none;
    transition: opacity 0.2s ease;
  }
}
</style>
