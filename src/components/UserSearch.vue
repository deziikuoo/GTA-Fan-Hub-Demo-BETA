<template>
  <div class="user-search-container" ref="searchContainer">
    <!-- Search Input -->
    <div class="search-input-wrapper">
      <div class="search-input-container">
        <font-awesome-icon icon="search" class="search-icon" />
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Search"
          class="search-input"
          @input="handleInput"
          @focus="handleFocus"
          @keydown.esc="handleEscape"
          @keydown.down.prevent="handleArrowDown"
          @keydown.up.prevent="handleArrowUp"
          @keydown.enter.prevent="handleEnter"
        />
        <button
          v-if="searchQuery"
          @click="clearSearch"
          class="clear-search-btn"
          aria-label="Clear search"
        >
          <font-awesome-icon icon="times" />
        </button>
      </div>
    </div>

    <!-- Search Results / Recent Searches Dropdown (Teleported to body) -->
    <Teleport to="body">
      <div
        v-if="showDropdown"
        ref="searchDropdown"
        class="search-dropdown"
        :class="{ 'has-results': showResults || showRecent }"
      >
        <!-- Recent Searches (when no query) -->
        <div v-if="showRecent" class="recent-searches-section">
          <div class="section-header">
            <h3 class="section-title">Recent</h3>
            <button
              v-if="recentSearches.length > 0"
              @click="clearAllRecent"
              class="clear-all-btn"
            >
              Clear all
            </button>
          </div>
          <div v-if="recentSearches.length > 0" class="recent-list">
            <div
              v-for="(user, index) in recentSearches"
              :key="user._id"
              class="search-result-item"
              :class="{ highlighted: highlightedIndex === index }"
              @click="selectUser(user)"
              @mouseenter="highlightedIndex = index"
            >
              <router-link
                :to="`/profile/${user.username}`"
                class="result-link"
                @click.prevent="selectUser(user)"
              >
                <img
                  :src="getUserAvatar(user)"
                  :alt="user.username"
                  class="result-avatar"
                />
                <div class="result-info">
                  <div class="result-username">
                    {{ user.username }}
                    <font-awesome-icon
                      v-if="user.profile?.verified"
                      icon="check-circle"
                      class="verified-badge"
                    />
                  </div>
                  <div class="result-display-name">
                    {{ user.profile?.displayName || user.username }}
                    <span v-if="user.isMutual" class="mutual-badge"
                      >Mutual</span
                    >
                    <span v-else-if="user.isFollowing" class="follow-badge"
                      >Following</span
                    >
                    <span v-else-if="user.followsYou" class="follows-you-badge"
                      >Follows you</span
                    >
                  </div>
                  <div
                    v-if="user.mutualCount || user.followerCount"
                    class="result-meta"
                  >
                    <span v-if="user.mutualCount > 0" class="mutual-count">
                      {{ user.mutualCount }} mutual connection{{
                        user.mutualCount > 1 ? "s" : ""
                      }}
                    </span>
                    <span v-if="user.followerCount > 0" class="follower-count">
                      {{ formatFollowerCount(user.followerCount) }} follower{{
                        user.followerCount !== 1 ? "s" : ""
                      }}
                    </span>
                  </div>
                </div>
              </router-link>
              <button
                @click.stop="removeRecent(user._id)"
                class="remove-recent-btn"
                aria-label="Remove from recent"
              >
                <font-awesome-icon icon="times" />
              </button>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>No recent searches</p>
          </div>
        </div>

        <!-- Search Results (when query exists) -->
        <div v-if="showResults" class="search-results-section">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Searching...</p>
          </div>
          <div v-else-if="searchResults.length > 0" class="results-list">
            <div
              v-for="(user, index) in searchResults"
              :key="user._id"
              class="search-result-item"
              :class="{
                highlighted: highlightedIndex === index + recentSearches.length,
              }"
              @click="selectUser(user)"
              @mouseenter="highlightedIndex = index + recentSearches.length"
            >
              <router-link
                :to="`/profile/${user.username}`"
                class="result-link"
                @click.prevent="selectUser(user)"
              >
                <img
                  :src="getUserAvatar(user)"
                  :alt="user.username"
                  class="result-avatar"
                />
                <div class="result-info">
                  <div class="result-username">
                    {{ user.username }}
                    <font-awesome-icon
                      v-if="user.profile?.verified"
                      icon="check-circle"
                      class="verified-badge"
                    />
                  </div>
                  <div class="result-display-name">
                    {{ user.profile?.displayName || user.username }}
                    <span v-if="user.isMutual" class="mutual-badge"
                      >Mutual</span
                    >
                    <span v-else-if="user.isFollowing" class="follow-badge"
                      >Following</span
                    >
                    <span v-else-if="user.followsYou" class="follows-you-badge"
                      >Follows you</span
                    >
                  </div>
                  <div class="result-meta">
                    <span v-if="user.mutualCount > 0" class="mutual-count">
                      {{ user.mutualCount }} mutual connection{{
                        user.mutualCount > 1 ? "s" : ""
                      }}
                    </span>
                    <span v-if="user.followerCount > 0" class="follower-count">
                      {{ formatFollowerCount(user.followerCount) }} follower{{
                        user.followerCount !== 1 ? "s" : ""
                      }}
                    </span>
                  </div>
                </div>
              </router-link>
            </div>
          </div>
          <div v-else-if="searchQuery && !loading" class="empty-state">
            <p>No users found</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import axios from "@/utils/axios";
