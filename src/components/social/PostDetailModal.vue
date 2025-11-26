<template>
  <div v-if="modelValue" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>
      <!-- Close Button -->
      <button @click="closeModal" class="close-btn">
        <font-awesome-icon icon="times" />
      </button>

      <!-- Post Preview -->
      <div class="post-preview-section">
        <PostPreview :post="post" @deleted="handlePostDeleted" />
      </div>

      <!-- Comment Input -->
      <div v-if="isLoggedIn" class="comment-input-section">
        <CommentInput
          :post-id="post._id"
          :placeholder="`Add a comment...`"
          @comment-posted="handleCommentPosted"
        />
      </div>

      <!-- Login Prompt -->
      <div v-else class="login-prompt">
        <p>Please log in to comment on posts.</p>
        <router-link to="/login" class="login-link">Log In</router-link>
      </div>

      <!-- Comments Section -->
      <div class="comments-section">
        <div class="comments-header">
          <h3>Comments</h3>
          <span class="comments-count"
            >{{ totalComments }}
            {{ totalComments === 1 ? "comment" : "comments" }}</span
          >
        </div>

        <!-- Loading State -->
        <div v-if="loading && comments.length === 0" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading comments...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
          <p class="error-message">{{ error }}</p>
          <button @click="loadComments" class="retry-btn">Try Again</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="comments.length === 0" class="empty-state">
          <font-awesome-icon icon="comment" class="empty-icon" />
          <h4>No comments yet</h4>
          <p>Be the first to comment on this post!</p>
        </div>

        <!-- Comments List -->
        <div v-else class="comments-list">
          <CommentItem
            v-for="comment in comments"
            :key="comment._id"
            :comment="comment"
            :post-id="post._id"
            :post-author-id="post.author._id"
            :level="0"
            @comment-edited="handleCommentEdited"
            @comment-deleted="handleCommentDeleted"
            @comment-liked="handleCommentLiked"
            @reply-added="handleReplyAdded"
          />

          <!-- Load More Comments -->
          <div v-if="hasMoreComments" class="load-more-container">
            <button
              @click="loadMoreComments"
              :disabled="loadingMore"
              class="load-more-btn"
            >
              <span v-if="loadingMore">Loading...</span>
              <span v-else>Load more comments</span>
            </button>
          </div>

          <!-- End of Comments -->
          <div v-else-if="comments.length > 0" class="end-of-comments">
            <p>No more comments</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useStore } from "vuex";
import axios from "@/utils/axios";
import PostPreview from "./PostPreview.vue";
import CommentInput from "./CommentInput.vue";
import CommentItem from "./CommentItem.vue";
import viewTracker from "@/utils/viewTracking";

