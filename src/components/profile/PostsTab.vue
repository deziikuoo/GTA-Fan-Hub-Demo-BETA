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

    <!-- Posts Grid (TikTok-style) -->
    <div v-else class="posts-grid">
      <div
        v-for="post in posts"
        :key="post._id"
        class="post-grid-item"
        @click="openPost(post)"
      >
        <div class="post-thumbnail" :class="{ 'has-quote': hasQuote(post) }">
          <!-- Repost quote section -->
          <div
            v-if="hasQuote(post)"
            class="repost-quote-card main-backdrop-filter"
          >
            <p class="repost-quote-text">
              {{ post.content.text }}
            </p>
          </div>

          <!-- Main content (original post or text) -->
          <div
            class="post-main-content"
            :class="{ 'is-repost': isRepost(post) }"
          >
            <div
              v-if="isRepost(post)"
              class="repost-content-overlay"
              aria-hidden="true"
            ></div>
            <div class="content-inner">
              <!-- Image Post -->
              <img
                v-if="
                  getPostMedia(post) &&
                  getPostMedia(post).length > 0 &&
                  getPostMedia(post)[0].type === 'image'
                "
                :src="getPostMedia(post)[0].url"
                :alt="getActualPost(post).content?.text || 'Post media'"
                class="thumbnail-image content-foreground"
              />
              <!-- Video Post -->
              <template
                v-else-if="
                  getPostMedia(post) &&
                  getPostMedia(post).length > 0 &&
                  getPostMedia(post)[0].type === 'video'
                "
              >
                <div class="thumbnail-video">
                  <video
                    :src="getPostMedia(post)[0].url"
                    muted
                    class="thumbnail-video-el content-foreground"
                  ></video>
                </div>
                <div class="play-overlay">
                  <font-awesome-icon
                    :icon="['fas', 'play']"
                    class="play-icon"
                  />
                </div>
              </template>
              <!-- Text Post Card -->
              <div
                v-else-if="getActualPost(post).content?.text"
                class="text-post-card main-backdrop-filter content-foreground"
              >
                <div class="text-post-content">
                  <p class="text-post-text">
                    {{ getActualPost(post).content.text }}
                  </p>
                </div>
              </div>
              <!-- Placeholder for posts without content or media -->
              <div v-else class="thumbnail-placeholder content-foreground">
                <font-awesome-icon
                  :icon="['fas', 'image']"
                  class="placeholder-icon"
                />
              </div>
            </div>
            <!-- View Count Overlay (only for media posts) -->
            <div
              class="view-count-overlay"
              v-if="
                getPostMedia(post) &&
                getPostMedia(post).length > 0 &&
                getActualPost(post).viewCount !== undefined
              "
            >
              <font-awesome-icon :icon="['fas', 'play']" class="view-icon" />
              <span>{{ formatViewCount(getActualPost(post).viewCount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMore" class="load-more-container">
        <button @click="loadMore" :disabled="loadingMore" class="load-more-btn">
          <span v-if="loadingMore">Loading...</span>
          <span v-else>Load More</span>
        </button>
      </div>
    </div>

    <!-- Post Detail Modal -->
    <div v-if="selectedPost" class="post-modal-overlay" @click="closePost">
      <div class="post-modal-content" @click.stop>
        <button class="modal-close-btn" @click="closePost">
          <font-awesome-icon :icon="['fas', 'times']" />
        </button>
        <PostCard :post="selectedPost" @deleted="handlePostDeleted" />
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
    const selectedPost = ref(null);

    const formatViewCount = (count) => {
      if (!count) return "0";
      if (count < 1000) return count.toString();
      if (count < 1000000) return (count / 1000).toFixed(1) + "K";
      return (count / 1000000).toFixed(1) + "M";
    };

    // Helper function to get the actual post (handles reposts)
    const isRepost = (post) => post.type === "repost" && post.originalPost;

    const hasQuote = (post) =>
      post.type === "repost" && post.content?.text?.trim();

    const getActualPost = (post) => {
      if (post.type === "repost" && post.originalPost) {
        return post.originalPost;
      }
      return post;
    };

    // Helper function to get post media (handles reposts)
    const getPostMedia = (post) => {
      const actualPost = getActualPost(post);
      return actualPost.media || [];
    };

    const openPost = (post) => {
      selectedPost.value = post;
    };

    const closePost = () => {
      selectedPost.value = null;
    };

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
      if (selectedPost.value && selectedPost.value._id === postId) {
        selectedPost.value = null;
      }
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
      selectedPost,
      formatViewCount,
      getActualPost,
      getPostMedia,
      hasQuote,
      isRepost,
      openPost,
      closePost,
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

/* TikTok-style Grid Layout */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  padding: 0;
}

.post-grid-item {
  position: relative;
  aspect-ratio: 9 / 16;
  cursor: pointer;
  overflow: hidden;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.post-grid-item:hover {
  transform: scale(1.02);
  opacity: 0.9;
  z-index: 10;
}

.post-thumbnail {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.post-thumbnail.has-quote .post-main-content {
  flex: 1;
}

.repost-quote-card {
  border-radius: 12px;
  padding: var(--space-md);
  text-align: center;
  color: var(--bright-white);
  max-height: 45%;
  min-height: 60px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.repost-quote-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  line-clamp: 4;
  overflow: hidden;
  text-overflow: ellipsis;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.post-main-content {
  position: relative;
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-main-content.is-repost {
  border-radius: 12px;
}

.repost-content-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 0.55) 0%,
    rgba(0, 0, 0, 0.45) 40%,
    rgba(0, 0, 0, 0.15) 75%,
    rgba(0, 0, 0, 0) 100%
  );
  pointer-events: none;
  z-index: 1;
}

.content-inner {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-foreground {
  position: relative;
  z-index: 2;
}

.thumbnail-image,
.thumbnail-video-el {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumbnail-video {
  position: relative;
  width: 100%;
  height: 100%;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
}

.placeholder-icon {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.3);
}

/* Text Post Card */
.text-post-card {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
  border-radius: 4px;
  overflow: hidden;
}

.text-post-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  align-items: center;
  text-align: center;
}

.text-post-text {
  color: var(--bright-white);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 8;
  -webkit-box-orient: vertical;
  line-clamp: 8;
  overflow: hidden;
  text-overflow: ellipsis;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.post-grid-item:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.9);
}

.view-count-overlay {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.4);
  padding: 2px 6px;
  border-radius: 4px;
}

.view-icon {
  font-size: 0.7rem;
}

/* Post Detail Modal */
.post-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  backdrop-filter: blur(20px);
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: var(--space-lg);
  overflow-y: auto;
}

