<template>
  <div class="modal-overlay" @click="handleClose">
    <div
      v-if="!showHeaderEditor"
      class="modal-content main-backdrop-filter"
      @click.stop
    >
      <div class="modal-header">
        <h2>Edit Profile</h2>
        <button @click="handleClose" class="close-btn">
          <font-awesome-icon icon="times" />
        </button>
      </div>

      <form @submit.prevent="handleSave" class="edit-form">
        <!-- Basic Info -->
        <div class="form-section">
          <h3>Basic Information</h3>
          <div class="form-group">
            <label for="displayName">Display Name</label>
            <input
              id="displayName"
              v-model="formData.displayName"
              type="text"
              maxlength="50"
              placeholder="Enter your display name"
            />
          </div>

          <div class="form-group">
            <label>Header Image</label>
            <div class="header-image-section">
              <ImageUpload
                v-model="formData.headerImage"
                alt-text="Header background image"
                placeholder-text="No header image"
                icon="image"
                :max-size="10 * 1024 * 1024"
                :hide-buttons="!!formData.headerImage"
                preview-shape="rectangle"
                @error="handleImageError"
              />
              <div v-if="formData.headerImage" class="header-buttons">
                <button
                  type="button"
                  @click="changeHeaderImage"
                  class="change-header-btn"
                >
                  <font-awesome-icon icon="camera" />
                  Change Image
                </button>
                <button
                  type="button"
                  @click="openHeaderEditor"
                  class="edit-header-btn"
                >
                  <font-awesome-icon icon="edit" />
                  Edit Header Image
                </button>
                <button
                  type="button"
                  @click="removeHeaderImage"
                  class="delete-header-btn"
                >
                  <font-awesome-icon icon="trash" />
                  Delete
                </button>
              </div>
            </div>
            <small class="form-hint">Recommended size: 1500x500px</small>
          </div>

          <div class="form-group">
            <label>Profile Picture</label>
            <ImageUpload
              v-model="formData.profilePicture"
              alt-text="Profile picture"
              placeholder-text="No image"
              icon="user"
              :max-size="5 * 1024 * 1024"
              @error="handleImageError"
            />
          </div>

          <div class="form-group">
            <label for="bio">Bio</label>
            <textarea
              id="bio"
              v-model="formData.bio"
              maxlength="500"
              rows="4"
              placeholder="Tell us about yourself..."
            ></textarea>
            <div class="char-count">{{ formData.bio.length }}/500</div>
          </div>

          <div class="form-group">
            <label for="location">Location</label>
            <input
              id="location"
              v-model="formData.location"
              type="text"
              maxlength="100"
              placeholder="Where are you from?"
            />
          </div>

          <div class="form-group">
            <label for="website">Website</label>
            <input
              id="website"
              v-model="formData.website"
              type="url"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>


        <div class="form-actions">
          <button type="button" @click="handleClose" class="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            <span v-if="isLoading">Saving...</span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Header Image Editor -->
    <HeaderImageEditor
      v-if="showHeaderEditor"
      :image="previewImageUrl"
      :position-x="formData.headerImagePositionX"
      :position-y="formData.headerImagePositionY"
      :user="user"
      @close="closeHeaderEditor"
      @save="handleHeaderEditorSave"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from "vue";
import axios from "@/utils/axios";
import ImageUpload from "./ImageUpload.vue";
import HeaderImageEditor from "./HeaderImageEditor.vue";

