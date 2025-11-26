<template>
  <div class="about-tab">
    <div class="about-content">
      <!-- Gaming Profile Section -->
      <div class="section">
        <h3 class="section-title">
          <font-awesome-icon icon="gamepad" />
          Gaming Profile
        </h3>
        <div class="section-content">
          <div v-if="user.gamingProfile?.playStyle" class="info-group">
            <label>Play Style:</label>
            <span class="info-value">{{ user.gamingProfile.playStyle }}</span>
          </div>

          <div v-if="user.gamingProfile?.skillLevel" class="info-group">
            <label>Skill Level:</label>
            <SkillBadge :level="user.gamingProfile.skillLevel" />
          </div>

          <div
            v-if="user.gamingProfile?.preferredGameMode?.length"
            class="info-group"
          >
            <label>Preferred Game Modes:</label>
            <div class="modes-list">
              <span
                v-for="mode in user.gamingProfile.preferredGameMode"
                :key="mode"
                class="mode-tag"
              >
                {{ mode }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics Section -->
      <div class="section">
        <h3 class="section-title">
          <font-awesome-icon icon="chart-bar" />
          Statistics
        </h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <font-awesome-icon icon="newspaper" />
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ user.socialStats?.totalPosts || 0 }}</span>
              <span class="stat-label">Posts</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <font-awesome-icon icon="heart" />
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ user.socialStats?.totalLikes || 0 }}</span>
              <span class="stat-label">Likes Received</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <font-awesome-icon icon="comment" />
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ user.socialStats?.totalComments || 0 }}</span>
              <span class="stat-label">Comments</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">
              <font-awesome-icon icon="star" />
            </div>
            <div class="stat-info">
              <span class="stat-number">{{ user.socialStats?.reputation || 0 }}</span>
              <span class="stat-label">Reputation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SkillBadge from "@/components/SkillBadge.vue";

export default {
  name: "AboutTab",
  components: {
    SkillBadge,
  },
  props: {
    user: {
      type: Object,
      required: true,
    },
  },
  setup() {
    const formatDate = (date) => {
      if (!date) return "";
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return {
      formatDate,
    };
  },
};
</script>

<style scoped>
.about-tab {
  padding: var(--space-lg);
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.section {
  background: var(--glass-morphism-bg);
  border-radius: 1.2rem;
  padding: 20px;
  border: 1px solid transparent;
  box-shadow: 8px 8px 24px rgba(0, 0, 0, 0.3),
    -8px -8px 24px rgba(80, 80, 90, 0.05);
  transition: all 0.3s ease;
}

.section:hover {
  transform: translateY(-2px);
  border: var(--hover-border);
  box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.4),
    -10px -10px 30px rgba(80, 80, 90, 0.08), var(--neon-glow-hover);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--bright-white);
  margin-bottom: var(--space-lg);
}

.section-title svg {
  color: var(--skyOrange);
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  color: var(--bright-white);
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  align-items: center;
}

.info-group label {
  font-weight: 600;
  color: var(--steel-gray);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: auto;
  text-align: center;
}

.info-value {
  color: var(--bright-white);
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.bio-text {
  color: var(--bright-white);
  font-weight: 400;
  line-height: var(--leading-relaxed);
  margin: 0;
}

.website-link {
  color: var(--skyOrange);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.website-link:hover {
  text-decoration: underline;
}

.games-list,
.modes-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.game-tag,
.mode-tag {
  background: var(--skyOrange);
  color: var(--bright-white);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-lg);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 20px;
  background: var(--glass-morphism-bg);
  border-radius: 1.2rem;
  border: 1px solid transparent;
  box-shadow: 8px 8px 24px rgba(0, 0, 0, 0.3),
    -8px -8px 24px rgba(80, 80, 90, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  border: var(--hover-border);
  box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.4),
    -10px -10px 30px rgba(80, 80, 90, 0.08), var(--neon-glow-hover);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: var(--skyOrange);
  border-radius: 50%;
  color: var(--bright-white);
  font-size: var(--text-lg);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--bright-white);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--bright-white);
  font-weight: 400;
}

/* Responsive Design */
@media (max-width: 768px) {
  .about-tab {
    padding: var(--space-md);
  }

  .section {
    padding: 16px;
    border-radius: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 16px;
    border-radius: 1rem;
  }
}

@media (max-width: 640px) {
  .about-tab {
    padding: var(--space-sm);
  }

  .section {
    padding: var(--space-sm);
  }

  .section-title {
    font-size: var(--text-lg);
  }
}
</style>
