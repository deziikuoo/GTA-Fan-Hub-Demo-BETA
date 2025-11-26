<template>
  <div class="comment-item" :style="{ paddingLeft: `${level * 20}px` }">
    <!-- Main Comment -->
    <div class="comment-main">
      <div class="comment-header">
        <!-- Author Avatar -->
        <div class="author-avatar">
          <img
            :src="
              comment.author.profile?.profilePicture ||
              '/src/assets/images/user.png'
            "
            :alt="comment.author.username"
            class="avatar-img"
          />
        </div>

        <!-- Author Info -->
        <div class="author-info">
          <div class="author-name">
            <span class="username">{{ comment.author.username }}</span>
            <VerifiedBadge v-if="comment.author.profile?.verified" />
            <span
              v-if="comment.author._id === postAuthorId"
              class="post-author-badge"
            >
              Author
            </span>
          </div>
          <div class="comment-meta">
            <span class="timestamp">{{ formatTime(comment.createdAt) }}</span>
            <span v-if="comment.isEdited" class="edited-label">(edited)</span>
          </div>
        </div>

        <!-- Options Dropdown (for own comments) -->
        <div v-if="isOwnComment" class="comment-options" ref="optionsContainer">
          <button
            @click="toggleOptions"
            class="options-btn"
            :class="{ active: showOptions }"
          >
            <font-awesome-icon icon="ellipsis-h" />
          </button>

          <!-- Options Menu -->
          <div v-if="showOptions" class="options-menu">
            <button
              v-if="comment.isEditable"
              @click="handleEdit"
              class="option-btn"
            >
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

      <!-- Comment Content -->
      <div class="comment-content">
        <p class="comment-text">{{ comment.content.text }}</p>
      </div>

      <!-- Comment Actions -->
      <div class="comment-actions">
        <button
          @click="toggleLike"
          class="action-btn like-btn"
          :class="{ active: isLiked }"
          :disabled="liking"
        >
          <font-awesome-icon
            :icon="isLiked ? ['fas', 'heart'] : ['far', 'heart']"
          />
          <span>{{ formatCount(comment.engagement.likes) }}</span>
        </button>

        <button
          v-if="level < 3"
          @click="toggleReply"
          class="action-btn reply-btn"
        >
          <font-awesome-icon icon="reply" />
          Reply
        </button>
      </div>
    </div>

    <!-- Reply Input -->
    <div v-if="showReplyInput" class="reply-input">
      <CommentInput
        :post-id="postId"
        :parent-comment-id="comment._id"
        placeholder="Write a reply..."
        :auto-focus="true"
        @comment-posted="handleReplyPosted"
        @cancel="toggleReply"
      />
    </div>

    <!-- Nested Replies -->
    <div v-if="comment.engagement.replies > 0" class="replies-section">
      <button
        v-if="!showReplies"
        @click="loadReplies"
        class="view-replies-btn"
        :disabled="loadingReplies"
      >
        <font-awesome-icon icon="chevron-down" />
        <span
          >View {{ comment.engagement.replies }}
          {{ comment.engagement.replies === 1 ? "reply" : "replies" }}</span
        >
      </button>

      <div v-else class="replies-list">
        <!-- Load More Replies Button -->
        <div v-if="hasMoreReplies" class="load-more-replies">
          <button
            @click="loadMoreReplies"
            class="load-more-btn"
            :disabled="loadingMoreReplies"
          >
            <span v-if="loadingMoreReplies">Loading...</span>
            <span v-else>Load more replies</span>
          </button>
        </div>

        <!-- Reply Items -->
        <CommentItem
          v-for="reply in replies"
          :key="reply._id"
          :comment="reply"
          :post-id="postId"
          :post-author-id="postAuthorId"
          :level="level + 1"
          @comment-edited="handleCommentEdited"
          @comment-deleted="handleCommentDeleted"
          @comment-liked="handleCommentLiked"
          @reply-added="handleReplyAdded"
        />
      </div>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="showEditModal"
      class="edit-modal-overlay"
      @click="handleEditModalClickOutside"
    >
      <div class="edit-modal-content" @click.stop>
        <div class="edit-modal-header">
          <h3>Edit Comment</h3>
          <button @click="closeEditModal" class="close-btn">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="edit-modal-body">
          <textarea
            v-model="editText"
            class="edit-textarea"
            :maxlength="2000"
            ref="editTextareaRef"
          />
          <div class="edit-footer">
            <div
              class="char-counter"
              :class="{ 'over-limit': editText.length > 2000 }"
            >
              {{ editText.length }}/2000
            </div>
            <div class="edit-actions">
              <button @click="closeEditModal" class="cancel-btn">Cancel</button>
              <button
                @click="saveEdit"
                class="save-btn"
                :disabled="!canSaveEdit || saving"
              >
                <span v-if="saving">Saving...</span>
                <span v-else>Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
