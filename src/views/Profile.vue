<template>
  <div class="profile-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading profile...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <font-awesome-icon :icon="['fas', 'exclamation-triangle']" />
        <h3>{{ error }}</h3>
        <button @click="loadProfile" class="btn btn-primary">Try Again</button>
      </div>
    </div>

    <!-- Profile Content -->
    <div v-else-if="profileUser" class="profile-content">
        <!-- Profile Header -->
        <ProfileHeader
          :user="profileUser"
          :isOwnProfile="isOwnProfile"
          @edit="handleEdit"
        />

        <!-- Profile Navigation -->
        <ProfileNavigation
          :activeTab="activeTab"
          @tabChange="handleTabChange"
        />

        <!-- Profile Content Tabs -->
        <PostsTab v-if="activeTab === 'posts'" :userId="profileUser.id || profileUser._id" />
        <AboutTab v-if="activeTab === 'about'" :user="profileUser" />
        <AchievementsTab
          v-if="activeTab === 'achievements'"
          :achievements="profileUser.achievements || []"
        />
        <FollowersTab
          v-if="activeTab === 'followers'"
          :userId="profileUser.id || profileUser._id"
          :username="profileUser.username"
        />
        <FollowingTab
          v-if="activeTab === 'following'"
          :userId="profileUser.id || profileUser._id"
          :username="profileUser.username"
        />
    </div>
    
    <!-- Fallback if no profile user and no error -->
    <div v-else class="profile-content">
      <div class="error-container">
        <div class="error-message">
          <font-awesome-icon :icon="['fas', 'exclamation-triangle']" />
          <h3>Profile not found</h3>
          <button @click="loadProfile" class="btn btn-primary">Retry</button>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <EditProfileModal
      v-if="showEditModal"
      :user="profileUser"
      @close="showEditModal = false"
      @saved="handleProfileSaved"
    />

  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import axios from "@/utils/axios";
import ProfileHeader from "@/components/ProfileHeader.vue";
import ProfileNavigation from "@/components/ProfileNavigation.vue";
import PostsTab from "@/components/profile/PostsTab.vue";
import AboutTab from "@/components/profile/AboutTab.vue";
import AchievementsTab from "@/components/profile/AchievementsTab.vue";
import FollowersTab from "@/components/profile/FollowersTab.vue";
import FollowingTab from "@/components/profile/FollowingTab.vue";
import EditProfileModal from "@/components/EditProfileModal.vue";

