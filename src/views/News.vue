<!-- src/views/News.vue -->
<template>
  <div class="news-wrapper">
    <div class="news-container">
      <div v-if="showNewArticlesNotification" class="new-articles-notification">
        New articles available!
        <button @click="refreshPage">Refresh to view</button>
      </div>
      <h1 class="news-title">GTA News</h1>
      <div class="current-sort">
        Currently sorted:
        {{
          sortField === "pubDate"
            ? sortOrder === "desc"
              ? "Newest to Oldest"
              : "Oldest to Newest"
            : sortOrder === "desc"
            ? "Title Z-A"
            : "Title A-Z"
        }}
      </div>
      <div class="news-controls">
        <button class="sortArticles-btn" @click="showSortModal = true">
          Sort Articles
        </button>
        <button class="refresh-btn" @click="refreshNews" :disabled="loading">
          <span v-if="loading">🔄</span>
          <span v-else>🔄</span>
          Refresh News
        </button>
        <button
          class="refresh-btn"
          @click="testCache"
          style="background-color: rgba(255, 165, 0, 1)"
        >
          Test Cache
        </button>
        <button
          class="refresh-btn"
          @click="clearCache"
          style="background-color: rgba(255, 0, 0, 1)"
        >
          Clear Cache
        </button>
        <button
          class="refresh-btn"
          @click="manualRssFetch"
          :disabled="rssFetching"
          style="background-color: rgba(0, 128, 255, 1)"
        >
          <span v-if="rssFetching">🔄</span>
          <span v-else>📡</span>
          {{ rssFetching ? "Fetching RSS..." : "Fetch RSS Now" }}
        </button>
      </div>
      <div class="search-container">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search articles..."
          @keyup.enter="searchArticles"
        />
        <button @click="searchArticles">Search</button>
        <button v-if="searchQuery" @click="clearSearch">Clear</button>
      </div>

      <div v-if="loading">Loading...</div>
      <div v-else-if="errorMessage">{{ errorMessage }}</div>
      <div v-else>
        <div
          v-for="(block, blockIndex) in articleBlocks"
          :key="`block-${blockIndex}`"
          class="article-block"
        >
          <ul class="article-list">
            <li
              v-for="article in block"
              :key="article.link"
              class="article-item"
            >
              <!-- RSS Article Display -->
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
              <!-- YouTube/Vimeo embeds -->
              <iframe
                v-else-if="
                  article.enclosure &&
                  article.enclosure.url &&
                  article.enclosure.type.startsWith('video/') &&
                  (article.enclosure.url.includes('youtube') ||
                    article.enclosure.url.includes('vimeo'))
                "
                :src="article.enclosure.url"
                class="article-video"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
              <!-- Direct video files (MP4, etc.) -->
              <video
                v-else-if="
                  article.enclosure &&
                  article.enclosure.url &&
                  article.enclosure.type.startsWith('video/') &&
                  !article.enclosure.url.includes('youtube') &&
                  !article.enclosure.url.includes('vimeo')
                "
                controls
                class="article-image"
              >
                <source
                  :src="article.enclosure.url"
                  :type="article.enclosure.type"
                />
                Your browser does not support the video tag.
              </video>
              <h2 @click="openArticleDetails(article._id)">
                {{ article.title }}
              </h2>
              <p class="article-description">
                {{ truncateDescription(article.description) }}
              </p>
              <div class="article-footer">
                <div v-if="article.description" class="read-more-container">
                  <a :href="article.link" target="_blank" class="read-more-link"
                    >Read more →</a
                  >
                </div>
                <div class="article-header">
                  <span class="posted-time"
                    >Posted: {{ getRelativeTime(article.pubDate) }}</span
                  >
                  <span class="article-date">{{
                    formatDate(article.pubDate)
                  }}</span>
                </div>
                <div class="author-container">
                  <span class="article-author">
                    Author: {{ article.author || "Unknown" }}
                  </span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div v-if="loadingMore" class="loading-more">
        <div class="loading-spinner">🔄</div>
        Loading more articles...
      </div>
      <div ref="sentinel" class="sentinel"></div>

      <div v-if="showSortModal" class="sortModal">
        <div class="sortModal-content">
          <h2 class="sort-articles-title">Sort Articles</h2>
          <div class="sort-buttons">
            <button @click="setSort('pubDate', 'desc')">
              Newest to Oldest
            </button>
            <button @click="setSort('pubDate', 'asc')">Oldest to Newest</button>
            <button @click="setSort('title', 'asc')">Title A-Z</button>
            <button @click="setSort('title', 'desc')">Title Z-A</button>
          </div>
          <button class="closeSortModal-btn" @click="showSortModal = false">
            <font-awesome-icon :icon="['fas', 'x']" style="color: #98ff98" />
          </button>
        </div>
      </div>
      <div v-if="showDetailsModal" class="article-details-modal">
        <div class="modal-overlay" @click="showDetailsModal = false"></div>
        <div class="modal-content-wrapper">
          <div class="modal-content-card">
            <button class="modal-close-btn" @click="showDetailsModal = false">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
            
            <!-- Article Header -->
            <div class="modal-header">
              <h1 class="modal-title">{{ selectedArticle.title }}</h1>
              <div class="modal-meta">
                <span class="meta-date">
                  <font-awesome-icon :icon="['fas', 'calendar']" />
                  {{ formatDate(selectedArticle.pubDate) }}
                </span>
                <span class="meta-time">
                  <font-awesome-icon :icon="['fas', 'clock']" />
                  {{ getRelativeTime(selectedArticle.pubDate) }}
                </span>
                <span class="meta-author">
                  <font-awesome-icon :icon="['fas', 'user']" />
                  {{ selectedArticle.author || "Unknown" }}
                </span>
              </div>
            </div>

            <!-- Article Media -->
            <div v-if="selectedArticle.enclosure" class="modal-media">
              <img
                v-if="
                  selectedArticle.enclosure.url &&
                  selectedArticle.enclosure.type.startsWith('image/')
                "
                :src="selectedArticle.enclosure.url"
                alt="Article Image"
                class="modal-image"
              />
              <iframe
                v-else-if="
                  selectedArticle.enclosure.url &&
                  selectedArticle.enclosure.type.startsWith('video/') &&
                  (selectedArticle.enclosure.url.includes('youtube') ||
                    selectedArticle.enclosure.url.includes('vimeo'))
                "
                :src="selectedArticle.enclosure.url"
                class="modal-video"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>

            <!-- Article Content -->
            <div class="modal-body">
              <div v-if="selectedArticle.description" class="content-section">
                <h3 class="section-label">Summary</h3>
                <div class="modal-description">
                  {{ selectedArticle.description }}
                </div>
              </div>
              
              <div 
                v-if="selectedArticle.content && stripHtml(selectedArticle.content) !== selectedArticle.description" 
                class="content-section"
              >
                <h3 class="section-label">Article Content</h3>
                <div 
                  class="modal-content"
                  :class="{ 'expanded': isDescriptionExpanded }"
                >
                  {{ stripHtml(selectedArticle.content) }}
                </div>
              </div>
            </div>

            <!-- Article Footer -->
            <div class="modal-footer">
              <button 
                v-if="selectedArticle.content && stripHtml(selectedArticle.content).length > 600"
                @click="isDescriptionExpanded = !isDescriptionExpanded"
                class="expand-btn"
              >
                {{ isDescriptionExpanded ? 'Show Less' : 'Show More' }}
                <font-awesome-icon 
                  :icon="['fas', isDescriptionExpanded ? 'chevron-up' : 'chevron-down']" 
                />
              </button>
              <a 
                :href="selectedArticle.link" 
                target="_blank" 
                class="modal-read-full-btn"
              >
                <font-awesome-icon :icon="['fas', 'external-link-alt']" />
                Read Full Article
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";
import axios from "@/utils/axios";

