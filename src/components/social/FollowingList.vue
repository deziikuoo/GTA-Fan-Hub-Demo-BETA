<template>
  <div class="following-list">
    <div v-if="loading && following.length === 0" class="loading-state">
      <div class="loading-spinner-large"></div>
      <p>Loading following...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="loadFollowing" class="retry-button">Retry</button>
    </div>

    <div v-else-if="following.length === 0" class="empty-state">
      <p class="empty-message">{{ emptyMessage }}</p>
    </div>

    <div v-else class="following-content">
      <div
        v-for="user in reactiveFollowerCounts"
        :key="user._id"
        class="following-card"
      >
        <router-link :to="`/profile/${user.username}`" class="following-info">
          <img
            :src="user.profile?.profilePicture || '/src/assets/images/user.png'"
            :alt="`${user.username}'s profile picture`"
            class="following-avatar"
            @error="handleImageError"
          />
          <div class="following-details">
            <div class="following-name">
              <span class="username">{{ user.username }}</span>
              <span
                v-if="user.profile?.verified"
                class="verified-badge"
                title="Verified"
                >✓</span
              >
            </div>
            <p v-if="user.profile?.displayName" class="display-name">
              {{ user.profile.displayName }}
            </p>
            <p v-if="user.profile?.bio" class="bio">
              {{ truncateBio(user.profile.bio) }}
            </p>
            <p class="follower-count">
              {{ user.realTimeFollowerCount }} followers
            </p>
          </div>
        </router-link>

        <div
          class="following-actions"
          v-if="showUnfollowButton && !isOwnProfile(user._id)"
        >
          <FollowButton
            :userId="user._id"
            :username="user.username"
            size="small"
            variant="secondary"
            source="following_list"
          />
        </div>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMore" class="load-more-container">
        <button @click="loadMore" :disabled="loading" class="load-more-button">
          {{ loading ? "Loading..." : "Load More" }}
        </button>
      </div>

      <!-- Pagination Info -->
      <div class="pagination-info">
        Showing {{ following.length }} of {{ totalCount }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useStore } from "vuex";
import axios from "@/utils/axios";
import FollowButton from "./FollowButton.vue";

const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
  emptyMessage: {
    type: String,
    default: "Not following anyone yet",
  },
  showUnfollowButton: {
    type: Boolean,
    default: true,
  },
});

const store = useStore();

// State
const following = ref([]);
const loading = ref(false);
const error = ref(null);
const page = ref(1);
const totalCount = ref(0);
const hasMore = ref(false);
const limit = 20;

// Computed
const currentUserId = computed(() => store.state.user?.id);

// Helper function to get real-time follower count for a user
const getFollowerCount = (userId) => {
  // If it's the current user, use Vuex store (real-time)
  if (userId === currentUserId.value) {
    return store.state.social.followerCount;
  }
  // For other users, we need to fetch from API or use cached data
  // For now, return the static data but this could be enhanced with caching
  const user = following.value.find((f) => f._id === userId);
  return user?.stats?.followersCount || 0;
};

// Make follower counts reactive by watching Vuex changes
const reactiveFollowerCounts = computed(() => {
  return following.value.map((user) => ({
    ...user,
    realTimeFollowerCount: getFollowerCount(user._id),
  }));
});

// Methods
const isOwnProfile = (userId) => {
  return userId === currentUserId.value;
};

const truncateBio = (bio) => {
  if (!bio) return "";
  return bio.length > 100 ? bio.substring(0, 100) + "..." : bio;
};

const handleImageError = (event) => {
  event.target.src = "/src/assets/images/user.png";
};

const loadFollowing = async () => {
  loading.value = true;
  error.value = null;

  try {
    const { data } = await axios.get(`/api/users/${props.userId}/following`, {
      params: {
        page: page.value,
        limit,
      },
    });

    if (page.value === 1) {
      following.value = data.following;
    } else {
      following.value = [...following.value, ...data.following];
    }

    totalCount.value = data.totalCount;
    hasMore.value = data.hasMore;

    console.log(`[FollowingList] Loaded ${data.following.length} following`);
  } catch (err) {
    console.error("[FollowingList] Error loading following:", err);
    error.value =
      err.response?.data?.error ||
      "Failed to load following. Please try again.";
  } finally {
    loading.value = false;
  }
};

const loadMore = async () => {
  if (!hasMore.value || loading.value) return;

  page.value++;
  await loadFollowing();
};

// Watch Vuex following count for real-time updates (when current user follows/unfollows)
watch(
  () => store.state.social.followingCount,
  (newCount, oldCount) => {
    // Only refresh if viewing current user's following list
    if (props.userId === currentUserId.value && newCount !== oldCount) {
      console.log(
        `[FollowingList] Vuex followingCount changed: ${oldCount} → ${newCount}, refreshing list...`
      );
      page.value = 1;
      loadFollowing();
    }
  }
);

// Lifecycle
onMounted(() => {
  loadFollowing();
});
</script>

<style scoped>
.following-list {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.loading-spinner-large {
  width: 40px;
  height: 40px;
  border: 4px solid var(--lavender, #e6e6fa);
  border-top-color: var(--skyOrange, #fbbd59);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: var(--coral-red, #ff4040);
  margin-bottom: 16px;
}

.retry-button {
  padding: 8px 24px;
  background: var(--skyOrange, #fbbd59);
  color: var(--bright-white, #ffffff);
  border: none;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: var(--sunset-orange, #ff6347);
}

.empty-message {
  color: var(--steel-gray, #778899);
  font-size: 16px;
}

.following-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.following-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: var(--glass-morphism-bg);
  backdrop-filter: blur(10px);
  border-radius: 1.2rem;
  border: 1px solid transparent;
  box-shadow: 
    8px 8px 24px rgba(0, 0, 0, 0.3),
    -8px -8px 24px rgba(80, 80, 90, 0.05);
  transition: all 0.3s ease;
}

.following-card:hover {
  transform: translateY(-2px);
  border: var(--hover-border);
  box-shadow: 
    10px 10px 30px rgba(0, 0, 0, 0.4),
    -10px -10px 30px rgba(80, 80, 90, 0.08),
    var(--neon-glow-hover);
}

.following-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  text-decoration: none;
  color: inherit;
}

.following-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--skyPurp, #454383);
}

.following-details {
  flex: 1;
  min-width: 0;
}

.following-name {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.username {
  font-weight: 700;
  font-size: 15px;
  color: var(--bright-white);
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: var(--electric-blue, #00bfff);
  color: white;
  border-radius: 50%;
  font-size: 10px;
}

.display-name {
  font-size: 13px;
  color: var(--bright-white);
  font-weight: 400;
  margin-bottom: 4px;
}

.bio {
  font-size: 13px;
  color: var(--bright-white);
  font-weight: 400;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.follower-count {
  font-size: 12px;
  color: var(--bright-white);
  font-weight: 400;
}

.following-actions {
  margin-left: 12px;
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.load-more-button {
  padding: 8px 20px;
  background: var(--glass-morphism-bg);
  color: var(--bright-white);
  border: 1px solid var(--sunset-orange);
  border-radius: var(--radius-full);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.load-more-button:hover:not(:disabled) {
  border: 1px solid var(--bright-white);
}

.load-more-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  font-size: 13px;
  color: var(--bright-white);
  font-weight: 400;
}

/* Responsive */
@media (max-width: 600px) {
  .following-card {
    padding: 16px;
    border-radius: 1rem;
  }

  .following-avatar {
    width: 40px;
    height: 40px;
  }

  .following-details {
    font-size: 13px;
  }
}
</style>
