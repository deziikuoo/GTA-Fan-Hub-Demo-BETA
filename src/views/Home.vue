<script>
import { ref, onMounted, onUnmounted, computed } from "vue";
import axios from "@/utils/axios";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import Countdown from "../components/Countdown.vue";
import CreatePost from "@/components/social/CreatePost.vue";
import PostCard from "@/components/social/PostCard.vue";

export default {
  name: "Home",
  components: { Countdown, CreatePost, PostCard },
  setup() {
    const router = useRouter();
    const store = useStore();
    const currentIndex = ref(0);
    const homeFlip = ref(false);
    const images = ref([]);
    const carouselLoading = ref(false);
    const sidebarPosition = ref("sticky");
    const sidebarTop = ref("0");
    const recentArticles = ref([]);
    const currentArticleIndex = ref(0);
    const isPaused = ref(false);
    const loading = ref(false);
    const errorMessage = ref(null);
    const showDetailsModal = ref(false);
    const selectedArticle = ref({});
    const isDescriptionExpanded = ref(false);
    const trendingRedditPosts = ref([]);
    const redditLoading = ref(false);
    const currentRedditIndex = ref(0);
    const isRedditPaused = ref(false);
    let redditCarouselInterval = null;
    const baseURL = "http://localhost:3003"; // TODO: Move to .env

    // Social feed state
    const trendingPosts = ref([]);
    const postsLoading = ref(false);
    const postsError = ref(null);
    const isLoggedIn = computed(() => store.getters.isLoggedIn);

    const fetchCarouselImages = async () => {
      carouselLoading.value = true;
      try {
        const response = await axios.get(
          `${baseURL}/api/carousel?_t=${Date.now()}`
        );
        images.value = response.data.images || [];

        // Fallback to static images if no images in database
        if (images.value.length === 0) {
          images.value = [
            "/src/assets/images/HeaderImages/Bros.jpg",
            "/src/assets/images/HeaderImages/draco.jpg",
            "/src/assets/images/HeaderImages/LuciaPool.jpg",
            "/src/assets/images/HeaderImages/RaulBoat.jpg",
            "/src/assets/images/HeaderImages/Stripaz.jpg",
          ];
        }
      } catch (error) {
        console.error("Error fetching carousel images:", error);
        // Fallback to static images on error
        images.value = [
          "/src/assets/images/HeaderImages/Bros.jpg",
          "/src/assets/images/HeaderImages/draco.jpg",
          "/src/assets/images/HeaderImages/LuciaPool.jpg",
          "/src/assets/images/HeaderImages/RaulBoat.jpg",
          "/src/assets/images/HeaderImages/Stripaz.jpg",
        ];
      } finally {
        carouselLoading.value = false;
      }
    };

    const fetchRecentArticles = async () => {
      loading.value = true;
      try {
        const response = await axios.get(
          `${baseURL}/api/news?page=1&limit=5&sortField=pubDate&sortOrder=desc&sourceType=rss`
        );
        recentArticles.value = response.data.articles || [];
        errorMessage.value = recentArticles.value.length
          ? null
          : "No recent articles found.";
      } catch (error) {
        console.error("Error fetching recent articles:", error);
        errorMessage.value = "Failed to load recent articles.";
      } finally {
        loading.value = false;
      }
    };

    const fetchTrendingRedditPosts = async () => {
      redditLoading.value = true;
      try {
        const response = await axios.get(
          `${baseURL}/api/reddit/trending?limit=20`
        );
        console.log("Reddit API response:", response.data);
        trendingRedditPosts.value = response.data.posts || [];
        console.log("Reddit posts loaded:", trendingRedditPosts.value.length);
      } catch (error) {
        console.error("Error fetching trending Reddit posts:", error);
        trendingRedditPosts.value = [];
      } finally {
        redditLoading.value = false;
      }
    };

    // Reddit carousel functions
    const nextRedditPost = () => {
      if (currentRedditIndex.value < trendingRedditPosts.value.length - 1) {
        currentRedditIndex.value++;
      } else {
        currentRedditIndex.value = 0;
      }
    };

    const prevRedditPost = () => {
      if (currentRedditIndex.value > 0) {
        currentRedditIndex.value--;
      } else {
        currentRedditIndex.value = trendingRedditPosts.value.length - 1;
      }
    };

    const toggleRedditPause = () => {
      isRedditPaused.value = !isRedditPaused.value;
    };

    const startRedditCarousel = () => {
      if (redditCarouselInterval) {
        clearInterval(redditCarouselInterval);
      }
      redditCarouselInterval = setInterval(() => {
        if (!isRedditPaused.value && trendingRedditPosts.value.length > 1) {
          nextRedditPost();
        }
      }, 5000); // 5-second interval
    };

    const handleAvatarError = (event) => {
      // Fallback to official Reddit icon if avatar fails to load
      event.target.src =
        "https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png";
    };

    const nextArticle = () => {
      if (currentArticleIndex.value < recentArticles.value.length - 1) {
        currentArticleIndex.value++;
      } else {
        currentArticleIndex.value = 0; // Loop back to start
      }
    };

    const prevArticle = () => {
      if (currentArticleIndex.value > 0) {
        currentArticleIndex.value--;
      } else {
        currentArticleIndex.value = recentArticles.value.length - 1; // Loop to end
      }
    };

    const togglePause = () => {
      isPaused.value = !isPaused.value;
    };

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Threshold adjusted to 900px for 2400px offset
      if (scrollPosition >= 900) {
        sidebarPosition.value = "absolute";
        sidebarTop.value = `${scrollPosition}px`;
      } else {
        sidebarPosition.value = "sticky";
        sidebarTop.value = "0";
      }
    };

    let carouselInterval = null;
    // Fetch trending posts for social feed
    const fetchTrendingPosts = async () => {
      postsLoading.value = true;
      postsError.value = null;
      try {
        const response = await axios.get("/api/feed/trending", {
          params: { limit: 10 },
        });
        trendingPosts.value = response.data.posts;
      } catch (err) {
        postsError.value = "Failed to load posts";
        console.error("Error loading trending posts:", err);
      } finally {
        postsLoading.value = false;
      }
    };

    // Handle new post created
    const handleNewPost = (newPost) => {
      trendingPosts.value.unshift(newPost);
    };

    // Utility function for relative time
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

    const openArticleDetails = async (id) => {
      try {
        const response = await axios.get(`${baseURL}/api/news/${id}`);
        selectedArticle.value = response.data;
        isDescriptionExpanded.value = false;
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

    const stripHtml = (html) => {
      if (!html) return "";
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    };

    onMounted(() => {
      window.addEventListener("scroll", handleScroll);
      fetchCarouselImages();
      fetchRecentArticles();
      fetchTrendingPosts();
      fetchTrendingRedditPosts();
      carouselInterval = setInterval(() => {
        if (!isPaused.value && recentArticles.value.length) {
          nextArticle();
        }
      }, 5000); // 5-second interval
      startRedditCarousel();
    });
    const dotClicked = (index) => {
      currentArticleIndex.value = index;
    };
    onUnmounted(() => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(carouselInterval);
      if (redditCarouselInterval) {
        clearInterval(redditCarouselInterval);
      }
    });

    return {
      dotClicked,
      currentIndex,
      images,
      sidebarPosition,
      sidebarTop,
      recentArticles,
      currentArticleIndex,
      isPaused,
      loading,
      errorMessage,
      nextArticle,
      prevArticle,
      togglePause,
      router,
      homeFlip,
      // Social feed
      trendingPosts,
      postsLoading,
      postsError,
      isLoggedIn,
      handleNewPost,
      // Trending Reddit posts
      trendingRedditPosts,
      redditLoading,
      fetchTrendingRedditPosts,
      currentRedditIndex,
      isRedditPaused,
      nextRedditPost,
      prevRedditPost,
      toggleRedditPause,
      handleAvatarError,
      getRelativeTime,
      showDetailsModal,
      selectedArticle,
      isDescriptionExpanded,
      openArticleDetails,
      formatDate,
      stripHtml,
    };
  },
};
</script>

