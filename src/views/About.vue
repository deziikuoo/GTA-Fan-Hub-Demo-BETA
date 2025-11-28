<script>
import { ref, onMounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";

export default {
  name: "About",
  setup() {
    const route = useRoute();
    const router = useRouter();

    // Newsletter subscription state
    const newsletterFormEmail = ref("");
    const newsletterLoading = ref(false);
    const newsletterMessage = ref("");
    const newsletterMessageType = ref(""); // 'success' or 'error'
    const successType = ref(""); // 'pending', 'confirmed', or 'unsubscribed'

    // Toast notification state (for redirect confirmations)
    const showToast = ref(false);
    const toastMessage = ref("");
    const toastType = ref(""); // 'success', 'error', or 'info'

    // Handle newsletter subscription
    const handleSubscribe = async () => {
      if (!newsletterFormEmail.value || newsletterLoading.value) return;

      // Basic client-side validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newsletterFormEmail.value)) {
        newsletterMessage.value = "Please enter a valid email address.";
        newsletterMessageType.value = "error";
        return;
      }

      newsletterLoading.value = true;
      newsletterMessage.value = "";
      newsletterMessageType.value = "";

      try {
        // Use Railway backend URL
        const apiUrl =
          import.meta.env.VITE_API_URL ||
          "https://gta-fan-hub-demo-production.up.railway.app";
        const response = await fetch(`${apiUrl}/api/newsletter/subscribe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: newsletterFormEmail.value,
            source: "about-page",
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          newsletterMessage.value = data.message;
          newsletterMessageType.value = "success";
          successType.value = "pending"; // Show spam instructions
          newsletterFormEmail.value = ""; // Clear form
        } else {
          newsletterMessage.value =
            data.message || "Something went wrong. Please try again.";
          newsletterMessageType.value = "error";
        }
      } catch (error) {
        console.error("Subscription error:", error);
        newsletterMessage.value =
          "Network error. Please check your connection and try again.";
        newsletterMessageType.value = "error";
      } finally {
        newsletterLoading.value = false;
      }
    };

    // Show toast notification
    const displayToast = (message, type = "success", duration = 6000) => {
      toastMessage.value = message;
      toastType.value = type;
      showToast.value = true;

      // Auto-dismiss after duration
      setTimeout(() => {
        showToast.value = false;
      }, duration);
    };

    // Dismiss toast manually
    const dismissToast = () => {
      showToast.value = false;
    };

    // Check for confirmation/unsubscribe query parameters
    const checkQueryParams = () => {
      // Try route.query first, fallback to window.location for external redirects
      let subscribed = route.query.subscribed;
      let unsubscribed = route.query.unsubscribed;
      let error = route.query.error;

      // Fallback: parse from window.location if route.query is empty
      if (!subscribed && !unsubscribed && !error) {
        const urlParams = new URLSearchParams(window.location.search);
        subscribed = urlParams.get("subscribed");
        unsubscribed = urlParams.get("unsubscribed");
        error = urlParams.get("error");
      }

      if (subscribed === "true") {
        // Show toast notification at top of page
        displayToast(
          "🎉 Your subscription is confirmed! Welcome to the GtaFanHub community.",
          "success"
        );
        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname);
      } else if (unsubscribed === "true") {
        displayToast(
          "You have been unsubscribed. We're sorry to see you go!",
          "info"
        );
        window.history.replaceState({}, "", window.location.pathname);
      } else if (error) {
        const errorMessages = {
          invalid_token:
            "Invalid or expired confirmation link. Please subscribe again.",
          token_expired:
            "This confirmation link has expired. Please subscribe again.",
          already_confirmed: "Your email is already confirmed!",
          confirmation_failed: "Confirmation failed. Please try again.",
          invalid_email: "Invalid email address.",
          not_subscribed: "Email not found in our subscription list.",
          unsubscribe_failed: "Failed to unsubscribe. Please try again.",
        };
        displayToast(
          errorMessages[error] || "An error occurred. Please try again.",
          "error",
          8000
        );
        window.history.replaceState({}, "", window.location.pathname);
      }
    };
    const stats = ref([
      { number: "50K+", label: "Active Users" },
      { number: "1M+", label: "Page Views" },
      { number: "24/7", label: "Live Updates" },
      { number: "Beta", label: "Preview Mode" },
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

    // Developer/GitHub info
    const githubUrl = ref("https://github.com/deziikuoo");
    const githubRepoUrl = ref("https://github.com/deziikuoo/GTA-Fan-Hub-Demo");
    const githubUsername = ref("deziikuoo");

    // Social links (coming soon)
    const socialLinks = ref([
      { name: "Discord", icon: ["fab", "discord"], url: "#", comingSoon: true },
      { name: "Twitter", icon: ["fab", "twitter"], url: "#", comingSoon: true },
      {
        name: "Instagram",
        icon: ["fab", "instagram"],
        url: "#",
        comingSoon: true,
      },
      { name: "Reddit", icon: ["fab", "reddit"], url: "#", comingSoon: true },
    ]);

    // Roadmap items
    const roadmapItems = ref([
      {
        feature: "Reputation & Leveling System",
        status: "in-progress",
        progress: 45,
        description:
          "Level up from Street Thug to Legend with reputation points",
      },
      {
        feature: "Virtual Events & Tournaments",
        status: "planned",
        progress: 0,
        description: "Weekly gaming tournaments and community challenges",
      },
      {
        feature: "Real-time Chat",
        status: "planned",
        progress: 0,
        description: "Live messaging between users",
      },
      {
        feature: "Enhanced Profiles",
        status: "in-progress",
        progress: 75,
        description: "Customizable user profiles",
      },
      {
        feature: "Mobile Optimization",
        status: "in-progress",
        progress: 60,
        description: "Responsive mobile experience",
      },
      {
        feature: "GTA 6 Release Integration",
        status: "planned",
        progress: 0,
        description: "Post-launch content updates",
      },
    ]);

    // Version info
    const versionInfo = ref({
      version: "Beta v0.9.2",
      lastUpdated: "November 2025",
      status: "Frontend Preview",
    });

    // Support links
    const supportLinks = ref([
      {
        name: "Buy Me a Coffee",
        icon: ["fas", "mug-hot"],
        url: "https://buymeacoffee.com/deziikuoo",
        comingSoon: false,
        showQRCode: true,
      },
      {
        name: "GitHub Sponsors",
        icon: ["fab", "github"],
        url: "https://github.com/sponsors/deziikuoo",
        comingSoon: false,
      },
    ]);

    // Newsletter email (for display purposes)
    const newsletterEmail = ref("ifdawanprintqualified14@gmail.com");

    onMounted(() => {
      // Check for query params from confirmation/unsubscribe redirects
      // Use nextTick to ensure DOM is ready after external redirect
      nextTick(() => {
        checkQueryParams();
      });
    });

    // Also watch for route changes (backup for SPA navigation)
    watch(
      () => route.query,
      () => {
        checkQueryParams();
      },
      { immediate: false }
    );

    return {
      stats,
      features,
      githubUrl,
      githubRepoUrl,
      githubUsername,
      socialLinks,
      roadmapItems,
      versionInfo,
      supportLinks,
      newsletterEmail,
      // Newsletter form
      newsletterFormEmail,
      newsletterLoading,
      newsletterMessage,
      newsletterMessageType,
      successType,
      handleSubscribe,
      // Toast notifications
      showToast,
      toastMessage,
      toastType,
      dismissToast,
    };
  },
};
</script>

<template>
  <div class="about-page">
    <!-- Toast Notification - Teleported to body to appear above everything -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="showToast" class="toast-notification" :class="toastType">
          <div class="toast-content">
            <font-awesome-icon
              :icon="
                toastType === 'success'
                  ? 'fas fa-check-circle'
                  : toastType === 'error'
                  ? 'fas fa-exclamation-circle'
                  : 'fas fa-info-circle'
              "
              class="toast-icon"
            />
            <span class="toast-message">{{ toastMessage }}</span>
          </div>
          <button class="toast-dismiss" @click="dismissToast">
            <font-awesome-icon icon="fas fa-times" />
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="beta-badge">🚧 Beta Preview</div>
        <h1 class="hero-title">Welcome to GtaFanHub</h1>
        <p class="hero-subtitle">
          The ultimate destination for Rockstar Games news, community, and
          everything GTA!
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
          GtaFanHub was created for passionate GTA fans.<br></br>We're dedicated to
          providing the most comprehensive, up-to-date information about the
          Grand Theft Auto series, building a vibrant community of players, and
          celebrating everything that makes GTA legendary.
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

    <!-- Developer/GitHub Section -->
    <section class="developer-section">
      <div class="developer-container">
        <h2 class="section-title">Developer & Source Code</h2>
        <div class="developer-content">
          <a :href="githubRepoUrl" target="_blank" class="github-link">
            <font-awesome-icon :icon="['fab', 'github']" class="github-icon" />
            <span>View on GitHub</span>
            <font-awesome-icon
              icon="fas fa-external-link-alt"
              class="external-icon"
            />
          </a>
          <p class="developer-text">
            This is an open-source frontend demo built by
            <a :href="githubUrl" target="_blank" class="dev-link"
              >@{{ githubUsername }}</a
            >. Star the repository to show your support!
          </p>
        </div>
      </div>
    </section>

    <!-- Social/Community Links Section -->
    <section class="social-section">
      <div class="social-container">
        <h2 class="section-title">Join Our Community</h2>
        <p class="section-subtitle">
          Connect with fellow GTA fans across platforms
        </p>
        <div class="social-grid">
          <div
            v-for="social in socialLinks"
            :key="social.name"
            class="social-card"
            :class="{ 'coming-soon': social.comingSoon }"
          >
            <font-awesome-icon :icon="social.icon" class="social-icon" />
            <h3>{{ social.name }}</h3>
            <span v-if="social.comingSoon" class="coming-soon-badge"
              >Coming Soon</span
            >
            <a v-else :href="social.url" target="_blank" class="social-link">
              Join {{ social.name }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Beta Feedback Section -->
    <section class="feedback-section">
      <div class="feedback-container">
        <h2 class="section-title">Beta Feedback</h2>
        <p class="feedback-text">
          Help us improve! Report bugs, suggest features, or share your
          thoughts.<br></br>Your feedback shapes the future of GtaFanHub.
        </p>
        <div class="feedback-links">
          <a
            :href="`${githubRepoUrl}/issues`"
            target="_blank"
            class="feedback-btn bug"
          >
            <font-awesome-icon icon="fas fa-bug" />
            Report a Bug
          </a>
          <a
            :href="`${githubRepoUrl}/issues/new`"
            target="_blank"
            class="feedback-btn feature"
          >
            <font-awesome-icon icon="fas fa-lightbulb" />
            Suggest a Feature
          </a>
          <a
            :href="`mailto:${newsletterEmail}?subject=GtaFanHub Beta Feedback`"
            class="feedback-btn email"
          >
            <font-awesome-icon icon="fas fa-envelope" />
            Send Feedback
          </a>
        </div>
      </div>
    </section>

    <!-- Roadmap Section -->
    <section class="roadmap-section">
      <div class="roadmap-container">
        <h2 class="section-title">Roadmap & Coming Soon</h2>
        <p class="section-subtitle">
          What we're working on for the full release
        </p>
        <div class="roadmap-list">
          <div
            v-for="(item, index) in roadmapItems"
            :key="index"
            class="roadmap-item"
          >
            <div class="roadmap-header">
              <div class="roadmap-info">
                <h3>{{ item.feature }}</h3>
                <p class="roadmap-description">{{ item.description }}</p>
              </div>
              <span class="roadmap-status" :class="item.status">
                {{ item.status === "in-progress" ? "In Progress" : "Planned" }}
              </span>
            </div>
            <div v-if="item.progress > 0" class="progress-container">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: item.progress + '%' }"
                ></div>
                <span class="progress-text">{{ item.progress }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Version & Newsletter Container -->
    <div class="version-newsletter-container">
      <!-- Version Section -->
      <section class="version-section">
      <div class="version-container">
        <h2 class="section-title">Version Information</h2>
        <div class="version-info">
          <div class="version-badge">{{ versionInfo.version }}</div>
          <div class="version-details">
            <p class="version-text">
              <strong>Status:</strong> {{ versionInfo.status }}
            </p>
            <p class="version-text">
              <strong>Last Updated:</strong> {{ versionInfo.lastUpdated }}
            </p>
          </div>
          <a
            :href="`${githubRepoUrl}/releases`"
            target="_blank"
            class="changelog-link"
          >
            <font-awesome-icon icon="fas fa-code-branch" />
            View Changelog on GitHub
          </a>
        </div>
      </div>
    </section>

    <!-- Newsletter Section -->
    <section class="newsletter-section">
      <div class="newsletter-container">
        <h2 class="section-title">Stay Updated</h2>
        <p class="newsletter-text">
          Get notified when we launch new features or go live with the full
          release!
        </p>

        <!-- Subscription Form -->
        <form @submit.prevent="handleSubscribe" class="newsletter-form">
          <div class="newsletter-input-group">
            <input
              v-model="newsletterFormEmail"
              type="email"
              placeholder="Enter your email address"
              class="newsletter-input"
              :disabled="newsletterLoading"
              required
            />
            <button
              type="submit"
              class="newsletter-submit-btn"
              :disabled="newsletterLoading || !newsletterFormEmail"
            >
              <font-awesome-icon
                v-if="newsletterLoading"
                icon="fas fa-circle-notch"
                spin
              />
              <font-awesome-icon v-else icon="fas fa-envelope" />
              <span>{{
                newsletterLoading ? "Subscribing..." : "Subscribe"
              }}</span>
            </button>
          </div>

          <!-- Success/Error Message -->
          <div
            v-if="newsletterMessage"
            class="newsletter-message"
            :class="newsletterMessageType"
          >
            <font-awesome-icon
              :icon="
                newsletterMessageType === 'success'
                  ? 'fas fa-check-circle'
                  : 'fas fa-exclamation-circle'
              "
            />
            <div class="newsletter-message-content">
              <!-- Error messages -->
              <span v-if="newsletterMessageType !== 'success'">{{
                newsletterMessage
              }}</span>

              <!-- Pending confirmation - show spam instructions -->
              <div
                v-else-if="successType === 'pending'"
                class="success-message-text"
              >
                <p class="message-main">
                  Please check your email to confirm your subscription.
                </p>
                <div class="message-highlight-box">
                  <font-awesome-icon
                    icon="fas fa-exclamation-triangle"
                    class="highlight-icon"
                  />
                  <div class="highlight-content">
                    <p class="highlight-title">Important:</p>
                    <p class="highlight-text">
                      If you don't see the email,
                      <strong>check your spam/junk folder</strong>.
                    </p>
                    <p class="highlight-text">
                      If the email is in spam, tap
                      <strong class="highlight-accent"
                        >"Report not spam"</strong
                      >
                      to move it to your inbox.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Confirmed subscription - show celebration -->
              <div
                v-else-if="successType === 'confirmed'"
                class="confirmed-message-text"
              >
                <p class="message-main confirmed">
                  🎉 Your subscription is confirmed!
                </p>
                <p class="message-sub">
                  Welcome to the GtaFanHub community. You'll now receive updates
                  on GTA 6 news, announcements, and exclusive content.
                </p>
              </div>

              <!-- Unsubscribed - show farewell -->
              <div
                v-else-if="successType === 'unsubscribed'"
                class="unsubscribed-message-text"
              >
                <p class="message-main">You have been unsubscribed.</p>
                <p class="message-sub">
                  We're sorry to see you go! You can always resubscribe if you
                  change your mind.
                </p>
              </div>

              <!-- Fallback for other success messages -->
              <span v-else>{{ newsletterMessage }}</span>
            </div>
          </div>
        </form>

        <div class="newsletter-actions">
          <a
            :href="githubRepoUrl"
            target="_blank"
            class="newsletter-btn secondary"
          >
            <font-awesome-icon :icon="['fab', 'github']" />
            Watch on GitHub
          </a>
        </div>
        <p class="newsletter-note">
          Watch the
          <a :href="githubRepoUrl" target="_blank">GitHub repository</a> to get
          notified of all updates
        </p>
      </div>
    </section>
    </div>

    <!-- Support the Project Section -->
    <section class="support-section">
      <div class="support-container">
        <h2 class="section-title">Support the Project</h2>
        <p class="support-text">
          Love what we're building? Consider supporting the project to help us
          grow!
        </p>
        <div class="support-links">
          <div
            v-for="support in supportLinks"
            :key="support.name"
            class="support-card"
            :class="{ 'coming-soon': support.comingSoon }"
          >
            <font-awesome-icon :icon="support.icon" class="support-icon" />
            <h3>{{ support.name }}</h3>
            <span v-if="support.comingSoon" class="coming-soon-badge"
              >Coming Soon</span
            >
            <div v-else class="support-card-content">
              <a :href="support.url" target="_blank" class="support-link">
                Support via {{ support.name }}
              </a>
              <!-- Buy Me a Coffee QR Code -->
              <div v-if="support.showQRCode" class="qr-code-container">
                <img
                  src="/BuyMeCoffeeQR/bmc_qr.png"
                  alt="Buy Me a Coffee QR Code"
                  class="support-qr-code"
                />
                <p class="qr-code-url">buymeacoffee.com/deziikuoo</p>
              </div>
              <!-- GitHub Sponsors Card -->
              <div v-if="support.name === 'GitHub Sponsors'" class="github-sponsors-container">
                <iframe
                  src="https://github.com/sponsors/deziikuoo/card"
                  title="Sponsor deziikuoo"
                  height="225"
                  width="600"
                  style="border: 0;"
                  class="github-sponsors-iframe"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
        <p class="support-note">
          Your support helps me build better projects and collaborate with awesome developers!<br></br>
          You can also <a :href="githubRepoUrl" target="_blank">⭐ star the repo</a> on GitHub.
        </p>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-container">
        <h2 class="cta-title">Ready to Explore?</h2>
        <p class="cta-subtitle">
          Dive into the GTA 6 community. Share your excitement, theories, and
          connect with fellow players.
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

        <!-- Credits Section -->
    <section class="credits-section">
      <div class="credits-container">
        <h2 class="section-title">Credits & Acknowledgments</h2>
        <div class="credits-content">
          <p class="credits-text">
            <!-- Credits will be added as the project grows -->
            Special thanks to the GTA community for the inspiration and support.
          </p>
          <div class="credits-disclaimer">
            <p>
              <strong>Disclaimer:</strong> GtaFanHub is a fan-made project and
              is not affiliated with, endorsed by, or connected to Rockstar
              Games or Take-Two Interactive.
            </p>
          </div>
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
  margin-top: 4%;
  width: 80% !important;
  margin-left: 15%;
  backdrop-filter: blur(50px);
}

/* Toast Notification */
.toast-notification {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 100000 !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  max-width: 500px;
  width: auto;
  min-width: 300px;
}

.toast-notification.success {
  background: linear-gradient(
    135deg,
    rgba(152, 255, 152, 0.15) 0%,
    rgba(0, 191, 255, 0.1) 100%
  );
  border: 1px solid var(--mint-green);
  color: var(--mint-green);
}

.toast-notification.error {
  background: linear-gradient(
    135deg,
    rgba(226, 113, 207, 0.95) 0%,
    rgba(255, 107, 157, 0.95) 100%
  );
  border: 2px solid var(--neon-pink2);
  color: #ffffff;
}

.toast-notification.info {
  background: linear-gradient(
    135deg,
    rgba(0, 191, 255, 0.95) 0%,
    rgba(84, 123, 152, 0.95) 100%
  );
  border: 2px solid var(--electric-blue);
  color: #ffffff;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
}

.toast-icon {
  font-size: 1.2em;
  flex-shrink: 0;
  color: var(--mint-green);
}

.toast-notification.success .toast-icon {
  color: var(--mint-green);
}

.toast-notification.error .toast-icon {
  color: var(--neon-pink2);
}

.toast-notification.info .toast-icon {
  color: var(--electric-blue);
}

.toast-message {
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1.4;
}

.toast-dismiss {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: var(--space-xs);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
  opacity: 0.7;
  font-size: 0.9em;
}

.toast-dismiss:hover {
  opacity: 1;
}

.toast-notification.success .toast-dismiss {
  color: var(--mint-green);
}

/* Toast animation */
.toast-enter-active {
  animation: toast-slide-in 0.4s ease-out;
}

.toast-leave-active {
  animation: toast-slide-out 0.3s ease-in;
}

@keyframes toast-slide-in {
  0% {
    opacity: 0;
    transform: translateX(100%);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-slide-out {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* Mobile toast adjustments */
@media (max-width: 768px) {
  .toast-notification {
    top: 64px;
    right: 10px;
    left: 10px;
    max-width: none;
    width: auto;
    min-width: auto;
  }

  .toast-enter-active {
    animation: toast-slide-in-mobile 0.4s ease-out;
  }

  .toast-leave-active {
    animation: toast-slide-out-mobile 0.3s ease-in;
  }

  @keyframes toast-slide-in-mobile {
    0% {
      opacity: 0;
      transform: translateX(100%);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes toast-slide-out-mobile {
    0% {
      opacity: 1;
      transform: translateX(0);
    }
    100% {
      opacity: 0;
      transform: translateX(100%);
    }
  }
}

/* Beta Badge */
.beta-badge {
  display: inline-block;
  padding: var(--space-sm) var(--space-lg);
  background: linear-gradient(135deg, var(--neon-pink2), var(--electric-blue));
  color: var(--bright-white);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: var(--space-lg);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* Hero Section */
.hero-section {
  position: relative;
  height: 50vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: var(--space-4xl);
  border-radius: var(--radius-2xl);
}

.hero-content {
  text-align: center;
  max-width: 950px;
  padding: var(--space-xl);
  width: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  display: flex;
}

.hero-title {
  font-size: var(--text-6xl);
  font-weight: 700;
  margin-bottom: var(--space-lg);
  background: linear-gradient(
    135deg,
    var(--bright-white),
    var(--soft-lavender)
  );
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

/* Section Subtitle */
.section-subtitle {
  font-size: var(--text-lg);
  color: var(--soft-lavender);
  opacity: 0.8;
  margin-top: calc(-1 * var(--space-md));
  margin-bottom: var(--space-2xl);
}

/* Stats Section */
.stats-section {
  padding: var(--space-3xl) var(--space-lg);
  width: 100%;
  border-radius: var(--radius-2xl);
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.stat-card {
  background-color: var(--glass-morphism-bg);
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
}

.stat-number {
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--neon-pink2);
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
  border-radius: var(--radius-2xl);
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
  border: 1px solid var(--bright-white);
  border-radius: var(--radius-full);
  color: var(--bright-white);
  font-weight: 500;
}

.highlight-icon {
  color: var(--neon-pink2);
  font-size: var(--text-lg);
}

/* Features Section */
.features-section {
  padding: var(--space-4xl) var(--space-lg);
  border-radius: var(--radius-2xl);
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
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--neon-pink2), var(--electric-blue));
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

/* Developer/GitHub Section */
.developer-section {
  padding: var(--space-2xl) var(--space-lg);
  background-color: var(--glass-morphism-bg);
  border-radius: var(--radius-2xl);
}

.developer-container {
  max-width: 950px;
  margin: 0 auto;
  text-align: center;
}

.developer-content {
  margin-top: var(--space-xl);
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-2xl);
  background: linear-gradient(135deg, #24292e, #1a1e22);
  color: var(--bright-white);
  border-radius: var(--radius-full);
  text-decoration: none;
  font-weight: 600;
  font-size: var(--text-lg);
  transition: var(--transition-normal);
  border: 2px solid var(--bright-white);
  margin-bottom: var(--space-lg);
}

.github-link:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #2d333b, #22272e);
}

.github-icon {
  font-size: var(--text-2xl);
}

.external-icon {
  font-size: var(--text-sm);
  opacity: 0.7;
}

.developer-text {
  color: var(--soft-lavender);
  opacity: 0.9;
  margin-bottom: var(--space-xl);
  font-size: var(--text-md);
}

.dev-link {
  color: var(--electric-blue);
  text-decoration: none;
  font-weight: 600;
}

.dev-link:hover {
  text-decoration: underline;
}

/* Social/Community Section */
.social-section {
  padding: var(--space-4xl) var(--space-lg);
  border-radius: var(--radius-2xl);
}

.social-container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.social-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
  gap: var(--space-xl);
  margin-top: var(--space-2xl);
  width: 100%;
}

@media (max-width: 768px) {
  .social-grid {
    grid-template-columns: 1fr !important;
  }
}

.social-card {
  background-color: var(--glass-morphism-bg);
  border: 1px solid var(--bright-white);
  border-radius: var(--radius-2xl);
  padding: var(--space-xl);
  text-align: center;
  box-shadow: var(--shadow-lg);
  transition: var(--transition-normal);
}

.social-card.coming-soon {
  opacity: 0.6;
}

.social-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-xl);
}

.social-icon {
  font-size: var(--text-4xl);
  color: var(--neon-pink2);
  margin-bottom: var(--space-md);
}

.social-card h3 {
  font-size: var(--text-xl);
  font-weight: 600;
  margin-bottom: var(--space-md);
  color: var(--bright-white);
}

.coming-soon-badge {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  background: linear-gradient(135deg, var(--mint-green), var(--electric-blue));
  color: var(--deep-black);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Feedback Section */
.feedback-section {
  padding: var(--space-4xl) var(--space-lg);
  background-color: var(--glass-morphism-bg);
  border-radius: var(--radius-2xl);
}

.feedback-container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.feedback-text {
  color: var(--soft-lavender);
  margin-bottom: var(--space-2xl);
  opacity: 0.9;
  font-size: var(--text-lg);
}

.feedback-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-lg);
}

.feedback-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-full);
  color: var(--bright-white);
  text-decoration: none;
  font-weight: 600;
  transition: var(--transition-normal);
  border: 2px solid transparent;
}

.feedback-btn.bug {
  background: linear-gradient(135deg, #dc3545, #c82333);
}

.feedback-btn.feature {
  background: linear-gradient(135deg, #ffc107, #e0a800);
  color: var(--deep-black);
}

.feedback-btn.email {
  background: linear-gradient(135deg, var(--neon-pink2), var(--electric-blue));
}

.feedback-btn:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-xl);
}

/* Roadmap Section */
.roadmap-section {
  padding: var(--space-4xl) var(--space-lg);
  border-radius: var(--radius-2xl);
}

.roadmap-container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.roadmap-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-lg);
  margin-top: var(--space-xl);
  text-align: left;
}

.roadmap-item {
  background-color: var(--glass-morphism-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  transition: var(--transition-normal);
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 200px;
  box-sizing: border-box;
}

@media (max-width: 1024px) {
  .roadmap-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .roadmap-list {
    grid-template-columns: 1fr;
  }
}

.roadmap-item:hover {
  border-color: var(--neon-pink2);
}

.roadmap-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
  flex: 1;
}

.progress-container {
  margin-top: var(--space-md);
  width: 100%;
}

.roadmap-info h3 {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--bright-white);
  margin: 0 0 var(--space-xs) 0;
}

.roadmap-description {
  font-size: var(--text-sm);
  color: var(--soft-lavender);
  opacity: 0.8;
  margin: 0;
}

.roadmap-status {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.roadmap-status.planned {
  background-color: rgba(152, 255, 152, 0.15);
  color: var(--mint-green);
  border: 1px solid var(--mint-green);
}

.roadmap-status.in-progress {
  background-color: rgba(0, 191, 255, 0.15);
  color: var(--electric-blue);
  border: 1px solid var(--electric-blue);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--neon-pink2), var(--electric-blue));
  transition: width 0.5s ease;
  border-radius: var(--radius-full);
}

.progress-text {
  position: absolute;
  right: 0;
  top: -20px;
  font-size: var(--text-xs);
  color: var(--electric-blue);
  font-weight: 600;
}

/* Version & Newsletter Container */
.version-newsletter-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3xl);
  margin-bottom: var(--space-4xl);
}

/* Version Section */
.version-section {
  padding: var(--space-4xl) var(--space-lg);
  background-color: var(--glass-morphism-bg);
  border-radius: var(--radius-2xl);
}

.version-container {
  max-width: 100%;
  margin: 0 auto;
  text-align: center;
}

.version-info {
  margin-top: var(--space-xl);
}

.version-badge {
  display: inline-block;
  padding: var(--space-md) var(--space-2xl);
  background: linear-gradient(135deg, var(--neon-pink2), var(--electric-blue));
  color: var(--bright-white);
  border-radius: var(--radius-full);
  font-size: var(--text-2xl);
  font-weight: 700;
  margin-bottom: var(--space-lg);
}

.version-details {
  margin-bottom: var(--space-lg);
}

.version-text {
  color: var(--soft-lavender);
  margin: var(--space-sm) 0;
  font-size: var(--text-lg);
}

.version-text strong {
  color: var(--bright-white);
}

.changelog-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--electric-blue);
  text-decoration: none;
  font-weight: 600;
  transition: var(--transition-normal);
}

.changelog-link:hover {
  text-decoration: underline;
}

/* Newsletter Section */
.newsletter-section {
  padding: var(--space-4xl) var(--space-lg);
  background-color: var(--glass-morphism-bg);
  border-radius: var(--radius-2xl);
}

.newsletter-container {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.newsletter-text {
  color: var(--soft-lavender);
  margin-bottom: var(--space-2xl);
  opacity: 0.9;
  font-size: var(--text-md);
}

.newsletter-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.newsletter-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: linear-gradient(135deg, var(--neon-pink2), var(--electric-blue));
  color: var(--bright-white);
  border-radius: var(--radius-full);
  text-decoration: none;
  font-weight: 600;
  transition: var(--transition-normal);
}

.newsletter-btn.secondary {
  background: transparent;
  border: 2px solid var(--bright-white);
}

.newsletter-btn:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-xl);
}

.newsletter-note {
  color: var(--soft-lavender);
  font-size: var(--text-sm);
  opacity: 0.7;
}

.newsletter-note a {
  color: var(--electric-blue);
  text-decoration: none;
}

.newsletter-note a:hover {
  text-decoration: underline;
}

/* Newsletter Form */
.newsletter-form {
  margin-bottom: var(--space-xl);
}

.newsletter-input-group {
  display: flex;
  gap: var(--space-sm);
  max-width: 500px;
  margin: 0 auto var(--space-lg) auto;
}

.newsletter-input {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  background-color: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  color: var(--bright-white);
  font-size: var(--text-base);
  outline: none;
  transition: var(--transition-normal);
}

.newsletter-input::placeholder {
  color: var(--soft-lavender);
  opacity: 0.7;
}

.newsletter-input:focus {
  border-color: var(--neon-pink2);
  background-color: rgba(255, 255, 255, 0.15);
}

.newsletter-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.newsletter-submit-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-xl);
  background: linear-gradient(135deg, var(--neon-pink2), var(--electric-blue));
  color: var(--bright-white);
  border: none;
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: var(--text-base);
  cursor: pointer;
  transition: var(--transition-normal);
  white-space: nowrap;
}

.newsletter-submit-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: var(--shadow-xl);
}

.newsletter-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.newsletter-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-lg);
  font-size: var(--text-sm);
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.newsletter-message.success {
  background: linear-gradient(
    135deg,
    rgba(152, 255, 152, 0.15) 0%,
    rgba(0, 191, 255, 0.1) 100%
  );
  color: var(--mint-green);
  border: 1px solid var(--mint-green);
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.newsletter-message-content {
  width: 100%;
}

.success-message-text {
  width: 100%;
}

.message-main {
  margin: 0 0 var(--space-md) 0;
  color: var(--mint-green);
  font-weight: 500;
}

.message-highlight-box {
  background: linear-gradient(
    135deg,
    rgba(255, 107, 157, 0.25) 0%,
    rgba(0, 191, 255, 0.2) 100%
  );
  border: 2px solid var(--neon-pink2);
  border-left: 4px solid var(--neon-blue);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-top: var(--space-sm);
  display: flex;
  gap: var(--space-sm);
  align-items: flex-start;
  box-shadow: 0 4px 20px rgba(255, 107, 157, 0.3),
    0 0 10px rgba(0, 191, 255, 0.2);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 4px 20px rgba(255, 107, 157, 0.3),
      0 0 10px rgba(0, 191, 255, 0.2);
  }
  50% {
    box-shadow: 0 4px 25px rgba(255, 107, 157, 0.4),
      0 0 15px rgba(0, 191, 255, 0.3);
  }
}

.highlight-icon {
  color: var(--neon-pink2);
  font-size: 1.2em;
  margin-top: 2px;
  flex-shrink: 0;
}

.highlight-content {
  flex: 1;
}

.highlight-title {
  margin: 0 0 var(--space-xs) 0;
  background: linear-gradient(
    135deg,
    var(--neon-pink2) 0%,
    var(--neon-blue) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  font-size: 1em;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.highlight-text {
  margin: var(--space-xs) 0;
  color: var(--text-primary);
  font-size: 0.9em;
  line-height: 1.5;
}

.highlight-text strong {
  color: #ffd700;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.highlight-accent {
  color: #ffd700;
  font-weight: 700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
  padding: 2px 4px;
}

/* Confirmed subscription message styles */
.confirmed-message-text,
.unsubscribed-message-text {
  text-align: center;
  padding: var(--space-sm) 0;
}

.message-main.confirmed {
  font-size: 1.2em;
  margin-bottom: var(--space-sm);
  background: linear-gradient(
    135deg,
    var(--mint-green) 0%,
    var(--electric-blue) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.message-sub {
  color: var(--soft-lavender);
  font-size: 0.95em;
  line-height: 1.5;
  margin: 0;
}

.newsletter-message.error {
  background-color: rgba(255, 107, 157, 0.15);
  color: var(--neon-pink2);
  border: 1px solid var(--neon-pink2);
}

/* Support Section */
.support-section {
  padding: var(--space-4xl) var(--space-lg);
  background-color: var(--glass-morphism-bg);
  border-radius: var(--radius-2xl);
}

.support-container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.support-text {
  color: var(--soft-lavender);
  margin-bottom: var(--space-2xl);
  opacity: 0.9;
  font-size: var(--text-lg);
}

.support-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-xl);
  margin-bottom: var(--space-xl);
}

.support-card {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--bright-white);
  border-radius: var(--radius-2xl);
  padding: var(--space-xl);
  text-align: center;
  min-width: 200px;
  transition: var(--transition-normal);
}

.support-card.coming-soon {
  opacity: 0.6;
}

.support-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-xl);
}

.support-icon {
  font-size: var(--text-4xl);
  color: var(--neon-pink2);
  margin-bottom: var(--space-md);
}

.support-card h3 {
  font-size: var(--text-xl);
  font-weight: 600;
  margin-bottom: var(--space-md);
  color: var(--bright-white);
}

.support-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.support-link {
  display: inline-block;
  padding: var(--space-sm) var(--space-lg);
  background: linear-gradient(135deg, var(--neon-pink2), var(--electric-blue));
  color: var(--bright-white);
  text-decoration: none;
  border-radius: var(--radius-full);
  font-weight: 600;
  transition: var(--transition-normal);
}

.support-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(226, 113, 207, 0.4);
}

.qr-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
}

.support-qr-code {
  width: 150px;
  height: 150px;
  border-radius: var(--radius-lg);
  border: 2px solid var(--mint-green);
  padding: var(--space-xs);
  background: var(--bright-white);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.qr-code-url {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--mint-green);
  font-weight: 600;
  text-align: center;
}

.github-sponsors-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: var(--space-md);
}

.github-sponsors-iframe {
  max-width: 100%;
  width: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.support-note {
  color: var(--soft-lavender);
  font-size: var(--text-sm);
}

.support-note a {
  color: var(--mint-green);
  text-decoration: none;
  font-weight: 600;
}

.support-note a:hover {
  text-decoration: underline;
}

/* Credits Section */
.credits-section {
  padding: var(--space-4xl) var(--space-lg);
  border-radius: var(--radius-2xl);
}

.credits-container {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.credits-content {
  margin-top: var(--space-xl);
}

.credits-text {
  color: var(--soft-lavender);
  opacity: 0.9;
  font-size: var(--text-lg);
  margin-bottom: var(--space-xl);
}

.credits-disclaimer {
  padding: var(--space-lg);
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-xl);
  border-left: 4px solid var(--neon-pink2);
}

.credits-disclaimer p {
  color: var(--soft-lavender);
  font-size: var(--text-sm);
  margin: 0;
  text-align: left;
}

.credits-disclaimer strong {
  color: var(--bright-white);
}

/* CTA Section */
.cta-section {
  margin-top: var(--space-2xl);
  padding: var(--space-4xl) var(--space-lg);
  background: var(--glass-morphism-bg);
  border-radius: var(--radius-2xl);
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
  font-size: var(--text-md);
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
  background: linear-gradient(135deg, var(--neon-pink2), var(--electric-blue));
  color: var(--bright-white);
  border: 2px solid transparent;
}

.cta-button.primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

.cta-button.secondary {
  background-color: var(--glass-morphism-bg);
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
  .about-page {
    width: 95% !important;
    margin-left: 2.5%;
  }

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

  .social-grid {
    grid-template-columns: 1fr;
  }

  .mission-highlights {
    flex-direction: column;
    align-items: center;
  }

  .feedback-links {
    flex-direction: column;
    align-items: center;
  }

  .feedback-btn {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }

  .roadmap-header {
    flex-direction: column;
  }

  .roadmap-status {
    align-self: flex-start;
  }

  .newsletter-actions {
    flex-direction: column;
    align-items: center;
  }

  .newsletter-btn {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }

  .newsletter-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .newsletter-submit-btn {
    justify-content: center;
  }

  .newsletter-message {
    flex-direction: column;
    text-align: center;
  }

  .support-links {
    flex-direction: column;
    align-items: center;
  }

  .version-newsletter-container {
    grid-template-columns: 1fr;
    gap: var(--space-2xl);
  }

  .support-card {
    width: 100%;
    max-width: 300px;
  }

  .github-sponsors-iframe {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: 200px;
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

  .social-grid {
    grid-template-columns: 1fr;
  }

  .hero-content {
    padding: var(--space-lg);
  }

  .hero-title {
    font-size: var(--text-3xl);
  }

  .section-title {
    font-size: var(--text-2xl);
  }
}
</style>