export default {
  name: "EditProfileModal",
  components: {
    ImageUpload,
    HeaderImageEditor,
  },
  props: {
    user: {
      type: Object,
      required: true,
    },
  },
  emits: ["close", "saved"],
  setup(props, { emit }) {
    const isLoading = ref(false);
    const showHeaderEditor = ref(false);

    const headerPositions = [
      { value: "top left", label: "Top Left", icon: "↖" },
      { value: "top center", label: "Top Center", icon: "↑" },
      { value: "top right", label: "Top Right", icon: "↗" },
      { value: "center left", label: "Center Left", icon: "←" },
      { value: "center center", label: "Center", icon: "⊙" },
      { value: "center right", label: "Center Right", icon: "→" },
      { value: "bottom left", label: "Bottom Left", icon: "↙" },
      { value: "bottom center", label: "Bottom Center", icon: "↓" },
      { value: "bottom right", label: "Bottom Right", icon: "↘" },
    ];

    const formData = reactive({
      displayName: "",
      bio: "",
      location: "",
      website: "",
      headerImage: null,
      headerImagePositionX: 50,
      headerImagePositionY: 50,
      profilePicture: null,
    });

    // Drag state
    const isDragging = ref(false);
    const dragStart = ref({ x: 0, y: 0 });
    const initialPosition = ref({ x: 0, y: 0 });

    // Preview image URL
    const previewImageUrl = computed(() => {
      if (formData.headerImage instanceof File) {
        return URL.createObjectURL(formData.headerImage);
      }
      return formData.headerImage || "";
    });

    const initializeForm = () => {
      formData.displayName = props.user.profile?.displayName || "";
      formData.bio = props.user.profile?.bio || "";
      formData.location = props.user.profile?.location || "";
      formData.website = props.user.profile?.website || "";
      formData.headerImage = props.user.profile?.headerImage || null;

      // Parse existing position or default to center
      const existingPosition =
        props.user.profile?.headerImagePosition || "50% 50%";
      const [x, y] = existingPosition
        .split(" ")
        .map((p) => parseFloat(p.replace("%", "")) || 50);
      formData.headerImagePositionX = x;
      formData.headerImagePositionY = y;

      formData.profilePicture = props.user.profile?.profilePicture || null;
    };

    const handleSave = async () => {
      try {
        isLoading.value = true;

        const formDataToSend = new FormData();
        formDataToSend.append("profile.displayName", formData.displayName);
        formDataToSend.append("profile.bio", formData.bio);
        formDataToSend.append("profile.location", formData.location);
        formDataToSend.append("profile.website", formData.website);
        formDataToSend.append(
          "profile.headerImagePosition",
          `${formData.headerImagePositionX}% ${formData.headerImagePositionY}%`
        );

        // Add header image if it's a new file
        if (formData.headerImage instanceof File) {
          // New file uploaded
          formDataToSend.append("headerImage", formData.headerImage);
        } else if (typeof formData.headerImage === "string") {
          // Existing header image URL
          formDataToSend.append("profile.headerImage", formData.headerImage);
        }

        // Add profile picture if it's a new file
        if (formData.profilePicture instanceof File) {
          // New file uploaded
          formDataToSend.append("profilePicture", formData.profilePicture);
        } else if (typeof formData.profilePicture === "string") {
          // Existing picture URL
          formDataToSend.append(
            "profile.profilePicture",
            formData.profilePicture
          );
        } else {
          // No picture, use default
          formDataToSend.append(
            "profile.profilePicture",
            "/src/assets/images/user.png"
          );
        }

        try {
          const response = await axios.put("/api/profile/me", formDataToSend, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            timeout: 30000, // 30 seconds timeout specifically for this request
          });

          emit("saved", response.data.user);
        } catch (axiosError) {
          // Handle specific Axios errors
          if (axiosError.code === "ECONNABORTED") {
            console.error("Request timed out:", axiosError);
            // Show user-friendly timeout message
            alert(
              "The request took too long. Please check your internet connection and try again."
            );
          } else {
            console.error("Error updating profile:", axiosError);
            // Generic error handling
            alert("Failed to update profile. Please try again.");
          }
          throw axiosError;
        }
      } catch (error) {
        console.error("Unexpected error updating profile:", error);
        alert("An unexpected error occurred. Please try again.");
        throw error;
      } finally {
        isLoading.value = false;
      }
    };

    const handleClose = () => {
      emit("close");
    };

    const handleImageError = (error) => {
      if (error) {
        console.error("Image upload error:", error);
        // You can add user notification here
      }
    };

    // Drag functionality
    const startDrag = (event) => {
      isDragging.value = true;
      dragStart.value = { x: event.clientX, y: event.clientY };
      initialPosition.value = {
        x: formData.headerImagePositionX,
        y: formData.headerImagePositionY,
      };
      event.preventDefault();
    };

    const onDrag = (event) => {
      if (!isDragging.value) return;

      const deltaX = event.clientX - dragStart.value.x;
      const deltaY = event.clientY - dragStart.value.y;

      // Convert pixel movement to percentage (adjust sensitivity as needed)
      const sensitivity = 0.3;
      const newX = Math.max(
        0,
        Math.min(100, initialPosition.value.x + deltaX * sensitivity)
      );
      const newY = Math.max(
        0,
        Math.min(100, initialPosition.value.y + deltaY * sensitivity)
      );

      formData.headerImagePositionX = newX;
      formData.headerImagePositionY = newY;
    };

    const endDrag = () => {
      isDragging.value = false;
    };

    const resetPosition = () => {
      formData.headerImagePositionX = 50;
      formData.headerImagePositionY = 50;
    };

    // Header editor functions
    const openHeaderEditor = () => {
      showHeaderEditor.value = true;
    };

    const closeHeaderEditor = () => {
      showHeaderEditor.value = false;
    };

    const handleHeaderEditorSave = (positionData) => {
      formData.headerImagePositionX = positionData.x;
      formData.headerImagePositionY = positionData.y;
      showHeaderEditor.value = false;
    };

    const removeHeaderImage = () => {
      formData.headerImage = null;
      formData.headerImagePositionX = 50;
      formData.headerImagePositionY = 50;
    };

    const changeHeaderImage = () => {
      // Create a hidden file input to trigger file selection
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          // Validate file
          if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file.");
            return;
          }
          if (file.size > 10 * 1024 * 1024) {
            // 10MB limit
            alert("File size must be less than 10MB.");
            return;
          }
          formData.headerImage = file;
          // Reset position to center for new image
          formData.headerImagePositionX = 50;
          formData.headerImagePositionY = 50;
        }
      };
      input.click();
    };

    onMounted(() => {
      initializeForm();
    });

    return {
      isLoading,
      formData,
      previewImageUrl,
      isDragging,
      showHeaderEditor,
      startDrag,
      onDrag,
      endDrag,
      resetPosition,
      openHeaderEditor,
      closeHeaderEditor,
      handleHeaderEditorSave,
      removeHeaderImage,
      changeHeaderImage,
      handleSave,
      handleClose,
      handleImageError,
    };
  },
};
</script>