<template>
  <div class="Home">
    <div class="Home-Content">
      <div class="LeftSide-Content">
        <div class="Header-Section">
          <div class="carousel">
            <div class="headerInner">
              <div class="headerText">
                <p>Welcome to GTA 6 Fan Hub</p>
              </div>
              <Countdown class="countdown-overlay" />
              <div class="headerButtons">
                <router-link to="/Events" class="events-btn headerButton-Group">
                  <font-awesome-icon
                    :icon="['fas', 'calendar-day']"
                    :class="{ 'flip-once': homeFlip, 'button-icons': true }"
                    style="color: #ffffff"
                    alt="Events"
                  />
                  <span class="button-label">Events</span>
                </router-link>
                <router-link to="/Social" class="social-btn headerButton-Group">
                  <font-awesome-icon
                    :icon="['fas', 'user-group']"
                    :class="{ 'flip-once': homeFlip, 'button-icons': true }"
                    style="color: #ffffff"
                    alt="Social"
                  />
                  <span class="button-label">Social</span>
                </router-link>
                <router-link to="/News" class="news-btn headerButton-Group">
                  <font-awesome-icon
                    :icon="['fas', 'newspaper']"
                    :class="{ 'flip-once': homeFlip, 'button-icons': true }"
                    style="color: #ffffff"
                    alt="News"
                  />
                  <span class="button-label">News</span>
                </router-link>
                <router-link
                  to="/Characters"
                  class="characters-btn headerButton-Group"
                >
                  <font-awesome-icon
                    :icon="['fas', 'users']"
                    :class="{ 'flip-once': homeFlip, 'button-icons': true }"
                    style="color: #ffffff"
                    alt="Characters"
                  />
                  <span class="button-label">Characters</span>
                </router-link>
                <router-link to="/Story" class="story-btn headerButton-Group">
                  <font-awesome-icon
                    :icon="['fas', 'book']"
                    :class="{ 'flip-once': homeFlip, 'button-icons': true }"
                    style="color: #ffffff"
                    alt="Story"
                  />
                  <span class="button-label">Story</span>
                </router-link>
                <router-link
                  to="/Missions"
                  class="missions-btn headerButton-Group"
                >
                  <font-awesome-icon
                    :icon="['fas', 'location-pin']"
                    :class="{ 'flip-once': homeFlip, 'button-icons': true }"
                    style="color: #ffffff"
                    alt="Missions"
                  />
                  <span class="button-label">Missions</span>
                </router-link>
                <router-link to="/City" class="city-btn headerButton-Group">
                  <font-awesome-icon
                    :icon="['fas', 'city']"
                    :class="{ 'flip-once': homeFlip, 'button-icons': true }"
                    style="color: #ffffff"
                    alt="City"
                  />
                  <span class="button-label">City</span>
                </router-link>
                <router-link to="/Lore" class="lore-btn headerButton-Group">
                  <font-awesome-icon
                    :icon="['fas', 'gun']"
                    :class="{ 'flip-once': homeFlip, 'button-icons': true }"
                    style="color: #ffffff"
                    alt="Lore"
                  />
                  <span class="button-label">Lore</span>
                </router-link>
              </div>
            </div>
            <div class="carouselInner">
              <img
                v-for="(image, index) in images"
                :key="index"
                :src="typeof image === 'string' ? image : image.path"
                :alt="
                  typeof image === 'string' ? 'GTA 6 Header Image' : image.alt
                "
              />
              <img
                v-if="images.length > 0"
                :src="
                  typeof images[0] === 'string' ? images[0] : images[0].path
                "
                :alt="
                  typeof images[0] === 'string'
                    ? 'GTA 6 Header Image'
                    : images[0].alt
                "
              />
            </div>
          </div>
        </div>
        <div class="Explore-SocialFeed">
          <!-- Create Post Section (Logged-in users only) -->
          <CreatePost v-if="isLoggedIn" @post-created="handleNewPost" />

          <!-- Feed Header -->
          <div class="feed-preview-header">
            <h2>Trending Posts</h2>
            <router-link to="/Social" class="view-all-link"
              >View All</router-link
            >
          </div>

          <!-- Loading State -->
          <div v-if="postsLoading" class="loading-state">
            <p>Loading posts...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="postsError" class="error-state">
            <p>{{ postsError }}</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="trendingPosts.length === 0" class="empty-state">
            <p>No posts yet. Be the first to share!</p>
          </div>

          <!-- Feed Preview (Max 10 posts) -->
          <div v-else class="feed-preview">
            <PostCard
              v-for="post in trendingPosts.slice(0, 10)"
              :key="post._id"
              :post="post"
            />
          </div>
        </div>
      </div>
      <div class="Limit-Container">
        <div
          class="RightSide-Content"
          ref="rightSideContent"
          :style="{ position: sidebarPosition, top: sidebarTop }"
        >
          <div class="Trending-Articles">
            <div class="redditCarousel">
              <div v-if="redditLoading" class="reddit-loading">
                Loading Reddit posts...
              </div>
              <div
                v-else-if="trendingRedditPosts.length === 0"
                class="no-reddit-posts"
              >
                No Reddit posts available
              </div>
              <div v-else class="reddit-carousel-wrapper">
                <div class="reddit-carousel-content">
                  <div
                    class="reddit-slide"
                    v-for="(post, index) in trendingRedditPosts"
                    :key="post._id"
                    :style="{
                      transform: `translateX(-${currentRedditIndex * 100}%)`,
                    }"
                  >
                    <a :href="post.link" target="_blank" class="reddit-link">
                      <div
                        class="reddit-background"
                        :style="{
                          backgroundImage: post.enclosure?.url
                            ? `url(${post.enclosure.url})`
                            : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                        }"
                      >
                        <div class="reddit-overlay">
                          <div class="reddit-header">
                            <div class="reddit-subreddit-section">
                              <div class="reddit-subreddit-info">
                                <img
                                  :src="
                                    post.redditData?.subredditIcon ||
                                    '/Reddit-Wordmark-Color-Logo.wine.svg'
                                  "
                                  :alt="
                                    post.redditData?.subreddit || 'Subreddit'
                                  "
                                  class="reddit-subreddit-icon"
                                  @error="handleAvatarError"
                                />
                                <span class="reddit-subreddit"
                                  >r/{{
                                    post.redditData?.subreddit || "Unknown"
                                  }}</span
                                >
                              </div>
                              <div class="reddit-stats">
                                <span class="reddit-upvotes"
                                  >⬆ {{ post.redditData?.upvotes || 0 }}</span
                                >
                              </div>
                            </div>
                            <div class="reddit-user-section">
                              <div class="reddit-user-info">
                                <img
                                  :src="
                                    post.redditData?.authorAvatar ||
                                    'https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png'
                                  "
                                  :alt="post.redditData?.author || 'User'"
                                  class="reddit-avatar"
                                  @error="handleAvatarError"
                                />
                                <span class="reddit-author"
                                  >u/{{
                                    post.redditData?.author || "Unknown"
                                  }}</span
                                >
                              </div>
                            </div>
                          </div>
                          <div class="reddit-content">
                            <h3 class="reddit-title">{{ post.title }}</h3>
                            <div class="reddit-footer">
                              <span class="reddit-time">{{
                                getRelativeTime(post.pubDate)
                              }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
                <div
                  class="RedditCarouselButtons-Container"
                  v-if="trendingRedditPosts.length > 1"
                >
                  <button
                    class="reddit-carousel-btn reddit-prev-btn"
                    @click="prevRedditPost"
                    aria-label="Previous Reddit post"
                  >
                    <font-awesome-icon :icon="['fas', 'arrow-left']" />
                  </button>
                  <button
                    class="reddit-carousel-btn reddit-pause-btn"
                    @click="toggleRedditPause"
                    :aria-label="
                      isRedditPaused
                        ? 'Resume Reddit carousel'
                        : 'Pause Reddit carousel'
                    "
                  >
                    <font-awesome-icon
                      :icon="
                        isRedditPaused ? ['fas', 'play'] : ['fas', 'pause']
                      "
                    />
                  </button>
                  <button
                    class="reddit-carousel-btn reddit-next-btn"
                    @click="nextRedditPost"
                    aria-label="Next Reddit post"
                  >
                    <font-awesome-icon :icon="['fas', 'arrow-right']" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="Recent-Articles">
            <div class="recentArticleCarousel">
              <div v-if="loading">Loading...</div>
              <div v-else-if="errorMessage">{{ errorMessage }}</div>
              <div v-else class="carousel-wrapper">
                <div class="carousel-content">
                  <div
                    class="article-slide"
                    v-for="(article, index) in recentArticles"
                    :key="article._id"
                    :style="{
                      transform: `translateX(-${currentArticleIndex * 100}%)`,
                    }"
                  >
                    <div
                      @click="openArticleDetails(article._id)"
                      class="article-link"
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
                      <h3>{{ article.title }}</h3>
                      <p>{{ article.description.slice(0, 100) }}...</p>
                    </div>
                  </div>
                </div>
                <div class="CarouselButtons-Container">
                  <button
                    class="carousel-btn prev-btn"
                    @click="prevArticle"
                    aria-label="Previous article"
                  >
                    <font-awesome-icon :icon="['fas', 'arrow-left']" />
                  </button>
                  <button
                    class="carousel-btn pause-btn"
                    @click="togglePause"
                    :aria-label="
                      isPaused ? 'Resume carousel' : 'Pause carousel'
                    "
                  >
                    <font-awesome-icon
                      :icon="isPaused ? ['fas', 'play'] : ['fas', 'pause']"
                    />
                  </button>
                  <button
                    class="carousel-btn next-btn"
                    @click="nextArticle"
                    aria-label="Next article"
                  >
                    <font-awesome-icon :icon="['fas', 'arrow-right']" />
                  </button>
                </div>
                <div class="carousel-dots">
                  <button
                    v-for="(article, index) in recentArticles"
                    :key="index"
                    class="carousel-dot"
                    :class="{ active: index === currentArticleIndex }"
                    @click="dotClicked(index)"
                    :aria-label="`Go to article ${index + 1}`"
                  ></button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="Limit-InnerContainer"></div>
      </div>
    </div>

    <!-- Article Details Modal -->
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
              v-if="
                selectedArticle.content &&
                stripHtml(selectedArticle.content) !==
                  selectedArticle.description
              "
              class="content-section"
            >
              <h3 class="section-label">Article Content</h3>
              <div
                class="modal-content"
                :class="{ expanded: isDescriptionExpanded }"
              >
                {{ stripHtml(selectedArticle.content) }}
              </div>
            </div>
          </div>

          <!-- Article Footer -->
          <div class="modal-footer">
            <button
              v-if="
                selectedArticle.content &&
                stripHtml(selectedArticle.content).length > 600
              "
              @click="isDescriptionExpanded = !isDescriptionExpanded"
              class="expand-btn"
            >
              {{ isDescriptionExpanded ? "Show Less" : "Show More" }}
              <font-awesome-icon
                :icon="[
                  'fas',
                  isDescriptionExpanded ? 'chevron-up' : 'chevron-down',
                ]"
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
</template>

