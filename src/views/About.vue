<script>
import { ref, onMounted } from "vue";

export default {
  name: "About",
  setup() {
    const stats = ref([
      { number: "50K+", label: "Active Users" },
      { number: "1M+", label: "Page Views" },
      { number: "24/7", label: "Live Updates" },
      { number: "100%", label: "GTA 6 Focused" },
    ]);

    const features = ref([
      {
        icon: "fas fa-newspaper",
        title: "Latest News",
        description:
          "Stay updated with the most recent GTA 6 news, trailers, and announcements from trusted sources.",
      },
      {
        icon: "fas fa-users",
        title: "Community",
        description:
          "Connect with fellow GTA fans, share theories, and discuss everything about Grand Theft Auto 6.",
      },
      {
        icon: "fas fa-clock",
        title: "Live Countdown",
        description:
          "Track the exact time remaining until GTA 6's release with our real-time countdown timer.",
      },
      {
        icon: "fas fa-map",
        title: "Vice City Guide",
        description:
          "Explore Leonida state with our comprehensive map and location guide for Vice City and beyond.",
      },
    ]);

    const team = ref([
      {
        name: "Development Team",
        role: "Core Development",
        description:
          "Passionate developers dedicated to creating the ultimate GTA 6 fan experience.",
      },
      {
        name: "Community Managers",
        role: "User Experience",
        description:
          "Ensuring our community stays engaged and informed with the latest GTA 6 updates.",
      },
      {
        name: "Content Creators",
        role: "News & Media",
        description:
          "Curating and creating high-quality content to keep fans informed and entertained.",
      },
    ]);

    onMounted(() => {
      // Any initialization logic
    });

    return {
      stats,
      features,
      team,
    };
  },
};
</script>

<template>
  <div class="about-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Welcome to GtaFanHub</h1>
        <p class="hero-subtitle">
          The ultimate destination for Grand Theft Auto 6 news, community, and
          everything Vice City.
        </p>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="stats-container">
        <div v-for="stat in stats" :key="stat.label" class="stat-card">
          <div class="stat-number">{{ stat.number }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <!-- Mission Section -->
    <section class="mission-section">
      <div class="mission-container">
        <h2 class="section-title">Our Mission</h2>
        <p class="mission-text">
          GtaFanHub was created by passionate GTA fans, for passionate GTA fans.
          We're dedicated to providing the most comprehensive, up-to-date
          information about Grand Theft Auto 6, building a vibrant community of
          players, and celebrating everything that makes the GTA series
          legendary.
        </p>
        <div class="mission-highlights">
          <div class="highlight-item">
            <font-awesome-icon icon="fas fa-star" class="highlight-icon" />
            <span>Fan-First Approach</span>
          </div>
          <div class="highlight-item">
            <font-awesome-icon icon="fas fa-rocket" class="highlight-icon" />
            <span>Real-Time Updates</span>
          </div>
          <div class="highlight-item">
            <font-awesome-icon icon="fas fa-heart" class="highlight-icon" />
            <span>Community Driven</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="features-container">
        <h2 class="section-title">What We Offer</h2>
        <div class="features-grid">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="feature-card"
          >
            <div class="feature-icon">
              <font-awesome-icon :icon="feature.icon" />
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="team-section">
      <div class="team-container">
        <h2 class="section-title">Our Team</h2>
        <div class="team-grid">
          <div v-for="member in team" :key="member.name" class="team-card">
            <h3 class="team-name">{{ member.name }}</h3>
            <p class="team-role">{{ member.role }}</p>
            <p class="team-description">{{ member.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-container">
        <h2 class="cta-title">Join the GTA 6 Community</h2>
        <p class="cta-subtitle">
          Be part of the most dedicated GTA 6 fan community. Share your
          excitement, theories, and connect with fellow players.
        </p>
        <div class="cta-buttons">
          <router-link to="/social" class="cta-button primary">
            <font-awesome-icon icon="fas fa-users" />
            Join Community
          </router-link>
          <router-link to="/news" class="cta-button secondary">
            <font-awesome-icon icon="fas fa-newspaper" />
            Read Latest News
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<style>
.about-page {
  min-height: 100vh;
  color: var(--bright-white);
  font-family: "Montserrat", sans-serif;
  overflow-x: hidden;
}

/* Hero Section */
.hero-section {
  position: relative;
  height: 60vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2.2px);
  margin-top: var(--space-xl);
  border-bottom: 1px solid var(--bright-white);
}

.hero-content {
  text-align: center;
  max-width: 800px;
  padding: var(--space-xl);
  width: 100vw;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  display: flex;
}

.hero-title {
  width: 100vw;
  font-size: var(--text-6xl);
  font-weight: 700;
  margin-bottom: var(--space-lg);
  background: linear-gradient(135deg, var(--bright-white), var(--bright-white));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: var(--text-xl);
  color: var(--soft-lavender);
  line-height: var(--leading-relaxed);
  opacity: 0.9;
}

/* Stats Section */
.stats-section {
  padding: var(--space-3xl) var(--space-lg);
  background-color: var(--glass-morphism-bg);
  backdrop-filter: blur(2.2px);
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.stat-card {
  background-color: var(--glass-morphism-bg);
  backdrop-filter: blur(2.2px);
  border: 1px solid var(--bright-white);
  border-radius: var(--radius-2xl);
  padding: var(--space-xl);
  text-align: center;
  box-shadow: var(--shadow-lg);
  transition: var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(4.2px);
}

.stat-number {
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--neon-pink);
  margin-bottom: var(--space-sm);
}

.stat-label {
  font-size: var(--text-lg);
  color: var(--bright-white);
  font-weight: 500;
}

/* Mission Section */
.mission-section {
  padding: var(--space-4xl) var(--space-lg);
  background: linear-gradient(
    135deg,
    rgba(255, 20, 147, 0.05),
    rgba(0, 191, 255, 0.05)
  );
}

.mission-container {
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
}

.section-title {
  font-size: var(--text-4xl);
  font-weight: 600;
  margin-bottom: var(--space-xl);
  color: var(--bright-white);
}

.mission-text {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: var(--soft-lavender);
  margin-bottom: var(--space-2xl);
  opacity: 0.9;
}

.mission-highlights {
  display: flex;
  justify-content: center;
  gap: var(--space-xl);
  flex-wrap: wrap;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background-color: var(--glass-morphism-bg);
  backdrop-filter: blur(2.2px);
  border: 1px solid var(--bright-white);
  border-radius: var(--radius-full);
  color: var(--bright-white);
  font-weight: 500;
}

.highlight-icon {
  color: var(--neon-pink);
  font-size: var(--text-lg);
}

/* Features Section */
.features-section {
  padding: var(--space-4xl) var(--space-lg);
  background-color: var(--glass-morphism-bg);
  backdrop-filter: blur(2.2px);
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-xl);
  margin-top: var(--space-2xl);
}

.feature-card {
  background-color: var(--glass-morphism-bg);
  backdrop-filter: blur(2.2px);
  border: 1px solid var(--bright-white);
  border-radius: var(--radius-2xl);
  padding: var(--space-xl);
  text-align: center;
  box-shadow: var(--shadow-lg);
  transition: var(--transition-normal);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(4.2px);
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--neon-pink), var(--electric-blue));
  border-radius: var(--radius-full);
  font-size: var(--text-2xl);
  color: var(--bright-white);
}

