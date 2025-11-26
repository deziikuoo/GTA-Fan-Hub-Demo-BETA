<template>
  <div class="profile-header">
    <!-- Header Background -->
    <div class="header-background">
      <img
        :src="headerImageUrl"
        :alt="`${user.username} header`"
        class="header-image"
        :style="{ objectPosition: headerImagePosition }"
        @error="handleHeaderImageError"
      />
      <div class="header-overlay"></div>
    </div>

    <!-- Profile Info -->
    <div class="profile-info">
      <div class="profile-avatar-section">
        <div class="avatar-container">
          <img
            :src="profileImageUrl"
            :alt="`${user.username} avatar`"
            class="profile-avatar"
            @error="handleImageError"
          />
          <div
            v-if="user.gamingProfile.onlineStatus === 'online'"
            class="online-indicator"
          ></div>
        </div>
        <div class="profile-badges">
          <AchievementBadge
            v-for="achievement in featuredAchievements"
            :key="achievement.id"
            :achievement="achievement"
            size="small"
          />
        </div>
      </div>

      <div class="profile-details">
        <div class="profile-name-section">
          <h1 class="display-name">
            {{ user.profile.displayName || user.username }}
          </h1>
          <span class="username">@{{ user.username }}</span>
          <VerifiedBadge v-if="user.profile.verified" />
          <LevelBadge v-if="user.socialStats?.level" :level="user.socialStats.level" />
        </div>

        <p v-if="user.profile.bio" class="bio">{{ user.profile.bio }}</p>

        <div class="profile-meta">
          <div v-if="user.profile.location" class="meta-item">
            <font-awesome-icon icon="location-dot" />
            <span>{{ user.profile.location }}</span>
          </div>
          <div v-if="user.profile.website" class="meta-item">
            <font-awesome-icon icon="link" />
            <a
              :href="user.profile.website"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ user.profile.website }}
            </a>
          </div>
          <div v-if="user.profile?.joinDate" class="meta-item">
            <font-awesome-icon icon="calendar" />
            <span>Joined {{ formatDate(user.profile.joinDate) }}</span>
          </div>
        </div>

        <div class="gaming-status">
          <div
            v-if="user.gamingProfile?.currentGame && user.gamingProfile.currentGame !== 'Offline'"
            class="current-game"
          >
            <font-awesome-icon icon="gamepad" />
            <span>Playing {{ user.gamingProfile.currentGame }}</span>
          </div>
          <div v-if="user.gamingProfile?.skillLevel" class="skill-level">
            <span class="skill-label">Skill Level:</span>
            <SkillBadge :level="user.gamingProfile.skillLevel" />
          </div>
        </div>
      </div>

      <div class="profile-actions">
        <div v-if="!isOwnProfile" class="action-buttons">
          <FollowButton
            :userId="user.id"
            :username="user.username"
            size="medium"
            variant="primary"
            source="profile"
          />
          <button class="btn btn-outline message-btn">
            <font-awesome-icon icon="envelope" />
            Message
          </button>
        </div>
        <div v-else class="action-buttons">
          <button @click="$emit('edit')" class="btn btn-primary edit-btn">
            <font-awesome-icon icon="edit" />
            Edit Profile
          </button>
          <button
            @click="$emit('openSettings')"
            class="btn btn-outline settings-btn"
          >
            <font-awesome-icon icon="cog" />
            Settings
          </button>
        </div>
      </div>
    </div>

    <!-- Profile Stats -->
    <div class="profile-stats">
      <div class="stat-item posts-stat">
        <span class="stat-number posts-count">{{
          user.socialStats?.totalPosts || user.stats?.postsCount || 0
        }}</span>
        <span class="stat-label posts-label">Posts</span>
      </div>
      <div class="stat-item followers-stat">
        <span class="stat-number followers-count">{{ displayFollowerCount }}</span>
        <span class="stat-label followers-label">Followers</span>
      </div>
      <div class="stat-item following-stat">
        <span class="stat-number following-count">{{ displayFollowingCount }}</span>
        <span class="stat-label following-label">Following</span>
      </div>
      <div class="stat-item reputation-stat">
        <span class="stat-number reputation-count">{{ user.socialStats?.reputation || 0 }}</span>
        <span class="stat-label reputation-label">Reputation</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";
import { useStore } from "vuex";
import AchievementBadge from "./AchievementBadge.vue";
import VerifiedBadge from "./VerifiedBadge.vue";
import LevelBadge from "./LevelBadge.vue";
import SkillBadge from "./SkillBadge.vue";
import FollowButton from "./social/FollowButton.vue";

