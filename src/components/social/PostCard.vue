<template>
  <div ref="postCardRef" class="post-card">
    <!-- Repost Header (if this is a repost) -->
    <div v-if="post.type === 'repost'" class="repost-header">
      <font-awesome-icon icon="retweet" />
      <span
        >{{
          post.author.profile?.displayName || post.author.username
        }}
        reposted</span
      >
    </div>

    <!-- Main Post Content -->
    <div class="post-main">
      <!-- Author Info -->
      <div class="post-header">
        <img
          :src="
            actualPost.author.profile?.profilePicture ||
            '/src/assets/images/user.png'
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
          <span class="post-time">{{ formatTime(actualPost.createdAt) }}</span>
          <span v-if="actualPost.isEdited" class="edited-label">(edited)</span>
        </div>

        <!-- More Options -->
        <div class="post-options" @click="toggleOptions">
          <font-awesome-icon icon="ellipsis-h" />

          <div v-if="showOptions" class="options-menu" @click.stop>
            <button
              v-if="isOwnPost"
              @click="handleEdit"
              :disabled="!actualPost.isEditable"
            >
              <font-awesome-icon icon="edit" /> Edit
            </button>
            <button v-if="isOwnPost" @click="handleDelete">
              <font-awesome-icon icon="trash" /> Delete
            </button>
            <button v-if="!isOwnPost" @click="handleReport">
              <font-awesome-icon icon="flag" /> Report
            </button>
            <button v-if="!isOwnPost" @click="handleBlock">
              <font-awesome-icon icon="ban" /> Block User
            </button>
            <button @click="handleHide">
              <font-awesome-icon icon="eye-slash" /> Hide
            </button>
            <button @click="handleCopyLink">
              <font-awesome-icon icon="link" /> Copy Link
            </button>
          </div>
        </div>
      </div>

      <!-- Post Content -->
      <div class="post-content" @click="navigateToPost">
        <p class="post-text" v-html="formattedText"></p>

        <!-- Media Grid -->
        <MediaGrid
          v-if="actualPost.media && actualPost.media.length > 0"
          :media="actualPost.media"
          @click.stop
        />

        <!-- Quote Post (if this is a quote) -->
        <div
          v-if="post.type === 'quote' && post.originalPost"
          class="quoted-post"
        >
          <div class="quoted-header">
            <img
              :src="
                post.originalPost.author.profile?.profilePicture ||
                '/src/assets/images/user.png'
              "
              class="quoted-avatar"
            />
            <span class="quoted-name">{{
              post.originalPost.author.profile?.displayName ||
              post.originalPost.author.username
            }}</span>
          </div>
          <p class="quoted-text">{{ post.originalPost.content.text }}</p>
        </div>
      </div>

      <!-- Engagement Bar -->
      <div class="engagement-bar">
        <!-- Likes -->
        <button
          class="engagement-btn"
          :class="{ active: isLiked }"
          @click.stop="handleLike"
          :disabled="liking"
        >
          <font-awesome-icon :icon="isLiked ? 'heart' : ['far', 'heart']" />
          <span>{{ formatCount(actualPost.engagement.likes) }}</span>
        </button>

        <!-- Comments -->
        <button class="engagement-btn" @click.stop="handleComment">
          <font-awesome-icon :icon="['far', 'comment']" />
          <span>{{ formatCount(actualPost.engagement.comments) }}</span>
        </button>

        <!-- Repost -->
        <button
          class="engagement-btn"
          :class="{ active: isReposted }"
          @click.stop="handleRepost"
          :disabled="reposting"
        >
          <font-awesome-icon icon="retweet" />
          <span>{{
            formatCount(
              actualPost.engagement.reposts + actualPost.engagement.quotes
            )
          }}</span>
        </button>

        <!-- Bookmark -->
        <button
          class="engagement-btn"
          :class="{ active: isBookmarked }"
          @click.stop="handleBookmark"
          :disabled="bookmarking"
        >
          <font-awesome-icon
            :icon="isBookmarked ? 'bookmark' : ['far', 'bookmark']"
          />
        </button>

        <!-- Views -->
        <span class="views-count">
          <font-awesome-icon icon="eye" />
          {{ formatCount(actualPost.engagement.views) }}
        </span>
      </div>
    </div>

    <!-- Edit Post Modal -->
    <div
      v-if="showEditModal"
      class="edit-modal-overlay"
      @click="handleEditModalClickOutside"
    >
      <div class="edit-modal-content" @click.stop>
        <div class="edit-modal-header">
          <h3>Edit Post</h3>
          <button class="edit-modal-close" @click="closeEditModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>

        <div class="edit-modal-body">
          <textarea
            v-model="editText"
            class="edit-textarea"
            placeholder="What's happening in Vice City?"
            maxlength="5000"
            ref="editTextarea"
          ></textarea>

          <div
            class="edit-character-count"
            :class="{
              warning: editText.length >= 4500,
              error: editText.length >= 5000,
            }"
          >
            {{ editText.length }} / 5000
          </div>
        </div>

        <div class="edit-modal-footer">
          <button class="edit-cancel-btn" @click="closeEditModal">
            Cancel
          </button>
          <button
            class="edit-save-btn"
            @click="saveEdit"
            :disabled="!editText.trim() || editText.length > 5000 || saving"
          >
            <span v-if="saving">Saving...</span>
            <span v-else>Save</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Comment Modal -->
    <PostDetailModal
      v-model="showCommentModal"
      :post="actualPost"
      @comment-added="handleCommentAdded"
      @comment-deleted="handleCommentDeleted"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import axios from "@/utils/axios";
