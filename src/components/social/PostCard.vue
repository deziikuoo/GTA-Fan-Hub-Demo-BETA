<template>
  <div ref="postCardRef" class="post-card main-backdrop-filter">
    <!-- Repost Header (if this is a repost) -->
    <div v-if="post.type === 'repost'" class="repost-header">
      <font-awesome-icon :icon="['fas', 'retweet']" />
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
              :icon="['fas', 'check-circle']"
              class="verified-badge"
            />
          </div>
          <span class="post-time">{{ formatTime(actualPost.createdAt) }}</span>
          <span v-if="actualPost.isEdited" class="edited-label">(edited)</span>
        </div>

        <!-- More Options -->
        <div class="post-options" @click="toggleOptions">
          <font-awesome-icon :icon="['fas', 'ellipsis-h']" />

          <div v-if="showOptions" class="options-menu" @click.stop>
            <button
              v-if="isOwnPost"
              @click="handleEdit"
              :disabled="!actualPost.isEditable"
            >
              <font-awesome-icon :icon="['fas', 'edit']" /> Edit
            </button>
            <button v-if="isOwnPost" @click="handleDelete">
              <font-awesome-icon :icon="['fas', 'trash']" /> Delete
            </button>
            <button v-if="!isOwnPost" @click="handleReport">
              <font-awesome-icon :icon="['fas', 'flag']" /> Report
            </button>
            <button v-if="!isOwnPost" @click="handleBlock">
              <font-awesome-icon :icon="['fas', 'ban']" /> Block User
            </button>
            <button @click="handleHide">
              <font-awesome-icon :icon="['fas', 'eye-slash']" /> Hide
            </button>
            <button @click="handleCopyLink">
              <font-awesome-icon :icon="['fas', 'link']" /> Copy Link
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
          <font-awesome-icon :icon="isLiked ? ['fas', 'heart'] : ['far', 'heart']" />
          <span>{{ formatCount(engagementCounts.likes) }}</span>
        </button>

        <!-- Comments -->
        <button
          class="engagement-btn"
          :class="{ active: hasCommented }"
          @click.stop="handleComment"
        >
          <font-awesome-icon
            :icon="hasCommented ? ['fas', 'comment'] : ['far', 'comment']"
          />
          <span>{{ formatCount(actualPost.engagement.comments) }}</span>
        </button>

        <!-- Repost -->
        <div class="repost-container" ref="repostContainerRef">
          <button
            class="engagement-btn"
            :class="{ active: isReposted }"
            @click.stop="toggleRepostMenu"
            :disabled="reposting"
          >
            <font-awesome-icon :icon="isReposted ? ['fas', 'check'] : ['fas', 'retweet']" />
            <span>{{
              formatCount(
                engagementCounts.reposts + (actualPost.engagement.quotes || 0)
              )
            }}</span>
          </button>

          <!-- Repost Menu Tooltip -->
          <div v-if="showRepostMenu" class="repost-menu" @click.stop>
            <button
              v-if="!isReposted"
              class="repost-menu-item"
              @click="handleSimpleRepost"
            >
              <font-awesome-icon :icon="['fas', 'retweet']" />
              <span>Repost</span>
            </button>
            <button v-else class="repost-menu-item" @click="handleSimpleRepost">
              <font-awesome-icon :icon="['fas', 'check']" />
              <span>Undo repost</span>
            </button>
            <button class="repost-menu-item" @click="handleQuoteRepost">
              <font-awesome-icon :icon="['fas', 'comment']" />
              <span>Quote</span>
            </button>
          </div>
        </div>

        <!-- Bookmark -->
        <button
          class="engagement-btn"
          :class="{ active: isBookmarked }"
          @click.stop="handleBookmark"
          :disabled="bookmarking"
        >
          <font-awesome-icon
            :icon="isBookmarked ? ['fas', 'bookmark'] : ['far', 'bookmark']"
          />
        </button>

        <!-- Views -->
        <span class="views-count">
          <font-awesome-icon :icon="['fas', 'eye']" />
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
            <font-awesome-icon :icon="['fas', 'times']" />
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

    <!-- Quote Post Modal -->
    <div
      v-if="showQuoteModal"
      class="quote-modal-overlay"
      @click="closeQuoteModal"
    >
      <div class="quote-modal-content" @click.stop>
        <div class="quote-modal-header">
          <h3>Quote Post</h3>
          <button class="quote-modal-close" @click="closeQuoteModal">
            <font-awesome-icon :icon="['fas', 'times']" />
          </button>
        </div>

        <div class="quote-modal-body">
          <!-- Your Quote Text -->
          <textarea
            v-model="quoteText"
            class="quote-textarea"
            placeholder="Add a comment..."
            maxlength="5000"
            ref="quoteTextarea"
          ></textarea>

          <div
            class="quote-character-count"
            :class="{
              warning: quoteText.length >= 4500,
              error: quoteText.length >= 5000,
            }"
          >
            {{ quoteText.length }} / 5000
          </div>

          <!-- Original Post Preview -->
          <div class="quoted-post-preview">
            <div class="quoted-post-header">
              <img
                :src="
                  actualPost.author.profile?.profilePicture ||
                  '/src/assets/images/user.png'
                "
                class="quoted-avatar-small"
              />
              <div class="quoted-author-info">
                <span class="quoted-author-name">{{
                  actualPost.author.profile?.displayName ||
                  actualPost.author.username
                }}</span>
                <span class="quoted-author-username"
                  >@{{ actualPost.author.username }}</span
                >
              </div>
            </div>
            <p class="quoted-post-text">{{ actualPost.content?.text }}</p>
            <MediaGrid
              v-if="actualPost.media && actualPost.media.length > 0"
              :media="actualPost.media"
              @click.stop
            />
          </div>
        </div>

        <div class="quote-modal-footer">
          <button class="quote-cancel-btn" @click="closeQuoteModal">
            Cancel
          </button>
          <button
            class="quote-post-btn"
            @click="submitQuotePost"
            :disabled="!quoteText.trim() || quoteText.length > 5000 || quoting"
          >
            <span v-if="quoting">Posting...</span>
            <span v-else>Quote Post</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
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
  emits: ["deleted", "edited", "quoted"],
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

    // Repost menu state
    const showRepostMenu = ref(false);
    const repostContainerRef = ref(null);

    // Quote modal state
    const showQuoteModal = ref(false);
    const quoteText = ref("");
    const quoting = ref(false);
    const quoteTextarea = ref(null);

    // Local engagement state - initialized from props to persist across reloads
    const isLiked = ref(props.post.userEngagement?.isLiked || false);
    const isBookmarked = ref(props.post.userEngagement?.isBookmarked || false);
    const isReposted = ref(props.post.userEngagement?.isReposted || false);
    const hasCommented = ref(props.post.userEngagement?.hasCommented || false);

    // Local engagement counts for instant updates
    const engagementCounts = ref({
      likes:
        props.post.type === "repost" && props.post.originalPost
          ? props.post.originalPost.engagement?.likes || 0
          : props.post.engagement?.likes || 0,
      reposts:
        props.post.type === "repost" && props.post.originalPost
          ? props.post.originalPost.engagement?.reposts || 0
          : props.post.engagement?.reposts || 0,
      bookmarks:
        props.post.type === "repost" && props.post.originalPost
          ? props.post.originalPost.engagement?.bookmarks || 0
          : props.post.engagement?.bookmarks || 0,
    });

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

        // Update state immediately
        isLiked.value = response.data.liked;

        // Update local engagement count for instant UI update
        engagementCounts.value.likes = response.data.postLikes;

        // Also update the post object for consistency
        if (props.post.type === "repost" && props.post.originalPost) {
          if (props.post.originalPost.engagement) {
            props.post.originalPost.engagement.likes = response.data.postLikes;
          }
        } else {
          if (props.post.engagement) {
            props.post.engagement.likes = response.data.postLikes;
          }
        }
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

    const toggleRepostMenu = () => {
      showRepostMenu.value = !showRepostMenu.value;
      if (showRepostMenu.value) {
        // Add click outside listener
        nextTick(() => {
          document.addEventListener("click", handleRepostMenuClickOutside);
        });
      }
    };

    const closeRepostMenu = () => {
      showRepostMenu.value = false;
      document.removeEventListener("click", handleRepostMenuClickOutside);
    };

    const handleRepostMenuClickOutside = (event) => {
      if (
        repostContainerRef.value &&
        !repostContainerRef.value.contains(event.target)
      ) {
        closeRepostMenu();
      }
    };

    const handleSimpleRepost = async () => {
      closeRepostMenu();
      if (reposting.value) return;

      try {
        reposting.value = true;
        const response = await axios.post(
          `/api/posts/${actualPost.value._id}/repost`
        );

        // Update state immediately
        isReposted.value = response.data.reposted;

        // Update local engagement count for instant UI update
        if (response.data.reposted) {
          engagementCounts.value.reposts++;
        } else {
          engagementCounts.value.reposts = Math.max(
            0,
            engagementCounts.value.reposts - 1
          );
        }

        // Also update the post object for consistency
        if (props.post.type === "repost" && props.post.originalPost) {
          if (props.post.originalPost.engagement) {
            if (response.data.reposted) {
              props.post.originalPost.engagement.reposts++;
            } else {
              props.post.originalPost.engagement.reposts = Math.max(
                0,
                props.post.originalPost.engagement.reposts - 1
              );
            }
          }
        } else {
          if (props.post.engagement) {
            if (response.data.reposted) {
              props.post.engagement.reposts++;
            } else {
              props.post.engagement.reposts = Math.max(
                0,
                props.post.engagement.reposts - 1
              );
            }
          }
        }
      } catch (error) {
        console.error("Error reposting:", error);
      } finally {
        reposting.value = false;
      }
    };

    const handleQuoteRepost = () => {
      closeRepostMenu();
      quoteText.value = "";
      showQuoteModal.value = true;
      document.body.style.overflow = "hidden";

      // Add keyboard event listener for Escape key
      document.addEventListener("keydown", handleQuoteModalKeydown);

      // Focus textarea after modal opens
      nextTick(() => {
        if (quoteTextarea.value) {
          quoteTextarea.value.focus();
        }
      });
    };

    const handleQuoteModalKeydown = (event) => {
      // Close modal on Escape key
      if (event.key === "Escape") {
        closeQuoteModal();
      }
    };

    const closeQuoteModal = () => {
      showQuoteModal.value = false;
      quoteText.value = "";
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleQuoteModalKeydown);
    };

    const submitQuotePost = async () => {
      if (!quoteText.value.trim() || quoteText.value.length > 5000) return;

      try {
        quoting.value = true;
        const response = await axios.post(
          `/api/posts/${actualPost.value._id}/quote`,
          {
            text: quoteText.value.trim(),
          }
        );

        // Update engagement counts
        if (props.post.type === "repost" && props.post.originalPost) {
          if (props.post.originalPost.engagement) {
            props.post.originalPost.engagement.quotes =
              (props.post.originalPost.engagement.quotes || 0) + 1;
          }
        } else {
          if (props.post.engagement) {
            props.post.engagement.quotes =
              (props.post.engagement.quotes || 0) + 1;
          }
        }

        closeQuoteModal();
        // Optionally emit event to refresh feed
        emit("quoted", response.data.post);
      } catch (error) {
        console.error("Error creating quote post:", error);
        alert(error.response?.data?.error || "Failed to create quote post");
      } finally {
        quoting.value = false;
      }
    };

    const handleBookmark = async () => {
      if (bookmarking.value) return;

      try {
        bookmarking.value = true;
        const response = await axios.post(
          `/api/posts/${actualPost.value._id}/bookmark`
        );

        // Update state immediately
        isBookmarked.value = response.data.bookmarked;

        // Update bookmark count if provided
        if (response.data.bookmarksCount !== undefined) {
          // Update local engagement count for instant UI update
          engagementCounts.value.bookmarks = response.data.bookmarksCount;

          // Also update the post object for consistency
          if (props.post.type === "repost" && props.post.originalPost) {
            if (props.post.originalPost.engagement) {
              props.post.originalPost.engagement.bookmarks =
                response.data.bookmarksCount;
            }
          } else {
            if (props.post.engagement) {
              props.post.engagement.bookmarks = response.data.bookmarksCount;
            }
          }
        }
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
      // Mark that user has commented
      hasCommented.value = true;
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
      document.removeEventListener("click", handleRepostMenuClickOutside);
      document.removeEventListener("keydown", handleQuoteModalKeydown);
      document.body.style.overflow = "auto";
    });

    // Note: Engagement states are initialized from props on mount.
    // User actions (like, comment, repost, bookmark) update local state directly.
    // Props don't change after initial render, so no watcher needed for performance.

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
      engagementCounts,
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
      // Repost menu
      showRepostMenu,
      repostContainerRef,
      toggleRepostMenu,
      handleSimpleRepost,
      handleQuoteRepost,
      closeRepostMenu,
      // Quote modal
      showQuoteModal,
      quoteText,
      quoting,
      quoteTextarea,
      closeQuoteModal,
      submitQuotePost,
      // View tracking
      postCardRef,
      // Comment state
      hasCommented,
    };
  },
};
</script>

