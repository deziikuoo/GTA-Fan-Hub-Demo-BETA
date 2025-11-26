<template>
  <div class="posts-tab">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading posts...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="loadPosts" class="retry-btn">Try Again</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="posts.length === 0" class="empty-state">
      <font-awesome-icon icon="newspaper" class="empty-icon" />
      <h3>No posts yet</h3>
      <p v-if="isOwnProfile">Share your thoughts with the community!</p>
      <p v-else>This user hasn't posted anything yet.</p>
    </div>

    <!-- Posts List -->
    <div v-else class="posts-list">
      <PostCard
        v-for="post in posts"
        :key="post._id"
        :post="post"
        @deleted="handlePostDeleted"
      />

      <!-- Load More -->
      <div v-if="hasMore" class="load-more-container">
        <button @click="loadMore" :disabled="loadingMore" class="load-more-btn">
          <span v-if="loadingMore">Loading...</span>
          <span v-else>Load More</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useStore } from "vuex";
import axios from "@/utils/axios";
import PostCard from "@/components/social/PostCard.vue";

export default {
  name: "PostsTab",
  components: {
    PostCard,
  },
  props: {
    userId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const store = useStore();
    const posts = ref([]);
    const loading = ref(true);
    const loadingMore = ref(false);
    const error = ref(null);
    const page = ref(1);
    const hasMore = ref(true);

    const currentUser = computed(() => store.state.user);
    const isOwnProfile = computed(() => currentUser.value?.id === props.userId);

    const loadPosts = async (append = false) => {
      try {
        if (!append) {
          loading.value = true;
          page.value = 1;
        } else {
          loadingMore.value = true;
        }

        error.value = null;

        const response = await axios.get(`/api/feed/user/${props.userId}`, {
          params: {
            page: page.value,
            limit: 20,
          },
        });

        if (append) {
          posts.value = [...posts.value, ...response.data.posts];
        } else {
          posts.value = response.data.posts;
        }

        hasMore.value = response.data.hasMore;
      } catch (err) {
        console.error("Error loading posts:", err);
        error.value = err.response?.data?.error || "Failed to load posts";
      } finally {
        loading.value = false;
        loadingMore.value = false;
      }
    };

    const loadMore = () => {
      page.value++;
      loadPosts(true);
    };

    const handlePostDeleted = (postId) => {
      posts.value = posts.value.filter((p) => p._id !== postId);
    };

    onMounted(() => {
      loadPosts();
    });

    // Watch for userId changes (when navigating between profiles)
    watch(
      () => props.userId,
      () => {
        loadPosts();
      }
    );

    return {
      posts,
      loading,
      loadingMore,
      error,
      hasMore,
      isOwnProfile,
      loadPosts,
      loadMore,
      handlePostDeleted,
    };
  },
};
</script>

<style scoped>
.posts-tab {
  padding: var(--space-lg);
}

.loading-container,
.error-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
  text-align: center;
  min-height: 300px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--steel-gray);
  border-top: 4px solid var(--skyOrange);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-md);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  color: var(--coral-red);
  margin-bottom: var(--space-md);
}

.retry-btn {
  padding: 8px 20px;
  background: var(--glass-morphism-bg);
  border: 1px solid var(--sunset-orange);
  border-radius: var(--radius-full);
  color: var(--bright-white);
  font-weight: 600;
  cursor: pointer;
  font-size: var(--text-base);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.retry-btn:hover {
  border: 1px solid var(--bright-white);
}

.empty-icon {
  font-size: var(--text-5xl);
  color: var(--steel-gray);
  margin-bottom: var(--space-lg);
}

.empty-state h3 {
  color: var(--bright-white);
  margin-bottom: var(--space-sm);
}

.empty-state p {
  color: var(--steel-gray);
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: var(--space-lg);
}

.load-more-btn {
  padding: 8px 20px;
  background: var(--glass-morphism-bg);
  color: var(--bright-white);
  border: 1px solid var(--sunset-orange);
  border-radius: var(--radius-full);
  font-weight: 600;
  cursor: pointer;
  font-size: var(--text-base);
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.load-more-btn:hover:not(:disabled) {
  border: 1px solid var(--bright-white);
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .posts-tab {
    padding: var(--space-md);
  }
}
</style>
