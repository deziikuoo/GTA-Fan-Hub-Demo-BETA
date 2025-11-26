<!-- 22741767-3527-477a-a4ba-934a0565f5e2 136aa66e-a4ce-4d54-8f32-0adf9c6beba4 -->
# Modern Navigation System Refactor

## Overview

Remove keep-alive from all routes except Home, eliminate page transitions, and implement proper modern routing patterns to fix navigation issues (especially Profile page blank screens).

## Changes

### 1. App.vue - Router View Refactor

**File**: `src/App.vue` (lines 479-501)

**Current problematic code:**

```vue
<router-view :key="$route.fullPath" v-slot="{ Component }">
  <transition name="fade" mode="out-in">
    <keep-alive :include="[...]">
      <component :is="Component" />
    </keep-alive>
  </transition>
</router-view>
```

**Replace with:**

```vue
<router-view v-slot="{ Component, route }">
  <keep-alive v-if="route.name === 'Home'" max="1">
    <component :is="Component" :key="route.name" />
  </keep-alive>
  <component v-else :is="Component" :key="route.fullPath" />
</router-view>
```

**Why this fixes blank pages:**

- No conflicting key/keep-alive strategies
- Home is cached for performance
- Dynamic routes (Profile) properly remount with new data
- No transition delays that can cause timing issues

**Also remove:** All transition CSS (lines 536-543, 756-773)

### 2. Profile.vue - Remove Watchers, Use Navigation Guards

**File**: `src/views/Profile.vue`

**Remove lines 191-236:** All watch() blocks - they're causing the blank page issue

**Replace with modern pattern (after setup(), around line 113):**

```js
import { onBeforeRouteUpdate } from 'vue-router'

// Inside setup(), after loadProfile definition
onBeforeRouteUpdate(async (to, from) => {
  if (to.params.username !== from.params.username) {
    loading.value = true
    error.value = null
    await loadProfile()
  }
})
```

**Update template (line 19):** Change condition to always show content during loading:

```vue
<div v-else class="profile-content">
```

This ensures something always renders (either loading, error, or profile)

### 3. Router Configuration - Add Route Meta

**File**: `src/router/index.js`

**Update Home route (line 7):**

```js
{ 
  path: "/", 
  name: "Home", 
  component: () => import("../views/Home.vue"),
  meta: { keepAlive: true }
}
```

**Add global navigation guard (after router creation, line 84):**

```js
router.beforeEach((to, from, next) => {
  // Reset scroll position on navigation
  window.scrollTo(0, 0)
  next()
})
```

### 4. ArticleDetails.vue - Add Route Update Handler

**File**: `src/views/ArticleDetails.vue`

Since keep-alive is removed, add handler for navigating between articles:

```js
import { onBeforeRouteUpdate } from 'vue-router'

// In setup(), after fetchArticle
onBeforeRouteUpdate(async (to, from) => {
  if (to.params.id !== from.params.id) {
    await fetchArticle()
  }
})
```

## Key Benefits

- ✅ No blank page issues - proper component lifecycle
- ✅ Predictable navigation - components mount/unmount properly
- ✅ Home page stays cached for performance
- ✅ Profile navigation works correctly between users
- ✅ Faster page loads - no transition delays
- ✅ Simpler debugging - standard Vue Router patterns

### To-dos

- [ ] Update App.vue router-view to use conditional keep-alive only for Home, remove transitions
- [ ] Replace Profile.vue watchers with onBeforeRouteUpdate hook, fix template conditions
- [ ] Add meta fields to router, implement global beforeEach for scroll reset
- [ ] Add route update handler to ArticleDetails.vue for navigation between articles
- [ ] Clean up unused transition CSS from App.vue
- [ ] Test all navigation scenarios: Home cache, Profile user switching, Article navigation