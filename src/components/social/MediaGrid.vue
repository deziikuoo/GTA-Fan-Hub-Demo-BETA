<template>
  <div class="media-grid" :class="`media-count-${media.length}`">
    <div
      v-for="(item, index) in media"
      :key="index"
      class="media-item"
      @click="handleMediaClick(item, index)"
    >
      <!-- Image -->
      <img
        v-if="item.type === 'image' || item.type === 'gif'"
        :src="item.url"
        :alt="item.altText || 'Post media'"
        class="media-image"
        loading="lazy"
        @error="handleImageError($event)"
        @load="handleImageLoad($event)"
      />

      <!-- Video -->
      <div
        v-else-if="item.type === 'video'"
        class="media-video-wrapper"
        :ref="(el) => setVideoRef(el, index)"
        @click.stop="handleVideoClick(index)"
      >
        <video
          :ref="(el) => setVideoElementRef(el, index)"
          :src="item.url"
          :poster="item.thumbnail"
          class="media-video"
          preload="metadata"
          playsinline
          loop
          @error="handleVideoError($event)"
          @play="handleVideoPlay(index)"
          @pause="handleVideoPause(index)"
          @loadedmetadata="handleVideoLoaded(index)"
        ></video>
        <!-- Play button overlay for videos - show when paused -->
        <div
          v-if="!isVideoPlaying[index]"
          class="video-play-overlay"
          :class="{ 'overlay-visible': !isVideoPlaying[index] }"
        >
          <font-awesome-icon icon="play-circle" class="play-icon" />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <transition name="fade-fast">
        <div
          v-if="showImageModal"
          class="image-modal"
          role="dialog"
          aria-modal="true"
          @click="closeImageModal"
        >
          <div class="image-modal-layer">
            <div
              class="image-modal-backdrop"
              :style="imageModalBackdropStyle"
            ></div>
            <div class="image-modal-overlay"></div>
          </div>

          <button
            class="modal-close-btn"
            type="button"
            @click.stop="closeImageModal"
            aria-label="Close image preview"
          >
            <font-awesome-icon :icon="['fas', 'times']" />
          </button>

          <button
            v-if="hasPreviousImage"
            class="image-modal-nav image-modal-prev"
            type="button"
            @click.stop="showPreviousImage"
            aria-label="Previous image"
          >
            <font-awesome-icon :icon="['fas', 'chevron-left']" />
          </button>

          <div class="image-modal-content" @click.stop>
            <img
              v-if="currentImage"
              :src="currentImage.url"
              :alt="currentImage.altText || 'Post media'"
              class="image-modal-media"
              decoding="async"
            />
          </div>

          <button
            v-if="hasNextImage"
            class="image-modal-nav image-modal-next"
            type="button"
            @click.stop="showNextImage"
            aria-label="Next image"
          >
            <font-awesome-icon :icon="['fas', 'chevron-right']" />
          </button>

          <div class="image-modal-counter" v-if="imageCounter">
            {{ imageCounter }}
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";