import { mockUsers } from "@/mockData/users.js";

export default {
  name: "UserSearch",
  setup() {
    const router = useRouter();
    const store = useStore();
    const searchContainer = ref(null);
    const searchInput = ref(null);
    const searchDropdown = ref(null);
    const searchQuery = ref("");
    const searchResults = ref([]);
    const loading = ref(false);
    const showDropdown = ref(false);
    const recentSearches = ref([]);
    const highlightedIndex = ref(-1);
    const debounceTimer = ref(null);

    // Get current user for localStorage key
    const currentUser = computed(() => store.getters.currentUser);
    const storageKey = computed(
      () => `recentSearches_${currentUser.value?.id || "guest"}`
    );

    // Computed properties
    const showRecent = computed(() => !searchQuery.value && showDropdown.value);
    const showResults = computed(() => searchQuery.value && showDropdown.value);

    // Load recent searches from localStorage and refresh their data
    const loadRecentSearches = async () => {
      try {
        const stored = localStorage.getItem(storageKey.value);
        if (stored) {
          const storedSearches = JSON.parse(stored);
          recentSearches.value = storedSearches;

          // Refresh data for recent searches if user is logged in
          if (currentUser.value?.id && storedSearches.length > 0) {
            refreshRecentSearchesData(storedSearches);
          }
        } else {
          // If no stored searches, initialize with mock users (up to 5)
          // This demonstrates how the search feature works
          const defaultRecentSearches = mockUsers.slice(0, 5).map(user => ({
            _id: user._id,
            username: user.username,
            profile: user.profile,
            isFollowing: false,
            followsYou: false,
            isMutual: false,
            mutualCount: 0,
            followerCount: user.followers || 0,
            timestamp: Date.now(),
          }));
          recentSearches.value = defaultRecentSearches;
          saveRecentSearches();
        }
      } catch (error) {
        console.error("Error loading recent searches:", error);
        // If error, still initialize with mock users
        const defaultRecentSearches = mockUsers.slice(0, 5).map(user => ({
          _id: user._id,
          username: user.username,
          profile: user.profile,
          isFollowing: false,
          followsYou: false,
          isMutual: false,
          mutualCount: 0,
          followerCount: user.followers || 0,
          timestamp: Date.now(),
        }));
        recentSearches.value = defaultRecentSearches;
        saveRecentSearches();
      }
    };

    // Refresh recent searches with current follow status and counts
    const refreshRecentSearchesData = async (searches) => {
      try {
        const userIds = searches.map((s) => s._id).join(",");
        // Fetch fresh data for these users
        const response = await axios.get("/api/users/batch", {
          params: { ids: userIds },
        });

        if (response.data.users) {
          // Update recent searches with fresh data
          recentSearches.value = searches.map((oldUser) => {
            const freshData = response.data.users.find(
              (u) => u._id === oldUser._id
            );
            return freshData ? { ...oldUser, ...freshData } : oldUser;
          });
        }
      } catch (error) {
        // Silently fail - keep old data if refresh fails
        console.log("Could not refresh recent searches data");
      }
    };

    // Save recent searches to localStorage with cleanup
    const saveRecentSearches = () => {
      try {
        // Cleanup: Remove searches older than 30 days
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        const validSearches = recentSearches.value.filter((search) => {
          // Keep searches without timestamp (backward compatibility)
          if (!search.timestamp) return true;
          // Remove searches older than 30 days
          return now - search.timestamp < THIRTY_DAYS_MS;
        });

        // Update if any were removed
        if (validSearches.length !== recentSearches.value.length) {
          recentSearches.value = validSearches;
          console.log(
            `Cleaned up ${
              recentSearches.value.length - validSearches.length
            } old recent searches`
          );
        }

        localStorage.setItem(
          storageKey.value,
          JSON.stringify(recentSearches.value)
        );
      } catch (error) {
        console.error("Error saving recent searches:", error);
      }
    };

    // Add user to recent searches with enhanced data
    const addToRecent = (user) => {
      // Remove if already exists
      recentSearches.value = recentSearches.value.filter(
        (u) => u._id !== user._id
      );
      // Add to beginning with all enhanced fields
      recentSearches.value.unshift({
        _id: user._id,
        username: user.username,
        profile: user.profile,
        isFollowing: user.isFollowing,
        followsYou: user.followsYou,
        isMutual: user.isMutual,
        mutualCount: user.mutualCount,
        followerCount: user.followerCount,
        timestamp: Date.now(), // Add timestamp for future expiration
      });
      // Limit to 8 recent searches
      if (recentSearches.value.length > 8) {
        recentSearches.value = recentSearches.value.slice(0, 8);
      }
      saveRecentSearches();
    };

    // Remove user from recent searches
    const removeRecent = (userId) => {
      recentSearches.value = recentSearches.value.filter(
        (u) => u._id !== userId
      );
      saveRecentSearches();
    };

    // Clear all recent searches
    const clearAllRecent = () => {
      recentSearches.value = [];
      saveRecentSearches();
    };

    // Get user avatar URL
    const getUserAvatar = (user) => {
      return user.profile?.profilePicture || "/images/user.png";
    };

    // Format follower count (e.g., 1.2K, 3.5M)
    const formatFollowerCount = (count) => {
      if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + "M";
      } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + "K";
      }
      return count.toString();
    };

    // Search users with enhanced API
    const searchUsers = async (query) => {
      if (!query || query.trim().length === 0) {
        searchResults.value = [];
        return;
      }

      loading.value = true;
      try {
        const response = await axios.get("/api/users/search", {
          params: {
            q: query.trim(),
            limit: 30, // Increased from 10 to 30 for better results
          },
        });

        searchResults.value = response.data.users || [];
      } catch (error) {
        console.error("Error searching users:", error);
        if (error.response?.status === 504) {
          console.error("Search timed out - query too complex");
        }
        searchResults.value = [];
      } finally {
        loading.value = false;
      }
    };

    // Debounced search
    const handleInput = () => {
      if (debounceTimer.value) {
        clearTimeout(debounceTimer.value);
      }

      debounceTimer.value = setTimeout(() => {
        const query = searchQuery.value.trim();
        if (query.length > 0) {
          searchUsers(query);
        } else {
          searchResults.value = [];
        }
      }, 300);
    };

    // Position dropdown relative to input
    const positionDropdown = () => {
      nextTick(() => {
        if (searchInput.value && searchDropdown.value) {
          const inputRect = searchInput.value.getBoundingClientRect();
          searchDropdown.value.style.top = `${inputRect.bottom + 8}px`;
          searchDropdown.value.style.left = `${inputRect.left}px`;
        }
      });
    };

    // Handle input focus
    const handleFocus = () => {
      showDropdown.value = true;
      loadRecentSearches();
      positionDropdown();
    };

    // Clear search
    const clearSearch = () => {
      searchQuery.value = "";
      searchResults.value = [];
      highlightedIndex.value = -1;
      if (debounceTimer.value) {
        clearTimeout(debounceTimer.value);
      }
      nextTick(() => {
        searchInput.value?.focus();
      });
    };

    // Handle escape key
    const handleEscape = () => {
      showDropdown.value = false;
      searchInput.value?.blur();
    };

    // Handle arrow down
    const handleArrowDown = () => {
      const maxIndex =
        (searchQuery.value
          ? searchResults.value.length
          : recentSearches.value.length) - 1;
      if (highlightedIndex.value < maxIndex) {
        highlightedIndex.value++;
      }
    };

    // Handle arrow up
    const handleArrowUp = () => {
      if (highlightedIndex.value > 0) {
        highlightedIndex.value--;
      }
    };

    // Handle enter key
    const handleEnter = () => {
      const items = searchQuery.value
        ? searchResults.value
        : recentSearches.value;
      if (items[highlightedIndex.value]) {
        selectUser(items[highlightedIndex.value]);
      }
    };

    // Select user
    const selectUser = (user) => {
      addToRecent(user);
      searchQuery.value = "";
      searchResults.value = [];
      showDropdown.value = false;
      highlightedIndex.value = -1;
      router.push(`/profile/${user.username}`);
      searchInput.value?.blur();
    };

    // Handle click outside
    const handleClickOutside = (event) => {
      if (
        searchContainer.value &&
        !searchContainer.value.contains(event.target)
      ) {
        showDropdown.value = false;
        highlightedIndex.value = -1;
      }
    };

    // Watch for user changes to reload recent searches
    watch(
      () => currentUser.value?.id,
      () => {
        loadRecentSearches();
      }
    );

    // Watch for query changes
    watch(searchQuery, (newQuery) => {
      if (!newQuery || newQuery.trim().length === 0) {
        searchResults.value = [];
        highlightedIndex.value = -1;
      }
    });

    // Watch for dropdown visibility changes to reposition
    watch(showDropdown, (isVisible) => {
      if (isVisible) {
        positionDropdown();
      }
    });

    onMounted(() => {
      loadRecentSearches();
      document.addEventListener("click", handleClickOutside);
      window.addEventListener("scroll", positionDropdown, true);
      window.addEventListener("resize", positionDropdown);
    });

    onUnmounted(() => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", positionDropdown, true);
      window.removeEventListener("resize", positionDropdown);
      if (debounceTimer.value) {
        clearTimeout(debounceTimer.value);
      }
    });

    return {
      searchContainer,
      searchInput,
      searchDropdown,
      searchQuery,
      searchResults,
      loading,
      showDropdown,
      recentSearches,
      highlightedIndex,
      showRecent,
      showResults,
      handleInput,
      handleFocus,
      handleEscape,
      handleArrowDown,
      handleArrowUp,
      handleEnter,
      clearSearch,
      clearAllRecent,
      removeRecent,
      selectUser,
      getUserAvatar,
      formatFollowerCount,
    };
  },
};
</script>