<style scoped>
.modal-overlay {
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
  padding: var(--space-md);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-2xl);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4),
    0 10px 10px -5px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
  position: relative;
}

/* Custom Scrollbar */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-full);
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  transition: background 0.2s ease;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-overlay:focus {
  outline: none;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-lg) var(--space-lg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.modal-header h2 {
  color: var(--bright-white);
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 600;
  text-align: center;
}

.close-btn {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--bright-white);
  font-size: var(--text-lg);
  cursor: pointer;
  padding: var(--space-sm);
  border-radius: var(--radius-full);
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: var(--bright-white);
  transform: rotate(90deg);
}

.edit-form {
  padding: var(--space-lg);
}

.form-section {
  margin-bottom: var(--space-xl);
}

.form-section h3 {
  color: var(--bright-white);
  margin-bottom: var(--space-lg);
  font-size: var(--text-lg);
  font-weight: 600;
  padding-bottom: var(--space-sm);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.form-group {
  margin-bottom: var(--space-lg);
}

.form-group label {
  display: block;
  color: var(--bright-white);
  font-weight: 500;
  margin-bottom: var(--space-sm);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  color: var(--bright-white);
  font-size: var(--text-base);
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--mint-green);
  box-shadow: 0 0 0 3px rgba(152, 255, 152, 0.15);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  text-align: right;
  font-size: var(--text-sm);
  color: var(--steel-gray);
  margin-top: var(--space-xs);
}

.form-hint {
  display: block;
  font-size: var(--text-xs);
  color: var(--steel-gray);
  margin-top: var(--space-xs);
  font-style: italic;
}

.header-image-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.change-header-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  background: rgba(255, 255, 255, 0.1);
  color: var(--bright-white);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--text-sm);
  font-weight: 500;
  min-width: 140px;
  justify-content: center;
}

.change-header-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--electric-blue);
  color: var(--electric-blue);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 191, 255, 0.2);
}

.edit-header-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  background: linear-gradient(
    135deg,
    var(--skyOrange) 0%,
    var(--sunset-orange) 100%
  );
  color: var(--bright-white);
  border: 1px solid var(--sunset-orange);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--text-sm);
  font-weight: 500;
  min-width: 160px;
  justify-content: center;
}

.edit-header-btn:hover {
  background: linear-gradient(
    135deg,
    var(--sunset-orange) 0%,
    var(--skyOrange) 100%
  );
  border-color: var(--bright-white);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 189, 89, 0.3);
}

.delete-header-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-lg);
  background: rgba(255, 64, 64, 0.2);
  color: var(--coral-red);
  border: 1px solid var(--coral-red);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--text-sm);
  font-weight: 500;
  min-width: 120px;
  justify-content: center;
}

.delete-header-btn:hover {
  background: var(--coral-red);
  color: var(--bright-white);
  border-color: var(--bright-white);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 64, 64, 0.3);
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  color: var(--bright-white);
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.position-hint {
  color: var(--steel-gray);
  font-size: var(--text-sm);
  margin-bottom: var(--space-sm);
  font-style: italic;
}

.header-preview-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 600px;
}

.header-preview-frame {
  width: 100%;
  height: 120px;
  border: 2px solid var(--steel-gray);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--card-background);
  position: relative;
}

.header-preview-image {
  width: 100%;
  height: 100%;
  cursor: grab;
  transition: var(--transition-normal);
  position: relative;
}

.header-preview-image:active {
  cursor: grabbing;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.drag-indicator {
  background: var(--skyOrange);
  color: var(--bright-white);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
}

.preview-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.1);
  color: var(--bright-white);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--text-sm);
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--mint-green);
  color: var(--mint-green);
  transform: translateY(-2px);
}

.position-display {
  color: var(--steel-gray);
  font-size: var(--text-sm);
  font-family: monospace;
}

.form-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  padding-top: var(--space-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn {
  padding: var(--space-sm) var(--space-xl);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--bright-white);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 120px;
}

.btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--mint-green);
  color: var(--mint-green);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(152, 255, 152, 0.2);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn[type="submit"] {
  background: linear-gradient(
    135deg,
    var(--skyOrange) 0%,
    var(--sunset-orange) 100%
  );
  border-color: var(--sunset-orange);
}

.btn[type="submit"]:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    var(--sunset-orange) 0%,
    var(--skyOrange) 100%
  );
  border-color: var(--bright-white);
  color: var(--bright-white);
  box-shadow: 0 4px 12px rgba(251, 189, 89, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--space-sm);
  }

  .modal-content {
    max-height: 95vh;
  }

  .modal-header,
  .edit-form {
    padding: var(--space-md);
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
