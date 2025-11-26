<template>
  <div class="profile-navigation">
    <nav class="nav-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="handleTabClick(tab.id)"
        :class="['nav-tab', { active: activeTab === tab.id }]"
        :aria-label="tab.label"
      >
        <font-awesome-icon :icon="tab.icon" />
        <span class="tab-label">{{ tab.label }}</span>
        <span v-if="tab.count !== undefined" class="tab-count">{{
          tab.count
        }}</span>
      </button>
    </nav>
  </div>
</template>

<script>
export default {
  name: "ProfileNavigation",
  props: {
    activeTab: {
      type: String,
      default: "posts",
    },
    userStats: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["tabChange"],
  setup(props, { emit }) {
    const tabs = [
      {
        id: "posts",
        label: "Posts",
        icon: "newspaper",
        count: props.userStats.totalPosts,
      },
      {
        id: "about",
        label: "About",
        icon: "user",
      },
      {
        id: "achievements",
        label: "Achievements",
        icon: "trophy",
        count: props.userStats.achievementCount,
      },
      {
        id: "followers",
        label: "Followers",
        icon: "users",
        count: props.userStats.followerCount,
      },
      {
        id: "following",
        label: "Following",
        icon: "user-group",
        count: props.userStats.followingCount,
      },
    ];

    const handleTabClick = (tabId) => {
      emit("tabChange", tabId);
    };

    return {
      tabs,
      handleTabClick,
    };
  },
};
</script>

<style scoped>
.profile-navigation {
  background: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-lg);
  overflow: hidden;
}

.nav-tabs {
  display: flex;
  justify-content: space-evenly;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  background: var(--glass-morphism-bg);
  gap: 2px;
}

.nav-tabs::-webkit-scrollbar {
  display: none;
}

.nav-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  background: transparent;
  border: none;
  color: var(--steel-gray);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  position: relative;
  flex: 1;
  min-width: fit-content;
}

.nav-tab:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--bright-white);
}

.nav-tab.active {
  color: var(--electric-blue);
  background: rgba(255, 255, 255, 0.1);
}

.nav-tab.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--bright-white);
}

.tab-label {
  font-size: var(--text-sm);
}

.tab-count {
  background: var(--steel-gray);
  color: var(--bright-white);
  font-size: var(--text-xs);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  min-width: 20px;
  text-align: center;
}

.nav-tab.active .tab-count {
  background: var(--bright-white);
  color: var(--deep-black);
}

/* Responsive Design */
@media (max-width: 768px) {
  .nav-tab {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-xs);
  }

  .tab-label {
    display: none;
  }

  .nav-tab {
    flex-direction: column;
    gap: var(--space-xs);
  }
}

@media (max-width: 640px) {
  .nav-tab {
    padding: var(--space-xs) var(--space-sm);
  }

  .tab-count {
    font-size: 10px;
    padding: 1px 4px;
  }
}
</style>