<style scoped>
/*Tested screen sizes 1481w × 716h*/
/* Component-specific variables that extend the global design system */

.Home {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  background-color: transparent;
  z-index: 5;
}

.Home-Content {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  background-color: transparent;
  padding: var(--space-md);
  gap: var(--space-lg);
  overflow: auto;
}

@media (min-width: 768px) {
  .Home-Content {
    flex-direction: row;
    padding: var(--space-lg);
    gap: var(--space-xl);
  }
}

.LeftSide-Content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--space-sm);
  padding-top: 0 !important;
  height: auto;
  margin-left: 0;
  align-items: center;
}

@media (min-width: 768px) {
  .LeftSide-Content {
    margin-left: 62px;
    padding: var(--space-md);
  }
}

.Header-Section {
  align-self: center;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
  height: 300px;
  min-height: 300px;
  overflow: hidden;
  border-radius: 1.2rem;
  border: 1px solid transparent;
  box-shadow: 8px 8px 24px rgba(0, 0, 0, 0.3),
    -8px -8px 24px rgba(80, 80, 90, 0.05);
  margin-bottom: var(--space-lg);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.Header-Section:hover {
  border: 1px solid var(--bright-white);
  box-shadow: 12px 12px 30px rgba(0, 0, 0, 0.4),
    -12px -12px 30px rgba(80, 80, 90, 0.08), 0 0 40px rgba(255, 255, 255, 0.2);
}

@media (min-width: 640px) {
  .Header-Section {
    height: 350px;
    min-height: 350px;
  }
}

@media (min-width: 768px) {
  .Header-Section {
    height: 400px;
    min-height: 400px;
    max-width: 90%;
  }
}

@media (min-width: 1024px) {
  .Header-Section {
    height: 450px;
    min-height: 450px;
    max-width: 1000px;
  }
}
.headerInner {
  position: absolute;
  display: flex;
  align-items: center;
  flex-direction: column;
  z-index: 20;
  height: 100%;
  width: 100%;
}
.headerText {
  position: relative;
  top: 15%;
  width: auto;
  height: auto;
  z-index: 20;
}
.headerText p {
  font-size: var(--text-3xl);
  font-weight: 600;
  color: var(--bright-white);
  text-align: center;
  line-height: var(--leading-tight);
  margin: 0;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 255, 255, 0.3);
  letter-spacing: 2px;
}