export default {
  name: "MediaGrid",
  props: {
    media: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const isImageMedia = (item) =>
      item?.type === "image" || item?.type === "gif";

    const imageModalIndex = ref(-1);
    const prefetchedImages = new Set();
    const previousBodyOverflow = ref("");

    const imageIndices = computed(() =>
      props.media.reduce((acc, item, idx) => {
        if (isImageMedia(item)) acc.push(idx);
        return acc;
      }, [])
    );

    const currentImage = computed(() => {
      if (imageModalIndex.value === -1) return null;
      const item = props.media[imageModalIndex.value];
      return isImageMedia(item) ? item : null;
    });

    const showImageModal = computed(() => currentImage.value !== null);

    const currentImagePosition = computed(() => {
      if (!showImageModal.value) return -1;
      return imageIndices.value.indexOf(imageModalIndex.value);
    });

    const hasNextImage = computed(() => {
      if (!showImageModal.value) return false;
      const position = currentImagePosition.value;
      return position !== -1 && position < imageIndices.value.length - 1;
    });

    const hasPreviousImage = computed(() => {
      if (!showImageModal.value) return false;
      const position = currentImagePosition.value;
      return position > 0;
    });

    const imageCounter = computed(() => {
      if (!showImageModal.value) return "";
      const position = currentImagePosition.value;
      if (position === -1) return "";
      return `${position + 1} / ${imageIndices.value.length}`;
    });

    const imageModalBackdropStyle = computed(() => {
      if (!currentImage.value) return {};
      return {
        backgroundImage: `url(${currentImage.value.url})`,
      };
    });

    const prefetchImage = (url) => {
      if (!url || prefetchedImages.has(url)) return;
      const load = () => {
        const img = new Image();
        img.src = url;
        prefetchedImages.add(url);
      };

      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        window.requestIdleCallback(load, { timeout: 500 });
      } else {
        setTimeout(load, 200);
      }
    };

    const findAdjacentImageIndex = (startIndex, direction) => {
      let idx = startIndex + direction;
      while (idx >= 0 && idx < props.media.length) {
        if (isImageMedia(props.media[idx])) return idx;
        idx += direction;
      }
      return null;
    };

    const prefetchAdjacentImages = (index) => {
      const nextIndex = findAdjacentImageIndex(index, 1);
      const prevIndex = findAdjacentImageIndex(index, -1);
      if (nextIndex !== null) prefetchImage(props.media[nextIndex]?.url);
      if (prevIndex !== null) prefetchImage(props.media[prevIndex]?.url);
    };

    const disableBodyScroll = () => {
      if (typeof document === "undefined") return;
      previousBodyOverflow.value = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    };

    const enableBodyScroll = () => {
      if (typeof document === "undefined") return;
      document.body.style.overflow = previousBodyOverflow.value || "";
    };

    const openImageModal = (index) => {
      if (!isImageMedia(props.media[index])) return;
      imageModalIndex.value = index;
      prefetchImage(props.media[index]?.url);
      prefetchAdjacentImages(index);
    };

    const closeImageModal = () => {
      imageModalIndex.value = -1;
    };

    const showNextImage = () => {
      const nextIndex = findAdjacentImageIndex(imageModalIndex.value, 1);
      if (nextIndex !== null) {
        imageModalIndex.value = nextIndex;
        prefetchAdjacentImages(nextIndex);
      }
    };

    const showPreviousImage = () => {
      const prevIndex = findAdjacentImageIndex(imageModalIndex.value, -1);
      if (prevIndex !== null) {
        imageModalIndex.value = prevIndex;
        prefetchAdjacentImages(prevIndex);
      }
    };

    const handleMediaClick = (item, index) => {
      if (isImageMedia(item)) {
        openImageModal(index);
      }
    };

    // Video state
    const videoRefs = ref({});
    const videoElementRefs = ref({});
    const isVideoPlaying = ref({});
    const videoObservers = ref({});

    const handleImageError = (event) => {
      // Handle broken image
      event.target.style.display = "none";
      const parent = event.target.closest(".media-item");
      if (parent) {
        parent.classList.add("media-error");
      }
    };

    const handleImageLoad = (event) => {
      // Image loaded successfully
      event.target.classList.add("loaded");
    };

    const handleVideoError = (event) => {
      // Handle broken video
      const parent = event.target.closest(".media-item");
      if (parent) {
        parent.classList.add("media-error");
      }
    };

    // Video ref setters
    const setVideoRef = (el, index) => {
      if (el) {
        videoRefs.value[index] = el;
      }
    };

    const setVideoElementRef = (el, index) => {
      if (el) {
        videoElementRefs.value[index] = el;
        isVideoPlaying.value[index] = false;
      }
    };

    // Video playback handlers
    const handleVideoPlay = (index) => {
      isVideoPlaying.value[index] = true;
    };

    const handleVideoPause = (index) => {
      isVideoPlaying.value[index] = false;
    };

    const handleVideoLoaded = (index) => {
      // Video metadata loaded, ensure poster shows if not playing
      if (videoElementRefs.value[index]) {
        isVideoPlaying.value[index] = !videoElementRefs.value[index].paused;
      }
    };

    const toggleVideoPlay = (index) => {
      const video = videoElementRefs.value[index];
      if (!video) return;

      if (video.paused) {
        // When user manually clicks, ensure video is unmuted and play with audio
        video.muted = false;
        video.play().catch((err) => {
          console.error("Error playing video:", err);
        });
      } else {
        video.pause();
      }
    };

    const handleVideoClick = (index) => {
      // Toggle play/pause on click, but don't open lightbox
      toggleVideoPlay(index);
    };

    // IntersectionObserver setup for video autoplay
    const setupVideoObserver = (index, videoElement) => {
      if (!videoElement || videoObservers.value[index]) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Video is in viewport - try to autoplay with audio
              if (videoElement.paused) {
                // First try playing with audio (unmuted)
                videoElement.play().catch((err) => {
                  // If autoplay with sound is blocked, try muted autoplay
                  console.log(
                    "Autoplay with sound blocked, trying muted:",
                    err
                  );
                  videoElement.muted = true;
                  videoElement.play().catch((mutedErr) => {
                    // Autoplay completely blocked
                    console.log("Autoplay blocked:", mutedErr);
                  });
                });
              }
            } else {
              // Video is out of viewport - pause
              if (!videoElement.paused) {
                videoElement.pause();
              }
            }
          });
        },
        {
          threshold: 0.5, // Trigger when 50% of video is visible
          rootMargin: "0px",
        }
      );

      const wrapper = videoRefs.value[index];
      if (wrapper) {
        observer.observe(wrapper);
        videoObservers.value[index] = observer;
      }
    };

    // Initialize observers for all videos
    const initializeVideoObservers = () => {
      nextTick(() => {
        props.media.forEach((item, index) => {
          if (item.type === "video") {
            // Wait a bit for refs to be set
            setTimeout(() => {
              const videoElement = videoElementRefs.value[index];
              if (videoElement && !videoObservers.value[index]) {
                setupVideoObserver(index, videoElement);
              }
            }, 100);
          }
        });
      });
    };

    // Watch for video element refs to be set
    watch(
      () => videoElementRefs.value,
      () => {
        // Re-initialize observers when new video refs are added
        initializeVideoObservers();
      },
      { deep: true }
    );

    // Cleanup observers
    const cleanupVideoObservers = () => {
      Object.values(videoObservers.value).forEach((observer) => {
        if (observer && observer.disconnect) {
          observer.disconnect();
        }
      });
      videoObservers.value = {};
    };

    const handleKeydown = (event) => {
      if (!showImageModal.value) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeImageModal();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextImage();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousImage();
      }
    };

    watch(imageModalIndex, (index, previousIndex) => {
      if (index !== -1) {
        disableBodyScroll();
      } else if (previousIndex !== -1) {
        enableBodyScroll();
      }
    });

    watch(
      () => props.media.length,
      () => {
        if (
          imageModalIndex.value !== -1 &&
          (imageModalIndex.value >= props.media.length ||
            !isImageMedia(props.media[imageModalIndex.value]))
        ) {
          closeImageModal();
        }
      }
    );

    onMounted(() => {
      initializeVideoObservers();
      if (typeof window !== "undefined") {
        window.addEventListener("keydown", handleKeydown);
      }
    });

    onUnmounted(() => {
      cleanupVideoObservers();
      // Pause all videos on unmount
      Object.values(videoElementRefs.value).forEach((video) => {
        if (video && !video.paused) {
          video.pause();
        }
      });
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", handleKeydown);
      }
      enableBodyScroll();
    });

    return {
      showImageModal,
      currentImage,
      imageModalBackdropStyle,
      hasNextImage,
      hasPreviousImage,
      showNextImage,
      showPreviousImage,
      closeImageModal,
      handleMediaClick,
      imageCounter,
      handleImageError,
      handleImageLoad,
      handleVideoError,
      // Video handlers
      setVideoRef,
      setVideoElementRef,
      isVideoPlaying,
      toggleVideoPlay,
      handleVideoClick,
      handleVideoPlay,
      handleVideoPause,
      handleVideoLoaded,
      currentImagePosition,
    };
  },
};
</script>