export default {
  name: "News",
  setup() {
    const articles = ref([]);
    const loading = ref(true);
    const loadingMore = ref(false);
    const errorMessage = ref(null);
    const sortField = ref("pubDate");
    const sortOrder = ref("desc");
    const showSortModal = ref(false);
    const showDetailsModal = ref(false);
    const selectedArticle = ref({});
    const isDescriptionExpanded = ref(false);
    const page = ref(1);
    const totalPages = ref(0);
    const sentinel = ref(null);
    const loadedCount = ref(0);
    const rssFetching = ref(false);
    const standardLimit = 12;
    const searchQuery = ref("");
    const isSearch = ref(false);
    const showNewArticlesNotification = ref(false);
    const articleCount = ref(0);
    const baseURL = "http://localhost:3003";
    let pollInterval = null;

    // Block-based computed property to group articles into blocks of 3 for grid layout
    const articleBlocks = computed(() => {
      const blocks = [];

      // Group articles into blocks of 3 for RVV the grid layout
      for (let i = 0; i < articles.value.length; i += 3) {
        const block = articles.value.slice(i, i + 3);
        if (block.length > 0) {
          blocks.push(block);
        }
      }

      return blocks;
    });

    // Track the last processed article count to handle infinite scroll properly
    const lastProcessedCount = ref(0);
    const isProcessingInfiniteScroll = ref(false);

    const fetchArticles = async (pageNum, isSortChange = false) => {
      try {
        if (pageNum === 1) loading.value = true;
        else loadingMore.value = true;

        const fetchLimit =
          (isSortChange || isSearch.value) && loadedCount.value > standardLimit
            ? loadedCount.value
            : standardLimit;
        const url = `${baseURL}/api/news?page=${pageNum}&limit=${fetchLimit}&sortField=${
          sortField.value
        }&sortOrder=${sortOrder.value}&sourceType=rss${
          searchQuery.value
            ? `&query=${encodeURIComponent(searchQuery.value.trim())}`
            : ""
        }`;
        console.log("Fetching URL:", url);
        const response = await axios.get(url);
        console.log("API Response:", response.data);

        const fetchedArticles = response.data.articles || [];
        console.log(
          "Fetched Articles with Enclosure:",
          fetchedArticles.map((a) => ({
            title: a.title,
            enclosure: a.enclosure,
          }))
        );

        if (pageNum === 1) {
          articles.value = fetchedArticles;
          loadedCount.value = fetchedArticles.length;
          lastProcessedCount.value = fetchedArticles.length;
        } else {
          // For infinite scroll, simply add new articles to the array
          // The computed property will handle the interleaving automatically
          isProcessingInfiniteScroll.value = true;

          articles.value = [...articles.value, ...fetchedArticles];
          loadedCount.value += fetchedArticles.length;

          // Small delay to allow Vue's reactivity to update
          await new Promise((resolve) => setTimeout(resolve, 50));

          isProcessingInfiniteScroll.value = false;
        }
        totalPages.value =
          Math.ceil(response.data.totalArticles / standardLimit) || 0;

        if (fetchedArticles.length === 0) {
          errorMessage.value = searchQuery.value
            ? "No matching articles found."
            : "No articles found.";
        } else {
          errorMessage.value = null;
        }
      } catch (error) {
        console.error("Error fetching articles:", error);
        if (error.response) {
          if (error.response.status === 503) {
            errorMessage.value = "Offline - showing cached data";
            articles.value = articles.value.length ? articles.value : [];
          } else if (
            error.response.status === 500 ||
            error.response.status === 503
          ) {
            errorMessage.value = searchQuery.value
              ? "Failed to search articles. Please try again."
              : "Failed to fetch articles. Please try again.";
          } else {
            errorMessage.value = searchQuery.value
              ? "No matching articles found."
              : "No articles found.";
          }
        } else {
          errorMessage.value = "Network error. Please check your connection.";
          articles.value = articles.value.length ? articles.value : [];
        }
      } finally {
        if (pageNum === 1) loading.value = false;
        else loadingMore.value = false;
      }
      console.log("Articles:", articles.value);
    };

    const checkForNewArticles = async () => {
      try {
        const response = await axios.get(`${baseURL}/api/news/count`);
        const newCount = response.data.count || 0;
        if (newCount > articleCount.value && articleCount.value > 0) {
          showNewArticlesNotification.value = true;
        }
        articleCount.value = newCount;
      } catch (error) {
        console.error("Error checking article count:", error);
      }
    };

    const refreshPage = () => {
      showNewArticlesNotification.value = false;
      window.location.reload();
    };

    const setSort = (field, order) => {
      sortField.value = field;
      sortOrder.value = order;
      showSortModal.value = false;
      page.value = Math.ceil(loadedCount.value / standardLimit) || 1;
      isSearch.value = false;
      fetchArticles(1, true);
    };

    const searchArticles = () => {
      console.log("Search triggered with:", searchQuery.value);
      page.value = 1;
      isSearch.value = true;
      fetchArticles(1, false);
    };

    const clearSearch = () => {
      searchQuery.value = "";
      page.value = 1;
      isSearch.value = false;
      fetchArticles(1, false);
    };

    const refreshNews = () => {
      console.log("Manual refresh triggered");
      page.value = 1;
      isSearch.value = false;
      searchQuery.value = "";
      fetchArticles(1, true);
    };

    const testCache = async () => {
      if ("caches" in window) {
        const cache = await caches.open("news-cache-v3");
        const keys = await cache.keys();
        console.log(
          "Cache keys:",
          keys.map((req) => req.url)
        );
        console.log("Cache size:", keys.length);
      } else {
        console.log("Cache API not supported");
      }
    };

    const clearCache = async () => {
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes("news-cache")) {
            await caches.delete(cacheName);
            console.log(`Cleared cache: ${cacheName}`);
          }
        }
        console.log("All news caches cleared");
      }
    };

    const manualRssFetch = async () => {
      rssFetching.value = true;
      try {
        const response = await axios.post(
          "http://localhost:3004/manual-fetch",
          {},
          {
            withCredentials: false, // RSS endpoint doesn't require authentication
          }
        );
        console.log("Manual RSS fetch result:", response.data);
        alert(
          `RSS Fetch Complete!\nArticles found: ${response.data.articlesFound}\nExecution time: ${response.data.executionTime}`
        );
        // Refresh the news after successful fetch
        await fetchArticles(1, true);
      } catch (error) {
        console.error("Error triggering manual RSS fetch:", error);
        alert("Failed to fetch RSS feeds. Check console for details.");
      } finally {
        rssFetching.value = false;
      }
    };

    const handleAvatarError = (event) => {
      event.target.src =
        "https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png";
    };

    const openArticleDetails = async (id) => {
      try {
        const response = await axios.get(`${baseURL}/api/news/${id}`);
        selectedArticle.value = response.data;
        isDescriptionExpanded.value = false; // Reset expansion state
        showDetailsModal.value = true;
      } catch (error) {
        console.error("Error fetching article details:", error);
        selectedArticle.value = {
          title: "Error",
          description: "Could not load article",
        };
        isDescriptionExpanded.value = false;
        showDetailsModal.value = true;
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

    const truncateDescription = (description, maxLength = 180) => {
      if (!description) return "";
      if (description.length <= maxLength) return description;

      // Truncate at the last space before maxLength to avoid cutting words
      const truncated = description.substring(0, maxLength);
      const lastSpace = truncated.lastIndexOf(" ");

      return lastSpace > 0
        ? truncated.substring(0, lastSpace) + "..."
        : truncated + "...";
    };

    const stripHtml = (html) => {
      if (!html) return "";
      // Create a temporary div to parse HTML
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          page.value < totalPages.value &&
          !loadingMore.value &&
          !isProcessingInfiniteScroll.value
        ) {
          // Add a small delay to allow articles to load and position properly
          setTimeout(async () => {
            page.value++;
            await fetchArticles(page.value);
          }, 1000); // 1 second delay
        }
      },
      { threshold: 0.1 }
    );

    onMounted(() => {
      fetchArticles(1);
      if (sentinel.value) observer.observe(sentinel.value);
      checkForNewArticles();
      pollInterval = setInterval(checkForNewArticles, 5 * 60 * 1000);
    });

    onUnmounted(() => {
      if (sentinel.value) observer.unobserve(sentinel.value);
      if (pollInterval) clearInterval(pollInterval);
    });

    return {
      articles,
      articleBlocks,
      loading,
      loadingMore,
      errorMessage,
      sortField,
      sortOrder,
      showSortModal,
      showDetailsModal,
      selectedArticle,
      isDescriptionExpanded,
      setSort,
      searchQuery,
      searchArticles,
      clearSearch,
      refreshNews,
      testCache,
      clearCache,
      manualRssFetch,
      rssFetching,
      handleAvatarError,
      openArticleDetails,
      formatDate,
      getRelativeTime,
      truncateDescription,
      stripHtml,
      sentinel,
      isSearch,
      showNewArticlesNotification,
      refreshPage,
      isProcessingInfiniteScroll,
    };
  },
};
</script>