@media (min-width: 640px) {
  .headerText p {
    font-size: var(--text-4xl);
  }
}

@media (min-width: 768px) {
  .headerText p {
    font-size: var(--text-5xl);
  }
}

@media (min-width: 1024px) {
  .headerText p {
    font-size: var(--text-6xl);
  }
}
.headerButton-Group {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: auto;
  min-height: 70px;
  width: 70px;
  padding: var(--space-sm);
  gap: var(--space-xs);
  background: var(--glass-morphism-bg);
  border: 1px solid var(--sunset-orange);
  border-radius: 1rem;
  backdrop-filter: blur(10px);
  box-shadow: 6px 6px 20px rgba(0, 0, 0, 0.4),
    -6px -6px 20px rgba(80, 80, 90, 0.1);
  opacity: 1;
  transition: all 0.3s ease;
  text-decoration: none;
}

@media (min-width: 640px) {
  .headerButton-Group {
    min-height: 80px;
    width: 80px;
    padding: var(--space-md);
  }
}

@media (min-width: 768px) {
  .headerButton-Group {
    min-height: 90px;
    width: 90px;
    padding: var(--space-md);
  }
}
.headerButton-Group:hover {
  border: 1px solid var(--bright-white);
  transform: translateY(-4px);
  box-shadow: 8px 8px 25px rgba(0, 0, 0, 0.5),
    -8px -8px 25px rgba(80, 80, 90, 0.15), 0 0 25px rgba(255, 255, 255, 0.3);
}

