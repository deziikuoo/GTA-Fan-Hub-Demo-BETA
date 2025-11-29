<!-- LoginAndRegModal.vue -->
<template>
  <!-- Modal Backdrop -->
  <div
    class="modal-backdrop"
    @click="handleBackdropClick"
    @keydown.esc="handleEscapeKey"
    tabindex="-1"
    role="dialog"
    :aria-modal="true"
    :aria-labelledby="mode === 'login' ? 'login-title' : 'register-title'"
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
        ×
      </button>

      <component
        :is="componentToRender"
        v-if="mode === 'register'"
        :csrf-token="csrfToken"
        @registered="handleRegistered"
        @logged-in="handleLoggedIn"
        @close="$emit('close')"
      />
      <component
        :is="componentToRender"
        v-else
        @registered="handleRegistered"
        @logged-in="handleLoggedIn"
        @close="$emit('close')"
      />
      <p v-if="!componentToRender">
        No component to render for mode: {{ mode }}
      </p>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import Login from "./Login.vue";
import Register from "./Register.vue";

export default {
  name: "LoginAndRegModal",
  props: {
    mode: {
      type: String,
      required: true,
      validator: (value) => ["login", "register"].includes(value),
    },
    csrfToken: {
      type: String,
      default: null,
    },
  },
  emits: ["close", "registered", "logged-in"],
  setup(props, { emit }) {
    const modalTitleId = ref(
      `modal-title-${Math.random().toString(36).substr(2, 9)}`
    );
    let previousActiveElement = null;

    const componentToRender = computed(() => {
      if (props.mode === "login") return Login;
      if (props.mode === "register") return Register;
      return null;
    });

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

    onMounted(() => {
      setupModal();
    });

    onUnmounted(() => {
      cleanupModal();
    });

    const handleRegistered = (userData) => {
      emit("registered", userData);
      console.log("User registered in modal:", userData);
      emit("close");
    };

    const handleLoggedIn = (userData) => {
      console.log("User logged in modal:", userData);
      emit("logged-in", userData);
      emit("close");
    };

    return {
      modalTitleId,
      componentToRender,
      handleBackdropClick,
      handleEscapeKey,
      handleRegistered,
      handleLoggedIn,
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: rgba(230, 230, 250, 0.95);
  border-radius: 12px;
  padding: 20px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease-out;
  position: relative;
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
    margin: 20px;
    max-width: calc(100vw - 40px);
    padding: 15px;
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
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  font-weight: bold;
  color: #666;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  z-index: 10;
}

.modal-close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
  transform: scale(1.1);
}

.modal-close-btn:focus {
  outline: 2px solid var(--skyPink, #ff6b9d);
  outline-offset: 2px;
}

.modal-close-btn:active {
  transform: scale(0.95);
}
</style>