import { useStore } from "vuex";
import axios from "@/utils/axios";
import CommentInput from "./CommentInput.vue";
import VerifiedBadge from "../VerifiedBadge.vue";

export default {
  name: "CommentItem",
  components: {
    CommentInput,
    VerifiedBadge,
  },
  props: {
    comment: {
      type: Object,
      required: true,
    },
    postId: {
      type: String,
      required: true,
    },
    postAuthorId: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      default: 0,
    },
  },
  emits: ["comment-edited", "comment-deleted", "comment-liked", "reply-added"],
  setup(props, { emit }) {
    const store = useStore();
    const currentUser = computed(() => store.getters.currentUser);

    // State
    const showOptions = ref(false);
    const showReplyInput = ref(false);
    const showReplies = ref(false);
    const showEditModal = ref(false);
    const replies = ref([]);
    const loadingReplies = ref(false);
    const loadingMoreReplies = ref(false);
    const hasMoreReplies = ref(false);
    const liking = ref(false);
    const saving = ref(false);
    const editText = ref("");
    const isLiked = ref(false);

    // Refs
    const optionsContainer = ref(null);
    const editTextareaRef = ref(null);

    // Computed
    const isOwnComment = computed(
      () => currentUser.value?.id === props.comment.author._id
    );

    const canSaveEdit = computed(
      () =>
        editText.value.trim().length > 0 &&
        editText.value.length <= 2000 &&
        editText.value.trim() !== props.comment.content.text.trim()
    );

    // Methods
    const formatTime = (timestamp) => {
      const now = new Date();
      const commentTime = new Date(timestamp);
      const diffInSeconds = Math.floor((now - commentTime) / 1000);

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
      if (showOptions.value && !event.target.closest(".comment-options")) {
        closeOptions();
      }
    };

    const handleOptionsKeydown = (event) => {
      if (event.key === "Escape") {
        closeOptions();
      }
    };

    const toggleReply = () => {
      showReplyInput.value = !showReplyInput.value;
    };

    const toggleLike = async () => {
      if (liking.value) return;

      liking.value = true;
      try {
        const response = await axios.post(
          `/api/comments/${props.comment._id}/like`
        );

        // Update local state
        isLiked.value = response.data.liked;

        // Update comment engagement count
        props.comment.engagement.likes += response.data.liked ? 1 : -1;

        emit("comment-liked", {
          commentId: props.comment._id,
          liked: response.data.liked,
          likesCount: props.comment.engagement.likes,
        });
      } catch (error) {
        console.error("Error toggling comment like:", error);
      } finally {
        liking.value = false;
      }
    };

    const loadReplies = async () => {
      if (loadingReplies.value) return;

      loadingReplies.value = true;
      try {
        const response = await axios.get(
          `/api/comments/${props.comment._id}/replies`,
          {
            params: { limit: 5, page: 1 },
          }
        );

        replies.value = response.data.replies || [];
        hasMoreReplies.value = response.data.hasMore || false;
        showReplies.value = true;
      } catch (error) {
        console.error("Error loading replies:", error);
      } finally {
        loadingReplies.value = false;
      }
    };

    const loadMoreReplies = async () => {
      if (loadingMoreReplies.value) return;

      loadingMoreReplies.value = true;
      try {
        const response = await axios.get(
          `/api/comments/${props.comment._id}/replies`,
          {
            params: {
              limit: 5,
              page: Math.floor(replies.value.length / 5) + 1,
            },
          }
        );

        replies.value = [...replies.value, ...(response.data.replies || [])];
        hasMoreReplies.value = response.data.hasMore || false;
      } catch (error) {
        console.error("Error loading more replies:", error);
      } finally {
        loadingMoreReplies.value = false;
      }
    };

    const handleReplyPosted = (reply) => {
      // Check if reply already exists to prevent duplicates
      const existingReply = replies.value.find((r) => r._id === reply._id);
      if (!existingReply) {
        replies.value.unshift(reply);
        props.comment.engagement.replies += 1;
      }
      showReplyInput.value = false;

      if (!showReplies.value) {
        showReplies.value = true;
      }

      emit("reply-added", { commentId: props.comment._id, reply });
    };

    const handleEdit = () => {
      editText.value = props.comment.content.text;
      showEditModal.value = true;
      closeOptions();
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEditModalKeydown);

      nextTick(() => {
        if (editTextareaRef.value) {
          editTextareaRef.value.focus();
          editTextareaRef.value.select();
        }
      });
    };

    const closeEditModal = () => {
      const originalText = props.comment.content.text;
      const hasChanges = editText.value.trim() !== originalText.trim();

      if (hasChanges) {
        const confirmClose = confirm(
          "You have unsaved changes. Are you sure you want to close?"
        );
        if (!confirmClose) return;
      }

      showEditModal.value = false;
      editText.value = "";
      saving.value = false;
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleEditModalKeydown);
    };

    const saveEdit = async () => {
      if (!canSaveEdit.value || saving.value) return;

      saving.value = true;
      try {
        const response = await axios.put(`/api/comments/${props.comment._id}`, {
          content: { text: editText.value.trim() },
        });

        // Update comment content
        props.comment.content.text = editText.value.trim();
        props.comment.isEdited = true;
        props.comment.editedAt = new Date();

        emit("comment-edited", {
          commentId: props.comment._id,
          content: editText.value.trim(),
        });
        closeEditModal();
      } catch (error) {
        console.error("Error saving comment edit:", error);
      } finally {
        saving.value = false;
      }
    };

    const handleDelete = async () => {
      const confirmed = confirm(
        "Are you sure you want to delete this comment?"
      );
      if (!confirmed) return;

      closeOptions();

      try {
        await axios.delete(`/api/comments/${props.comment._id}`);
        emit("comment-deleted", props.comment._id);
      } catch (error) {
        console.error("Error deleting comment:", error);
      }
    };

    const handleEditModalClickOutside = (event) => {
      if (showEditModal.value && !event.target.closest(".edit-modal-content")) {
        closeEditModal();
      }
    };

    const handleEditModalKeydown = (event) => {
      if (event.key === "Escape") {
        closeEditModal();
      }
    };

    // Event handlers for child components
    const handleCommentEdited = (data) => {
      emit("comment-edited", data);
    };

    const handleCommentDeleted = (commentId) => {
      emit("comment-deleted", commentId);
    };

    const handleCommentLiked = (data) => {
      emit("comment-liked", data);
    };

    const handleReplyAdded = (data) => {
      emit("reply-added", data);
    };

    // Lifecycle
    onMounted(() => {
      // Check if comment is liked by current user
      // TODO: This should come from the API response
      isLiked.value = false;
    });

    onUnmounted(() => {
      // Cleanup event listeners
      closeOptions();
      if (showEditModal.value) {
        closeEditModal();
      }
    });

    return {
      currentUser,
      showOptions,
      showReplyInput,
      showReplies,
      showEditModal,
      replies,
      loadingReplies,
      loadingMoreReplies,
      hasMoreReplies,
      liking,
      saving,
      editText,
      isLiked,
      optionsContainer,
      editTextareaRef,
      isOwnComment,
      canSaveEdit,
      formatTime,
      formatCount,
      toggleOptions,
      closeOptions,
      toggleReply,
      toggleLike,
      loadReplies,
      loadMoreReplies,
      handleReplyPosted,
      handleEdit,
      closeEditModal,
      saveEdit,
      handleDelete,
      handleEditModalClickOutside,
      handleEditModalKeydown,
      handleCommentEdited,
      handleCommentDeleted,
      handleCommentLiked,
      handleReplyAdded,
    };
  },
};
</script>

