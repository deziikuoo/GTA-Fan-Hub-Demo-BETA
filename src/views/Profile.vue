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
        <font-awesome-icon icon="exclamation-triangle" />
        <h3>{{ error }}</h3>
        <button @click="loadProfile" class="btn btn-primary">Try Again</button>
      </div>
    </div>

    <!-- Profile Content -->
    <div v-else class="profile-content">
      <template v-if="profileUser">
        <!-- Profile Header -->
        <ProfileHeader
          :user="profileUser"
          :isOwnProfile="isOwnProfile"
          @edit="handleEdit"
          @openSettings="handleOpenSettings"
        />

        <!-- Profile Navigation -->
        <ProfileNavigation
          :activeTab="activeTab"
          @tabChange="handleTabChange"
        />

        <!-- Profile Content Tabs -->
        <PostsTab v-if="activeTab === 'posts'" :userId="profileUser.id" />
        <AboutTab v-if="activeTab === 'about'" :user="profileUser" />
        <AchievementsTab
          v-if="activeTab === 'achievements'"
          :achievements="profileUser.achievements || []"
        />
        <FollowersTab
          v-if="activeTab === 'followers'"
          :userId="profileUser.id"
          :username="profileUser.username"
        />
        <FollowingTab
          v-if="activeTab === 'following'"
          :userId="profileUser.id"
          :username="profileUser.username"
        />
      </template>
    </div>

    <!-- Edit Profile Modal -->
    <EditProfileModal
      v-if="showEditModal"
      :user="profileUser"
      @close="showEditModal = false"
      @saved="handleProfileSaved"
    />

    <!-- Settings Modal -->
    <SettingsModal
      v-if="showSettingsModal"
      @close="showSettingsModal = false"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";
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
import SettingsModal from "@/components/SettingsModal.vue";

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
    SettingsModal,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();

    // Reactive data
    const profileUser = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const activeTab = ref("posts");
    const showEditModal = ref(false);
    const showSettingsModal = ref(false);

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
      try {
        loading.value = true;
        error.value = null;

        const username = route.params.username;
        if (!username) {
          throw new Error("Username is required");
        }

        const response = await axios.get(`/api/profile/${username}`);
        profileUser.value = response.data.user;

        // Check if current user is following this profile (update Vuex store)
        if (currentUser.value && !isOwnProfile.value && profileUser.value.id) {
          await store.dispatch(
            "social/checkFollowStatus",
            profileUser.value.id
          );
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        error.value = err.response?.data?.error || "Failed to load profile";
      } finally {
        loading.value = false;
      }
    };

    const handleEdit = () => {
      showEditModal.value = true;
    };

    const handleOpenSettings = () => {
      showSettingsModal.value = true;
    };

    const handleProfileSaved = (updatedUser) => {
      profileUser.value = updatedUser;
      showEditModal.value = false;
    };

    const handleTabChange = (tab) => {
      activeTab.value = tab;
    };

    // Lifecycle
    onMounted(() => {
      loadProfile();
    });

    onUnmounted(() => {
      // Clean up component state when unmounted
      profileUser.value = null;
      loading.value = false;
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
      showSettingsModal,
      currentUser,
      isOwnProfile,
      loadProfile,
      handleEdit,
      handleOpenSettings,
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
