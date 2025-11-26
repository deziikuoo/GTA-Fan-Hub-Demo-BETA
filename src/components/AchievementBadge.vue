<template>
  <div
    :class="[
      'achievement-badge',
      `rarity-${achievement.rarity}`,
      `size-${size}`,
    ]"
    :title="achievement.description"
  >
    <div class="badge-icon">
      <font-awesome-icon v-if="achievement.icon" :icon="achievement.icon" />
      <font-awesome-icon v-else icon="trophy" />
    </div>
    <div v-if="size !== 'small'" class="badge-content">
      <span class="badge-name">{{ achievement.name }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "AchievementBadge",
  props: {
    achievement: {
      type: Object,
      required: true,
    },
    size: {
      type: String,
      default: "medium",
      validator: (value) => ["small", "medium", "large"].includes(value),
    },
  },
};
</script>

<style scoped>
.achievement-badge {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-md);
  background: var(--steel-gray);
  color: var(--bright-white);
  transition: var(--transition-normal);
  cursor: pointer;
}

.achievement-badge:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.badge-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Size variants */
.size-small {
  padding: 4px 6px;
  font-size: var(--text-xs);
}

.size-medium {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-sm);
}

.size-large {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-base);
}

/* Rarity colors */
.rarity-common {
  background: var(--steel-gray);
  border: 1px solid #8a9ba8;
}

.rarity-rare {
  background: var(--electric-blue);
  border: 1px solid #00bfff;
}

.rarity-epic {
  background: var(--vibrant-purple);
  border: 1px solid #800080;
}

.rarity-legendary {
  background: linear-gradient(45deg, var(--skyOrange), var(--neon-pink));
  border: 1px solid var(--skyOrange);
  animation: legendary-glow 2s ease-in-out infinite alternate;
}

@keyframes legendary-glow {
  from {
    box-shadow: 0 0 5px var(--skyOrange);
  }
  to {
    box-shadow: 0 0 20px var(--skyOrange), 0 0 30px var(--neon-pink);
  }
}

.badge-content {
  display: flex;
  flex-direction: column;
}

.badge-name {
  font-weight: 500;
  font-size: inherit;
}

.size-small .badge-content {
  display: none;
}
</style>
