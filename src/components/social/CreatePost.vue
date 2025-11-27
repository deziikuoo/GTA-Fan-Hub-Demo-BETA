<template>
  <div class="create-post main-backdrop-filter">
    <div class="post-composer">
      <!-- Text Area -->
      <div class="composer-input-container">
        <textarea
          v-model="postText"
          placeholder="What's happening in Vice City?"
          class="composer-textarea"
          :maxlength="5000"
          @input="adjustTextareaHeight"
          ref="textarea"
        ></textarea>

        <!-- Media Preview -->
        <div v-if="mediaFiles.length > 0" class="media-preview-grid">
          <div
            v-for="(file, index) in mediaFiles"
            :key="index"
            class="media-preview-item"
          >
            <img
              v-if="file.type.startsWith('image/')"
              :src="file.preview"
              alt="Preview"
              class="media-preview-image"
              @click="openLightbox(index)"
            />
            <video
              v-else-if="file.type.startsWith('video/')"
              :src="file.preview"
              class="media-preview-video"
              controls
            ></video>

            <button
              class="media-remove-btn"
              @click="removeMedia(index)"
              title="Remove"
            >
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>
        </div>

        <!-- Character Counter -->
        <div class="composer-footer">
          <div class="composer-actions">
            <!-- Media Upload -->
            <button
              class="action-btn"
              @click="triggerMediaUpload"
              :disabled="mediaFiles.length >= 4"
              title="Add photos or videos"
            >
              <font-awesome-icon :icon="['fas', 'image']" />
            </button>

            <!-- Privacy Selector -->
            <button
              class="action-btn privacy-btn"
              @click="togglePrivacy"
              :title="`Post visibility: ${privacy}`"
            >
              <font-awesome-icon
                :icon="privacy === 'public' ? 'globe' : 'users'"
              />
              <span class="privacy-label">{{
                privacy === "public" ? "Public" : "Followers"
              }}</span>
            </button>

            <input
              ref="mediaInput"
              type="file"
              accept="image/*,video/*"
              multiple
              style="display: none"
              @change="handleMediaSelect"
            />
          </div>

          <div class="composer-meta">
            <span
              class="char-counter"
              :class="{
                warning: postText.length > 4500,
                error: postText.length >= 5000,
              }"
            >
              {{ postText.length }} / 5000
            </span>

            <button
              class="post-btn"
              @click="handlePost"
              :disabled="!canPost || posting"
            >
              <span v-if="posting">Posting...</span>
              <span v-else>Post</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox Modal -->
    <div v-if="lightboxOpen" class="lightbox-overlay" @click="closeLightbox">
      <div class="lightbox-content" @click.stop>
        <button class="lightbox-close" @click="closeLightbox">
          <font-awesome-icon icon="times" />
        </button>

        <img
          v-if="currentLightboxMedia?.type.startsWith('image/')"
          :src="currentLightboxMedia.preview"
          alt="Preview"
          class="lightbox-image"
        />

        <div v-if="mediaFiles.length > 1" class="lightbox-navigation">
          <button
            v-if="lightboxIndex > 0"
            @click="previousLightboxMedia"
            class="lightbox-nav-btn lightbox-prev"
          >
            <font-awesome-icon :icon="['fas', 'chevron-left']" />
          </button>
          <button
            v-if="lightboxIndex < mediaFiles.length - 1"
            @click="nextLightboxMedia"
            class="lightbox-nav-btn lightbox-next"
          >
            <font-awesome-icon :icon="['fas', 'chevron-right']" />
          </button>
        </div>

        <div v-if="mediaFiles.length > 1" class="lightbox-counter">
          {{ lightboxIndex + 1 }} / {{ mediaFiles.length }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick } from "vue";
import { useStore } from "vuex";
import axios from "@/utils/axios";

