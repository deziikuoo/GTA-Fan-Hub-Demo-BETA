<template>
  <div
    :class="['skill-badge', `skill-${level}`]"
    :title="`Skill Level: ${level}`"
  >
    <span class="skill-text">{{ level }}</span>
  </div>
</template>

<script>
export default {
  name: "SkillBadge",
  props: {
    level: {
      type: String,
      required: true,
      validator: (value) =>
        ["beginner", "intermediate", "advanced", "expert"].includes(value),
    },
  },
};
</script>

<style scoped>
.skill-badge {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: capitalize;
}

.skill-text {
  font-size: inherit;
}

.skill-beginner {
  background: var(--mint-green);
  color: var(--deep-black);
}

.skill-intermediate {
  background: var(--skyOrange);
  color: var(--bright-white);
}

.skill-advanced {
  background: var(--electric-blue);
  color: var(--bright-white);
}

.skill-expert {
  background: var(--vibrant-purple);
  color: var(--bright-white);
}
</style>
