<script>
export default {
  name: "Lore",
};
</script>

<template>
  <div class="lore">
    <div class="coming-soon-card">
      <h2>Lore Page Coming Soon</h2>
      <p>
        We're working hard to add the latest GTA 6 lore and worldbuilding
        details.<br />
        Stay tuned for updates as new information is revealed!
      </p>
    </div>
  </div>
</template>

<style>
.lore {
  position: absolute;
  align-self: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.coming-soon-card {
  background: rgba(35, 35, 35, 0.91);
  border: 2px solid var(--neon-pink2);
  border-radius: 16px;
  padding: 2rem;
  color: #eee;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.36);
  max-width: 600px;
  width: 90%;
}

.coming-soon-card h2 {
  color: var(--neon-pink2);
  margin-bottom: 1rem;
  font-size: 2rem;
  font-weight: bold;
}

.coming-soon-card p {
  color: #eee;
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 1rem 0;
}
</style>