.headerButton-Group:hover .button-icons {
  filter: drop-shadow(0 0 8px var(--bright-white));
}

.headerButtons {
  position: absolute;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  height: auto;
  width: 95%;
  border-radius: var(--radius-lg);
  bottom: 10.5%;
  gap: var(--space-sm);
  flex-wrap: wrap;
  padding: var(--space-sm);
  z-index: 20;
}

@media (min-width: 640px) {
  .headerButtons {
    gap: var(--space-md);
    padding: var(--space-md);
  }
}

@media (min-width: 768px) {
  .headerButtons {
    gap: var(--space-lg);
    flex-wrap: nowrap;
  }
}
.button-icons {
  font-size: var(--text-lg);
  transition: var(--transition-fast);
}

@media (min-width: 640px) {
  .button-icons {
    font-size: var(--text-xl);
  }
}

@media (min-width: 768px) {
  .button-icons {
    font-size: var(--text-2xl);
  }
}

.button-label {
  color: var(--bright-white);
  font-size: 0.65rem;
  font-weight: 600;
  text-align: center;
  margin-top: var(--space-xs);
  white-space: nowrap;
  text-transform: capitalize;
  opacity: 0.7;
  text-decoration: none;
  transition: all 0.3s ease;
}
.headerButton-Group:hover .button-label {
  opacity: 1;
  color: var(--bright-white);
}

