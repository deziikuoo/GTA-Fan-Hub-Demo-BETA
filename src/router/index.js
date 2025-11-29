// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import News from "../views/News.vue";
import ArticleDetails from "../views/ArticleDetails.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/Home.vue"),
    meta: { keepAlive: true },
  },
  {
    path: "/Characters",
    name: "Characters",
    component: () => import("../views/Characters.vue"),
  },
  {
    path: "/Missions",
    name: "Missions",
    component: () => import("../views/Missions.vue"),
  },
  {
    path: "/Story",
    name: "Story",
    component: () => import("../views/Story.vue"),
  },
  {
    path: "/Lore",
    name: "Lore",
    component: () => import("../views/Lore.vue"),
  },
  {
    path: "/About",
    name: "About",
    component: () => import("../views/About.vue"),
  },
  {
    path: "/City",
    name: "City",
    component: () => import("../views/City.vue"),
  },
  {
    path: "/Events",
    name: "Events",
    component: () => import("../views/Events.vue"),
  },
  {
    path: "/Social",
    name: "Social",
    component: () => import("../views/Social.vue"),
  },
  {
    path: "/register",
    component: () => import("../components/Register.vue"),
  },
  {
    path: "/forgot-password",
    component: () => import("../components/ForgotPassword.vue"),
  },
  {
    path: "/news",
    name: "News",
    component: News,
  },
  {
    path: "/news/:id",
    name: "ArticleDetails",
    component: ArticleDetails,
  },
  {
    path: "/profile/:username",
    name: "Profile",
    component: () => import("../views/Profile.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/notifications",
    name: "Notifications",
    component: () => import("../views/Notifications.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Always scroll to top on navigation
    return { top: 0, behavior: "smooth" };
  },
});

// Add navigation guard to ensure proper route handling
router.beforeEach((to, from, next) => {
  // Log navigation for debugging
  console.log("Navigating from:", from.path, "to:", to.path);
  // Always allow navigation in demo mode
  next();
});

// Ensure router is working
router.afterEach((to, from) => {
  console.log("Navigation completed to:", to.path);
});

export default router;
