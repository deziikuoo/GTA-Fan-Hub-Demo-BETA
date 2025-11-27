<template>
  <button
    :class="['follow-button', sizeClass, variantClass, { loading: isLoading }]"
    :disabled="isLoading || disabled"
    @click="handleClick"
    :aria-label="isFollowing ? `Unfollow ${username}` : `Follow ${username}`"
  >
    <font-awesome-icon
      v-if="!isLoading"
      :icon="isFollowing ? 'user-check' : 'user-plus'"
      class="follow-icon"
    />
    <span v-if="!isLoading" class="button-text">
      {{ buttonText }}
    </span>
    <span v-else class="button-text">
      <span class="loading-spinner"></span>
      {{ loadingText }}
    </span>
  </button>
</template>

<script setup>
import { computed, watch } from "vue";
import { useStore } from "vuex";

const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    default: "",
  },
  size: {
    type: String,
    default: "medium",
    validator: (value) => ["small", "medium", "large"].includes(value),
  },
  variant: {
    type: String,
    default: "primary",
    validator: (value) => ["primary", "secondary", "outline"].includes(value),
  },
  source: {
    type: String,
    default: "profile",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["followed", "unfollowed", "error"]);

const store = useStore();

// Computed properties
const normalizedUserId = computed(() => String(props.userId));

const isFollowing = computed(() => {
  return store.state.social.followingUsers.includes(normalizedUserId.value);
});

const isLoading = computed(() => {
  return store.state.social.followActionLoading.includes(normalizedUserId.value);
});

const buttonText = computed(() => {
  return isFollowing.value ? "Following" : "Follow";
});

const loadingText = computed(() => {
  return isFollowing.value ? "Unfollowing..." : "Following...";
});

const sizeClass = computed(() => {
  return `follow-button-${props.size}`;
});

const variantClass = computed(() => {
  if (isFollowing.value) {
    return "follow-button-following";
  }
  return `follow-button-${props.variant}`;
});

// Watch for reactivity debugging
watch(
  () => isFollowing.value,
  (newVal, oldVal) => {
    console.log(
      `[FollowButton:Watch] isFollowing changed: ${oldVal} → ${newVal}`
    );
    console.log(
      `[FollowButton:Watch] Button text will be: ${
        newVal ? "Following" : "Follow"
      }`
    );
  }
);

watch(
  () => store.state.social.followingCount,
  (newVal, oldVal) => {
    console.log(
      `[FollowButton:Watch] Vuex followingCount changed: ${oldVal} → ${newVal}`
    );
  }
);

// Methods
const handleClick = async () => {
  console.log("[FollowButton] ========== CLICK START ==========");
  console.log("[FollowButton] UserId:", normalizedUserId.value);
  console.log("[FollowButton] Before action - isFollowing:", isFollowing.value);
  console.log("[FollowButton] Before action - isLoading:", isLoading.value);
  console.log(
    "[FollowButton] Vuex followingUsers:",
    store.state.social.followingUsers
  );
  console.log(
    "[FollowButton] Vuex followingCount:",
    store.state.social.followingCount
  );

  try {
    await store.dispatch("social/toggleFollow", {
      userId: normalizedUserId.value,
      source: props.source,
    });

    console.log(
      "[FollowButton] After action - isFollowing:",
      isFollowing.value
    );
    console.log(
      "[FollowButton] After action - Vuex followingUsers:",
      store.state.social.followingUsers
    );
    console.log(
      "[FollowButton] After action - Vuex followingCount:",
      store.state.social.followingCount
    );

    // Emit appropriate event
    if (isFollowing.value) {
      console.log("[FollowButton] Emitting 'followed' event");
      emit("followed", {
        userId: normalizedUserId.value,
        username: props.username,
      });
    } else {
      console.log("[FollowButton] Emitting 'unfollowed' event");
      emit("unfollowed", {
        userId: normalizedUserId.value,
        username: props.username,
      });
    }
  } catch (error) {
    console.error("[FollowButton] ✗ Error:", error);
    emit("error", {
      userId: props.userId,
      error: error.response?.data?.error || "Action failed",
    });
  }

  console.log("[FollowButton] ========== CLICK END ==========");
};
</script>

<style scoped>
.follow-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--bright-white);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  white-space: nowrap;
}

.follow-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sizes - Override base padding for different sizes */
.follow-button-small {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-xs);
}

.follow-button-medium {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-xs);
}

.follow-button-large {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
}

/* Variants - All use same hover style */
.follow-button-primary {
  /* Inherits base styles */
}

.follow-button-primary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--mint-green);
  transform: translateX(5px);
}

.follow-button-secondary {
  /* Inherits base styles */
}

.follow-button-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--mint-green);
  transform: translateX(5px);
}

.follow-button-outline {
  /* Inherits base styles */
}

.follow-button-outline:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--mint-green);
  transform: translateX(5px);
}

.follow-button-following {
  /* Inherits all base styles */
}

.follow-button-following:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: var(--mint-green);
  transform: translateX(5px);
}

.follow-button-following:hover:not(:disabled) .button-text::after {
  content: "";
}

.follow-button-following:hover:not(:disabled) .button-text {
  visibility: hidden;
  position: relative;
}

.follow-button-following:hover:not(:disabled) .button-text::before {
  content: "Unfollow";
  visibility: visible;
  position: absolute;
  left: 0;
  right: 0;
  color: var(--mint-green);
}

/* Loading state */
.follow-button.loading {
  pointer-events: none;
}

.loading-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.button-text {
  white-space: nowrap;
}

.follow-icon {
  font-size: var(--text-xl);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

/* Icon color on hover for follow state (primary/outline/secondary) */
.follow-button-primary:hover:not(:disabled) .follow-icon,
.follow-button-outline:hover:not(:disabled) .follow-icon,
.follow-button-secondary:hover:not(:disabled) .follow-icon {
  color: var(--mint-green);
}

/* Icon color on hover for following state */
.follow-button-following:hover:not(:disabled) .follow-icon {
  color: var(--mint-green);
}

</style>