import MediaGrid from "./MediaGrid.vue";
import PostDetailModal from "./PostDetailModal.vue";
import viewTracker from "@/utils/viewTracking";

export default {
  name: "PostCard",
  components: {
    MediaGrid,
    PostDetailModal,
  },
  props: {
    post: {
      type: Object,
      required: true,
    },
  },
  emits: ["deleted", "edited"],
  setup(props, { emit }) {
    const router = useRouter();
    const store = useStore();

    const showOptions = ref(false);
    const liking = ref(false);
    const reposting = ref(false);
    const bookmarking = ref(false);

    // Edit modal state
    const showEditModal = ref(false);
    const editText = ref("");
    const saving = ref(false);
    const editTextarea = ref(null);
    const showCommentModal = ref(false);

    // Local engagement state
    const isLiked = ref(props.post.userEngagement?.isLiked || false);
    const isBookmarked = ref(props.post.userEngagement?.isBookmarked || false);
    const isReposted = ref(false); // TODO: Track repost status

    const currentUser = computed(() => store.state.user);
    const isOwnPost = computed(
      () => currentUser.value?.id === props.post.author._id
    );

    // Get the actual post content (handle reposts)
    const actualPost = computed(() => {
      if (props.post.type === "repost" && props.post.originalPost) {
        return props.post.originalPost;
      }
      return props.post;
    });

    // Format text with mentions and hashtags
    const formattedText = computed(() => {
      if (!actualPost.value.content?.text) return "";

      let text = actualPost.value.content.text;

      // Convert mentions to links
      text = text.replace(
        /@(\w+)/g,
        '<a href="/profile/$1" class="mention">@$1</a>'
      );

      // Convert hashtags to links
      text = text.replace(
        /#(\w+)/g,
        '<a href="/feed/hashtag/$1" class="hashtag">#$1</a>'
      );

      // Convert URLs to links
      text = text.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="link">$1</a>'
      );

      return text;
    });

    const formatTime = (date) => {
      const now = new Date();
      const postDate = new Date(date);
      const diffInSeconds = Math.floor((now - postDate) / 1000);

      if (diffInSeconds < 60) return `${diffInSeconds}s`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
      if (diffInSeconds < 604800)
        return `${Math.floor(diffInSeconds / 86400)}d`;

      return postDate.toLocaleDateString();
    };

    const formatCount = (count) => {
      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
      return count.toString();
    };

    const toggleOptions = () => {
      showOptions.value = !showOptions.value;

      if (showOptions.value) {
        // Add keyboard event listener for Escape key when options open
        document.addEventListener("keydown", handleOptionsKeydown);
        // Add click listener to close options when clicking outside
        document.addEventListener("click", handleOptionsClickOutside);
      } else {
        // Remove event listeners when options close
        document.removeEventListener("keydown", handleOptionsKeydown);
        document.removeEventListener("click", handleOptionsClickOutside);
      }
    };

    const closeOptions = () => {
      showOptions.value = false;
      // Remove event listeners
      document.removeEventListener("keydown", handleOptionsKeydown);
      document.removeEventListener("click", handleOptionsClickOutside);
    };

    const handleOptionsClickOutside = (event) => {
      // Close options if clicking outside the options menu
      if (showOptions.value && !event.target.closest(".post-options")) {
        closeOptions();
      }
    };

    const handleOptionsKeydown = (event) => {
      // Close options on Escape key
      if (event.key === "Escape") {
        closeOptions();
      }
    };

    const navigateToProfile = (username) => {
      router.push(`/profile/${username}`);
    };

    const navigateToPost = () => {
      // TODO: Implement PostDetail route
      console.log(
        `Would navigate to post detail: /posts/${actualPost.value._id}`
      );
      // router.push(`/posts/${actualPost.value._id}`);
    };

    const handleLike = async () => {
      if (liking.value) return;

      try {
        liking.value = true;
        const response = await axios.post(
          `/api/posts/${actualPost.value._id}/like`
        );

        isLiked.value = response.data.liked;
        actualPost.value.engagement.likes = response.data.likesCount;
      } catch (error) {
        console.error("Error liking post:", error);
      } finally {
        liking.value = false;
      }
    };

    const handleComment = () => {
      // Open comment modal
      showCommentModal.value = true;
    };

    const handleRepost = async () => {
      if (reposting.value) return;

      try {
        reposting.value = true;
        const response = await axios.post(
          `/api/posts/${actualPost.value._id}/repost`
        );

        isReposted.value = response.data.reposted;
        // Update engagement count
        if (response.data.reposted) {
          actualPost.value.engagement.reposts++;
        } else {
          actualPost.value.engagement.reposts--;
        }
      } catch (error) {
        console.error("Error reposting:", error);
      } finally {
        reposting.value = false;
      }
    };

    const handleBookmark = async () => {
      if (bookmarking.value) return;

      try {
        bookmarking.value = true;
        const response = await axios.post(
          `/api/posts/${actualPost.value._id}/bookmark`
        );

        isBookmarked.value = response.data.bookmarked;
      } catch (error) {
        console.error("Error bookmarking post:", error);
      } finally {
        bookmarking.value = false;
      }
    };

    const handleEdit = () => {
      editText.value = actualPost.value.content?.text || "";
      showEditModal.value = true;
      closeOptions();

      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";

      // Add keyboard event listener for Escape key
      document.addEventListener("keydown", handleEditModalKeydown);

      // Focus textarea after modal opens
      setTimeout(() => {
        if (editTextarea.value) {
          editTextarea.value.focus();
          editTextarea.value.setSelectionRange(
            editText.value.length,
            editText.value.length
          );
        }
      }, 100);
    };

    const closeEditModal = (force = false) => {
      // Check if there are unsaved changes
      const originalText = actualPost.value.content?.text || "";
      const hasChanges = editText.value.trim() !== originalText.trim();

      if (hasChanges && !force) {
        const confirmClose = confirm(
          "You have unsaved changes. Are you sure you want to close?"
        );
        if (!confirmClose) return;
      }

      showEditModal.value = false;
      editText.value = "";
      saving.value = false;
      // Restore body scroll
      document.body.style.overflow = "auto";
      // Remove keyboard event listener
      document.removeEventListener("keydown", handleEditModalKeydown);
    };

    const handleEditModalClickOutside = (event) => {
      // Only close if clicking the overlay, not the modal content
      if (event.target.classList.contains("edit-modal-overlay")) {
        closeEditModal();
      }
    };

    const handleEditModalKeydown = (event) => {
      // Close modal on Escape key
      if (event.key === "Escape") {
        closeEditModal();
      }
    };

    const saveEdit = async () => {
      if (!editText.value.trim() || editText.value.length > 5000) return;

      try {
        saving.value = true;

        const response = await axios.put(`/api/posts/${actualPost.value._id}`, {
          text: editText.value.trim(),
        });

        // Update the post data locally
        actualPost.value.content.text = editText.value.trim();
        actualPost.value.isEdited = true;
        actualPost.value.editedAt = new Date();

        closeEditModal(true); // Force close after successful save

        // Emit event to parent components
        emit("edited", actualPost.value);
      } catch (error) {
        console.error("Error editing post:", error);
        alert(error.response?.data?.error || "Failed to edit post");
      } finally {
        saving.value = false;
      }
    };

    const handleDelete = async () => {
      if (!confirm("Are you sure you want to delete this post?")) return;

      try {
        await axios.delete(`/api/posts/${props.post._id}`);
        emit("deleted", props.post._id);
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("Failed to delete post");
      }
      closeOptions();
    };

    const handleReport = () => {
      // TODO: Implement report modal
      console.log("Report post:", actualPost.value._id);
      closeOptions();
    };

    const handleBlock = async () => {
      if (!confirm(`Block @${actualPost.value.author.username}?`)) return;

      try {
        await axios.post(`/api/users/${actualPost.value.author._id}/block`);
        alert("User blocked successfully");
        emit("deleted", props.post._id); // Remove from feed
      } catch (error) {
        console.error("Error blocking user:", error);
        alert("Failed to block user");
      }
      closeOptions();
    };

    const handleHide = () => {
      emit("deleted", props.post._id); // Remove from feed locally
      closeOptions();
    };

    const handleCopyLink = () => {
      const link = `${window.location.origin}/posts/${actualPost.value._id}`;
      navigator.clipboard.writeText(link);
      alert("Link copied to clipboard!");
      closeOptions();
    };

    // Comment modal event handlers
    const handleCommentAdded = (data) => {
      // Update comment count
      actualPost.value.engagement.comments += 1;
    };

    const handleCommentDeleted = (data) => {
      // Update comment count
      actualPost.value.engagement.comments = Math.max(
        0,
        actualPost.value.engagement.comments - 1
      );
    };

    // Cleanup function to prevent memory leaks
    onUnmounted(() => {
      // Remove event listeners and restore body scroll if modal was open
      document.removeEventListener("keydown", handleEditModalKeydown);
      document.removeEventListener("keydown", handleOptionsKeydown);
      document.removeEventListener("click", handleOptionsClickOutside);
      document.body.style.overflow = "auto";
    });

    // View tracking with Intersection Observer
    const postCardRef = ref(null);

    onMounted(() => {
      if (!postCardRef.value) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Post is in viewport - start tracking
              viewTracker.startTracking(props.post._id, {
                source: "feed",
                timestamp: new Date().toISOString(),
              });
            } else {
              // Post is out of viewport - stop tracking
              viewTracker.stopTracking(props.post._id);
            }
          });
        },
        {
          threshold: 0.5, // Trigger when 50% of post is visible
          rootMargin: "0px",
        }
      );

      observer.observe(postCardRef.value);

      // Cleanup observer on unmount
      onUnmounted(() => {
        observer.disconnect();
        viewTracker.stopTracking(props.post._id);
      });
    });

    return {
      showOptions,
      liking,
      reposting,
      bookmarking,
      isLiked,
      isBookmarked,
      isReposted,
      isOwnPost,
      actualPost,
      formattedText,
      formatTime,
      formatCount,
      toggleOptions,
      navigateToProfile,
      navigateToPost,
      handleLike,
      handleComment,
      handleRepost,
      handleBookmark,
      handleEdit,
      handleDelete,
      handleReport,
      handleBlock,
      // Edit modal
      showEditModal,
      editText,
      saving,
      editTextarea,
      closeEditModal,
      saveEdit,
      handleEditModalClickOutside,
      handleEditModalKeydown,
      // Options modal
      closeOptions,
      handleOptionsClickOutside,
      handleOptionsKeydown,
      handleHide,
      handleCopyLink,
      // Comment modal
      showCommentModal,
      handleCommentAdded,
      handleCommentDeleted,
      // View tracking
      postCardRef,
    };
  },
};
</script>

