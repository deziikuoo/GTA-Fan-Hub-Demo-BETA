// Mock API service to replace axios calls with mock data
import { mockUsers, getCurrentDemoUser } from "@/mockData/users.js";
import { saveUserAvatar, saveUserHeader, saveUserProfile, getUserAvatar, getUserHeader } from "@/utils/avatarManager.js";
import { mockPosts } from "@/mockData/posts.js";
import { getCommentsForPost, addComment } from "@/mockData/comments.js";
import { mockNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/mockData/notifications.js";
import { getNewsArticles, getNewsArticleById, mockNewsArticles } from "@/mockData/news.js";
import { getFeed, getUserPosts } from "@/mockData/feed.js";
import { getCarouselImages } from "@/mockData/carousel.js";

// Simulate network delay
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// SessionStorage key for user-created posts (cleared on browser close)
const USER_POSTS_STORAGE_KEY = "gtafanhub-user-posts";

// Load user posts from sessionStorage on initialization
function loadUserPosts() {
  const stored = sessionStorage.getItem(USER_POSTS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

// Save user posts to sessionStorage
function saveUserPosts(posts) {
  sessionStorage.setItem(USER_POSTS_STORAGE_KEY, JSON.stringify(posts));
}

// Initialize with mock posts and user posts from sessionStorage
let userPosts = loadUserPosts();
let mockPostsStorage = [...mockPosts, ...userPosts];
// Include demo user in storage so it can be found (will be updated dynamically)
let mockUsersStorage = [...mockUsers];

// Helper to get current user from localStorage
function getCurrentUser() {
  const userStr = localStorage.getItem("gtafanhub-auth");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return getCurrentDemoUser();
    }
  }
  return null;
}

// Helper to check if user is logged in
function isLoggedIn() {
  return !!localStorage.getItem("gtafanhub-auth");
}

// Helper to get current user with latest avatar/header
function getCurrentUserWithLatestAvatar() {
  const user = getCurrentUser() || getCurrentDemoUser();
  // Always ensure the user has the latest avatar and header from avatarManager
  if (user && user.profile) {
    user.profile.profilePicture = getUserAvatar();
    user.profile.headerImage = getUserHeader();
  }
  return user;
}

// Helper to enrich user data with required fields
function enrichUserData(user) {
  if (!user) return null;
  
  // Create a copy to avoid mutating original
  const enriched = { ...user };
  
  // Ensure profile object exists
  if (!enriched.profile) {
    enriched.profile = {
      displayName: enriched.username || "User",
      bio: "",
      profilePicture: "/src/assets/images/user.png",
      headerImage: "/src/assets/images/HeaderImages/Bros.jpg",
      verified: false,
      location: "",
      website: null,
      joinedDate: enriched.createdAt || new Date(),
    };
  }
  
  // Ensure gamingProfile exists
  if (!enriched.gamingProfile) {
    enriched.gamingProfile = {
      onlineStatus: "offline",
      lastSeen: new Date(),
      favoriteGame: "GTA 6",
      playtime: 0,
    };
  }
  
  // Ensure socialStats exists
  if (!enriched.socialStats) {
    enriched.socialStats = {
      totalPosts: enriched.posts || 0,
      totalLikes: 0,
      totalReposts: 0,
      totalComments: 0,
      level: enriched.level || 1,
      reputation: enriched.reputation || 0,
    };
  }
  
  // Ensure stats exists
  if (!enriched.stats) {
    enriched.stats = {
      postsCount: enriched.posts || 0,
      followersCount: enriched.followers || 0,
      followingCount: enriched.following || 0,
    };
  }
  
  // Ensure achievements array exists
  if (!enriched.achievements) {
    enriched.achievements = [];
  }
  
  // Ensure id and _id exist
  if (!enriched.id) {
    enriched.id = enriched._id || enriched.username;
  }
  if (!enriched._id) {
    enriched._id = enriched.id || enriched.username;
  }
  
  return enriched;
}

// Helper to parse URL query parameters
function parseQueryParams(url) {
  const params = {};
  const queryString = url.split('?')[1];
  if (queryString) {
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
  }
  return params;
}

// Create mock API instance that mimics axios
const mockApi = {
  async get(url, config = {}) {
    console.log("[mockApi] GET request:", url);
    await delay(300);
    console.log("[mockApi] Delay complete, processing:", url);
    // Parse params from both config.params and URL query string
    const urlParams = parseQueryParams(url);
    const params = { ...urlParams, ...(config.params || {}) };
    
    // Authentication endpoints
    if (url === "/api/check-session") {
      const user = getCurrentUser();
      if (user && user.username) {
        return { data: { user, isAuthenticated: true } };
      }
      // Return demo user if no user found (for demo mode)
      return { data: { user: getCurrentDemoUser(), isAuthenticated: true } };
    }
    
    // Profile endpoints
    if (url.startsWith("/api/profile/")) {
      const username = url.split("/").pop();
      console.log("[mockApi] Profile request for username:", username);
      // Handle undefined username - use current user or demo user
      if (username === "undefined" || !username) {
        const user = getCurrentUser() || getCurrentDemoUser();
        console.log("[mockApi] Using current/demo user:", user.username);
        // Ensure user has all required fields
        const enrichedUser = enrichUserData(user);
        console.log("[mockApi] Returning enriched user:", enrichedUser);
        return { data: { user: enrichedUser } };
      }
      // Search in all users including demo user
      const allUsers = [...mockUsersStorage, getCurrentDemoUser()];
      let user = allUsers.find((u) => u.username === username) || getCurrentDemoUser();
      console.log("[mockApi] Found user:", user.username);
      // Ensure user has all required fields
      user = enrichUserData(user);
      console.log("[mockApi] Returning enriched user:", user);
      return { data: { user } };
    }
    
    if (url === "/api/profile/me") {
      const user = getCurrentUser() || getCurrentDemoUser();
      const enrichedUser = enrichUserData(user);
      return { data: { user: enrichedUser } };
    }
    
    // User endpoints
    if (url === "/api/users/batch") {
      const userIds = params.userIds ? params.userIds.split(",") : [];
      const users = mockUsersStorage.filter((u) => userIds.includes(u._id));
      return { data: { users } };
    }
    
    if (url === "/api/users/search") {
      const query = params.q || "";
      // Only search mock users (exclude demo user)
      const searchableUsers = mockUsersStorage.filter(
        (u) => u._id !== "demo_user" && u.id !== "demo_user"
      );
      const users = searchableUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(query.toLowerCase()) ||
          u.profile?.displayName?.toLowerCase().includes(query.toLowerCase())
      );
      return { data: { users: users.slice(0, 30) } };
    }
    
    if (url.startsWith("/api/users/") && url.endsWith("/follow-status")) {
      const userId = url.split("/")[3];
      const following = localStorage.getItem(`following_${userId}`) === "true";
      return { data: { following } };
    }
    
    if (url === "/api/users/bulk-follow-status") {
      // Return mock follow status for all users
      return { data: { followStatus: {} } };
    }
    
    if (url.startsWith("/api/users/") && url.endsWith("/following")) {
      const userId = url.split("/")[3];
      const user = mockUsersStorage.find((u) => u._id === userId) || mockUsers[0];
      return { data: { following: mockUsersStorage.slice(0, 5) } };
    }
    
    if (url.startsWith("/api/users/") && url.endsWith("/followers")) {
      const userId = url.split("/")[3];
      const user = mockUsersStorage.find((u) => u._id === userId) || mockUsers[0];
      return { data: { followers: mockUsersStorage.slice(0, 5) } };
    }
    
    // Post endpoints
    if (url.startsWith("/api/posts/") && url.endsWith("/comments")) {
      const postId = url.split("/")[3];
      const comments = getCommentsForPost(postId);
      return { data: { comments } };
    }
    
    if (url.startsWith("/api/posts/") && url.includes("/like")) {
      const postId = url.split("/")[3];
      const post = mockPostsStorage.find((p) => p._id === postId);
      if (post) {
        post.isLiked = !post.isLiked;
        const change = post.isLiked ? 1 : -1;
        post.likes = (post.likes || 0) + change;
        // Update engagement object if it exists
        if (post.engagement) {
          post.engagement.likes = (post.engagement.likes || 0) + change;
        } else {
          post.engagement = { likes: post.likes, reposts: post.reposts || 0, comments: post.comments || 0, bookmarks: post.bookmarks || 0, views: post.views || 0, quotes: 0 };
        }
      }
      return { data: { success: true, post, liked: post?.isLiked, postLikes: post?.engagement?.likes || post?.likes } };
    }
    
    if (url.startsWith("/api/posts/") && url.includes("/repost")) {
      const postId = url.split("/")[3];
      const post = mockPostsStorage.find((p) => p._id === postId);
      if (post) {
        post.isReposted = !post.isReposted;
        const change = post.isReposted ? 1 : -1;
        post.reposts = (post.reposts || 0) + change;
        // Update engagement object if it exists
        if (post.engagement) {
          post.engagement.reposts = (post.engagement.reposts || 0) + change;
        } else {
          post.engagement = { likes: post.likes || 0, reposts: post.reposts, comments: post.comments || 0, bookmarks: post.bookmarks || 0, views: post.views || 0, quotes: 0 };
        }
      }
      return { data: { success: true, post } };
    }
    
    if (url.startsWith("/api/posts/") && url.includes("/bookmark")) {
      const postId = url.split("/")[3];
      const post = mockPostsStorage.find((p) => p._id === postId);
      if (post) {
        post.isBookmarked = !post.isBookmarked;
        const change = post.isBookmarked ? 1 : -1;
        post.bookmarks = (post.bookmarks || 0) + change;
        // Update engagement object if it exists
        if (post.engagement) {
          post.engagement.bookmarks = (post.engagement.bookmarks || 0) + change;
        } else {
          post.engagement = { likes: post.likes || 0, reposts: post.reposts || 0, comments: post.comments || 0, bookmarks: post.bookmarks, views: post.views || 0, quotes: 0 };
        }
      }
      return { data: { success: true, post } };
    }
    
    if (url.startsWith("/api/posts/") && url.includes("/view")) {
      const postId = url.split("/")[3];
      const post = mockPostsStorage.find((p) => p._id === postId);
      if (post) {
        post.views = (post.views || 0) + 1;
        // Update engagement object if it exists
        if (post.engagement) {
          post.engagement.views = (post.engagement.views || 0) + 1;
        } else {
          post.engagement = { 
            likes: post.likes || 0, 
            reposts: post.reposts || 0, 
            comments: post.comments || 0, 
            bookmarks: post.bookmarks || 0, 
            views: post.views, 
            quotes: 0 
          };
        }
      }
      return { data: { success: true } };
    }
    
    // Feed endpoints
    if (url === "/api/feed/trending") {
      const feed = getFeed("trending", params.page || 1, params.limit || 10);
      return { data: feed };
    }
    
    if (url === "/api/feed/following") {
      const feed = getFeed("following", params.page || 1, params.limit || 10);
      return { data: feed };
    }
    
    if (url === "/api/feed/for-you") {
      const feed = getFeed("for-you", params.page || 1, params.limit || 10);
      return { data: feed };
    }
    
    if (url.startsWith("/api/feed/user/")) {
      const userId = url.split("/").pop();
      const feed = getUserPosts(userId, params.page || 1, params.limit || 10);
      return { data: feed };
    }
    
    // News endpoints
    if (url.startsWith("/api/news") && !url.startsWith("/api/news/")) {
      // Parse page and limit as numbers
      const page = params.page ? parseInt(params.page, 10) : 1;
      const limit = params.limit ? parseInt(params.limit, 10) : 10;
      const articles = getNewsArticles(
        page,
        limit,
        params.sortField || "pubDate",
        params.sortOrder || "desc",
        params.query || null,
        params.sourceType || null
      );
      console.log("[mockApi] Returning news articles:", articles.articles.length, "of", articles.totalArticles);
      return { data: articles };
    }
    
    if (url === "/api/news/count") {
      return { data: { count: mockNewsArticles.length } };
    }
    
    if (url.startsWith("/api/news/")) {
      const id = url.split("/").pop();
      const article = getNewsArticleById(id);
      if (article) {
        return { data: { article } };
      }
      throw new Error("Article not found");
    }
    
    // Carousel endpoint
    if (url === "/api/carousel") {
      return { data: getCarouselImages() };
    }
    
    // Reddit endpoint (mock)
    if (url === "/api/reddit/trending") {
      return { data: { posts: [] } };
    }
    
    // Notification endpoints
    if (url === "/api/notifications") {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const start = (page - 1) * limit;
      const end = start + limit;
      return {
        data: {
          notifications: mockNotifications.slice(start, end),
          total: mockNotifications.length,
          page,
          limit,
        },
      };
    }
    
    if (url === "/api/notifications/unread-count") {
      return { data: { count: getUnreadCount() } };
    }
    
    // Countdown endpoints
    if (url === "/api/countdown/server-time") {
      return { data: { serverTime: new Date().toISOString() } };
    }
    
    if (url === "/api/countdown/target-date") {
      return {
        data: {
          targetDate: new Date("2026-11-19T00:00:00Z").toISOString(),
        },
      };
    }
    
    if (url === "/api/countdown/release-times") {
      return {
        data: {
          releaseTimes: {
            Eastern: new Date("2026-11-19T00:00:00-05:00").toISOString(),
            Pacific: new Date("2026-11-19T00:00:00-08:00").toISOString(),
          },
        },
      };
    }
    
    // Asset endpoints
    if (url === "/api/assets/background-image/url") {
      return {
        data: {
          url: "/src/assets/images/HeaderImages/Bros.jpg",
        },
      };
    }
    
    // Default: return empty data
    return { data: {} };
  },
  
  async post(url, data = {}, config = {}) {
    console.log("[mockApi] POST request:", url, "Data type:", data?.constructor?.name, "Is FormData:", data instanceof FormData);
    await delay(400);
    
    // Authentication endpoints
    if (url === "/api/login") {
      const { username, password } = data;
      // Accept any username/password for demo
      const user = getCurrentDemoUser();
      localStorage.setItem("gtafanhub-auth", JSON.stringify(user));
      localStorage.setItem("accessToken", "demo_token_" + Date.now());
      return {
        data: {
          user,
          accessToken: localStorage.getItem("accessToken"),
        },
      };
    }
    
    if (url === "/api/register") {
      const demoUser = getCurrentDemoUser();
      const newUser = {
        ...demoUser,
        _id: "user_" + Date.now(),
        id: "user_" + Date.now(),
        username: data.username || "newuser",
        email: data.email || "newuser@example.com",
        profile: {
          ...demoUser.profile,
          displayName: data.displayName || data.username || "New User",
        },
      };
      mockUsersStorage.push(newUser);
      localStorage.setItem("gtafanhub-auth", JSON.stringify(newUser));
      localStorage.setItem("accessToken", "demo_token_" + Date.now());
      return {
        data: {
          user: newUser,
          accessToken: localStorage.getItem("accessToken"),
        },
      };
    }
    
    if (url === "/api/logout") {
      localStorage.removeItem("gtafanhub-auth");
      localStorage.removeItem("accessToken");
      return { data: { success: true } };
    }
    
    if (url === "/api/refresh-token") {
      const user = getCurrentUser();
      if (user) {
        const newToken = "demo_token_" + Date.now();
        localStorage.setItem("accessToken", newToken);
        return { data: { accessToken: newToken } };
      }
      throw new Error("Not authenticated");
    }
    
    if (url === "/api/forgot-password") {
      return { data: { message: "Password reset email sent (demo)" } };
    }
    
    // Post endpoints
    if (url === "/api/posts") {
      let contentText = "";
      let mediaFiles = [];
      
      // Handle FormData
      if (data instanceof FormData) {
        // Extract text content
        contentText = data.get("text") || data.get("content") || "";
        
        // Extract media files
        const mediaEntries = data.getAll("media");
        // Convert File objects to data URLs for storage
        for (const file of mediaEntries) {
          if (file instanceof File) {
            const dataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.onerror = reject;
              if (file.type.startsWith("image/")) {
                reader.readAsDataURL(file);
              } else if (file.type.startsWith("video/")) {
                reader.readAsDataURL(file);
              } else {
                reject(new Error("Unsupported file type"));
              }
            });
            
            mediaFiles.push({
              type: file.type.startsWith("image/") ? "image" : "video",
              url: dataUrl,
              thumbnail: file.type.startsWith("image/") ? dataUrl : null,
              metadata: file.type.startsWith("video/") ? {
                duration: 0, // Will be set when video loads
                dimensions: { width: 1920, height: 1080 },
              } : undefined,
            });
          }
        }
      } else {
        // Regular object data
        contentText = typeof data.content === 'string' ? data.content : (data.content?.text || "");
        mediaFiles = data.media || [];
      }
      
      // Get current user with latest avatar/header
      const currentAuthor = getCurrentUserWithLatestAvatar();
      
      const newPost = {
        _id: "user_post_" + Date.now(),
        author: currentAuthor,
        content: { text: contentText },
        media: mediaFiles,
        engagement: {
          likes: 0,
          reposts: 0,
          comments: 0,
          bookmarks: 0,
          views: 0,
          quotes: 0,
        },
        likes: 0,
        reposts: 0,
        comments: 0,
        bookmarks: 0,
        views: 0,
        isLiked: false,
        isReposted: false,
        isBookmarked: false,
        type: "post",
        createdAt: new Date(),
        isEdited: false,
        isEditable: true,
      };
      
      // Add to storage
      mockPostsStorage.unshift(newPost);
      userPosts.unshift(newPost);
      
      // Save to sessionStorage
      saveUserPosts(userPosts);
      
      console.log("[mockApi] Created new post:", newPost._id);
      return { data: { post: newPost } };
    }
    
    if (url.startsWith("/api/posts/") && url.endsWith("/comments")) {
      const postId = url.split("/")[3];
        // Get current user with latest avatar/header
        const currentAuthor = getCurrentUserWithLatestAvatar();
        
        const newComment = {
          _id: "comment_" + Date.now(),
          author: currentAuthor,
          content: data.content || "",
        likes: 0,
        replies: 0,
        isLiked: false,
        createdAt: new Date(),
        isEdited: false,
      };
      addComment(postId, newComment);
      const post = mockPostsStorage.find((p) => p._id === postId);
      if (post) {
        post.comments = (post.comments || 0) + 1;
        // Update engagement object if it exists
        if (post.engagement) {
          post.engagement.comments = (post.engagement.comments || 0) + 1;
        } else {
          post.engagement = { 
            likes: post.likes || 0, 
            reposts: post.reposts || 0, 
            comments: post.comments, 
            bookmarks: post.bookmarks || 0, 
            views: post.views || 0, 
            quotes: 0 
          };
        }
      }
      return { data: { comment: newComment } };
    }
    
    if (url.startsWith("/api/posts/") && url.includes("/view")) {
      return { data: { success: true } };
    }
    
    // User endpoints
    if (url.startsWith("/api/users/") && url.endsWith("/follow")) {
      const userId = url.split("/")[3];
      localStorage.setItem(`following_${userId}`, "true");
      return { data: { success: true, following: true } };
    }
    
    if (url.startsWith("/api/users/") && url.endsWith("/block")) {
      return { data: { success: true } };
    }
    
    // Notification endpoints
    if (url.startsWith("/api/notifications/") && url.endsWith("/read")) {
      const notifId = url.split("/")[3];
      markAsRead(notifId);
      return { data: { success: true } };
    }
    
    // Default: return success
    return { data: { success: true } };
  },
  
  async put(url, data = {}, config = {}) {
    await delay(400);
    
    // Profile update
    if (url === "/api/profile/me") {
      const user = getCurrentUser() || getCurrentDemoUser();
      
      // Handle FormData if it's a FormData object
      let profileUpdates = {};
      let gamingProfileUpdates = {};
      let profilePicture = null;
      let headerImage = null;
      
      if (data instanceof FormData) {
        // Parse FormData entries
        for (const [key, value] of data.entries()) {
          if (key.startsWith("profile.")) {
            const profileKey = key.replace("profile.", "");
            if (profileKey === "profilePicture") {
              profilePicture = value;
            } else if (profileKey === "headerImage") {
              headerImage = value;
            } else {
              profileUpdates[profileKey] = value;
            }
          } else if (key.startsWith("gamingProfile.")) {
            const gamingKey = key.replace("gamingProfile.", "");
            gamingProfileUpdates[gamingKey] = value;
          } else if (key === "profilePicture") {
            // Handle file upload
            profilePicture = value;
          } else if (key === "headerImage") {
            // Handle file upload
            headerImage = value;
          }
        }
      } else {
        // Regular object data
        profileUpdates = data.profile || {};
        gamingProfileUpdates = data.gamingProfile || {};
        profilePicture = data.profilePicture;
        headerImage = data.headerImage;
      }
      
      // Build updated user object
      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          ...profileUpdates,
        },
        gamingProfile: {
          ...user.gamingProfile,
          ...gamingProfileUpdates,
        },
      };
      
      // Handle profile picture (if it's a string URL, use it; if it's a File, convert to data URL)
      if (profilePicture) {
        if (typeof profilePicture === "string") {
          updatedUser.profile.profilePicture = profilePicture;
          // Save to avatar manager (will determine if custom or random)
          saveUserAvatar(profilePicture);
        } else if (profilePicture instanceof File) {
          // For demo mode, convert File to data URL
          // Use a Promise to handle the async FileReader
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(profilePicture);
          });
          updatedUser.profile.profilePicture = dataUrl;
          // Save custom upload to localStorage
          saveUserAvatar(dataUrl);
        }
      }
      
      // Handle header image
      if (headerImage) {
        if (typeof headerImage === "string") {
          updatedUser.profile.headerImage = headerImage;
          // Save to header manager (will determine if custom or random)
          saveUserHeader(headerImage);
        } else if (headerImage instanceof File) {
          // For demo mode, convert File to data URL
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(headerImage);
          });
          updatedUser.profile.headerImage = dataUrl;
          // Save custom upload to localStorage
          saveUserHeader(dataUrl);
        }
      }
      
      // Save profile data to localStorage using avatarManager
      // Include profilePicture and headerImage in profile data so they persist
      // The saveUserAvatar/saveUserHeader functions handle whether they go to localStorage (custom) or sessionStorage (random)
      const profileDataToSave = {
        displayName: updatedUser.profile.displayName,
        bio: updatedUser.profile.bio,
        location: updatedUser.profile.location,
        website: updatedUser.profile.website,
        profilePicture: updatedUser.profile.profilePicture, // Include in profile data for persistence
        headerImage: updatedUser.profile.headerImage, // Include in profile data for persistence
            headerImagePosition: updatedUser.profile.headerImagePosition,
            verified: updatedUser.profile.verified,
            joinedDate: updatedUser.profile.joinedDate,
          };
      // Save profile data (this will save to localStorage, but avatar/header are also saved separately)
      saveUserProfile(profileDataToSave);
      
      // Also save to gtafanhub-auth for compatibility
      localStorage.setItem("gtafanhub-auth", JSON.stringify(updatedUser));
      
      return { data: { user: updatedUser } };
    }
    
    // Post update
    if (url.startsWith("/api/posts/")) {
      const postId = url.split("/")[3];
      const post = mockPostsStorage.find((p) => p._id === postId);
      if (post) {
        post.content = data.content || post.content;
        post.isEdited = true;
        return { data: { post } };
      }
    }
    
    // Comment update
    if (url.startsWith("/api/comments/")) {
      const commentId = url.split("/")[3];
      return { data: { success: true } };
    }
    
    return { data: { success: true } };
  },
  
  async delete(url, config = {}) {
    await delay(300);
    
    // Post delete
    if (url.startsWith("/api/posts/")) {
      const postId = url.split("/")[3];
      const index = mockPostsStorage.findIndex((p) => p._id === postId);
      if (index > -1) {
        mockPostsStorage.splice(index, 1);
      }
      return { data: { success: true } };
    }
    
    // Comment delete
    if (url.startsWith("/api/comments/")) {
      return { data: { success: true } };
    }
    
    // Unfollow
    if (url.startsWith("/api/users/") && url.endsWith("/follow")) {
      const userId = url.split("/")[3];
      localStorage.setItem(`following_${userId}`, "false");
      return { data: { success: true, following: false } };
    }
    
    // Notification delete
    if (url.startsWith("/api/notifications/")) {
      return { data: { success: true } };
    }
    
    return { data: { success: true } };
  },
  
  async patch(url, data = {}, config = {}) {
    await delay(300);
    
    // Mark all notifications as read
    if (url === "/api/notifications/mark-all-read") {
      markAllAsRead();
      return { data: { success: true } };
    }
    
    return { data: { success: true } };
  },
};

// Export default (mimics axios default export)
export default mockApi;

// Export helper function for token refresh (for compatibility)
export const refreshAccessToken = async () => {
  await delay(200);
  const user = getCurrentUser();
  if (user) {
    const newToken = "demo_token_" + Date.now();
    localStorage.setItem("accessToken", newToken);
    return newToken;
  }
  throw new Error("Not authenticated");
};