<style scoped>
.user-search-container {
  position: relative;
  width: 100%;
  margin-bottom: var(--space-md);
}
.search-input-wrapper {
  width: 100%;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: var(--space-md);
  color: rgba(255, 255, 255, 0.5);
  font-size: var(--text-base);
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  padding-left: calc(var(--space-md) + var(--space-md) + 0.5rem);
  padding-right: calc(var(--space-md) + var(--space-md) + 0.5rem);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-md);
  color: var(--bright-white);
  font-size: var(--text-base);
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--mint-green);
  box-shadow: 0 0 0 3px rgba(152, 255, 152, 0.15);
}

.clear-search-btn {
  position: absolute;
  right: var(--space-md);
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: var(--space-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
}

.clear-search-btn:hover {
  color: var(--bright-white);
  background: rgba(255, 255, 255, 0.1);
}

.search-dropdown {
  position: fixed;
  top: auto;
  left: auto;
  max-height: 400px;
  overflow-y: auto;
  background: var(--skyPurp-SearchDropdown);
  border: 1px solid rgba(183, 150, 255, 0.6);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 1050;
  margin-top: var(--space-xs);
  width: 350px;
}

.search-dropdown::-webkit-scrollbar {
  width: 6px;
}

.search-dropdown::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-full);
}

