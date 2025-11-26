<template>
  <div class="header-editor-overlay">
    <!-- Header Drag Area Overlay -->
    <div class="header-overlay-container">
      <!-- Header Background with Drag Functionality -->
      <div class="header-drag-area">
        <div
          class="header-image-overlay"
          :style="{
            backgroundImage: `url(${image})`,
            backgroundPosition: `${positionX}% ${positionY}%`,
            backgroundSize: 'cover',
          }"
          @mousedown="startDrag"
          @mousemove="onDrag"
          @mouseup="endDrag"
          @mouseleave="endDrag"
        >
          <div class="drag-overlay" v-if="isDragging">
            <div class="drag-indicator">
              <font-awesome-icon icon="hand" />
              <span>Drag to position</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Done Button -->
      <div class="done-button-container">
        <button type="button" @click="handleSave" class="done-button">
          <font-awesome-icon icon="check" />
          Done
        </button>
      </div>
    </div>

    <!-- Disabled Content Overlay -->
    <div class="disabled-overlay"></div>
  </div>
</template>

<script>
import { ref, reactive } from "vue";

export default {
  name: "HeaderImageEditor",
  props: {
    image: {
      type: String,
      required: true,
    },
    positionX: {
      type: Number,
      default: 50,
    },
    positionY: {
      type: Number,
      default: 50,
    },
    user: {
      type: Object,
      required: true,
    },
  },
  emits: ["close", "save"],
  setup(props, { emit }) {
    // Drag state
    const isDragging = ref(false);
    const dragStart = ref({ x: 0, y: 0 });
    const initialPosition = ref({ x: 0, y: 0 });

    // Position state
    const positionX = ref(props.positionX);
    const positionY = ref(props.positionY);

    // Drag functionality
    const startDrag = (event) => {
      isDragging.value = true;
      dragStart.value = { x: event.clientX, y: event.clientY };
      initialPosition.value = { x: positionX.value, y: positionY.value };
      event.preventDefault();
    };

    const onDrag = (event) => {
      if (!isDragging.value) return;

      const deltaX = event.clientX - dragStart.value.x;
      const deltaY = event.clientY - dragStart.value.y;

      // Convert pixel movement to percentage (adjust sensitivity as needed)
      const sensitivity = 0.15; // Slower for more precise control
      const newX = Math.max(
        0,
        Math.min(100, initialPosition.value.x + deltaX * sensitivity)
      );
      const newY = Math.max(
        0,
        Math.min(100, initialPosition.value.y + deltaY * sensitivity)
      );

      positionX.value = newX;
      positionY.value = newY;
    };

    const endDrag = () => {
      isDragging.value = false;
    };

    const resetPosition = () => {
      positionX.value = 50;
      positionY.value = 50;
    };

    const handleClose = () => {
      emit("close");
    };

    const handleSave = () => {
      emit("save", { x: positionX.value, y: positionY.value });
    };

    return {
      isDragging,
      positionX,
      positionY,
      startDrag,
      onDrag,
      endDrag,
      resetPosition,
      handleClose,
      handleSave,
    };
  },
};
</script>

<style scoped>
.header-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  pointer-events: none; /* Allow clicks through to the real profile */
}

/* Header Overlay Container (Enabled/Green) */
.header-overlay-container {
  position: relative;
  z-index: 3;
  pointer-events: auto; /* Enable interactions on header area */
}

/* Header Drag Area - positioned to match the real profile header */
.header-drag-area {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-md);
  padding-top: var(--space-lg);
}

/* Header Image Overlay - matches the real header dimensions */
.header-image-overlay {
  position: relative;
  width: 100%;
  height: 200px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  cursor: grab;
  transition: var(--transition-normal);
  box-shadow: 0 0 0 3px var(--skyOrange); /* Highlight the draggable area */
}

.header-image-overlay:active {
  cursor: grabbing;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.drag-indicator {
  background: var(--skyOrange);
  color: var(--bright-white);
  padding: var(--space-lg) var(--space-xl);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-lg);
  font-weight: 500;
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(10px);
}

/* Done Button - positioned directly below header */
.done-button-container {
  display: flex;
  justify-content: center;
  margin-top: var(--space-md);
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 var(--space-md);
}

.done-button {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-xl);
  background: var(--skyOrange);
  color: var(--bright-white);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-lg);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-normal);
  box-shadow: var(--shadow-lg);
}

.done-button:hover {
  background: #e55a2b;
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

/* Disabled Overlay (Red/Disabled) */
.disabled-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1;
  pointer-events: none;
}

/* Remove overlay from header area */
.header-overlay-container ~ .disabled-overlay {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 25%,
    rgba(0, 0, 0, 0.6) 35%,
    rgba(0, 0, 0, 0.6) 100%
  );
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-drag-area {
    padding: var(--space-sm);
    padding-top: var(--space-md);
  }

  .header-image-overlay {
    height: 150px;
  }

  .done-button-container {
    padding: 0 var(--space-sm);
  }
}
</style>
