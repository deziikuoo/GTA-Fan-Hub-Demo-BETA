<!-- CreatePostModal.vue -->
<template>
  <!-- Modal Backdrop -->
  <div
    class="modal-backdrop"
    @click="handleBackdropClick"
    @keydown.esc="handleEscapeKey"
    tabindex="-1"
    role="dialog"
    :aria-modal="true"
    aria-labelledby="create-post-title"
  >
    <!-- Modal Content -->
    <div class="modal-content" @click.stop role="document">
      <!-- Close Button -->
      <button
        class="modal-close-btn"
        @click="$emit('close')"
        aria-label="Close modal"
        type="button"
      >
        <font-awesome-icon :icon="['fas', 'times']" />
      </button>

      <div class="modal-inner-content">
        <CreatePost @posted="handlePosted" @close="handleClose" />
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, onUnmounted, nextTick } from "vue";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import CreatePost from "./social/CreatePost.vue";

library.add(faTimes);

export default {
  name: "CreatePostModal",
  components: {
    CreatePost,
    FontAwesomeIcon,
  },
  emits: ["close", "posted"],
  setup(props, { emit }) {
    const handleBackdropClick = (event) => {
      // Only close if clicking directly on the backdrop, not on child elements
      if (event.target === event.currentTarget) {
        emit("close");
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        emit("close");
      }
    };

    const trapFocus = (event) => {
      if (event.key !== "Tab") return;

      const modal = document.querySelector(".modal-backdrop");
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    };

    let previousActiveElement = null;

    const setupModal = async () => {
      // Store the currently focused element
      previousActiveElement = document.activeElement;

      // Prevent body scrolling
      document.body.style.overflow = "hidden";

      // Focus the modal backdrop to enable keyboard navigation
      await nextTick();
      const modalBackdrop = document.querySelector(".modal-backdrop");
      if (modalBackdrop) {
        modalBackdrop.focus();
      }

      // Add focus trap event listener
      document.addEventListener("keydown", trapFocus);
    };

    const cleanupModal = () => {
      // Remove focus trap event listener
      document.removeEventListener("keydown", trapFocus);

      // Restore body scrolling
      document.body.style.overflow = "";

      // Restore focus to the previously active element
      if (previousActiveElement && previousActiveElement.focus) {
        previousActiveElement.focus();
      }
    };

    const handlePosted = (post) => {
      emit("posted", post);
      emit("close");
    };

    const handleClose = () => {
      emit("close");
    };

    onMounted(() => {
      setupModal();
    });

    onUnmounted(() => {
      cleanupModal();
    });

    return {
      handleBackdropClick,
      handleEscapeKey,
      handlePosted,
      handleClose,
    };
  },
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: transparent;
  border-radius: var(--radius-2xl);
  padding: 0;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4),
    0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

.modal-inner-content {
  background: var(--glass-morphism-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-2xl);
  padding: var(--space-xl);
  backdrop-filter: blur(100px);
  position: relative;
}

.modal-inner-content :deep(.create-post) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  border-radius: 0 !important;
  backdrop-filter: none !important;
}

.modal-inner-content :deep(.create-post:hover) {
  border: none !important;
}

.modal-inner-content :deep(.post-composer) {
  width: 100%;
}

.modal-inner-content :deep(.composer-input-container) {
  width: 100%;
}

/* Animation keyframes */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .modal-content {
    margin: var(--space-lg);
    max-width: calc(100vw - var(--space-2xl));
    width: calc(100vw - var(--space-2xl));
    border-radius: var(--radius-xl);
  }

  .modal-inner-content {
    padding: var(--space-lg);
  }

  .modal-close-btn {
    top: var(--space-md);
    right: var(--space-md);
    width: 36px;
    height: 36px;
  }
}

/* Focus styles for accessibility */
.modal-backdrop:focus {
  outline: none;
}

/* Ensure modal content doesn't inherit backdrop styles */
.modal-content * {
  box-sizing: border-box;
}

/* Close button styles */
.modal-close-btn {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  background: var(--glass-morphism-bg);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--bright-white);
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: 10;
  backdrop-filter: blur(100px);
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
  color: var(--mint-green);
  transform: scale(1.1) rotate(90deg);
  box-shadow: var(--neon-glow-hover);
}

.modal-close-btn:focus {
  outline: 2px solid var(--skyOrange);
  outline-offset: 2px;
}

.modal-close-btn:active {
  transform: scale(0.95) rotate(90deg);
}
</style>