<style scoped>
.comment-item {
  margin-bottom: var(--space-lg);
  transition: all 0.2s ease;
}

.comment-main {
  background: var(--glass-morphism-bg);
  border-radius: 1.2rem;
  padding: 20px;
  border: 1px solid transparent;
  backdrop-filter: blur(10px);
  box-shadow: 
    8px 8px 24px rgba(0, 0, 0, 0.3),
    -8px -8px 24px rgba(80, 80, 90, 0.05);
  transition: all 0.3s ease;
}

.comment-main:hover {
  border: var(--hover-border);
  box-shadow: 
    10px 10px 30px rgba(0, 0, 0, 0.4),
    -10px -10px 30px rgba(80, 80, 90, 0.08),
    var(--neon-glow-hover);
}

.comment-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  margin-bottom: var(--space-sm);
}

.author-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--steel-gray);
}

.author-info {
  flex: 1;
  min-width: 0;
}

.author-name {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);
}

.username {
  font-weight: 600;
  color: var(--bright-white);
  font-size: var(--text-sm);
}

.post-author-badge {
  background: var(--skyOrange);
  color: var(--bright-white);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 500;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.timestamp {
  color: var(--steel-gray);
  font-size: var(--text-xs);
}

.edited-label {
  color: var(--steel-gray);
  font-size: var(--text-xs);
  font-style: italic;
}

.comment-options {
  position: relative;
  flex-shrink: 0;
}

.options-btn {
  padding: var(--space-xs);
  background: transparent;
  border: none;
  color: var(--steel-gray);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.options-btn:hover {
  background: var(--glass-morphism-bg);
  color: var(--bright-white);
}

.options-btn.active {
  background: var(--glass-morphism-bg);
  color: var(--bright-white);
}

.options-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--glass-morphism-bg);
  border: 1px solid var(--steel-gray);
  border-radius: var(--radius-md);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  min-width: 120px;
  overflow: hidden;
}