<style scoped>
:root {
  --deep-black: rgb(0, 0, 0);
  --deep-black2: rgb(60, 60, 60);
  --vibrant-purple: rgb(128, 0, 128);
  --soft-lavender: rgb(230, 230, 250);
  --lavender: rgb(175, 175, 215);
  --bright-white: rgb(255, 255, 255);
  --neon-pink: rgb(255, 20, 147);
  --neon-pink2: rgb(231, 22, 225);
  --electric-blue: rgb(0, 191, 255);
  --sunset-orange: rgb(255, 99, 71);
  --mint-green: rgb(152, 255, 152);
  --steel-gray: rgb(119, 136, 153);
  --coral-red: rgb(255, 64, 64);
  --skyPurp: #454383;
  --skyBlue: #547b98;
  --skyPink: #c56aa8;
  --skyOrange: #fbbd59;
}

.new-articles-notification {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(152, 255, 152, 0.9);
  color: var(--deep-black2);
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  font-weight: 600;
  z-index: 20;
}

.new-articles-notification button {
  margin-left: 10px;
  padding: 5px 10px;
  background-color: var(--coral-red);
  color: var(--bright-white);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.new-articles-notification button:hover {
  background-color: var(--sunset-orange);
}

.search-container {
  margin: 20px 0;
  display: flex;
  gap: 10px;
}

.search-container input {
  padding: 5px;
  border: 1px solid var(--steel-gray);
  border-radius: 8px;
  flex-grow: 1;
}

.search-container button {
  padding: 5px 10px;
  background-color: var(--mint-green);
  border: none;
  border-radius: 8px;
  color: var(--deep-black2);
  cursor: pointer;
}

.current-sort {
  position: absolute;
  top: 4.5%;
  left: 1.9%;
  font-size: small;
  font-weight: 500;
  color: var(--deep-black);
}

.news-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.sortArticles-btn,
.refresh-btn,
.oldToNew-btn {
  font-family: "Montserrat";
  font-weight: 600;
  border-radius: 8px;
  border: none;
  outline: none;
  box-shadow: 0 0 5px 0.1px inset var(--bright-white);
  background-color: rgba(152, 255, 152, 1);
  backdrop-filter: blur(2px);
  color: var(--deep-black2);
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn {
  background-color: rgba(100, 200, 255, 1);
  display: flex;
  align-items: center;
  gap: 5px;
}

.refresh-btn:hover:not(:disabled) {
  background-color: rgba(80, 180, 235, 1);
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.sortModal {
  position: fixed;
  z-index: 20;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background: rgba(0, 0, 0, 0.75) 95%;
}

.sortModal-content {
  background-color: none;
  border: none;
  outline: none;
  margin: 15% auto;
  padding: 10px;
  width: 80%;
}

.sort-articles-title {
  text-align: center;
  margin: 30px;
}

.sort-buttons {
  display: flex;
  width: 100%;
  height: auto;
  justify-content: center;
  align-items: center;
}

.sort-buttons button {
  margin: 20px;
  font-family: "Montserrat";
  font-weight: 600;
  border-radius: 8px;
  border: none;
  outline: none;
  box-shadow: 0 0 5px 0.1px inset var(--bright-white);
  background-color: rgba(152, 255, 152, 1);
  backdrop-filter: blur(2px);
  color: var(--deep-black2);
  padding: 5px;
  cursor: pointer;
}

.closeSortModal-btn {
  position: absolute;
  top: 25%;
  right: 20%;
  height: 4%;
  width: 4%;
  border-radius: 8px;
  border: none;
  outline: none;
  box-shadow: 0 0 5px 0.1px inset var(--bright-white);
  background-color: rgba(230, 230, 250, 0.3);
  backdrop-filter: blur(2px);
}

.closeSortModal-btn:hover {
  transition: box-shadow 0.2s ease-in-out, background-color 0.2s ease-in-out;
  box-shadow: 0 0 25px -15px inset var(--bright-white);
  background-color: rgba(239, 239, 250, 0.5);
}

.loading-more {
  text-align: center;
  padding: 20px;
  color: var(--steel-gray);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.loading-spinner {
  font-size: 1.5em;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.sentinel {
  height: 1.25rem;
}

.news-title {
  position: relative;
  text-align: center;
  margin: 50px;
}

.news-wrapper {
  height: auto;
  width: auto;
  position: relative;
  display: flex;
  justify-content: center;
  height: 100vh;
  width: 100vw;
}

.news-container {
  overflow: auto;
  position: relative;
  top: 15%;
  height: 82%;
  width: 95%;
  min-width: min(500px, 95vw);
  padding: 0.625rem;
  border-radius: 0.5rem;
  background-color: rgba(230, 230, 250, 0.77);
}

.news-container ul {
  list-style-type: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 0;
  justify-content: center;
}

.news-container::-webkit-scrollbar {
  display: none;
}

.news-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.article-item {
  width: 100%;
  margin: 0;
  padding: 10px;
  border: 1px solid rgba(65, 65, 79, 0.3);
  background-color: rgba(119, 136, 153, 0.4);
  border-radius: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.article-item h2 {
  width: 100%;
  font-size: 1.5em;
  text-align: center;
  letter-spacing: 0.5px;
  color: var(--bright-white);
  cursor: pointer;
  margin: 10px 0;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.article-item h2:hover {
  color: var(--mint-green);
  text-shadow: 0 0 10px rgba(152, 255, 152, 0.8),
               0 0 20px rgba(152, 255, 152, 0.6);
}

.article-item p,
.article-item .article-description {
  width: 100%;
  font-weight: 500;
  font-size: 1em;
  letter-spacing: 0.0625rem;
  color: var(--bright-white);
  margin: 0.625rem 0;
  flex-grow: 0;
  min-height: 5rem;
  max-height: 7.5rem;
  overflow: hidden;
  line-height: 1.5;
}

.read-more-container {
  width: 100%;
  padding: 0 0 8px 0;
  margin: 0 0 10px 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.read-more-link {
  color: var(--mint-green);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95em;
  padding: 6px 12px;
  border-radius: 6px;
  background-color: rgba(60, 60, 60, 0.5);
  transition: all 0.2s ease;
  display: inline-block;
}

.read-more-link:hover {
  background-color: rgba(60, 60, 60, 0.8);
  color: var(--bright-white);
  transform: translateX(3px);
}

.article-item img,
.article-item video,
.article-item iframe.article-video {
  width: 100%;
  max-height: 16.25rem;
  border-radius: 0.5rem;
  object-fit: cover;
  margin: 0.625rem 0;
}

.article-item iframe.article-video {
  min-height: 12.5rem;
  aspect-ratio: 16 / 9;
}

.article-footer {
  margin-top: auto;
  width: 100%;
  flex-shrink: 0;
}

.article-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.posted-time {
  font-size: 0.9em;
  font-weight: 500;
  text-align: left;
  color: var(--soft-lavender);
  text-shadow: 0 0 4px var(--neon-pink), 0 0 8px rgba(255, 20, 147, 0.5);
}

.article-date {
  font-size: 0.9em;
  font-weight: 500;
  color: var(--soft-lavender);
  text-align: right;
  text-shadow: 0 0 4px var(--neon-pink), 0 0 8px rgba(255, 20, 147, 0.5);
}

.author-container {
  font-size: 0.8em;
  display: flex;
  padding: 0;
  margin: 0;
  min-height: 2.2rem;
  width: 100%;
}

.article-author {
  width: 100%;
  font-weight: 400;
  text-align: left;
  margin-top: 10px;
  color: var(--soft-lavender);
  text-shadow: 0 0 4px var(--neon-pink), 0 0 8px rgba(255, 20, 147, 0.5);
}

.article-block {
  margin-bottom: 40px;
  width: 100%;
}

.article-block .article-list {
  list-style-type: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 0;
  justify-content: center;
}

/* Responsive adjustments for grid columns */
@media (max-width: 1200px) {
  .news-container ul,
  .article-block .article-list {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
}

@media (max-width: 768px) {
  .news-container ul,
  .article-block .article-list {
    grid-template-columns: 1fr;
  }
}

/* Reddit Post Styling */
.reddit-article-item {
  flex: 0 0 calc(33.333% - 20px);
  max-width: calc(33.333% - 20px);
  min-width: 300px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.reddit-article-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 0 30px rgba(255, 69, 0, 0.5);
}

.reddit-link {
  text-decoration: none;
  display: block;
  height: 100%;
  width: 100%;
}

.reddit-background {
  height: 100%;
  width: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #ff4500;
  box-shadow: 0 0 20px rgba(255, 69, 0, 0.3);
}

.reddit-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 6px 10px;
}

.reddit-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
  width: 100%;
}

.reddit-user-section {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.reddit-user-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reddit-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(255, 69, 0, 0.6);
  object-fit: cover;
  background: rgba(255, 69, 0, 0.2);
}

.reddit-author {
  color: var(--bright-white);
  font-size: 0.65em;
  font-weight: 600;
  text-shadow: 0 0 4px rgba(255, 69, 0, 0.8);
}

.reddit-subreddit-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.reddit-subreddit-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reddit-subreddit-icon {
  height: 1.2em;
  width: auto;
  object-fit: contain;
  vertical-align: middle;
  background-color: var(--bright-white);
  border-radius: var(--radius-md);
}

.reddit-stats {
  display: flex;
  align-items: center;
  gap: 4px;
}

.reddit-subreddit {
  color: var(--bright-white);
  font-size: 0.7em;
  font-weight: 600;
  text-shadow: 0 0 4px rgba(255, 69, 0, 0.8);
}

.reddit-upvotes {
  color: #00ff00;
  font-size: 0.65em;
  font-weight: 600;
  margin-left: auto;
  background: rgba(0, 0, 0, 0.6);
  padding: 1px 4px;
  border-radius: 3px;
  text-shadow: 0 0 8px #00ff00, 0 0 16px #00ff00;
}

.reddit-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-height: 50%;
  overflow: hidden;
}

.reddit-title {
  color: var(--bright-white);
  font-size: 0.75em;
  font-weight: 700;
  margin-bottom: 2px;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-wrap: break-word;
  hyphens: auto;
  max-height: calc(1.2em * 2);
}

.reddit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reddit-time {
  color: var(--soft-lavender);
  font-size: 0.65em;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
}

/* Responsive adjustments for Reddit posts */
@media (max-width: 1200px) {
  .reddit-article-item {
    flex: 0 0 calc(50% - 20px);
    max-width: calc(50% - 20px);
  }
}

@media (max-width: 768px) {
  .reddit-article-item {
    flex: 0 0 100%;
    max-width: 100%;
    min-width: 280px;
  }

  .reddit-header {
    gap: 8px;
  }

  .reddit-subreddit-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .reddit-stats {
    align-self: flex-end;
  }
}

/* Article Details Modal Styles */
.article-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(5px);
}

.modal-content-wrapper {
  position: relative;
  z-index: 1001;
  width: 90%;
  max-width: min(900px, 95vw);
  max-height: 90vh;
  animation: modalSlideIn 0.3s ease-out;
  overflow-y: auto;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content-card {
  background: linear-gradient(
    135deg,
    rgba(230, 230, 250, 0.95) 0%,
    rgba(200, 200, 230, 0.95) 100%
  );
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  position: relative;
}

.modal-close-btn {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(50, 50, 50, 0.95), rgba(30, 30, 30, 0.95));
  border: 2px solid var(--mint-green);
  color: var(--mint-green);
  font-size: 1.4em;
  font-weight: bold;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.5),
              0 0 15px rgba(152, 255, 152, 0.4),
              inset 0 0 10px rgba(152, 255, 152, 0.1);
}

.modal-close-btn svg {
  filter: drop-shadow(0 0 8px rgba(152, 255, 152, 0.9));
}

.modal-close-btn:hover {
  background: linear-gradient(135deg, rgba(30, 30, 30, 1), rgba(10, 10, 10, 1));
  transform: rotate(90deg) scale(1.1);
  color: var(--bright-white);
  border-color: var(--mint-green);
  box-shadow: 0 0.5rem 1.25rem rgba(0, 0, 0, 0.6),
              0 0 25px rgba(152, 255, 152, 0.8),
              0 0 35px rgba(152, 255, 152, 0.6),
              inset 0 0 20px rgba(152, 255, 152, 0.2);
}

.modal-close-btn:hover svg {
  filter: drop-shadow(0 0 15px rgba(152, 255, 152, 1))
          drop-shadow(0 0 25px rgba(152, 255, 152, 0.8));
}

.modal-header {
  padding: 1.875rem 3.75rem 1.25rem 1.875rem;
  background: linear-gradient(
    135deg,
    rgba(128, 0, 128, 0.15) 0%,
    rgba(200, 100, 200, 0.1) 100%
  );
  border-bottom: 0.125rem solid rgba(128, 0, 128, 0.3);
}

.modal-title {
  font-size: 1.8em;
  font-weight: 700;
  color: var(--deep-black);
  margin: 0 0 15px 0;
  line-height: 1.3;
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.5);
}

.modal-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  font-size: 0.9em;
  color: var(--deep-black2);
}

.modal-meta span {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: 500;
}

.modal-meta svg {
  color: var(--vibrant-purple);
  font-size: 0.9em;
}

.modal-media {
  width: 100%;
  max-height: 25rem;
  overflow: hidden;
  background: var(--deep-black);
}

.modal-image {
  width: 100%;
  height: auto;
  max-height: 25rem;
  object-fit: cover;
  display: block;
}

.modal-video {
  width: 100%;
  height: 25rem;
  max-height: 25rem;
  display: block;
}

.modal-body {
  padding: 1.875rem;
}

.content-section {
  margin-bottom: 1.5rem;
}

.content-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 1.1em;
  font-weight: 700;
  color: var(--vibrant-purple);
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 0.125rem solid rgba(128, 0, 128, 0.2);
  text-transform: uppercase;
  letter-spacing: 0.03125rem;
}

.modal-description {
  font-size: 1.05em;
  line-height: 1.8;
  color: var(--deep-black2);
  font-weight: 400;
  margin: 0;
}

.modal-content {
  font-size: 1.05em;
  line-height: 1.8;
  color: var(--deep-black2);
  font-weight: 400;
  margin: 0;
  max-height: 25rem;
  overflow: hidden;
  position: relative;
  transition: max-height 0.4s ease;
  white-space: pre-wrap;
}

.modal-content.expanded {
  max-height: none;
}

.expand-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(128, 0, 128, 0.1);
  border: 0.125rem solid var(--vibrant-purple);
  border-radius: 0.625rem;
  color: var(--vibrant-purple);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  margin-right: 0.9375rem;
}