export default {
  name: "CreatePost",
  emits: ["posted", "close"],
  setup(props, { emit }) {
    const store = useStore();
    const textarea = ref(null);
    const mediaInput = ref(null);

    const postText = ref("");
    const mediaFiles = ref([]);
    const privacy = ref("public");
    const posting = ref(false);

    // Lightbox state
    const lightboxOpen = ref(false);
    const lightboxIndex = ref(0);

    const currentUser = computed(() => store.state.user);

    const currentLightboxMedia = computed(() => {
      return mediaFiles.value[lightboxIndex.value];
    });

    const canPost = computed(() => {
      return (
        (postText.value.trim().length > 0 || mediaFiles.value.length > 0) &&
        postText.value.length <= 5000
      );
    });

    const adjustTextareaHeight = () => {
      nextTick(() => {
        if (textarea.value) {
          textarea.value.style.height = "auto";
          textarea.value.style.height = textarea.value.scrollHeight + "px";
        }
      });
    };

    const triggerMediaUpload = () => {
      mediaInput.value.click();
    };

    const handleMediaSelect = (event) => {
      const files = Array.from(event.target.files);

      // Limit to 4 total files
      const availableSlots = 4 - mediaFiles.value.length;
      const filesToAdd = files.slice(0, availableSlots);

      filesToAdd.forEach((file) => {
        // Validate file size (1GB max)
        if (file.size > 1024 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum file size is 1GB.`);
          return;
        }

        // Validate file type
        if (
          !file.type.startsWith("image/") &&
          !file.type.startsWith("video/")
        ) {
          alert(`${file.name} is not a valid image or video file.`);
          return;
        }

        // Create preview URL
        const preview = URL.createObjectURL(file);

        mediaFiles.value.push({
          file,
          preview,
          type: file.type,
        });
      });

      // Reset input
      event.target.value = "";
    };

    const removeMedia = (index) => {
      // Revoke object URL to free memory
      URL.revokeObjectURL(mediaFiles.value[index].preview);
      mediaFiles.value.splice(index, 1);
    };

    const togglePrivacy = () => {
      privacy.value = privacy.value === "public" ? "followers" : "public";
    };

    const handlePost = async () => {
      if (!canPost.value || posting.value) return;

      try {
        posting.value = true;

        // Create FormData for file upload
        const formData = new FormData();
        formData.append("text", postText.value);
        formData.append("privacy", privacy.value);

        // Append media files
        mediaFiles.value.forEach((mediaFile) => {
          formData.append("media", mediaFile.file);
        });

        const response = await axios.post("/api/posts", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Clear form
        postText.value = "";
        mediaFiles.value.forEach((mediaFile) => {
          URL.revokeObjectURL(mediaFile.preview);
        });
        mediaFiles.value = [];
        privacy.value = "public";

        // Reset textarea height
        if (textarea.value) {
          textarea.value.style.height = "auto";
        }

        // Emit event
        emit("posted", response.data.post);
      } catch (error) {
        console.error("Error creating post:", error);
        alert(error.response?.data?.error || "Failed to create post");
      } finally {
        posting.value = false;
      }
    };

    // Lightbox methods
    const openLightbox = (index) => {
      lightboxIndex.value = index;
      lightboxOpen.value = true;
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
      lightboxOpen.value = false;
      // Restore body scroll
      document.body.style.overflow = "auto";
    };

    const nextLightboxMedia = () => {
      if (lightboxIndex.value < mediaFiles.value.length - 1) {
        lightboxIndex.value++;
      }
    };

    const previousLightboxMedia = () => {
      if (lightboxIndex.value > 0) {
        lightboxIndex.value--;
      }
    };

    return {
      textarea,
      mediaInput,
      postText,
      mediaFiles,
      privacy,
      posting,
      currentUser,
      canPost,
      adjustTextareaHeight,
      triggerMediaUpload,
      handleMediaSelect,
      removeMedia,
      togglePrivacy,
      handlePost,
      // Lightbox
      lightboxOpen,
      lightboxIndex,
      currentLightboxMedia,
      openLightbox,
      closeLightbox,
      nextLightboxMedia,
      previousLightboxMedia,
    };
  },
};
</script>

<style scoped>
.create-post {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 20px 20px;
  margin-bottom: var(--space-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: auto;
  align-self: center;
}

.create-post:hover {
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.post-composer {
  display: flex;
  width: 400px;
}

.composer-input-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.composer-input-container:focus-within {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

.composer-textarea {
  width: 100%;
  min-height: 48px;
  max-height: 300px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--bright-white);
  font-size: var(--text-base);
  font-family: inherit;
  resize: none;
  overflow-y: auto;
  line-height: 20px;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
}

.composer-textarea:focus {
  outline: none;
}

.composer-textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.media-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--space-sm);
  margin-top: 8px;
}

.media-preview-item {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  aspect-ratio: 16/9;
}

.media-preview-image,
.media-preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-preview-image {
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.media-preview-image:hover {
  opacity: 0.9;
}

.media-remove-btn {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.8);
  border: none;
  border-radius: 50%;
  color: var(--bright-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.media-remove-btn:hover {
  background: var(--coral-red);
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.composer-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.action-btn {
  width: 34px;
  height: 34px;
  background: none;
  border: none;
  color: var(--mid-white2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s ease;
}

.action-btn:hover:not(:disabled) {
  background: none;
  border-color: var(--mint-green);
  color: var(--mint-green);
  opacity: 0.8;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.privacy-btn {
  width: auto;
  padding: 6px var(--space-md);
  gap: var(--space-xs);
  transition: all 0.2s ease;
  color: var(--mint-green);
}

.privacy-btn svg {
  color: var(--mid-white2);
}

.privacy-label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--mid-white2);
  transition: color 0.2s ease;
}

.privacy-btn:hover:not(:disabled) {
  background: none;
  border-color: var(--mint-green);
}

.privacy-btn:hover:not(:disabled) .privacy-label,
.privacy-btn:hover:not(:disabled) svg {
  color: var(--mint-green);
  opacity: 0.8;
}

.composer-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.char-counter {
  color: var(--steel-gray);
  font-size: var(--text-sm);
}

.char-counter.warning {
  color: var(--sunset-orange);
}

.char-counter.error {
  color: var(--coral-red);
  font-weight: 600;
}

.post-btn {
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--mid-white2);
  border: 1px solid var(--mid-white2);
  border-radius: var(--radius-full);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;
}

.post-btn:hover:not(:disabled) {
  background: var(--mid-white2Hover);
  border-color: var(--bright-white);
  color: var(--bright-white);
}

.post-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .create-post {
    padding: 16px 16px;
    border-radius: 1rem;
  }

  .privacy-label {
    display: none;
  }

  .composer-textarea {
    font-size: var(--text-base);
    min-height: 44px;
    padding: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .composer-textarea:focus {
    outline: none;
  }
}

/* Lightbox Styles */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.lightbox-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.lightbox-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lightbox-navigation {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.lightbox-nav-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  pointer-events: all;
}

.lightbox-nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lightbox-counter {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 20px;
}
</style>