.option-btn {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: none;
  color: var(--bright-white);
  font-size: var(--text-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  transition: all 0.2s ease;
}

.option-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.option-btn.delete {
  color: var(--coral-red);
}

.comment-content {
  margin-bottom: var(--space-md);
}

.comment-text {
  color: var(--bright-white);
  font-size: var(--text-base);
  line-height: 1.5;
  margin: 0;
  word-wrap: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: transparent;
  border: none;
  color: var(--steel-gray);
  font-size: var(--text-sm);
  cursor: pointer;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.action-btn:hover {
  color: var(--bright-white);
  background: rgba(255, 255, 255, 0.05);
}

.action-btn.active {
  color: var(--neon-pink);
}

.action-btn.active:hover {
  color: var(--neon-pink);
}

.reply-input {
  margin-top: var(--space-md);
  margin-left: 48px; /* Align with comment content */
}

.replies-section {
  margin-top: var(--space-md);
}

.view-replies-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background: transparent;
  border: none;
  color: var(--steel-gray);
  font-size: var(--text-sm);
  cursor: pointer;
  padding: var(--space-xs) 0;
  transition: all 0.2s ease;
}

.view-replies-btn:hover:not(:disabled) {
  color: var(--bright-white);
}

.view-replies-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.replies-list {
  margin-top: var(--space-md);
}

.load-more-replies {
  margin-bottom: var(--space-md);
  text-align: center;
}

.load-more-btn {
  padding: 8px 20px;
  background: var(--glass-morphism-bg);
  border: 1px solid var(--sunset-orange);
  border-radius: var(--radius-full);
  color: var(--bright-white);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
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

/* Edit Modal */
.edit-modal-overlay {
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
}

.edit-modal-content {
  background: var(--glass-morphism-bg);
  border: 1px solid var(--steel-gray);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.edit-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--steel-gray);
}

.edit-modal-header h3 {
  color: var(--bright-white);
  font-size: var(--text-lg);
  margin: 0;
}

.close-btn {
  padding: var(--space-xs);
  background: transparent;
  border: none;
  color: var(--steel-gray);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: var(--bright-white);
  background: rgba(255, 255, 255, 0.1);
}

.edit-modal-body {
  padding: var(--space-lg);
}

.edit-textarea {
  width: 100%;
  min-height: 120px;
  max-height: 200px;
  padding: var(--space-md);
  background: var(--glass-morphism-bg);
  border: 1px solid var(--steel-gray);
  border-radius: var(--radius-md);
  color: var(--bright-white);
  font-size: var(--text-base);
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  margin-bottom: var(--space-md);
}

.edit-textarea:focus {
  outline: none;
  border-color: var(--skyOrange);
  box-shadow: 0 0 0 2px rgba(255, 140, 0, 0.2);
}

.edit-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-counter {
  font-size: var(--text-sm);
  color: var(--steel-gray);
}

.char-counter.over-limit {
  color: var(--coral-red);
}

.edit-actions {
  display: flex;
  gap: var(--space-sm);
}

.cancel-btn,
.save-btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: transparent;
  border: 1px solid var(--steel-gray);
  color: var(--steel-gray);
}

.cancel-btn:hover {
  background: var(--steel-gray);
  color: var(--bright-white);
}

.save-btn {
  background: var(--skyOrange);
  border: none;
  color: var(--bright-white);
}

.save-btn:hover:not(:disabled) {
  background: var(--neon-pink);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .comment-item {
    padding-left: 0;
  }

  .comment-main {
    padding: var(--space-sm);
  }

  .comment-header {
    gap: var(--space-sm);
  }

  .avatar-img {
    width: 28px;
    height: 28px;
  }

  .reply-input {
    margin-left: 36px;
  }

  .edit-modal-overlay {
    padding: var(--space-md);
  }

  .edit-modal-content {
    max-height: 90vh;
  }

  .edit-modal-header,
  .edit-modal-body {
    padding: var(--space-md);
  }
}
</style>