.expand-btn:hover {
  background: var(--vibrant-purple);
  color: var(--bright-white);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(128, 0, 128, 0.3);
}

.modal-footer {
  padding: 1.25rem 1.875rem 1.875rem 1.875rem;
  display: flex;
  justify-content: center;
  align-items: center;
  border-top: 0.0625rem solid rgba(128, 0, 128, 0.2);
}

.modal-read-full-btn {
  padding: 0.875rem 2rem;
  background: linear-gradient(
    135deg,
    var(--vibrant-purple) 0%,
    var(--neon-pink) 100%
  );
  color: var(--bright-white);
  text-decoration: none;
  border-radius: 0.625rem;
  font-weight: 700;
  font-size: 1.05em;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  transition: all 0.3s ease;
  box-shadow: 0 0.25rem 0.9375rem rgba(128, 0, 128, 0.3);
}

.modal-read-full-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(128, 0, 128, 0.5);
  background: linear-gradient(
    135deg,
    var(--neon-pink) 0%,
    var(--vibrant-purple) 100%
  );
}

/* Responsive Modal */
@media (max-width: 768px) {
  .modal-content-wrapper {
    width: 95%;
    max-height: 95vh;
  }

  .modal-title {
    font-size: 1.4em;
    padding-right: 20px;
  }

  .modal-header {
    padding: 1.25rem 3.125rem 0.9375rem 1.25rem;
  }

  .modal-body {
    padding: 1.25rem;
  }
  
  .section-label {
    font-size: 1em;
  }
  
  .modal-content {
    max-height: 18.75rem;
  }
  
  .modal-footer {
    flex-wrap: wrap;
    gap: 0.625rem;
    padding: 0.9375rem 1.25rem 1.25rem 1.25rem;
  }
  
  .expand-btn {
    margin-right: 0;
    margin-bottom: 0.625rem;
  }

  .modal-meta {
    gap: 12px;
    font-size: 0.85em;
  }

  .modal-video {
    height: 13.75rem;
    max-height: 13.75rem;
  }
  
  .modal-media {
    max-height: 15.625rem;
  }
  
  .modal-image {
    max-height: 15.625rem;
  }

  .modal-close-btn {
    top: 0.9375rem;
    right: 0.9375rem;
    width: 2.4rem;
    height: 2.4rem;
    font-size: 1.2em;
  }
}

.modal-content-wrapper::-webkit-scrollbar {
  width: 8px;
}

.modal-content-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

.modal-content-wrapper::-webkit-scrollbar-thumb {
  background: var(--vibrant-purple);
  border-radius: 10px;
}

.modal-content-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--neon-pink);
}
</style>