<style scoped>
.post-card {
  border-radius: 20px;
  padding: 20px;
  margin-bottom: var(--space-md);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  /* Prevent card content from overflowing */
  box-sizing: border-box;
}

.post-card:hover {
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.repost-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--bright-white);
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
  border: 2px solid var(--bright-white);
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
  color: var(--skyOrange);
  transition: color 0.2s ease;
}

.post-options:hover {
  color: var(--mint-green);
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
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  /* Prevent content from overflowing post card */
  box-sizing: border-box;
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
  border: 2px solid var(--bright-white);
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
  transform: scale(1);
}

.engagement-btn span {
  color: var(--bright-white);
  transition: color 0.3s ease;
}

.engagement-btn svg {
  transition: all 0.3s ease;
  display: inline-block;
}

.engagement-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Like button - Pink (default) */
.engagement-btn:nth-child(1) svg {
  color: var(--neon-pink2);
}

.engagement-btn:nth-child(1):hover:not(:disabled) {
  transform: scale(1.05);
}

.engagement-btn:nth-child(1):hover:not(:disabled) svg {
  filter: drop-shadow(0 0 6px var(--neon-pink2));
  transform: scale(1.1);
}

.engagement-btn:nth-child(1).active {
  color: var(--neon-pink2);
}

.engagement-btn:nth-child(1).active svg {
  color: var(--neon-pink2) !important;
  fill: var(--neon-pink2) !important;
}

