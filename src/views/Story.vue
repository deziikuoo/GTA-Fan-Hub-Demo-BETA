<script>
export default {
  name: "Story",
};
</script>

<template>
  <div class="story">
    <div class="coming-soon-card">
      <h2>Story Page Coming Soon</h2>
      <p>
        We're working hard to add the latest GTA 6 story details.<br />
        Stay tuned for updates as new information is revealed!
      </p>
      <div class="last-updated">
        <span>Last updated: October 2025</span>
      </div>
    </div>

    <div class="dev-message">
      <h3>Message to Dev:</h3>
      <ul>
        <li>Cutscene highlights (when available)</li>
        <li>Character relationship systems</li>
      </ul>
    </div>
  </div>
</template>

<style>
:root {
  --deep-black: rgb(0, 0, 0); /* Deep Black */
  --deep-black2: rgb(60, 60, 60);
  --vibrant-purple: rgb(128, 0, 128); /* Vibrant Purple */
  --soft-lavender: rgb(230, 230, 250); /* Soft Lavender */
  --lavender: rgb(175, 175, 215); /* Soft Lavender */
  --bright-white: rgb(255, 255, 255); /* Bright White */
  --neon-pink: rgb(255, 20, 147); /* Neon Pink */
  --neon-pink2: rgb(231, 22, 225); /* Neon Pink2 */
  --electric-blue: rgb(0, 191, 255); /* Electric Blue */
  --sunset-orange: rgb(255, 99, 71); /* Sunset Orange */
  --mint-green: rgb(152, 255, 152); /* Mint Green */
  --steel-gray: rgb(119, 136, 153); /* Steel Gray */
  --coral-red: rgb(255, 64, 64); /* Coral Red */
}
.story {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.coming-soon-card {
  background: rgba(35, 35, 35, 0.91);
  border: 2px solid #ff2948;
  border-radius: 16px;
  padding: 2rem;
  color: #eee;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.36);
  max-width: 600px;
  width: 90%;
}

.coming-soon-card h2 {
  color: #ff2948;
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

.last-updated {
  margin-top: 1.5rem;
  font-style: italic;
  color: #bbb;
  letter-spacing: 1px;
}

.dev-message {
  background: rgba(35, 35, 35, 0.91);
  border: 2px solid #ff2948;
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 2rem;
  color: #eee;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.36);
  max-width: 600px;
  width: 90%;
}

.dev-message h3 {
  color: #ff2948;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.dev-message ul {
  text-align: left;
  list-style: none;
  padding: 0;
  margin: 0;
}

.dev-message li {
  color: #eee;
  font-size: 1rem;
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: rgba(255, 41, 72, 0.1);
  border-radius: 8px;
  border-left: 3px solid #ff2948;
}
</style>