@media (min-width: 640px) {
  .button-label {
    font-size: 0.75rem;
  }
}

@media (min-width: 768px) {
  .button-label {
    font-size: 0.85rem;
  }
}
.carousel {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.carousel::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.2) 50%,
    rgba(0, 0, 0, 0.4) 100%
  );
  pointer-events: none;
  z-index: 10;
}

.carouselInner {
  display: flex;
  height: 100%;
  width: 100%;
  animation: slide-left 40.5s infinite; /* Use steps for discrete jumps */
  position: relative;
}

.carouselInner img {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  object-fit: fill;
  opacity: 1;
}
/* Carousel Animation */
@keyframes slide-left {
  0% {
    transform: translateX(0);
  }
  4.76% {
    transform: translateX(-100%); /* Scroll to 2nd image */
  }
  19.05% {
    transform: translateX(-100%); /* Hold 2nd image for 3.5s */
  }
  23.81% {
    transform: translateX(-200%); /* Scroll to 3rd image */
  }
  38.10% {
    transform: translateX(-200%); /* Hold 3rd image */
  }
  42.86% {
    transform: translateX(-300%); /* Scroll to 4th image */
  }
  57.14% {
    transform: translateX(-300%); /* Hold 4th image */
  }
  61.90% {
    transform: translateX(-400%); /* Scroll to 5th image */
  }
  76.19% {
    transform: translateX(-400%); /* Hold 5th image */
  }
  80.95% {
    transform: translateX(-500%); /* Scroll to 6th image (duplicate) */
  }
  95.24% {
    transform: translateX(-500%); /* Hold 6th image */
  }
  95.25% {
    transform: translateX(0); /* Instant reset to 1st image */
  }
  100% {
    transform: translateX(0); /* Hold 1st image */
  }
}

.Explore-SocialFeed {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: auto;
  width: 60%;
  border-radius: 8px;
  margin-top: 15px;
  opacity: 1;
}
/* Feed Preview Styles */
.feed-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 20px;
  margin-bottom: 10px;
  background: var(--glass-morphism-bg);
  backdrop-filter: blur(2.2px);
  border-radius: 1.2rem;
  border: 1px solid transparent;
  box-shadow: 8px 8px 24px rgba(0, 0, 0, 0.3),
    -8px -8px 24px rgba(80, 80, 90, 0.05);
}

.feed-preview-header h2 {
  color: var(--bright-white);
  font-size: 1.5em;
  margin: 0;
  font-weight: 600;
}

.view-all-link {
  color: var(--bright-white);
  text-decoration: none;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 20px;
  background: var(--glass-morphism-bg);
  border: 1px solid var(--sunset-orange);
  transition: all 0.3s ease;
  font-size: 0.9em;
  white-space: nowrap;
  flex-shrink: 0;
}

.view-all-link:hover {
  border: 1px solid var(--bright-white);
  color: var(--bright-white);
}

.feed-preview {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 40px 20px;
  background-color: var(--glass-morphism-bg);
  backdrop-filter: blur(2.2px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.loading-state p,
.error-state p,
.empty-state p {
  color: var(--bright-white);
  font-size: 1.1em;
  margin: 0;
}

.error-state p {
  color: var(--neon-pink);
}

.loading-state p::after {
  content: "...";
  animation: dots 1.5s steps(3, end) infinite;
}

@keyframes dots {
  0%,
  20% {
    content: ".";
  }
  40% {
    content: "..";
  }
  60%,
  100% {
    content: "...";
  }
}

.RightSide-Content {
  display: none;
  flex-direction: column;
  gap: var(--space-md);
  background-color: var(--glass-morphism-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--bright-white);
  opacity: 0.84;
  backdrop-filter: blur(2.2px);
  padding: var(--space-md);
  transition: var(--transition-normal);
  z-index: 15;
  width: 100%;
  min-height: 400px;
}

@media (min-width: 768px) {
  .RightSide-Content {
    display: flex;
    width: 300px;
    min-height: 500px;
    height: auto;
    max-height: none;
  }
}

@media (min-width: 1024px) {
  .RightSide-Content {
    width: 350px;
    min-height: 600px;
  }
}

.Trending-Articles {
  height: auto;
  min-height: 200px;
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.Trending-Articles:hover {
  transform: translateY(-2px);
  border: var(--hover-border);
  box-shadow: 10px 10px 30px rgba(0, 0, 0, 0.4),
    -10px -10px 30px rgba(80, 80, 90, 0.08), var(--neon-glow-hover);
}

@media (min-width: 768px) {
  .Trending-Articles {
    height: 50%;
    min-height: 250px;
  }
}
.article {
  height: 100%;
  width: 100%;
  background-color: transparent;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--bright-white);
  font-weight: 600;
  font-size: var(--text-lg);
  line-height: var(--leading-normal);
}

/* Reddit Carousel styles for Trending-Articles */
.redditCarousel {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.reddit-carousel-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: relative;
}

.reddit-carousel-content {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.5s ease;
}

.reddit-slide {
  min-width: 100%;
  height: 100%;
  position: relative;
}

.reddit-link {
  display: block;
  height: 100%;
  text-decoration: none;
  color: inherit;
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
  padding: 16px;
}

.reddit-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
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
  gap: 8px;
}

.reddit-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 69, 0, 0.6);
  object-fit: cover;
  background: rgba(255, 69, 0, 0.2);
}

