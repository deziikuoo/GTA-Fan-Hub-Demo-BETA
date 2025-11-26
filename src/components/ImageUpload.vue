<template>
  <div class="image-upload">
    <div class="image-preview-container">
      <div
        class="image-preview"
        :class="{ 'has-image': previewUrl }"
        :data-shape="previewShape"
      >
        <img
          v-if="previewUrl"
          :src="previewUrl"
          :alt="altText"
          class="preview-image"
        />
        <div v-else class="placeholder">
          <font-awesome-icon :icon="icon" class="placeholder-icon" />
          <span class="placeholder-text">{{ placeholderText }}</span>
        </div>
      </div>

      <div v-if="!hideButtons" class="upload-controls">
        <input
          ref="fileInput"
          type="file"
          :accept="accept"
          @change="handleFileSelect"
          class="file-input"
          :disabled="disabled"
        />
        <button
          type="button"
          @click="triggerFileSelect"
          class="upload-btn"
          :disabled="disabled"
        >
          <font-awesome-icon :icon="['fas', 'camera']" />
          {{ previewUrl ? "Change" : "Upload" }}
        </button>
        <button
          v-if="previewUrl && allowRemove"
          type="button"
          @click="removeImage"
          class="remove-btn"
          :disabled="disabled"
        >
          <font-awesome-icon :icon="['fas', 'trash']" />
        </button>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  modelValue: {
    type: [File, String, null],
    default: null,
  },
  accept: {
    type: String,
    default: "image/*",
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024, // 5MB
  },
  altText: {
    type: String,
    default: "Image preview",
  },
  placeholderText: {
    type: String,
    default: "No image selected",
  },
  icon: {
    type: String,
    default: "image",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  allowRemove: {
    type: Boolean,
    default: true,
  },
  hideButtons: {
    type: Boolean,
    default: false,
  },
  previewShape: {
    type: String,
    default: "circle", // "circle" or "rectangle"
    validator: (value) => ["circle", "rectangle"].includes(value),
  },
});

const emit = defineEmits(["update:modelValue", "error"]);

const fileInput = ref(null);
const previewUrl = ref(null);
const error = ref(null);

// Create preview URL when modelValue changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue instanceof File) {
      createPreview(newValue);
    } else if (typeof newValue === "string" && newValue) {
      previewUrl.value = newValue;
    } else {
      previewUrl.value = null;
    }
  },
  { immediate: true }
);

const createPreview = (file) => {
  // Revoke previous blob URL if exists
  if (previewUrl.value && previewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl.value);
  }

  // For GIFs, skip canvas processing to preserve animation
  if (file.type === "image/gif") {
    previewUrl.value = URL.createObjectURL(file);
    return;
  }

  // Create image element to check dimensions and potentially crop
  const img = new Image();
  const tempUrl = URL.createObjectURL(file);

  img.onload = () => {
    // Create canvas for potential cropping
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas to square aspect ratio
    const size = Math.min(img.width, img.height);
    canvas.width = size;
    canvas.height = size;

    // Calculate crop coordinates to center the image
    const sx = (img.width - size) / 2;
    const sy = (img.height - size) / 2;

    // Draw cropped image
    ctx.drawImage(
      img,
      sx,
      sy,
      size,
      size, // Source rectangle
      0,
      0,
      size,
      size // Destination rectangle
    );

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      previewUrl.value = URL.createObjectURL(blob);
      // Clean up temporary URL after canvas processing is complete
      URL.revokeObjectURL(tempUrl);
    }, file.type);
  };

  // Set source for image to trigger onload
  img.src = tempUrl;
};

const validateFile = (file) => {
  error.value = null;

  // Check file type
  if (!file.type.startsWith("image/")) {
    error.value = "Please select a valid image file.";
    return false;
  }

  // Check file size
  if (file.size > props.maxSize) {
    const maxSizeMB = props.maxSize / (1024 * 1024);
    error.value = `File size must be less than ${maxSizeMB}MB.`;
    return false;
  }

  return true;
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  if (validateFile(file)) {
    emit("update:modelValue", file);
    emit("error", null);
  } else {
    emit("error", error.value);
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  }
};

const triggerFileSelect = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const removeImage = () => {
  if (previewUrl.value && previewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = null;
  emit("update:modelValue", null);
  emit("error", null);

  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

// Cleanup on unmount
import { onUnmounted } from "vue";
onUnmounted(() => {
  if (previewUrl.value && previewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<style scoped>
.image-upload {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.image-preview-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  align-items: center;
}

.image-preview {
  width: 120px;
  height: 120px;
  border: 2px dashed var(--steel-gray);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--card-background);
  transition: var(--transition-normal);
  position: relative; /* For potential overlay */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Subtle shadow */
}

.image-preview[data-shape="circle"] {
  border-radius: 50%;
  width: 120px;
  height: 120px;
}

.image-preview[data-shape="rectangle"] {
  border-radius: var(--radius-md);
  width: 200px;
  height: 120px;
}

.image-preview.has-image {
  border-style: solid;
  border-color: var(--skyOrange);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview:hover .preview-image {
  transform: scale(1.05); /* Slight zoom on hover */
}

.image-preview::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3); /* Subtle darkening overlay */
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
  pointer-events: none;
}

.image-preview:hover::before {
  opacity: 1;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover; /* Ensures image covers entire container */
  object-position: center; /* Center the image */
  transition: transform 0.3s ease; /* Smooth scaling effect */
}

.image-preview[data-shape="circle"] .preview-image {
  border-radius: 50%;
}

.image-preview[data-shape="rectangle"] .preview-image {
  border-radius: var(--radius-md);
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  color: var(--steel-gray);
  width: 100%;
  height: 100%;
  text-align: center;
}

.placeholder-icon {
  font-size: 2rem;
}

.placeholder-text {
  font-size: var(--text-xs);
  text-align: center;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-controls {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.file-input {
  display: none;
}

.upload-btn,
.remove-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-normal);
}

.upload-btn {
  background: var(--skyOrange);
  color: var(--bright-white);
}

.upload-btn:hover:not(:disabled) {
  background: var(--sunset-orange);
}

.remove-btn {
  background: var(--coral-red);
  color: var(--bright-white);
}

.remove-btn:hover:not(:disabled) {
  background: #d63031;
}

.upload-btn:disabled,
.remove-btn:disabled {
  background: var(--steel-gray);
  cursor: not-allowed;
  opacity: 0.6;
}

.error-message {
  color: var(--coral-red);
  font-size: var(--text-xs);
  text-align: center;
  margin-top: var(--space-xs);
}

/* Responsive Design */
@media (max-width: 768px) {
  .image-preview {
    width: 100px;
    height: 100px;
  }

  .upload-controls {
    flex-direction: column;
    width: 100%;
  }

  .upload-btn,
  .remove-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
