<template>
  <div class="media-grid" :class="`media-count-${media.length}`">
    <div
      v-for="(item, index) in media"
      :key="index"
      class="media-item"
      @click="openLightbox(index)"
    >
      <!-- Image -->
      <img
        v-if="item.type === 'image' || item.type === 'gif'"
        :src="item.url"
        :alt="item.altText || 'Post media'"
        class="media-image"
        loading="lazy"
      />

      <!-- Video -->
      <video
        v-else-if="item.type === 'video'"
        :src="item.url"
        :poster="item.thumbnail"
        class="media-video"
        controls
        preload="metadata"
      ></video>
    </div>

    <!-- Lightbox Modal -->
    <div v-if="showLightbox" class="lightbox" @click="closeLightbox">
      <button class="lightbox-close" @click.stop="closeLightbox">
        <font-awesome-icon icon="times" />
      </button>

      <button
        v-if="media.length > 1 && currentIndex > 0"
        class="lightbox-nav lightbox-prev"
        @click.stop="prevMedia"
      >
        <font-awesome-icon icon="chevron-left" />
      </button>

      <div class="lightbox-content" @click.stop>
        <img
          v-if="currentMedia.type === 'image' || currentMedia.type === 'gif'"
          :src="currentMedia.url"
          :alt="currentMedia.altText || 'Post media'"
          class="lightbox-image"
        />

        <video
          v-else-if="currentMedia.type === 'video'"
          :src="currentMedia.url"
          class="lightbox-video"
          controls
          autoplay
        ></video>
      </div>

      <button
        v-if="media.length > 1 && currentIndex < media.length - 1"
        class="lightbox-nav lightbox-next"
        @click.stop="nextMedia"
      >
        <font-awesome-icon icon="chevron-right" />
      </button>

      <div class="lightbox-counter">
        {{ currentIndex + 1 }} / {{ media.length }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";

export default {
  name: "MediaGrid",
  props: {
    media: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const showLightbox = ref(false);
    const currentIndex = ref(0);

    const currentMedia = computed(() => props.media[currentIndex.value]);

    const openLightbox = (index) => {
      currentIndex.value = index;
      showLightbox.value = true;
      document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
      showLightbox.value = false;
      document.body.style.overflow = "";
    };

    const nextMedia = () => {
      if (currentIndex.value < props.media.length - 1) {
        currentIndex.value++;
      }
    };

    const prevMedia = () => {
      if (currentIndex.value > 0) {
        currentIndex.value--;
      }
    };

    return {
      showLightbox,
      currentIndex,
      currentMedia,
      openLightbox,
      closeLightbox,
      nextMedia,
      prevMedia,
    };
  },
};
</script>

<style scoped>
.media-grid {
  display: grid;
  gap: var(--space-xs);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-top: var(--space-md);
}

/* Single media - full width */
.media-count-1 {
  grid-template-columns: 1fr;
  max-height: 500px;
}

/* Two media - side by side */
.media-count-2 {
  grid-template-columns: 1fr 1fr;
  max-height: 350px;
}

/* Three media - one large left, two stacked right */
.media-count-3 {
  grid-template-columns: 2fr 1fr;
  max-height: 400px;
}

.media-count-3 .media-item:first-child {
  grid-row: span 2;
}

/* Four media - 2x2 grid */
.media-count-4 {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  max-height: 400px;
}

.media-item {
  position: relative;
  overflow: hidden;
  background: var(--deep-black);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.media-item:hover {
  transform: scale(1.02);
}

.media-image,
.media-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.media-video {
  cursor: default;
}

/* Lightbox */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-close {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: var(--bright-white);
  font-size: var(--text-2xl);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
  z-index: 10001;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.lightbox-content {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-image,
.lightbox-video {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: var(--bright-white);
  font-size: var(--text-2xl);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
  z-index: 10001;
}

.lightbox-nav:hover {
  background: rgba(255, 255, 255, 0.2);
}

.lightbox-prev {
  left: var(--space-lg);
}

.lightbox-next {
  right: var(--space-lg);
}

.lightbox-counter {
  position: absolute;
  bottom: var(--space-lg);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-full);
  color: var(--bright-white);
  font-size: var(--text-sm);
  z-index: 10001;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .media-count-2,
  .media-count-3,
  .media-count-4 {
    max-height: 300px;
  }

  .lightbox-nav,
  .lightbox-close {
    width: 40px;
    height: 40px;
    font-size: var(--text-xl);
  }

  .lightbox-nav {
    top: 50%;
  }

  .lightbox-prev {
    left: var(--space-sm);
  }

  .lightbox-next {
    right: var(--space-sm);
  }

  .lightbox-close {
    top: var(--space-sm);
    right: var(--space-sm);
  }
}
</style>