export default {
  name: "PostDetailModal",
  components: {
    PostPreview,
    CommentInput,
    CommentItem,
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    post: {
      type: Object,
      required: true,
    },
  },
  emits: ["update:modelValue", "comment-added", "comment-deleted"],
  setup(props, { emit }) {
    const store = useStore();
    const currentUser = computed(() => store.getters.currentUser);
    const isLoggedIn = computed(() => store.getters.isLoggedIn);

    // State
    const comments = ref([]);
    const loading = ref(false);
    const loadingMore = ref(false);
    const error = ref(null);
    const hasMoreComments = ref(true);
    const totalComments = ref(0);
    const page = ref(1);

    // Methods
    const closeModal = () => {
      emit("update:modelValue", false);
    };

    const handleOverlayClick = (event) => {
      if (event.target === event.currentTarget) {
        closeModal();
      }
    };

    const loadComments = async (append = false) => {
      if (append) {
        loadingMore.value = true;
      } else {
        loading.value = true;
        page.value = 1;
        comments.value = [];
      }

      error.value = null;

      try {
        const response = await axios.get(
          `/api/posts/${props.post._id}/comments`,
          {
            params: {
              page: page.value,
              limit: 10,
            },
          }
        );

        const newComments = response.data.comments || [];

        if (append) {
          comments.value = [...comments.value, ...newComments];
        } else {
          comments.value = newComments;
        }

        totalComments.value = response.data.totalCount || 0;
        hasMoreComments.value = response.data.hasMore || false;
      } catch (err) {
        console.error("Error loading comments:", err);
        error.value = err.response?.data?.error || "Failed to load comments";
      } finally {
        loading.value = false;
        loadingMore.value = false;
      }
    };

    const loadMoreComments = () => {
      page.value++;
      loadComments(true);
    };

    const handleCommentPosted = (comment) => {
      // Check if comment already exists to prevent duplicates
      const existingComment = comments.value.find((c) => c._id === comment._id);
      if (!existingComment) {
        comments.value.unshift(comment);
        totalComments.value += 1;
      }
      emit("comment-added", { postId: props.post._id, comment });
    };

    const handleCommentEdited = (data) => {
      // Find and update the comment
      const comment = comments.value.find((c) => c._id === data.commentId);
      if (comment) {
        comment.content.text = data.content;
        comment.isEdited = true;
        comment.editedAt = new Date();
      }
    };

    const handleCommentDeleted = (commentId) => {
      // Remove comment from list
      comments.value = comments.value.filter((c) => c._id !== commentId);
      totalComments.value = Math.max(0, totalComments.value - 1);
      emit("comment-deleted", { postId: props.post._id, commentId });
    };

    const handleCommentLiked = (data) => {
      // Find and update the comment's like status
      const comment = comments.value.find((c) => c._id === data.commentId);
      if (comment) {
        comment.engagement.likes = data.likesCount;
      }
    };

    const handleReplyAdded = (data) => {
      // Find parent comment and update reply count
      const parentComment = comments.value.find(
        (c) => c._id === data.commentId
      );
      if (parentComment) {
        parentComment.engagement.replies += 1;
        totalComments.value += 1;
      }
    };

    const handlePostDeleted = () => {
      closeModal();
    };

    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    // Lifecycle
    onMounted(() => {
      if (props.modelValue) {
        loadComments();
        document.addEventListener("keydown", handleKeydown);
        document.body.style.overflow = "hidden";
      }
    });

    onUnmounted(() => {
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = "auto";
    });

    // Watch for modal open/close
    watch(
      () => props.modelValue,
      (isOpen) => {
        if (isOpen) {
          loadComments();
          document.addEventListener("keydown", handleKeydown);
          document.body.style.overflow = "hidden";

          // Track view when modal opens (force track for modal views)
          viewTracker.forceTrackView(props.post._id, {
            source: "modal",
            timestamp: new Date().toISOString(),
          });
        } else {
          document.removeEventListener("keydown", handleKeydown);
          document.body.style.overflow = "auto";
        }
      }
    );

    // Watch for post changes
    watch(
      () => props.post._id,
      () => {
        if (props.modelValue) {
          loadComments();
        }
      }
    );

    return {
      currentUser,
      isLoggedIn,
      comments,
      loading,
      loadingMore,
      error,
      hasMoreComments,
      totalComments,
      closeModal,
      handleOverlayClick,
      loadComments,
      loadMoreComments,
      handleCommentPosted,
      handleCommentEdited,
      handleCommentDeleted,
      handleCommentLiked,
      handleReplyAdded,
      handlePostDeleted,
    };
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: var(--space-lg);
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

.modal-content {
  background: var(--glass-morphism-bg);
  border: 1px solid transparent;
  border-radius: 1.2rem;
  backdrop-filter: blur(20px);
  box-shadow: 
    8px 8px 24px rgba(0, 0, 0, 0.3),
    -8px -8px 24px rgba(80, 80, 90, 0.05);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  transform: translateY(20px);
  animation: slideUp 0.3s ease forwards;
}

@keyframes slideUp {
  to {
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  color: var(--bright-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-lg);
  transition: all 0.2s ease;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: scale(1.1);
}

.post-preview-section {
  max-height: 400px;
  overflow-y: auto;
}

.comment-input-section {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--steel-gray);
}

.login-prompt {
  padding: var(--space-lg);
  text-align: center;
  border-bottom: 1px solid var(--steel-gray);
}

.login-prompt p {
  color: var(--steel-gray);
  margin-bottom: var(--space-md);
}

.login-link {
  display: inline-block;
  padding: var(--space-sm) var(--space-lg);
  background: var(--skyOrange);
  color: var(--bright-white);
  text-decoration: none;
  border-radius: var(--radius-full);
  font-weight: 600;
  transition: all 0.2s ease;
}

.login-link:hover {
  background: var(--neon-pink);
  transform: translateY(-2px);
}

.comments-section {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
}

.comments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--steel-gray);
}

.comments-header h3 {
  color: var(--bright-white);
  font-size: var(--text-xl);
  margin: 0;
}

.comments-count {
  color: var(--steel-gray);
  font-size: var(--text-sm);
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
  min-height: 200px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--steel-gray);
  border-top: 3px solid var(--skyOrange);
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

.loading-container p,
.error-container p {
  color: var(--steel-gray);
  margin: 0;
}

.error-message {
  color: var(--coral-red);
  margin-bottom: var(--space-md);
}

.retry-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--skyOrange);
  color: var(--bright-white);
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: var(--neon-pink);
  transform: translateY(-2px);
}

.empty-icon {
  font-size: var(--text-4xl);
  color: var(--steel-gray);
  margin-bottom: var(--space-lg);
}

.empty-state h4 {
  color: var(--bright-white);
  font-size: var(--text-lg);
  margin: 0 0 var(--space-sm) 0;
}

.empty-state p {
  color: var(--steel-gray);
  margin: 0;
}

.comments-list {
  display: flex;
  flex-direction: column;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: var(--space-xl);
}

.load-more-btn {
  padding: 8px 20px;
  background: var(--glass-morphism-bg);
  border: 1px solid var(--sunset-orange);
  border-radius: var(--radius-full);
  color: var(--bright-white);
  cursor: pointer;
  font-size: var(--text-base);
  font-weight: 600;
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

.end-of-comments {
  text-align: center;
  padding: var(--space-xl);
  color: var(--steel-gray);
  font-size: var(--text-sm);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 0;
    align-items: flex-end;
  }

  .modal-content {
    width: 100%;
    max-width: none;
    max-height: 95vh;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    transform: translateY(100%);
    animation: slideUpMobile 0.3s ease forwards;
  }

  @keyframes slideUpMobile {
    to {
      transform: translateY(0);
    }
  }

  .close-btn {
    top: var(--space-md);
    right: var(--space-md);
    width: 36px;
    height: 36px;
    font-size: var(--text-base);
  }

  .post-preview-section {
    max-height: 300px;
  }

  .comment-input-section,
  .login-prompt,
  .comments-section {
    padding: var(--space-md);
  }

  .comments-header {
    margin-bottom: var(--space-md);
  }

  .comments-header h3 {
    font-size: var(--text-lg);
  }

  .loading-container,
  .error-container,
  .empty-state {
    padding: var(--space-xl);
    min-height: 150px;
  }
}
</style>