.post-modal-content {
  position: relative;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-close-btn {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(50, 50, 50, 0.95),
    rgba(30, 30, 30, 0.95)
  );
  border: 2px solid var(--mint-green);
  color: var(--mint-green);
  font-size: 1.4em;
  font-weight: bold;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.5),
    0 0 15px rgba(152, 255, 152, 0.4), inset 0 0 10px rgba(152, 255, 152, 0.1);
}

.modal-close-btn svg {
  filter: drop-shadow(0 0 8px rgba(152, 255, 152, 0.9));
}

.modal-close-btn:hover {
  background: linear-gradient(135deg, rgba(30, 30, 30, 1), rgba(10, 10, 10, 1));
  transform: rotate(90deg) scale(1.1);
  color: var(--bright-white);
  border-color: var(--mint-green);
  box-shadow: 0 0.5rem 1.25rem rgba(0, 0, 0, 0.6),
    0 0 25px rgba(152, 255, 152, 0.8), 0 0 35px rgba(152, 255, 152, 0.6),
    inset 0 0 20px rgba(152, 255, 152, 0.2);
}

.modal-close-btn:hover svg {
  filter: drop-shadow(0 0 15px rgba(152, 255, 152, 1))
    drop-shadow(0 0 25px rgba(152, 255, 152, 0.8));
}

/* Responsive Grid */
@media (max-width: 1400px) {
  .posts-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1100px) {
  .posts-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .posts-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .posts-tab {
    padding: var(--space-md);
  }

  .post-modal-content {
    max-width: 100%;
  }

  .modal-close-btn {
    top: 1rem;
    right: 1rem;
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.2em;
  }
}

@media (max-width: 480px) {
  .posts-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2px;
  }
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