export default {
  name: "Profile",
  components: {
    ProfileHeader,
    ProfileNavigation,
    PostsTab,
    AboutTab,
    AchievementsTab,
    FollowersTab,
    FollowingTab,
    EditProfileModal,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();

    // Reactive data
    const profileUser = ref(null);
    const loading = ref(false); // Start as false, will be set to true when loading starts
    const error = ref(null);
    const activeTab = ref("posts");
    const showEditModal = ref(false);
    const isLoadingRef = ref(false); // Track if a load is in progress to prevent duplicates

    // Computed properties
    const currentUser = computed(() => store.state.user);
    const isOwnProfile = computed(() => {
      return (
        currentUser.value &&
        profileUser.value &&
        currentUser.value.id === profileUser.value.id
      );
    });

    // Methods
    const loadProfile = async () => {
      // Prevent multiple simultaneous loads
      if (isLoadingRef.value) {
        console.log("[Profile] Already loading, skipping...");
        return;
      }

      try {
        isLoadingRef.value = true;
        loading.value = true;
        error.value = null;
        console.log("[Profile] Starting loadProfile...");

        let username = route.params.username;
        console.log("[Profile] Username from route:", username);
        
        // Handle undefined username - redirect to current user's profile
        if (!username || username === "undefined") {
          console.log("[Profile] Username is undefined, redirecting...");
          if (currentUser.value && currentUser.value.username) {
            loading.value = false; // Reset loading before redirect
            router.replace(`/profile/${currentUser.value.username}`);
            return;
          }
          // If no current user, use demo user
          const { currentDemoUser } = await import("@/mockData/users.js");
          username = currentDemoUser.username;
          loading.value = false; // Reset loading before redirect
          router.replace(`/profile/${username}`);
          return;
        }

        console.log("[Profile] Fetching profile for:", username);
        const response = await axios.get(`/api/profile/${username}`);
        console.log("[Profile] Response received:", response);
        
        if (!response || !response.data) {
          throw new Error("Invalid response from server");
        }

        // Ensure we have a user object
        if (!response.data.user) {
          // Try to get demo user as fallback
          const { currentDemoUser } = await import("@/mockData/users.js");
          profileUser.value = { ...currentDemoUser, username: username || currentDemoUser.username };
        } else {
          profileUser.value = response.data.user;
        }
        
        // Ensure profileUser has required fields
        if (!profileUser.value) {
          const { currentDemoUser } = await import("@/mockData/users.js");
          profileUser.value = { ...currentDemoUser, username: username || currentDemoUser.username };
        }

        if (!profileUser.value.id) {
          profileUser.value.id = profileUser.value._id || profileUser.value.username || username;
        }
        if (!profileUser.value._id && profileUser.value.id) {
          profileUser.value._id = profileUser.value.id;
        }
        if (!profileUser.value.username) {
          profileUser.value.username = username;
        }
        
        // Ensure profile object exists
        if (!profileUser.value.profile) {
          profileUser.value.profile = {
            displayName: profileUser.value.username,
            bio: "",
            profilePicture: "/src/assets/images/user.png",
            headerImage: "/src/assets/images/HeaderImages/Bros.jpg",
            verified: false,
            location: "",
            website: null,
            joinedDate: profileUser.value.createdAt || new Date(),
          };
        }

        // Ensure gamingProfile exists (required by ProfileHeader)
        if (!profileUser.value.gamingProfile) {
          profileUser.value.gamingProfile = {
            onlineStatus: "offline",
            lastSeen: new Date(),
            favoriteGame: "GTA 6",
            playtime: 0,
          };
        }

        // Ensure socialStats exists (required by ProfileHeader)
        if (!profileUser.value.socialStats) {
          profileUser.value.socialStats = {
            totalPosts: profileUser.value.posts || 0,
            totalLikes: 0,
            totalReposts: 0,
            totalComments: 0,
            level: profileUser.value.level || 1,
            reputation: profileUser.value.reputation || 0,
          };
        }

        // Ensure stats exists as fallback
        if (!profileUser.value.stats) {
          profileUser.value.stats = {
            postsCount: profileUser.value.posts || 0,
            followersCount: profileUser.value.followers || 0,
            followingCount: profileUser.value.following || 0,
          };
        }

        // Ensure achievements array exists
        if (!profileUser.value.achievements) {
          profileUser.value.achievements = [];
        }
        
        console.log("[Profile] Loaded user:", profileUser.value);
        console.log("[Profile] Setting loading to false...");

        // Check if current user is following this profile (update Vuex store)
        // Do this in a non-blocking way
        if (currentUser.value && profileUser.value.id) {
          const isOwn = currentUser.value.id === profileUser.value.id;
          if (!isOwn) {
            // Use setTimeout to make this non-blocking
            setTimeout(async () => {
              try {
                await store.dispatch(
                  "social/checkFollowStatus",
                  profileUser.value.id
                );
              } catch (followError) {
                console.warn("Error checking follow status:", followError);
                // Don't fail the whole profile load if follow check fails
              }
            }, 0);
          }
        }
      } catch (err) {
        console.error("[Profile] Error loading profile:", err);
        console.error("[Profile] Error details:", err.message, err.stack);
        error.value = err.message || err.response?.data?.error || "Failed to load profile";
        // Always set a fallback user so the component can still render
        try {
          const { currentDemoUser } = await import("@/mockData/users.js");
          const username = route.params.username || currentDemoUser.username;
          profileUser.value = { 
            ...currentDemoUser, 
            username: username,
            id: currentDemoUser._id || currentDemoUser.id || username,
            _id: currentDemoUser._id || currentDemoUser.id || username,
            profile: currentDemoUser.profile || {
              displayName: username,
              bio: "",
              profilePicture: "/src/assets/images/user.png",
              headerImage: "/src/assets/images/HeaderImages/Bros.jpg",
              verified: false,
              location: "",
              website: null,
              joinedDate: new Date(),
            },
            gamingProfile: {
              onlineStatus: "offline",
              lastSeen: new Date(),
              favoriteGame: "GTA 6",
              playtime: 0,
            },
            socialStats: {
              totalPosts: currentDemoUser.posts || 0,
              totalLikes: 0,
              totalReposts: 0,
              totalComments: 0,
              level: currentDemoUser.level || 1,
              reputation: currentDemoUser.reputation || 0,
            },
            stats: {
              postsCount: currentDemoUser.posts || 0,
              followersCount: currentDemoUser.followers || 0,
              followingCount: currentDemoUser.following || 0,
            },
            achievements: [],
          };
        } catch (fallbackError) {
          console.error("Error setting fallback user:", fallbackError);
          // Even if fallback fails, ensure profileUser is not null
          const username = route.params.username || "demo";
          profileUser.value = {
            username: username,
            id: "demo",
            _id: "demo",
            profile: {
              displayName: "Demo User",
              bio: "",
              profilePicture: "/src/assets/images/user.png",
              headerImage: "/src/assets/images/HeaderImages/Bros.jpg",
              verified: false,
              location: "",
              website: null,
              joinedDate: new Date(),
            },
            gamingProfile: {
              onlineStatus: "offline",
              lastSeen: new Date(),
              favoriteGame: "GTA 6",
              playtime: 0,
            },
            socialStats: {
              totalPosts: 0,
              totalLikes: 0,
              totalReposts: 0,
              totalComments: 0,
              level: 1,
              reputation: 0,
            },
            stats: {
              postsCount: 0,
              followersCount: 0,
              followingCount: 0,
            },
            achievements: [],
            followers: 0,
            following: 0,
            posts: 0,
            reputation: 0,
            level: 1,
          };
        }
      } finally {
        console.log("[Profile] Finally block executing - setting loading to false");
        loading.value = false;
        isLoadingRef.value = false;
        console.log("[Profile] Final state - loading:", loading.value, "profileUser:", profileUser.value ? "exists" : "null", "error:", error.value);
      }
    };

    const handleEdit = () => {
      showEditModal.value = true;
    };

    const handleProfileSaved = (updatedUser) => {
      profileUser.value = updatedUser;
      showEditModal.value = false;
    };

    const handleTabChange = (tab) => {
      activeTab.value = tab;
    };

    // Watch for route changes to reload profile
    watch(
      () => route.params.username,
      (newUsername, oldUsername) => {
        // Only reload if username actually changed
        if (newUsername && newUsername !== oldUsername) {
          // Reset state before loading
          profileUser.value = null;
          error.value = null;
          activeTab.value = "posts";
          isLoadingRef.value = false; // Reset loading flag
          loadProfile(); // This will set loading.value = true
        }
      },
      { immediate: false }
    );

    // Also watch the full route to catch any navigation issues
    watch(
      () => route.fullPath,
      (newPath, oldPath) => {
        // If we're navigating away from profile, reset state
        if (!newPath.includes('/profile/') && oldPath?.includes('/profile/')) {
          profileUser.value = null;
          loading.value = true;
          error.value = null;
          activeTab.value = "posts";
          showEditModal.value = false;
        }
      }
    );

    // Lifecycle
    onMounted(() => {
      // Reset state on mount to ensure clean start
      profileUser.value = null;
      loading.value = false; // Will be set to true by loadProfile
      error.value = null;
      activeTab.value = "posts";
      showEditModal.value = false;
      isLoadingRef.value = false; // Reset loading flag
      loadProfile(); // This will set loading.value = true
    });

    onUnmounted(() => {
      // Clean up component state when unmounted
      // Don't set loading to true here as it might cause issues
      profileUser.value = null;
      error.value = null;
      activeTab.value = "posts";
      showEditModal.value = false;
    });

    return {
      profileUser,
      loading,
      error,
      activeTab,
      showEditModal,
      currentUser,
      isOwnProfile,
      loadProfile,
      handleEdit,
      handleProfileSaved,
      handleTabChange,
    };
  },
};
</script>

<style scoped>
.profile-page {
  max-width: 100vw;
  padding: var(--space-md);
  min-height: 100vh;
  margin-top: 150px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: var(--space-lg);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--steel-gray);
  border-top: 4px solid var(--skyOrange);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.error-message {
  text-align: center;
  padding: var(--space-xl);
  background: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);

  svg {
    font-size: var(--text-4xl);
    color: var(--coral-red);
    margin-bottom: var(--space-md);
  }

  h3 {
    color: var(--bright-white);
    margin-bottom: var(--space-lg);
  }
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-page {
    padding: var(--space-sm);
  }
}

@media (max-width: 640px) {
  .profile-page {
    padding: var(--space-xs);
  }
}
</style>