.reddit-author {
  color: var(--bright-white);
  font-size: 0.8em;
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
  gap: 8px;
}

.reddit-subreddit-icon {
  height: 2em;
  width: auto;
  object-fit: contain;
  vertical-align: middle;
  background-color: var(--bright-white);
  border-radius: var(--radius-md);
}
.reddit-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reddit-stats-icon {
  height: 1em;
  width: auto;
  object-fit: contain;
  vertical-align: middle;
}

.reddit-subreddit {
  color: var(--bright-white);
  font-size: 0.9em;
  font-weight: 600;
  text-shadow: 0 0 4px rgba(255, 69, 0, 0.8);
}

.reddit-upvotes {
  color: #00ff00;
  font-size: 0.8em;
  font-weight: 600;
  margin-left: auto;
  background: rgba(0, 0, 0, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
  text-shadow: 0 0 8px #00ff00, 0 0 16px #00ff00;
}

.reddit-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-height: 50%; /* Ensure content doesn't exceed half the post display */
  overflow: hidden;
}

.reddit-title {
  color: var(--bright-white);
  font-size: 1.1em;
  font-weight: 700;
  margin-bottom: 12px;
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 4; /* Allow up to 4 lines for long titles */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-wrap: break-word;
  hyphens: auto;
  max-height: calc(1.3em * 4); /* 4 lines max */
}

.reddit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reddit-time {
  color: var(--soft-lavender);
  font-size: 0.8em;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
}

/* Reddit Carousel Buttons */
.RedditCarouselButtons-Container {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.reddit-carousel-btn {
  background: rgba(255, 69, 0, 0.8);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  font-size: 0.8em;
}

.reddit-carousel-btn:hover {
  background: rgba(255, 69, 0, 1);
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(255, 69, 0, 0.6);
}

/* Responsive adjustments for Reddit titles */
@media (max-width: 768px) {
  .reddit-title {
    font-size: 1em;
    -webkit-line-clamp: 3; /* Reduce to 3 lines on mobile */
    max-height: calc(1.3em * 3);
  }

  .reddit-content {
    max-height: 45%; /* Slightly less space on mobile */
  }

  .reddit-avatar {
    width: 20px;
    height: 20px;
  }

  .reddit-subreddit-icon {
    width: 18px;
    height: 18px;
  }

  .reddit-author {
    font-size: 0.7em;
  }
}

@media (max-width: 480px) {
  .reddit-title {
    font-size: 0.9em;
    -webkit-line-clamp: 2; /* Only 2 lines on very small screens */
    max-height: calc(1.3em * 2);
  }

  .reddit-content {
    max-height: 40%; /* Even less space on very small screens */
  }

  .reddit-avatar {
    width: 18px;
    height: 18px;
  }

  .reddit-subreddit-icon {
    width: 16px;
    height: 16px;
  }

  .reddit-author {
    font-size: 0.65em;
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

.tweet-content {
  color: var(--bright-white);
}

.tweet-title {
  font-size: 0.9em;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--bright-white);
  text-shadow: 0 0 4px var(--neon-pink), 0 0 8px rgba(255, 20, 147, 0.5);
  line-height: 1.3;
}

.tweet-text {
  font-size: 0.8em;
  line-height: 1.4;
  margin-bottom: 8px;
  color: var(--soft-lavender);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tweet-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 215, 0, 0.2);
}

.tweet-time {
  color: var(--soft-lavender);
  font-size: 0.7em;
  text-shadow: 0 0 4px var(--neon-pink), 0 0 8px rgba(255, 20, 147, 0.5);
}

.tweet-link {
  color: #ffd700;
  text-decoration: none;
  font-size: 0.7em;
  font-weight: 500;
  padding: 2px 6px;
  border: 1px solid #ffd700;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.tweet-link:hover {
  background: #ffd700;
  color: var(--deep-black);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
}

.tweets-loading,
.no-tweets {
  color: var(--soft-lavender);
  text-align: center;
  font-size: 0.9em;
  padding: 20px;
}
.Recent-Articles {
  height: auto;
  min-height: 200px;
  border-radius: var(--radius-lg);
  border: 1px solid transparent;
  padding: var(--space-md);
  backdrop-filter: blur(2.2px);
  background-color: var(--glass-morphism-bg);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}
.Recent-Articles:hover {
  border: 1px solid var(--bright-white);
}

@media (min-width: 768px) {
  .Recent-Articles {
    height: 50%;
    min-height: 250px;
  }
}
.recentArticle {
  height: 100%;
  width: 100%;
  background-color: transparent;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bolder;
}
.recentArticleCarousel {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.carousel-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: relative;
}

.carousel-content {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.5s ease;
}

.article-slide {
  flex: 0 0 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 10px;
  box-sizing: border-box;
}

.article-link {
  text-decoration: none;
  color: var(--bright-white);
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.article-link:hover {
  transform: scale(1.02);
}

.article-link h3:hover {
  color: var(--mint-green);
  text-shadow: 0 0 10px rgba(152, 255, 152, 0.8),
    0 0 20px rgba(152, 255, 152, 0.6);
}

.article-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.article-image:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(152, 255, 152, 0.3);
}

.article-slide h3 {
  font-size: 1.2em;
  text-align: center;
  margin: 10px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: pointer;
  transition: color 0.2s ease;
}

.article-slide p {
  font-size: 0.9em;
  text-align: center;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
}
.CarouselButtons-Container {
  position: absolute;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: auto;
  bottom: 5%;
}
.carousel-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  bottom: 0%;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  color: var(--deep-black2);
  z-index: 20;
  box-shadow: 0 0 15px -5px inset var(--bright-white);
  opacity: 0.7;
  border: 1px solid var(--bright-white);
  backdrop-filter: blur(2.2px);
  background-color: rgba(255, 255, 255, 0.1);
  transition: all 0.25s ease-in-out;
}
.Recent-Articles:hover .carousel-btn {
  opacity: 1;
  transition: all 0.25s ease-in-out;
  background-color: var(--glass-morphism-bg);
}

