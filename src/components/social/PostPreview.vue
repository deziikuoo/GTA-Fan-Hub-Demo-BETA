<template>
  <div class="post-preview">
    <!-- Author Info -->
    <div class="post-header">
      <img
        :src="
          actualPost.author.profile?.profilePicture ||
          '/images/user.png'
        "
        :alt="actualPost.author.username"
        class="author-avatar"
        @click="navigateToProfile(actualPost.author.username)"
      />

      <div class="author-info">
        <div class="author-name-row">
          <span
            class="author-name"
            @click="navigateToProfile(actualPost.author.username)"
          >
            {{
              actualPost.author.profile?.displayName ||
              actualPost.author.username
            }}
          </span>
          <font-awesome-icon
            v-if="actualPost.author.profile?.verified"
            icon="check-circle"
            class="verified-badge"
          />
        </div>
        <span
          class="author-username"
          @click="navigateToProfile(actualPost.author.username)"
        >
          @{{ actualPost.author.username }}
        </span>
        <span class="post-meta">
          {{ formatTime(actualPost.createdAt) }}
          <span v-if="actualPost.isEdited" class="edited-label">(edited)</span>
        </span>
      </div>

      <!-- Options Dropdown -->
      <div v-if="isOwnPost" class="post-options" ref="optionsContainer">
        <button @click="toggleOptions" class="options-btn">
          <font-awesome-icon icon="ellipsis-h" />
        </button>

        <div v-if="showOptions" class="options-menu">
          <button @click="handleEdit" class="option-btn">
            <font-awesome-icon icon="edit" />
            Edit
          </button>
          <button @click="handleDelete" class="option-btn delete">
            <font-awesome-icon icon="trash" />
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Post Content -->
    <div class="post-content">
      <p class="post-text" v-html="formattedText"></p>

      <!-- Media Grid -->
      <MediaGrid
        v-if="actualPost.media && actualPost.media.length > 0"
        :media="actualPost.media"
        @click.stop
      />
    </div>

    <!-- Engagement Stats -->
    <div class="engagement-stats">
      <div class="stat-item">
        <font-awesome-icon :icon="['far', 'heart']" />
        <span>{{ formatCount(actualPost.engagement.likes) }}</span>
      </div>
      <div class="stat-item">
        <font-awesome-icon :icon="['far', 'comment']" />
        <span>{{ formatCount(actualPost.engagement.comments) }}</span>
      </div>
      <div class="stat-item">
        <font-awesome-icon icon="retweet" />
        <span>{{ formatCount(actualPost.engagement.reposts) }}</span>
      </div>
      <div class="stat-item">
        <font-awesome-icon :icon="['far', 'bookmark']" />
        <span>{{ formatCount(actualPost.engagement.bookmarks) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onUnmounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import MediaGrid from "./MediaGrid.vue";

export default {
  name: "PostPreview",
  components: {
    MediaGrid,
  },
  props: {
    post: {
      type: Object,
      required: true,
    },
  },
  emits: ["deleted"],
  setup(props, { emit }) {
    const store = useStore();
    const router = useRouter();

    // State
    const showOptions = ref(false);

    // Refs
    const optionsContainer = ref(null);

    // Computed
    const currentUser = computed(() => store.getters.currentUser);
    const isOwnPost = computed(
      () => currentUser.value?.id === props.post.author._id
    );

    const actualPost = computed(() => {
      if (props.post.type === "repost" && props.post.originalPost) {
        return props.post.originalPost;
      }
      return props.post;
    });

    const formattedText = computed(() => {
      if (!actualPost.value.content?.text) return "";
      return actualPost.value.content.text;
    });

    // Methods
    const formatTime = (timestamp) => {
      const now = new Date();
      const postTime = new Date(timestamp);
      const diffInSeconds = Math.floor((now - postTime) / 1000);

      if (diffInSeconds < 60) return "now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
      if (diffInSeconds < 2592000)
        return `${Math.floor(diffInSeconds / 86400)}d`;
      return `${Math.floor(diffInSeconds / 2592000)}mo`;
    };

    const formatCount = (count) => {
      if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
      if (count >= 1000) return (count / 1000).toFixed(1) + "K";
      return count.toString();
    };

    const navigateToProfile = (username) => {
      router.push(`/profile/${username}`);
    };

    const toggleOptions = () => {
      showOptions.value = !showOptions.value;
      if (showOptions.value) {
        document.addEventListener("click", handleOptionsClickOutside);
        document.addEventListener("keydown", handleOptionsKeydown);
      } else {
        document.removeEventListener("click", handleOptionsClickOutside);
        document.removeEventListener("keydown", handleOptionsKeydown);
      }
    };

    const closeOptions = () => {
      showOptions.value = false;
      document.removeEventListener("click", handleOptionsClickOutside);
      document.removeEventListener("keydown", handleOptionsKeydown);
    };

    const handleOptionsClickOutside = (event) => {
      if (showOptions.value && !event.target.closest(".post-options")) {
        closeOptions();
      }
    };

    const handleOptionsKeydown = (event) => {
      if (event.key === "Escape") {
        closeOptions();
      }
    };

    const handleEdit = () => {
      // Edit functionality can be added later if needed
      closeOptions();
    };

    const handleDelete = async () => {
      const confirmed = confirm("Are you sure you want to delete this post?");
      if (!confirmed) return;

      closeOptions();
      emit("deleted", props.post._id);
    };

    // Lifecycle
    onUnmounted(() => {
      closeOptions();
    });

    return {
      actualPost,
      formattedText,
      showOptions,
      optionsContainer,
      currentUser,
      isOwnPost,
      formatTime,
      formatCount,
      navigateToProfile,
      toggleOptions,
      closeOptions,
      handleEdit,
      handleDelete,
    };
  },
};
</script>

<style scoped>
.post-preview {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--steel-gray);
}

.post-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid var(--bright-white);
}

