// Mock feed data for demo
import { mockPosts } from "./posts.js";

// Get user-created posts from sessionStorage
function getUserCreatedPosts() {
  const stored = sessionStorage.getItem("gtafanhub-user-posts");
  if (stored) {
    try {
      const posts = JSON.parse(stored);
      // Convert date strings back to Date objects
      return posts.map(post => ({
        ...post,
        createdAt: new Date(post.createdAt),
        author: {
          ...post.author,
          createdAt: post.author.createdAt ? new Date(post.author.createdAt) : new Date(),
          profile: {
            ...post.author.profile,
            joinedDate: post.author.profile?.joinedDate ? new Date(post.author.profile.joinedDate) : new Date(),
          },
        },
      }));
    } catch {
      return [];
    }
  }
  return [];
}

// Base feed arrays (mock posts only)
const baseFollowingFeed = [
  mockPosts[0],  // post1 - Text post
  mockPosts[1],  // post2 - Single image
  mockPosts[2],  // post3 - Repost
  mockPosts[6],  // post7 - Multi-image (3)
  mockPosts[7],  // post8 - Multi-image (4)
  mockPosts[8],  // post9 - Video post
  mockPosts[11], // post12 - Repost of multi-image
  mockPosts[12], // post13 - High engagement text
  mockPosts[14], // post15 - Multi-image (2)
  mockPosts[15], // post16 - Video post
  mockPosts[18], // post19 - Repost of video
  mockPosts[19], // post20 - Multi-image (3) high engagement
];

const baseForYouFeed = [
  mockPosts[3],  // post4 - Multi-image (2)
  mockPosts[4],  // post5 - Single image
  mockPosts[5],  // post6 - Text post edited
  mockPosts[6],  // post7 - Multi-image (3)
  mockPosts[7],  // post8 - Multi-image (4)
  mockPosts[8],  // post9 - Video post
  mockPosts[9],  // post10 - Quote post with image
  mockPosts[10], // post11 - Quote post with video
  mockPosts[12], // post13 - High engagement text
  mockPosts[13], // post14 - Single image
  mockPosts[14], // post15 - Multi-image (2)
  mockPosts[15], // post16 - Video post
  mockPosts[16], // post17 - Quote with multi-image
  mockPosts[17], // post18 - Edited text post
  mockPosts[19], // post20 - Multi-image (3) high engagement
];

const baseTrendingFeed = [
  mockPosts[17], // post18 - Highest engagement (5678 likes)
  mockPosts[19], // post20 - High engagement (4567 likes)
  mockPosts[7],  // post8 - High engagement (2345 likes)
  mockPosts[12], // post13 - High engagement (3456 likes)
  mockPosts[15], // post16 - Video high engagement (2345 likes)
  mockPosts[8],  // post9 - Video post (1456 likes)
  mockPosts[3],  // post4 - Multi-image (1234 likes)
  mockPosts[14], // post15 - Multi-image (1234 likes)
  mockPosts[6],  // post7 - Multi-image (892 likes)
  mockPosts[1],  // post2 - Single image (567 likes)
  mockPosts[0],  // post1 - Text post (234 likes)
  mockPosts[2],  // post3 - Repost (189 likes)
];

// Dynamic feed getters that include user posts
function getFollowingFeed() {
  const userCreatedPosts = getUserCreatedPosts();
  return [...userCreatedPosts, ...baseFollowingFeed];
}

function getForYouFeed() {
  const userCreatedPosts = getUserCreatedPosts();
  return [...userCreatedPosts, ...baseForYouFeed];
}

function getTrendingFeed() {
  const userCreatedPosts = getUserCreatedPosts();
  return [...userCreatedPosts, ...baseTrendingFeed];
}

// Helper to get feed by type
export function getFeed(feedType = "for-you", page = 1, limit = 10) {
  let feed = [];
  
  switch (feedType) {
    case "following":
      feed = getFollowingFeed();
      break;
    case "for-you":
      feed = getForYouFeed();
      break;
    case "trending":
      feed = getTrendingFeed();
      break;
    default:
      feed = getForYouFeed();
  }
  
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    posts: feed.slice(start, end),
    total: feed.length,
    page,
    limit,
    hasMore: end < feed.length,
  };
}

// Helper to get user posts (for profile pages)
export function getUserPosts(userId, page = 1, limit = 10) {
  const sessionUserPosts = getUserCreatedPosts();
  const allUserPosts = [...sessionUserPosts, ...mockPosts].filter((post) => post.author._id === userId);
  
  // Sort by date (newest first)
  allUserPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    posts: allUserPosts.slice(start, end),
    total: allUserPosts.length,
    page,
    limit,
    hasMore: end < allUserPosts.length,
  };
}