.feature-title {
  font-size: var(--text-xl);
  font-weight: 600;
  margin-bottom: var(--space-md);
  color: var(--bright-white);
}

.feature-description {
  color: var(--soft-lavender);
  line-height: var(--leading-relaxed);
  opacity: 0.9;
}

/* Team Section */
.team-section {
  padding: var(--space-4xl) var(--space-lg);
  background: linear-gradient(
    135deg,
    rgba(0, 191, 255, 0.05),
    rgba(255, 99, 71, 0.05)
  );
}

.team-container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-xl);
  margin-top: var(--space-2xl);
}

.team-card {
  background-color: var(--glass-morphism-bg);
  backdrop-filter: blur(2.2px);
  border: 1px solid var(--bright-white);
  border-radius: var(--radius-2xl);
  padding: var(--space-xl);
  text-align: center;
  box-shadow: var(--shadow-lg);
  transition: var(--transition-normal);
}

.team-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(4.2px);
}

.team-name {
  font-size: var(--text-xl);
  font-weight: 600;
  margin-bottom: var(--space-sm);
  color: var(--bright-white);
}

.team-role {
  font-size: var(--text-lg);
  color: var(--neon-pink);
  margin-bottom: var(--space-md);
  font-weight: 500;
}

.team-description {
  color: var(--soft-lavender);
  line-height: var(--leading-relaxed);
  opacity: 0.9;
}

/* CTA Section */
.cta-section {
  padding: var(--space-4xl) var(--space-lg);
  background: linear-gradient(
    135deg,
    rgba(255, 20, 147, 0.1),
    rgba(0, 191, 255, 0.1)
  );
  backdrop-filter: blur(2.2px);
}

.cta-container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.cta-title {
  font-size: var(--text-4xl);
  font-weight: 600;
  margin-bottom: var(--space-lg);
  color: var(--bright-white);
}

.cta-subtitle {
  font-size: var(--text-lg);
  color: var(--soft-lavender);
  margin-bottom: var(--space-2xl);
  line-height: var(--leading-relaxed);
  opacity: 0.9;
}

.cta-buttons {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  flex-wrap: wrap;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-full);
  font-weight: 600;
  text-decoration: none;
  transition: var(--transition-normal);
  font-size: var(--text-lg);
}

.cta-button.primary {
  background: linear-gradient(135deg, var(--neon-pink), var(--electric-blue));
  color: var(--bright-white);
  border: 2px solid transparent;
}

.cta-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

.cta-button.secondary {
  background-color: var(--glass-morphism-bg);
  backdrop-filter: blur(2.2px);
  border: 2px solid var(--bright-white);
  color: var(--bright-white);
}

.cta-button.secondary:hover {
  background-color: var(--bright-white);
  color: var(--deep-black);
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: var(--text-4xl);
  }

  .hero-subtitle {
    font-size: var(--text-lg);
  }

  .stats-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .team-grid {
    grid-template-columns: 1fr;
  }

  .mission-highlights {
    flex-direction: column;
    align-items: center;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }

  .cta-button {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stats-container {
    grid-template-columns: 1fr;
  }

  .hero-content {
    padding: var(--space-lg);
  }

  .hero-title {
    font-size: var(--text-3xl);
  }
}
</style>