<style scoped>
.post-card {
  background: var(--glass-morphism-bg);
  border-radius: 1.2rem;
  padding: 20px;
  margin-bottom: var(--space-md);
  border: 1px solid transparent;
  box-shadow: 
    8px 8px 24px rgba(0, 0, 0, 0.3),
    -8px -8px 24px rgba(80, 80, 90, 0.05);
  transition: all 0.3s ease;
}

.post-card:hover {
  transform: translateY(-2px);
  border: var(--hover-border);
  box-shadow: 
    10px 10px 30px rgba(0, 0, 0, 0.4),
    -10px -10px 30px rgba(80, 80, 90, 0.08),
    var(--neon-glow-hover);
}

.repost-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--steel-gray);
  font-size: var(--text-sm);
  margin-bottom: var(--space-md);
  padding-left: var(--space-xl);
}

.repost-header svg {
  color: var(--skyOrange);
}

.post-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.post-header {
  display: flex;
  gap: var(--space-md);
  position: relative;
  padding-right: 40px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.author-avatar:hover {
  transform: scale(1.05);
}

.author-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  position: relative;
}

.author-name-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.author-name {
  color: var(--bright-white);
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.author-name:hover {
  color: var(--skyOrange);
}

.verified-badge {
  color: var(--electric-blue);
  font-size: var(--text-sm);
}

.post-time {
  color: var(--bright-white);
  font-size: var(--text-sm);
  font-weight: 400;
  position: absolute;
  right: -32px;
  top: 24px;
}

.edited-label {
  color: var(--steel-gray);
  font-size: var(--text-xs);
  font-style: italic;
}

.post-options {
  position: absolute;
  right: 0;
  top: 0;
  cursor: pointer;
  padding: var(--space-sm);
  color: var(--steel-gray);
  transition: color 0.2s ease;
}

.post-options:hover {
  color: var(--bright-white);
}

.options-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background: var(--deep-black);
  border: 1px solid var(--steel-gray);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  z-index: 10;
  min-width: 180px;
  box-shadow: var(--shadow-lg);
}