<style scoped>
.media-grid {
  display: grid;
  gap: var(--space-xs);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-top: var(--space-md);
  width: 100%;
  max-width: 100%;
  /* Prevent overflow beyond post card */
  box-sizing: border-box;
}

/* Single media - full width with aspect ratio handling */
.media-count-1 {
  grid-template-columns: 1fr;
}

.media-count-1 .media-item {
  aspect-ratio: 16 / 9;
  min-height: 200px;
  max-height: 600px;
}

/* Two media - side by side */
.media-count-2 {
  grid-template-columns: 1fr 1fr;
}

.media-count-2 .media-item {
  aspect-ratio: 4 / 3;
  min-height: 200px;
  max-height: 400px;
}

/* Three media - one large left, two stacked right */
.media-count-3 {
  grid-template-columns: 2fr 1fr;
  grid-template-rows: repeat(2, 1fr);
  max-height: 500px;
}

.media-count-3 .media-item:first-child {
  grid-row: span 2;
  aspect-ratio: 2 / 3;
}

.media-count-3 .media-item:not(:first-child) {
  aspect-ratio: 4 / 3;
}

/* Four media - 2x2 grid */
.media-count-4 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  max-height: 500px;
}

.media-count-4 .media-item {
  aspect-ratio: 1 / 1;
  min-height: 150px;
}