.engagement-btn:nth-child(1).active svg path {
  fill: var(--neon-pink2) !important;
}

/* Comment button - Blue (default) */
.engagement-btn:nth-child(2) svg {
  color: var(--electric-blue);
}

.engagement-btn:nth-child(2):hover:not(:disabled) {
  transform: scale(1.05);
}

.engagement-btn:nth-child(2):hover:not(:disabled) svg {
  filter: drop-shadow(0 0 6px var(--electric-blue));
  transform: scale(1.1);
}

.engagement-btn:nth-child(2).active {
  color: var(--electric-blue);
}

.engagement-btn:nth-child(2).active svg {
  color: var(--electric-blue) !important;
  fill: var(--electric-blue) !important;
}

.engagement-btn:nth-child(2).active svg path {
  fill: var(--electric-blue) !important;
}

/* Repost button - Orange (default) */
.repost-container .engagement-btn svg {
  color: var(--sunset-orange);
}

.repost-container .engagement-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.repost-container .engagement-btn:hover:not(:disabled) svg {
  filter: drop-shadow(0 0 6px var(--sunset-orange));
  transform: scale(1.1);
}

.repost-container .engagement-btn.active {
  color: var(--sunset-orange);
}

.repost-container .engagement-btn.active svg {
  color: var(--sunset-orange) !important;
  fill: var(--sunset-orange) !important;
}