export default {
  name: "ProfileHeader",
  components: {
    AchievementBadge,
    VerifiedBadge,
    LevelBadge,
    SkillBadge,
    FollowButton,
  },
  props: {
    user: {
      type: Object,
      required: true,
    },
    isOwnProfile: {
      type: Boolean,
      default: false,
    },
    isFollowing: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["follow", "unfollow", "edit", "openSettings"],
  setup(props) {
    const store = useStore();

    // Get real-time counts from Vuex for current user, otherwise use prop data
    const displayFollowerCount = computed(() => {
      if (props.isOwnProfile) {
        // For current user, use live Vuex count
        return store.state.social.followerCount;
      }
      // For other users, use data from API
      return (
        props.user.stats?.followersCount ||
        props.user.socialStats?.followerCount ||
        0
      );
    });

    const displayFollowingCount = computed(() => {
      if (props.isOwnProfile) {
        // For current user, use live Vuex count
        return store.state.social.followingCount;
      }
      // For other users, use data from API
      return (
        props.user.stats?.followingCount ||
        props.user.socialStats?.followingCount ||
        0
      );
    });

    // Show only legendary and epic achievements in the header
    const featuredAchievements = computed(() => {
      if (!props.user.achievements || !Array.isArray(props.user.achievements)) {
        return [];
      }
      return props.user.achievements
        .filter(
          (achievement) =>
            achievement.rarity === "legendary" || achievement.rarity === "epic"
        )
        .slice(0, 3); // Show max 3 achievements
    });

    const formatDate = (date) => {
      if (!date) return "";
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    };

    // Handle profile image with fallback to default
    const profileImageUrl = computed(() => {
      if (props.user.profile.profilePicture) {
        return props.user.profile.profilePicture;
      }
      return "/src/assets/images/user.png";
    });

    // Handle header image with fallback to default
    const headerImageUrl = computed(() => {
      if (props.user.profile.headerImage) {
        return props.user.profile.headerImage;
      }
      // Use a default header image from the HeaderImages folder
      return "/src/assets/images/HeaderImages/Bros.jpg";
    });

    // Handle header image position (where to focus when cropping)
    const headerImagePosition = computed(() => {
      return props.user.profile.headerImagePosition || "50% 50%";
    });

    const handleImageError = (event) => {
      // Fallback to default image if the current image fails to load
      if (event.target.src !== "/src/assets/images/user.png") {
        event.target.src = "/src/assets/images/user.png";
      }
    };

    const handleHeaderImageError = (event) => {
      // Fallback to default header if the current image fails to load
      if (event.target.src !== "/src/assets/images/HeaderImages/Bros.jpg") {
        event.target.src = "/src/assets/images/HeaderImages/Bros.jpg";
      }
    };

    return {
      featuredAchievements,
      formatDate,
      profileImageUrl,
      headerImageUrl,
      headerImagePosition,
      handleImageError,
      handleHeaderImageError,
      displayFollowerCount,
      displayFollowingCount,
    };
  },
};
</script>

<style scoped>
.profile-header {
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  margin-bottom: var(--space-lg);
  background: var(--glass-morphism-bg);
}

.header-background {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.header-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
}

.profile-info {
  display: flex;
  align-items: flex-start;
  gap: var(--space-lg);
  padding: 20px;
  position: relative;
  border-radius: 1.2rem 1.2rem 0 0;
}

.profile-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.avatar-container {
  position: relative;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid var(--bright-white);
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: var(--mint-green);
  border: 3px solid var(--bright-white);
  border-radius: 50%;
}

.profile-badges {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
  justify-content: center;
}

.profile-details {
  flex: 1;
}

.display-name {
  font-size: var(--text-3xl);
  font-weight: 400;
  color: var(--bright-white);
  margin: 0 0 var(--space-xs) 0;
}

.username {
  font-size: var(--text-lg);
  color: var(--bright-white);
  margin-right: var(--space-sm);
  font-weight: 400;
}

.bio {
  font-size: var(--text-base);
  color: var(--bright-white);
  line-height: var(--leading-relaxed);
  margin: var(--space-md) 0;
  font-weight: 400;
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--bright-white);
  font-size: var(--text-sm);
  font-weight: 500;
}

.meta-item a {
  color: var(--skyOrange);
  text-decoration: none;
}

.meta-item a:hover {
  text-decoration: underline;
}

.gaming-status {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  font-weight: 500;
}

.current-game {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--mint-green);
  font-size: var(--text-sm);
  font-weight: 500;
}

.skill-level {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.skill-label {
  color: var(--bright-white);
  font-size: var(--text-sm);
}

.profile-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.action-buttons {
  display: flex;
  gap: var(--space-sm);
}

.btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 8px 20px;
  background: var(--glass-morphism-bg);
  border: 1px solid var(--sunset-orange);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--bright-white);
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn:hover {
  border: 1px solid var(--bright-white);
  color: var(--bright-white);
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  padding: var(--space-lg);
}

.stat-item {
  text-align: center;
  cursor: pointer;
  transition: var(--transition-normal);
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-number {
  display: block;
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--bright-white);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--bright-white);
  font-weight: 400;
}

.error {
  color: var(--coral-red);
  font-size: var(--text-sm);
  text-align: center;
  margin-top: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  background: rgba(255, 64, 64, 0.1);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 64, 64, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-info {
    flex-direction: column;
    text-align: center;
  }

  .profile-actions {
    width: 100%;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .profile-stats {
    .stat-item {
      .stat-number {
        font-size: var(--text-xl);
      }
    }
  }
}

@media (max-width: 640px) {
  .header-background {
    height: 150px;
  }

  .profile-avatar {
    width: 100px;
    height: 100px;
  }

  .display-name {
    font-size: var(--text-2xl);
  }

  .profile-stats {
    padding: var(--space-md);
  }
}
</style>
