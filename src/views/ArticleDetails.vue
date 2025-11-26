<!-- src/views/ArticleDetails.vue -->
<template>
  <div class="article-details-container">
    <h1>{{ article.title }}</h1>
    <div class="article-meta">
      <span>Posted: {{ getRelativeTime(article.pubDate) }}</span>
      <span>{{ formatDate(article.pubDate) }}</span>
    </div>
    <p class="description">{{ article.description }}</p>
    <div class="author">Author: {{ article.author || "Unknown" }}</div>
    <a :href="article.link" target="_blank" class="read-more"
      >Read Full Article</a
    >
    <img
      v-if="
        article.enclosure &&
        article.enclosure.url &&
        article.enclosure.type.startsWith('image/')
      "
      :src="article.enclosure.url"
      alt="Article Image"
      class="article-image"
    />
    <video
      v-else-if="
        article.enclosure &&
        article.enclosure.url &&
        article.enclosure.type.startsWith('video/')
      "
      controls
      class="article-image"
    >
      <source :src="article.enclosure.url" :type="article.enclosure.type" />
      Your browser does not support the video tag.
    </video>
    <router-link to="/news" class="back-btn">Back to News</router-link>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute, onBeforeRouteUpdate } from "vue-router";
import axios from "@/utils/axios";

export default {
  name: "ArticleDetails",
  setup() {
    const article = ref({});
    const route = useRoute();
    const baseURL = "http://localhost:3003";

    const fetchArticle = async () => {
      try {
        const response = await axios.get(
          `${baseURL}/api/news/${route.params.id}`
        );
        article.value = response.data;
        console.log("Fetched article:", article.value);
      } catch (error) {
        console.error("Error fetching article:", error);
        article.value = {
          title: "Error",
          description: "Could not load article",
        };
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const year = date.getFullYear().toString().slice(-2);
      return `${month}/${day}/${year}`;
    };

    const getRelativeTime = (dateString) => {
      const now = new Date();
      const date = new Date(dateString);
      const diffMs = now - date;

      const seconds = Math.floor(diffMs / 1000);
      if (seconds < 60) return "Just Now";

      const minutes = Math.floor(seconds / 60);
      if (minutes < 60)
        return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

      const days = Math.floor(hours / 24);
      if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

      const weeks = Math.floor(days / 7);
      if (weeks < 4) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;

      let months = (now.getFullYear() - date.getFullYear()) * 12;
      months += now.getMonth() - date.getMonth();
      if (now.getDate() < date.getDate()) months--;
      if (months < 12 && months >= 1)
        return `${months} month${months === 1 ? "" : "s"} ago`;

      const years = Math.floor(days / 365);
      return `${years} year${years === 1 ? "" : "s"} ago`;
    };

    // Handle navigation between different articles
    onBeforeRouteUpdate(async (to, from) => {
      if (to.params.id !== from.params.id) {
        await fetchArticle();
      }
    });

    onMounted(() => {
      fetchArticle();
    });

    return {
      article,
      formatDate,
      getRelativeTime,
    };
  },
};
</script>

<style scoped>
.article-details-container {
  position: absolute;
  top: 16%;
  left: 17.5%;
  height: 80vh;
  width: 65%;
  padding: 10px;
  background-color: rgba(230, 230, 250, 0.77);
  border-radius: 8px;
  overflow-y: auto;
}
.article-details-container::-webkit-scrollbar {
  display: none;
}
.article-details-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
h1 {
  font-size: 2em;
  text-align: center;
  color: var(--coral-red);
  margin-bottom: 20px;
}
.article-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9em;
  color: var(--soft-lavender);
  text-shadow: 0 0 4px var(--neon-pink), 0 0 8px rgba(255, 20, 147, 0.5);
  margin-bottom: 20px;
}
.description {
  font-size: 1.1em;
  font-weight: 550;
  letter-spacing: 1px;
  color: var(--deep-black2);
  margin-bottom: 20px;
}
.author {
  font-size: 0.9em;
  color: var(--soft-lavender);
  text-shadow: 0 0 4px var(--neon-pink), 0 0 8px rgba(255, 20, 147, 0.5);
  margin-bottom: 20px;
}
.read-more {
  display: block;
  width: fit-content;
  margin: 0 auto 20px;
  font-weight: 500;
  text-decoration: none;
  color: rgba(32, 32, 39, 0.8);
}
.article-image {
  width: 300px;
  height: 300px;
  margin: 20px;
}
.back-btn {
  display: block;
  width: fit-content;
  margin: 0 auto;
  padding: 5px 10px;
  background-color: var(--mint-green);
  border: none;
  border-radius: 8px;
  color: var(--deep-black2);
  text-decoration: none;
  font-weight: 600;
}
</style>
