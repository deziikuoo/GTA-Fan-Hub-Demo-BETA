<template>
  <div class="level-badge" :title="`Level ${level}`">
    <span class="level-text">Lv.{{ level }}</span>
  </div>
</template>

<script>
export default {
  name: "LevelBadge",
  props: {
    level: {
      type: Number,
      required: true,
    },
  },
};
</script>

<style scoped>
.level-badge {
  display: inline-flex;
  align-items: center;
  background: var(--skyOrange);
  color: var(--bright-white);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  margin-left: var(--space-xs);
}

.level-text {
  font-size: inherit;
}
</style>