.carousel-btn:hover {
  backdrop-filter: blur(4.2px) !important;
  background-color: var(--bright-white) !important;
  opacity: 1 !important;
  border: 1px solid var(--bright-white) !important;
}

.prev-btn,
.next-btn {
  height: 30px;
  min-height: 15px;
  max-height: 30px;
  width: 30px;
}

.pause-btn {
  height: 40px;
  min-height: 20px;
  max-height: 40px;
  width: 40px;
  background-color: rgba(255, 255, 255, 0.2);
  border: 2px solid var(--bright-white);
}
.carousel-dots {
  position: absolute;
  bottom: -30px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 10px 0;
}

.carousel-dot {
  width: 8px;
  height: 8px;
  background-color: var(--steel-gray);
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.carousel-dot.active {
  background-color: var(--neon-pink);
}

.carousel-dot:hover {
  background-color: var(--bright-white);
}
.Limit-Container {
  display: flex;
  flex-direction: column;
  /*Sets right side container scroll limit - Adjusted for 2400px offset*/
  min-height: 300vh;
  max-height: 300vh;
  background-color: transparent;
}
.Limit-InnerContainer {
  position: relative;
  height: 50px;
  width: 100%;
  background-color: transparent;
  /*Top rule debugging display only |

 .Limit-Container height changes limit - DOUBLED*/
  top: 2400px;
  margin: 0%;
}
.flip-once:hover {
  transform: rotateY(180deg);
}

/* Mobile-first responsive design - additional mobile optimizations */
@media (max-width: 640px) {
  .Home-Content {
    padding: var(--space-sm);
    gap: var(--space-md);
  }

  .LeftSide-Content {
    padding: var(--space-xs);
    margin-left: 0;
  }

  .Header-Section {
    height: 250px;
    min-height: 250px;
    margin-bottom: var(--space-md);
  }

  .headerText p {
    font-size: var(--text-2xl);
  }

  .headerButtons {
    gap: var(--space-xs);
    padding: var(--space-xs);
  }

  .headerButton-Group {
    min-height: 60px;
    width: 60px;
    padding: var(--space-xs);
  }

  .button-icons {
    font-size: var(--text-base);
  }

  .button-label {
    font-size: 0.6rem;
  }

  .carousel-btn {
    padding: var(--space-sm);
  }

  .carousel-dots {
    left: 50%;
    transform: translateX(-50%);
    gap: var(--space-xs);
  }

  .carousel-dot {
    width: 6px;
    height: 6px;
  }
}

/* Countdown positioned above headerButtons */
.countdown-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 25;
  pointer-events: none;
  background: var(--glass-morphism-bg);
  border: 1px solid var(--sunset-orange);
  border-radius: 1rem;
  padding: 12px 20px;
  box-shadow: 6px 6px 20px rgba(0, 0, 0, 0.4),
    -6px -6px 20px rgba(80, 80, 90, 0.1);
  backdrop-filter: blur(10px);
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
  background: linear-gradient(
    135deg,
    rgba(50, 50, 50, 0.95),
    rgba(30, 30, 30, 0.95)
  );
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
    0 0 15px rgba(152, 255, 152, 0.4), inset 0 0 10px rgba(152, 255, 152, 0.1);
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
    0 0 25px rgba(152, 255, 152, 0.8), 0 0 35px rgba(152, 255, 152, 0.6),
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
