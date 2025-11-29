<template>
  <div class="achievements-tab">
    <div class="achievements-header">
      <h3>Achievements</h3>
      <p>{{ achievements.length }} achievements unlocked</p>
    </div>

    <div v-if="achievements.length === 0" class="no-achievements">
      <font-awesome-icon icon="trophy" />
      <p>No achievements yet</p>
    </div>

    <div v-else class="achievements-grid">
      <AchievementBadge
        v-for="achievement in achievements"
        :key="achievement.id"
        :achievement="achievement"
        size="large"
      />
    </div>
  </div>
</template>

<script>
import AchievementBadge from "@/components/AchievementBadge.vue";

export default {
  name: "AchievementsTab",
  components: {
    AchievementBadge,
  },
  props: {
    achievements: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style scoped>
.achievements-tab {
  padding: var(--space-lg);
}

.achievements-header {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.achievements-header h3 {
  color: var(--bright-white);
  margin-bottom: var(--space-sm);
}

.achievements-header p {
  color: var(--bright-white);
  font-weight: 400;
}

.no-achievements {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-3xl);
  color: var(--bright-white);
  font-weight: 400;
}

.no-achievements svg {
  font-size: var(--text-5xl);
  color: var(--skyOrange);
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-lg);
}

/* Responsive Design */
@media (max-width: 768px) {
  .achievements-tab {
    padding: var(--space-md);
  }

  .achievements-grid {
    grid-template-columns: 1fr;
  }
}
</style>