.options-menu button {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: none;
  border: none;
  color: var(--bright-white);
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background 0.2s ease;
}

.options-menu button:hover:not(:disabled) {
  background: var(--steel-gray);
}

.options-menu button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.post-content {
  cursor: pointer;
}

.post-text {
  color: var(--bright-white);
  font-weight: 400;
  line-height: 1.5;
  margin-bottom: var(--space-md);
  word-wrap: break-word;
}

.post-text :deep(.mention) {
  color: var(--electric-blue);
  text-decoration: none;
  font-weight: 500;
}

.post-text :deep(.mention:hover) {
  text-decoration: underline;
}

.post-text :deep(.hashtag) {
  color: var(--skyOrange);
  text-decoration: none;
  font-weight: 500;
}

.post-text :deep(.hashtag:hover) {
  text-decoration: underline;
}

.post-text :deep(.link) {
  color: var(--electric-blue);
  text-decoration: underline;
}

.quoted-post {
  border: 1px solid var(--steel-gray);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  background: rgba(0, 0, 0, 0.3);
}

.quoted-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.quoted-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.quoted-name {
  color: var(--bright-white);
  font-weight: 600;
  font-size: var(--text-sm);
}

.quoted-text {
  color: var(--steel-gray);
  font-size: var(--text-sm);
  line-height: 1.4;
}