.repost-container .engagement-btn.active svg path {
  fill: var(--sunset-orange) !important;
}

/* Repost Container & Menu */
.repost-container {
  position: relative;
}

.repost-menu {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: var(--space-sm);
  background: var(--deep-black);
  border: 1px solid var(--steel-gray);
  border-radius: var(--radius-md);
  padding: var(--space-xs);
  z-index: 100;
  min-width: 180px;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.repost-menu-item {
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
  font-size: var(--text-sm);
}

.repost-menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.repost-menu-item svg {
  color: var(--sunset-orange);
  width: 16px;
}

.repost-menu-item:first-child svg {
  color: var(--sunset-orange);
}

.repost-menu-item:last-child svg {
  color: var(--electric-blue);
}

/* Bookmark button - Green (default) */
.engagement-btn:nth-child(4) svg {
  color: var(--mint-green);
}

.engagement-btn:nth-child(4):hover:not(:disabled) {
  transform: scale(1.05);
}

.engagement-btn:nth-child(4):hover:not(:disabled) svg {
  filter: drop-shadow(0 0 6px var(--mint-green));
  transform: scale(1.1);
}

.engagement-btn:nth-child(4).active {
  color: var(--mint-green);
}

.engagement-btn:nth-child(4).active svg {
  color: var(--mint-green) !important;
  fill: var(--mint-green) !important;
}

.engagement-btn:nth-child(4).active svg path {
  fill: var(--mint-green) !important;
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
  background: var(--neon-pink2);
  transform: translateY(-1px);
}

.edit-save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Quote Modal Styles */
.quote-modal-overlay {
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

.quote-modal-content {
  background: var(--dark-blue);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.quote-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.quote-modal-header h3 {
  margin: 0;
  color: var(--bright-white);
  font-size: var(--text-lg);
  font-weight: 600;
}

.quote-modal-close {
  background: none;
  border: none;
  color: var(--steel-gray);
  font-size: var(--text-lg);
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.quote-modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--bright-white);
}

.quote-modal-body {
  padding: var(--space-lg);
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.quote-textarea {
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

.quote-textarea:focus {
  border-color: var(--skyOrange);
}

.quote-character-count {
  text-align: right;
  font-size: var(--text-sm);
  color: var(--steel-gray);
  transition: color 0.2s ease;
}

.quote-character-count.warning {
  color: var(--skyOrange);
}

.quote-character-count.error {
  color: var(--coral-red);
}

.quoted-post-preview {
  border: 1px solid var(--steel-gray);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  background: rgba(0, 0, 0, 0.3);
  margin-top: var(--space-sm);
}

.quoted-post-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.quoted-avatar-small {
  width: 32px;
  height: 32px;
  border: 1px solid var(--bright-white);
  object-fit: cover;
}

.quoted-author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quoted-author-name {
  color: var(--bright-white);
  font-weight: 600;
  font-size: var(--text-sm);
}

.quoted-author-username {
  color: var(--steel-gray);
  font-size: var(--text-xs);
}

.quoted-post-text {
  color: var(--steel-gray);
  font-size: var(--text-sm);
  line-height: 1.4;
  margin: 0;
  word-wrap: break-word;
}

.quote-modal-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.quote-cancel-btn,
.quote-post-btn {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: var(--text-base);
}

.quote-cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: var(--bright-white);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.quote-cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.quote-post-btn {
  background: var(--skyOrange);
  color: var(--bright-white);
}

.quote-post-btn:hover:not(:disabled) {
  background: var(--neon-pink2);
  transform: translateY(-1px);
}

.quote-post-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>