.search-dropdown::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
}

.search-dropdown::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.recent-searches-section,
.search-results-section {
  padding: var(--space-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  color: var(--bright-white);
  font-size: var(--text-base);
  font-weight: 600;
  margin: 0;
}

.clear-all-btn {
  background: transparent;
  border: none;
  color: var(--electric-blue);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 500;
  padding: 0;
  transition: all 0.2s ease;
}

.clear-all-btn:hover {
  color: var(--bright-white);
}

.recent-list,
.results-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.search-result-item:hover,
.search-result-item.highlighted {
  background: rgba(255, 255, 255, 0.1);
}

.result-link {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.result-avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
  flex: 1;
}

.result-username {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--bright-white);
  font-size: var(--text-sm);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.verified-badge {
  color: var(--electric-blue);
  font-size: var(--text-sm);
  flex-shrink: 0;
}

.result-display-name {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--steel-gray);
  font-size: var(--text-xs);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mutual-badge {
  color: var(--electric-blue);
  font-size: var(--text-xs);
  font-weight: 600;
  padding: 2px 6px;
  background: rgba(0, 149, 246, 0.1);
  border-radius: 4px;
}

.follow-badge {
  color: var(--steel-gray);
  font-size: var(--text-xs);
}

.follows-you-badge {
  color: var(--mint-green);
  font-size: var(--text-xs);
}

.result-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--text-xs);
  color: var(--steel-gray);
  margin-top: 2px;
}

.mutual-count {
  color: var(--electric-blue);
  font-weight: 500;
}

.follower-count {
  color: var(--steel-gray);
  font-weight: 400;
}

.remove-recent-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  padding: var(--space-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: var(--radius-full);
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  opacity: 0;
}

.search-result-item:hover .remove-recent-btn {
  opacity: 1;
}

.remove-recent-btn:hover {
  color: var(--bright-white);
  background: rgba(255, 255, 255, 0.1);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  color: var(--steel-gray);
  font-size: var(--text-sm);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid var(--skyOrange);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--space-md);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .search-dropdown {
    max-height: 300px;
  }

  .result-avatar {
    width: 36px;
    height: 36px;
  }
}
</style>
