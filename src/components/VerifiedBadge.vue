<template>
  <div class="verified-badge" title="Verified Account">
    <font-awesome-icon icon="check-circle" />
  </div>
</template>

<script>
export default {
  name: "VerifiedBadge",
};
</script>

<style scoped>
.verified-badge {
  display: inline-flex;
  align-items: center;
  color: var(--electric-blue);
  font-size: var(--text-lg);
  margin-left: var(--space-xs);
}
</style>