.engagement-bar {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.engagement-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: none;
  border: none;
  color: var(--steel-gray);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-sm);
  transition: all 0.3s ease;
  font-size: var(--text-sm);
}

.engagement-btn span {
  color: var(--bright-white);
}

.engagement-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Like button hover - Pink */
.post-card:hover .engagement-btn:nth-child(1) svg {
  color: var(--neon-pink2);
  filter: drop-shadow(0 0 8px var(--neon-pink2));
}

/* Comment button hover - Blue */
.post-card:hover .engagement-btn:nth-child(2) svg {
  color: var(--electric-blue);
  filter: drop-shadow(0 0 8px var(--electric-blue));
}

/* Repost button hover - Orange */
.post-card:hover .engagement-btn:nth-child(3) svg {
  color: var(--sunset-orange);
  filter: drop-shadow(0 0 8px var(--sunset-orange));
}

/* Bookmark button hover - Green */
.post-card:hover .engagement-btn:nth-child(4) svg {
  color: var(--mint-green);
  filter: drop-shadow(0 0 8px var(--mint-green));
}

.engagement-btn.active {
  color: var(--neon-pink);
}

.engagement-btn.active svg {
  fill: currentColor;
  filter: drop-shadow(0 0 4px rgba(255, 20, 147, 0.5));
}

