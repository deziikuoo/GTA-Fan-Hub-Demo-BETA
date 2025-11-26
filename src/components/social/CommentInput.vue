<template>
  <div class="comment-input">
    <div class="input-container">
      <!-- User Avatar -->
      <div class="user-avatar">
        <img
          :src="
            currentUser?.profile?.profilePicture ||
            '/src/assets/images/user.png'
          "
          :alt="currentUser?.username || 'User'"
          class="avatar-img"
        />
      </div>

      <!-- Input Form -->
      <div class="input-form">
        <textarea
          ref="textareaRef"
          v-model="commentText"
          :placeholder="placeholder"
          class="comment-textarea"
          :maxlength="maxLength"
          @input="adjustTextareaHeight"
          @keydown.enter.prevent="handleEnterKey"
          @keydown.escape="handleCancel"
        />

        <div class="input-footer">
          <!-- Character Counter -->
          <div class="char-counter" :class="{ 'over-limit': isOverLimit }">
            {{ commentText.length }}/{{ maxLength }}
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button
              v-if="parentCommentId"
              @click="handleCancel"
              class="cancel-btn"
              :disabled="submitting"
            >
              Cancel
            </button>
            <button
              @click="submitComment"
              class="submit-btn"
              :disabled="!canSubmit"
              :class="{ loading: submitting }"
            >
              <span v-if="submitting">Posting...</span>
              <span v-else>Post</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, onMounted, watch } from "vue";
import { useStore } from "vuex";
import axios from "@/utils/axios";

export default {
  name: "CommentInput",
  props: {
    postId: {
      type: String,
      required: true,
    },
    parentCommentId: {
      type: String,
      default: null,
    },
    placeholder: {
      type: String,
      default: "Add a comment...",
    },
    autoFocus: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["comment-posted", "cancel"],
  setup(props, { emit }) {
    const store = useStore();
    const commentText = ref("");
    const submitting = ref(false);
    const textareaRef = ref(null);
    const maxLength = 2000;

    const currentUser = computed(() => store.getters.currentUser);

    const isOverLimit = computed(() => commentText.value.length > maxLength);
    const isEmpty = computed(() => commentText.value.trim().length === 0);
    const canSubmit = computed(
      () => !isEmpty.value && !isOverLimit.value && !submitting.value
    );

    const adjustTextareaHeight = () => {
      nextTick(() => {
        if (textareaRef.value) {
          textareaRef.value.style.height = "auto";
          textareaRef.value.style.height =
            Math.min(textareaRef.value.scrollHeight, 120) + "px";
        }
      });
    };

    const handleEnterKey = (event) => {
      if (event.shiftKey) {
        // Allow Shift+Enter for new lines
        return;
      }
      // Submit on Enter (without Shift)
      if (canSubmit.value) {
        submitComment();
      }
    };

    const handleCancel = () => {
      commentText.value = "";
      emit("cancel");
    };

    const submitComment = async () => {
      if (!canSubmit.value) return;

      submitting.value = true;
      try {
        const response = await axios.post(
          `/api/posts/${props.postId}/comments`,
          {
            text: commentText.value.trim(),
            parentCommentId: props.parentCommentId || null,
          }
        );

        // Clear input
        commentText.value = "";
        adjustTextareaHeight();

        // Emit success event
        emit("comment-posted", response.data.comment);
      } catch (error) {
        console.error("Error posting comment:", error);
        // TODO: Show error toast
      } finally {
        submitting.value = false;
      }
    };

    // Auto-focus on mount if requested
    onMounted(() => {
      if (props.autoFocus && textareaRef.value) {
        textareaRef.value.focus();
      }
    });

    // Watch for parentCommentId changes to clear input when switching contexts
    watch(
      () => props.parentCommentId,
      () => {
        commentText.value = "";
        adjustTextareaHeight();
      }
    );

    return {
      currentUser,
      commentText,
      submitting,
      textareaRef,
      maxLength,
      isOverLimit,
      isEmpty,
      canSubmit,
      adjustTextareaHeight,
      handleEnterKey,
      handleCancel,
      submitComment,
    };
  },
};
</script>

<style scoped>
.comment-input {
  width: 100%;
  margin-bottom: var(--space-lg);
}

.input-container {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
}

.user-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--steel-gray);
}

.input-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.comment-textarea {
  width: 100%;
  min-height: 48px;
  max-height: 120px;
  padding: 1rem;
  background: rgba(40, 40, 45, 0.8);
  border: none;
  border-radius: 1rem;
  color: var(--bright-white);
  font-size: var(--text-base);
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  overflow-y: auto;
  box-shadow: 
    12px 12px 30px rgba(0, 0, 0, 0.4),
    -12px -12px 30px rgba(80, 80, 90, 0.1);
  transition: all 0.3s ease;
}

.comment-textarea:focus {
  outline: none;
  background: rgba(40, 40, 45, 0.9);
  box-shadow: 
    inset 12px 12px 30px rgba(0, 0, 0, 0.5),
    inset -12px -12px 30px rgba(80, 80, 90, 0.2);
}

.comment-textarea::placeholder {
  color: var(--steel-gray);
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-counter {
  font-size: var(--text-sm);
  color: var(--steel-gray);
  transition: color 0.2s ease;
}

.char-counter.over-limit {
  color: var(--coral-red);
}

.action-buttons {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.cancel-btn {
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: 1px solid var(--steel-gray);
  border-radius: var(--radius-md);
  color: var(--steel-gray);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover:not(:disabled) {
  background: var(--steel-gray);
  color: var(--bright-white);
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn {
  padding: var(--space-sm) var(--space-lg);
  background: var(--glass-morphism-bg);
  border: 1px solid var(--sunset-orange);
  border-radius: var(--radius-full);
  color: var(--bright-white);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
  white-space: nowrap;
  flex-shrink: 0;
}

.submit-btn:hover:not(:disabled) {
  border: 1px solid var(--bright-white);
  color: var(--bright-white);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn.loading {
  opacity: 0.8;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .input-container {
    gap: var(--space-sm);
  }

  .avatar-img {
    width: 32px;
    height: 32px;
  }

  .comment-textarea {
    padding: var(--space-sm);
    font-size: var(--text-sm);
  }

  .input-footer {
    flex-direction: column;
    gap: var(--space-sm);
    align-items: stretch;
  }

  .action-buttons {
    justify-content: flex-end;
  }

  .cancel-btn,
  .submit-btn {
    padding: var(--space-xs) var(--space-md);
    font-size: var(--text-xs);
  }
}
</style>
