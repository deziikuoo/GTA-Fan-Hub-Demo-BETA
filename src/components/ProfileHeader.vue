<template>
  <div class="profile-header main-backdrop-filter">
    <!-- Header Background -->
    <div class="header-background main-backdrop-filter">
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
          <LevelBadge
            v-if="user.socialStats?.level"
            :level="user.socialStats.level"
          />
        </div>

        <!-- Instagram-style Stats above Bio -->
        <div class="profile-stats-inline">
          <span class="inline-stat">
            <span class="inline-stat-number">{{
              user.socialStats?.totalPosts || user.stats?.postsCount || 0
            }}</span>
            <span class="inline-stat-label"> posts</span>
          </span>
          <span class="inline-stat">
            <span class="inline-stat-number">{{ displayFollowerCount }}</span>
            <span class="inline-stat-label"> followers</span>
          </span>
          <span class="inline-stat">
            <span class="inline-stat-number">{{ displayFollowingCount }}</span>
            <span class="inline-stat-label"> following</span>
          </span>
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
            v-if="
              user.gamingProfile?.currentGame &&
              user.gamingProfile.currentGame !== 'Offline'
            "
            class="current-game"
          >
            <font-awesome-icon icon="gamepad" />
            <span>Playing {{ user.gamingProfile.currentGame }}</span>
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
        </div>
      </div>
    </div>

    <!-- Reputation Stats (Horizontal) -->
    <div class="reputation-section">
      <div class="reputation-stats-horizontal">
        <div class="reputation-stat-item">
          <span class="reputation-value">{{
            Math.round(user.socialStats?.activeReputation || 0)
          }}</span>
          <span class="reputation-label">Active</span>
        </div>
        <div class="reputation-stat-item">
          <span class="reputation-value">{{
            Math.round(user.socialStats?.reputation || 0)
          }}</span>
          <span class="reputation-label">Total</span>
        </div>
        <div class="reputation-stat-item">
          <span class="reputation-value">{{
            Math.round(user.socialStats?.commentsReputation || 0)
          }}</span>
          <span class="reputation-label">Comment</span>
        </div>
        <div class="reputation-stat-item">
          <span class="reputation-value">{{
            Math.round(user.socialStats?.legacyReputation || 0)
          }}</span>
          <span class="reputation-label">Legacy</span>
        </div>
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
  emits: ["follow", "unfollow", "edit"],
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
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--bright-white);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  position: relative;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--mint-green);
  transform: translateX(5px);
}

.btn:hover svg {
  color: var(--mint-green);
}

.btn svg {
  font-size: var(--text-xl);
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

/* Instagram-style inline stats above bio */
.profile-stats-inline {
  display: flex;
  gap: var(--space-md);
  margin: var(--space-md) 0;
  color: var(--bright-white);
  font-size: var(--text-base);
}

.inline-stat {
  display: inline-flex;
  align-items: baseline;
  padding: var(--space-xs) var(--space-sm);
  gap: var(--space-sm);
}

.inline-stat-number {
  font-weight: 600;
  color: var(--bright-white);
}

.inline-stat-label {
  font-weight: 400;
  color: var(--bright-white);
  opacity: 0.9;
}

.reputation-section {
  padding: var(--space-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.reputation-stats-horizontal {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  width: 100%;
  padding: 0 var(--space-md);
}

.reputation-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition: var(--transition-normal);
  flex: 1;
  max-width: 150px;
}

.reputation-stat-item:hover {
  transform: translateY(-2px);
}

.reputation-value {
  display: block;
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--bright-white);
  line-height: 1.2;
  margin-bottom: var(--space-xs);
  text-align: center;
}

.reputation-label {
  font-size: var(--text-sm);
  color: var(--bright-white);
  font-weight: 400;
  opacity: 0.9;
  text-align: center;
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

  .profile-stats-inline {
    font-size: var(--text-sm);
    gap: var(--space-sm);
  }

  .reputation-section {
    padding: var(--space-md);

    .reputation-stats-horizontal {
      padding: 0 var(--space-sm);
    }

    .reputation-stat-item {
      max-width: 120px;
    }

    .reputation-value {
      font-size: var(--text-xl);
    }

    .reputation-label {
      font-size: var(--text-xs);
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

  .profile-stats-inline {
    font-size: var(--text-xs);
    gap: var(--space-xs);
  }

  .reputation-section {
    padding: var(--space-sm);

    .reputation-stats-horizontal {
      padding: 0 var(--space-xs);
      flex-wrap: wrap;
    }

    .reputation-stat-item {
      max-width: 100px;
      min-width: 80px;
    }

    .reputation-value {
      font-size: var(--text-lg);
    }

    .reputation-label {
      font-size: 10px;
    }
  }
}
</style>