.views-count {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--bright-white);
  font-size: var(--text-sm);
  margin-left: auto;
  transition: all 0.3s ease;
}

.views-count svg {
  color: var(--steel-gray);
  transition: all 0.3s ease;
}

.post-card:hover .views-count svg {
  color: var(--bright-white);
  filter: drop-shadow(0 0 8px var(--bright-white));
}

@media (max-width: 768px) {
  .post-card {
    padding: 16px;
    border-radius: 1rem;
  }

  .engagement-bar {
    gap: var(--space-md);
  }

  .engagement-btn span {
    display: none;
  }
}

/* Edit Modal Styles */
.edit-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.edit-modal-content {
  background: var(--dark-blue);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.edit-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.edit-modal-header h3 {
  margin: 0;
  color: var(--bright-white);
  font-size: var(--text-lg);
  font-weight: 600;
}

.edit-modal-close {
  background: none;
  border: none;
  color: var(--steel-gray);
  font-size: var(--text-lg);
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.edit-modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--bright-white);
}

.edit-modal-body {
  padding: var(--space-lg);
  flex: 1;
  overflow-y: auto;
}

.edit-textarea {
  width: 100%;
  min-height: 120px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  color: var(--bright-white);
  font-size: var(--text-base);
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s ease;
}

.edit-textarea:focus {
  border-color: var(--skyOrange);
}

.edit-character-count {
  text-align: right;
  margin-top: var(--space-sm);
  font-size: var(--text-sm);
  color: var(--steel-gray);
  transition: color 0.2s ease;
}

.edit-character-count.warning {
  color: var(--skyOrange);
}

.edit-character-count.error {
  color: var(--coral-red);
}

.edit-modal-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.edit-cancel-btn,
.edit-save-btn {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: var(--text-base);
}

.edit-cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: var(--bright-white);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.edit-cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.edit-save-btn {
  background: var(--skyOrange);
  color: var(--bright-white);
}

.edit-save-btn:hover:not(:disabled) {
  background: var(--neon-pink);
  transform: translateY(-1px);
}

.edit-save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>