.author-avatar:hover {
  transform: scale(1.05);
}

.author-info {
  flex: 1;
  min-width: 0;
}

.author-name-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);
}

.author-name {
  font-weight: 600;
  color: var(--bright-white);
  cursor: pointer;
  transition: color 0.2s ease;
}

.author-name:hover {
  color: var(--skyOrange);
}

.verified-badge {
  color: var(--skyOrange);
  font-size: var(--text-sm);
}

.author-username {
  color: var(--steel-gray);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: color 0.2s ease;
}

.author-username:hover {
  color: var(--bright-white);
}

.post-meta {
  color: var(--steel-gray);
  font-size: var(--text-sm);
  margin-top: var(--space-xs);
}

.edited-label {
  font-style: italic;
}

.post-options {
  position: relative;
  flex-shrink: 0;
}

.options-btn {
  padding: var(--space-sm);
  background: transparent;
  border: none;
  color: var(--steel-gray);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.options-btn:hover {
  background: var(--glass-morphism-bg);
  color: var(--bright-white);
}

.options-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--glass-morphism-bg);
  border: 1px solid var(--steel-gray);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-xl);
  z-index: 1000;
  min-width: 150px;
  overflow: hidden;
  margin-top: var(--space-xs);
}

.option-btn {
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: none;
  color: var(--bright-white);
  font-size: var(--text-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  transition: all 0.2s ease;
}

.option-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.option-btn.delete {
  color: var(--coral-red);
}

.post-content {
  margin-bottom: var(--space-lg);
}

.post-text {
  color: var(--bright-white);
  font-size: var(--text-base);
  line-height: 1.6;
  margin: 0 0 var(--space-md) 0;
  word-wrap: break-word;
}

.engagement-stats {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  padding-top: var(--space-md);
  border-top: 1px solid var(--steel-gray);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--steel-gray);
  font-size: var(--text-sm);
}

.stat-item font-awesome-icon {
  font-size: var(--text-base);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .post-preview {
    padding: var(--space-md);
  }

  .post-header {
    gap: var(--space-sm);
  }

  .author-avatar {
    width: 40px;
    height: 40px;
  }

  .engagement-stats {
    gap: var(--space-lg);
  }
}
</style>
