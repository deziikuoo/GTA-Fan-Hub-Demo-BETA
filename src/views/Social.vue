<template>
  <div class="social-page">
    <!-- Page Header -->
    <div class="social-header">
      <h1>Social Feed</h1>
      <p>Connect with the GTA Fan community</p>
    </div>

    <!-- Feed Tabs -->
    <div class="feed-tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'following' }"
        @click="switchTab('following')"
      >
        <font-awesome-icon icon="users" />
        <span>Following</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'for-you' }"
        @click="switchTab('for-you')"
      >
        <font-awesome-icon icon="fire" />
        <span>For You</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'trending' }"
        @click="switchTab('trending')"
      >
        <font-awesome-icon icon="chart-line" />
        <span>Trending</span>
      </button>
    </div>

    <!-- Content Area -->
    <div class="social-content">
      <!-- Create Post -->
      <CreatePost v-if="isLoggedIn" @posted="handleNewPost" />

      <!-- Loading State -->
      <div v-if="loading && posts.length === 0" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading posts...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
        <button @click="loadFeed" class="retry-btn">Try Again</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="posts.length === 0" class="empty-state">
        <font-awesome-icon icon="newspaper" class="empty-icon" />
        <h3>No posts yet</h3>
        <p v-if="activeTab === 'following'">
          Follow some users to see their posts here!
        </p>
        <p v-else>Be the first to post something!</p>
      </div>

      <!-- Posts List -->
      <div v-else class="posts-feed">
        <PostCard
          v-for="post in posts"
          :key="post._id"
          :post="post"
          @deleted="handlePostDeleted"
        />

        <!-- Load More -->
        <div v-if="hasMore" class="load-more-container">
          <button
            @click="loadMore"
            :disabled="loadingMore"
            class="load-more-btn"
          >
            <span v-if="loadingMore">Loading...</span>
            <span v-else>Load More</span>
          </button>
        </div>

        <!-- End of Feed -->
        <div v-else-if="posts.length > 0" class="end-of-feed">
          <p>You're all caught up!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useStore } from "vuex";
import axios from "@/utils/axios";
import CreatePost from "@/components/social/CreatePost.vue";
import PostCard from "@/components/social/PostCard.vue";

export default {
  name: "Social",
  components: {
    CreatePost,
    PostCard,
  },
  setup() {
    const store = useStore();
    const posts = ref([]);
    const loading = ref(true);
    const loadingMore = ref(false);
    const error = ref(null);
    const page = ref(1);
    const hasMore = ref(true);

    const isLoggedIn = computed(() => store.getters.isLoggedIn);
    const activeTab = ref(isLoggedIn.value ? "following" : "trending");

    const loadFeed = async (append = false) => {
      try {
        if (!append) {
          loading.value = true;
          page.value = 1;
        } else {
          loadingMore.value = true;
        }

        error.value = null;

        // Check if trying to access authenticated feeds without being logged in
        if (
          (activeTab.value === "following" || activeTab.value === "for-you") &&
          !isLoggedIn.value
        ) {
          error.value = "Please log in to view this feed";
          return;
        }

        let endpoint = "";
        switch (activeTab.value) {
          case "following":
            endpoint = "/api/feed/following";
            break;
          case "for-you":
            endpoint = "/api/feed/for-you";
            break;
          case "trending":
            endpoint = "/api/feed/trending";
            break;
        }

        const response = await axios.get(endpoint, {
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
        console.error("Error loading feed:", err);
        error.value = err.response?.data?.error || "Failed to load feed";
      } finally {
        loading.value = false;
        loadingMore.value = false;
      }
    };

    const switchTab = (tab) => {
      if (activeTab.value === tab) return;

      // Check if trying to access authenticated feeds without being logged in
      if ((tab === "following" || tab === "for-you") && !isLoggedIn.value) {
        // Redirect to login or show error
        error.value = "Please log in to view this feed";
        return;
      }

      activeTab.value = tab;
      loadFeed();
    };

    const loadMore = () => {
      page.value++;
      loadFeed(true);
    };

    const handleNewPost = (newPost) => {
      // Add new post to the top of the feed
      posts.value.unshift(newPost);
    };

    const handlePostDeleted = (postId) => {
      posts.value = posts.value.filter((p) => p._id !== postId);
    };

    onMounted(() => {
      loadFeed();
    });

    // Reload feed when tab changes
    watch(activeTab, () => {
      loadFeed();
    });

    return {
      activeTab,
      posts,
      loading,
      loadingMore,
      error,
      hasMore,
      isLoggedIn,
      switchTab,
      loadFeed,
      loadMore,
      handleNewPost,
      handlePostDeleted,
    };
  },
};
</script>

<style scoped>
.social-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-lg);
  padding-top: 180px; /* Account for header */
  min-height: 100vh;
}

.social-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.social-header h1 {
  color: var(--bright-white);
  font-size: var(--text-4xl);
  margin-bottom: var(--space-sm);
}

.social-header p {
  color: var(--steel-gray);
  font-size: var(--text-lg);
}

.feed-tabs {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
  background: var(--glass-morphism-bg);
  padding: var(--space-sm);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: none;
  color: var(--steel-gray);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--bright-white);
}

.tab-btn.active {
  background: var(--skyOrange);
  color: var(--bright-white);
}

.social-content {
  display: flex;
  flex-direction: column;
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
  min-height: 400px;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--steel-gray);
  border-top: 4px solid var(--skyOrange);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-lg);
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
  font-size: var(--text-lg);
}

.retry-btn {
  padding: var(--space-md) var(--space-xl);
  background: var(--skyOrange);
  color: var(--bright-white);
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: var(--text-base);
  font-weight: 600;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: var(--neon-pink);
  transform: translateY(-2px);
}

.empty-icon {
  font-size: var(--text-6xl);
  color: var(--steel-gray);
  margin-bottom: var(--space-lg);
}

.empty-state h3 {
  color: var(--bright-white);
  font-size: var(--text-2xl);
  margin-bottom: var(--space-sm);
}

.empty-state p {
  color: var(--steel-gray);
  font-size: var(--text-base);
}

.posts-feed {
  display: flex;
  flex-direction: column;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: var(--space-xl);
}

.load-more-btn {
  padding: var(--space-md) var(--space-2xl);
  background: var(--glass-morphism-bg);
  color: var(--bright-white);
  border: 1px solid var(--steel-gray);
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: var(--text-base);
  font-weight: 500;
  transition: all 0.3s ease;
}

.load-more-btn:hover:not(:disabled) {
  background: var(--skyOrange);
  border-color: var(--skyOrange);
  transform: translateY(-2px);
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.end-of-feed {
  text-align: center;
  padding: var(--space-xl);
  color: var(--steel-gray);
}

.end-of-feed p {
  font-size: var(--text-base);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .social-page {
    padding: var(--space-md);
    padding-top: 140px;
  }

  .social-header h1 {
    font-size: var(--text-3xl);
  }

  .feed-tabs {
    gap: var(--space-xs);
  }

  .tab-btn {
    flex-direction: column;
    padding: var(--space-sm);
    font-size: var(--text-sm);
  }

  .tab-btn span {
    font-size: var(--text-xs);
  }
}
</style>