.media-item {
  position: relative;
  overflow: hidden;
  background: var(--deep-black);
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  /* Prevent grid items from overflowing */
  width: 100%;
  height: 100%;
}

.media-item:hover {
  opacity: 0.95;
}

/* Ensure images and videos don't overflow */
.media-image,
.media-video {
  width: 100%;
  height: 100%;
  display: block;
  /* Prevent image/video from overflowing container */
  max-width: 100%;
  max-height: 100%;
  /* Smooth rendering */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

/* Single images use contain for full image display with letterboxing */
.media-count-1 .media-image {
  object-fit: contain;
}

/* Multiple images use cover for grid consistency */
.media-count-2 .media-image,
.media-count-3 .media-image,
.media-count-4 .media-image {
  object-fit: cover;
}

/* Videos always use cover */
.media-video {
  object-fit: cover;
}

/* Video wrapper for play overlay */
.media-video-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--deep-black);
  cursor: pointer;
}

.media-video-wrapper:hover {
  opacity: 0.95;
}

/* Better video handling */
.media-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: var(--deep-black);
  /* Ensure poster image displays when video is paused */
  pointer-events: auto;
}

/* Ensure video poster shows correctly */
.media-video[poster] {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* Video play overlay */
.video-play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.2s ease;
}

.video-play-overlay.overlay-visible {
  opacity: 1;
}

.play-icon {
  font-size: 4rem;
  color: rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
  transition: transform 0.2s ease;
}

.media-video-wrapper:hover .play-icon {
  transform: scale(1.1);
  color: var(--bright-white);
}

.media-video-wrapper:hover .video-play-overlay.overlay-visible {
  opacity: 0.95;
}

/* Error state */
.media-item.media-error {
  background: rgba(255, 64, 64, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-item.media-error::after {
  content: "⚠️ Media unavailable";
  color: var(--steel-gray);
  font-size: var(--text-sm);
}

/* Image load animation */
.media-image {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.media-image.loaded {
  opacity: 1;
}

/* Image modal */
.image-modal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 4vw, 48px);
  overflow: hidden;
}

.image-modal-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.image-modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(42px);
  transform: scale(1.18);
  opacity: 1;
}

.image-modal-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(8, 8, 8, 0.68) 0%,
    rgba(6, 6, 6, 0.72) 100%
  );
  backdrop-filter: blur(16px);
}

.image-modal-content {
  position: relative;
  max-width: min(1200px, 90vw);
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.image-modal-media {
  max-width: 100%;
  max-height: 90vh;
  width: auto;
  height: auto;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  object-fit: contain;
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

.image-modal-nav {
  position: absolute;
  z-index: 2;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: var(--bright-white);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
  backdrop-filter: blur(6px);
  top: 50%;
  transform: translateY(-50%);
}

.image-modal-nav:hover {
  background: rgba(255, 255, 255, 0.24);
  color: var(--mint-green);
}

.image-modal-nav:hover svg {
  filter: drop-shadow(0 0 8px rgba(152, 255, 152, 0.9));
  color: var(--mint-green);
}

.image-modal-prev {
  left: clamp(12px, 8vw, 48px);
}

.image-modal-next {
  right: clamp(12px, 8vw, 48px);
}

.image-modal-counter {
  position: absolute;
  bottom: clamp(16px, 8vh, 48px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.68);
  padding: 6px 14px;
  border-radius: var(--radius-full);
  color: var(--bright-white);
  font-weight: 600;
  letter-spacing: 0.03em;
  z-index: 2;
}

.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.2s ease;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .media-grid {
    gap: 2px;
    border-radius: var(--radius-md);
  }

  .media-count-1 .media-item {
    aspect-ratio: 4 / 3;
    max-height: 400px;
  }

  .media-count-2 .media-item {
    aspect-ratio: 4 / 3;
    max-height: 250px;
  }

  .media-count-3 {
    max-height: 350px;
  }

  .media-count-3 .media-item:first-child {
    aspect-ratio: 3 / 4;
  }

  .media-count-3 .media-item:not(:first-child) {
    aspect-ratio: 3 / 4;
  }

  .media-count-4 {
    max-height: 350px;
  }

  .media-count-4 .media-item {
    min-height: 120px;
  }

  .modal-close-btn {
    top: 1rem;
    right: 1rem;
    width: 2.5rem;
    height: 2.5rem;
    font-size: 1.2em;
  }

  .image-modal-nav {
    width: 40px;
    height: 40px;
  }

  .image-modal-prev {
    left: clamp(8px, 4vw, 24px);
  }

  .image-modal-next {
    right: clamp(8px, 4vw, 24px);
  }
}
</style>
