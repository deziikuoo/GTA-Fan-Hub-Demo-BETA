// server/services/feedService.js

import Post from "../models/Post.js";
import Follow from "../models/Follow.js";
import Block from "../models/Block.js";
import Engagement from "../models/Engagement.js";

class FeedService {
  /**
   * Get Following feed (chronological)
   * @param {string} userId - Current user ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} Posts from followed users
   */
  static async getFollowingFeed(userId, options = {}) {
    const { limit = 20, lastPostId = null, lastPostDate = null } = options;

    try {
      // Get list of users current user follows
      const following = await Follow.find({
        follower: userId,
        status: "active",
      }).select("following");

      const followingIds = following.map((f) => f.following);

      // Include user's own posts in feed
      followingIds.push(userId);

      // Get blocked users to exclude
      const blockedUserIds = await Block.getBlockedUserIds(userId);

      // Filter out blocked users
      const filteredFollowingIds = followingIds.filter(
        (id) => !blockedUserIds.includes(id.toString())
      );

      // Build query
      const query = {
        author: { $in: filteredFollowingIds },
        status: "active",
        $or: [
          { privacy: "public" },
          { privacy: "followers", author: { $in: filteredFollowingIds } },
        ],
      };

      // Cursor-based pagination
      if (lastPostId && lastPostDate) {
        query.$and = [
          {
            $or: [
              { createdAt: { $lt: new Date(lastPostDate) } },
              {
                createdAt: new Date(lastPostDate),
                _id: { $lt: lastPostId },
              },
            ],
          },
        ];
      }

      // Fetch posts
      const posts = await Post.getFeedPosts(query, {
        limit,
        sort: { createdAt: -1 },
      });

      // Check user's engagement with posts (likes, bookmarks)
      if (posts.length > 0) {
        const postIds = posts.map((p) => p._id);
        const [likesMap, bookmarksMap] = await Promise.all([
          Engagement.bulkCheck(userId, postIds, "post", "like"),
          Engagement.bulkCheck(userId, postIds, "post", "bookmark"),
        ]);

        // Attach engagement status to each post
        posts.forEach((post) => {
          post._doc.userEngagement = {
            isLiked: likesMap[post._id.toString()] || false,
            isBookmarked: bookmarksMap[post._id.toString()] || false,
          };
        });
      }

      return posts;
    } catch (error) {
      console.error("Error fetching following feed:", error);
      throw error;
    }
  }

  /**
   * Get For You feed (algorithmic)
   * @param {string} userId - Current user ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} Algorithmically ranked posts
   */
  static async getForYouFeed(userId, options = {}) {
    const { limit = 20, skip = 0 } = options;

    try {
      // Get blocked users to exclude
      const blockedUserIds = await Block.getBlockedUserIds(userId);

      // Get posts from last 48 hours (recent content)
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      // Build query
      const query = {
        createdAt: { $gte: twoDaysAgo },
        status: "active",
        privacy: "public", // Only public posts in For You
        author: { $nin: blockedUserIds },
      };

      // Fetch posts sorted by engagement score
      const posts = await Post.getFeedPosts(query, {
        limit: limit * 2, // Fetch more for diversification
        skip,
        sort: { engagementScore: -1, createdAt: -1 },
      });

      // TODO: Implement seen posts tracking (Redis set)
      // Filter out posts user has already seen

      // Diversify feed - max 2 posts per author in single page
      const diversifiedPosts = this.diversifyFeed(posts, 2);

      // Get user's following list to inject some posts from followed users (30%)
      const following = await Follow.find({
        follower: userId,
        status: "active",
      })
        .select("following")
        .limit(50);

      const followingIds = following.map((f) => f.following.toString());

      if (followingIds.length > 0) {
        // Get recent posts from followed users
        const followingPosts = await Post.getFeedPosts(
          {
            author: { $in: followingIds },
            status: "active",
            createdAt: { $gte: twoDaysAgo },
          },
          {
            limit: Math.ceil(limit * 0.3), // 30% of feed
            sort: { createdAt: -1 },
          }
        );

        // Inject following posts into feed
        diversifiedPosts.push(...followingPosts);
      }

      // Shuffle and limit
      const shuffled = this.shuffleArray(diversifiedPosts).slice(0, limit);

      // Check user's engagement with posts
      if (shuffled.length > 0) {
        const postIds = shuffled.map((p) => p._id);
        const [likesMap, bookmarksMap] = await Promise.all([
          Engagement.bulkCheck(userId, postIds, "post", "like"),
          Engagement.bulkCheck(userId, postIds, "post", "bookmark"),
        ]);

        shuffled.forEach((post) => {
          post._doc.userEngagement = {
            isLiked: likesMap[post._id.toString()] || false,
            isBookmarked: bookmarksMap[post._id.toString()] || false,
          };
        });
      }

      return shuffled;
    } catch (error) {
      console.error("Error fetching For You feed:", error);
      throw error;
    }
  }

  /**
   * Get trending posts (top engagement in last 24 hours)
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} Trending posts
   */
  static async getTrendingFeed(options = {}) {
    const { limit = 20, skip = 0 } = options;

    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const posts = await Post.getFeedPosts(
        {
          createdAt: { $gte: oneDayAgo },
          status: "active",
          privacy: "public",
        },
        {
          limit,
          skip,
          sort: { engagementScore: -1 },
        }
      );

      return posts;
    } catch (error) {
      console.error("Error fetching trending feed:", error);
      throw error;
    }
  }

  /**
   * Get posts by hashtag
   * @param {string} hashtag - Hashtag to search
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} Posts with hashtag
   */
  static async getHashtagFeed(hashtag, options = {}) {
    const { limit = 20, skip = 0 } = options;

    try {
      const posts = await Post.getFeedPosts(
        {
          "content.hashtags": hashtag.toLowerCase(),
          status: "active",
          privacy: "public",
        },
        {
          limit,
          skip,
          sort: { createdAt: -1 },
        }
      );

      return posts;
    } catch (error) {
      console.error("Error fetching hashtag feed:", error);
      throw error;
    }
  }

  /**
   * Get user's posts (for profile)
   * @param {string} userId - User ID
   * @param {string} requesterId - ID of user requesting (for privacy check)
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} User's posts
   */
  static async getUserPosts(userId, requesterId = null, options = {}) {
    const { limit = 20, skip = 0 } = options;

    try {
      const query = {
        author: userId,
        status: "active",
      };

      // Privacy check
      if (requesterId !== userId) {
        // Check if requester follows user
        const isFollowing = requesterId
          ? await Follow.isFollowing(requesterId, userId)
          : false;

        if (isFollowing) {
          // Can see public and followers-only posts
          query.privacy = { $in: ["public", "followers"] };
        } else {
          // Can only see public posts
          query.privacy = "public";
        }
      }
      // If viewing own profile, see all posts (no privacy filter)

      const posts = await Post.getFeedPosts(query, {
        limit,
        skip,
        sort: { createdAt: -1 },
      });

      // Check requester's engagement if authenticated
      if (requesterId && posts.length > 0) {
        const postIds = posts.map((p) => p._id);
        const [likesMap, bookmarksMap] = await Promise.all([
          Engagement.bulkCheck(requesterId, postIds, "post", "like"),
          Engagement.bulkCheck(requesterId, postIds, "post", "bookmark"),
        ]);

        posts.forEach((post) => {
          post._doc.userEngagement = {
            isLiked: likesMap[post._id.toString()] || false,
            isBookmarked: bookmarksMap[post._id.toString()] || false,
          };
        });
      }

      return posts;
    } catch (error) {
      console.error("Error fetching user posts:", error);
      throw error;
    }
  }

  /**
   * Search posts by text
   * @param {string} searchQuery - Search query
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} Search results
   */
  static async searchPosts(searchQuery, options = {}) {
    const { limit = 20, skip = 0 } = options;

    try {
      const posts = await Post.find({
        $text: { $search: searchQuery },
        status: "active",
        privacy: "public",
      })
        .sort({ score: { $meta: "textScore" }, createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate(
          "author",
          "username profile.displayName profile.profilePicture profile.verified"
        )
        .populate({
          path: "originalPost",
          populate: {
            path: "author",
            select: "username profile.displayName profile.profilePicture",
          },
        });

      return posts;
    } catch (error) {
      console.error("Error searching posts:", error);
      throw error;
    }
  }

  /**
   * Diversify feed by limiting posts per author
   * @param {Array} posts - Posts array
   * @param {number} maxPerAuthor - Max posts per author
   * @returns {Array} Diversified posts
   */
  static diversifyFeed(posts, maxPerAuthor = 2) {
    const authorCounts = {};
    const diversified = [];

    for (const post of posts) {
      const authorId = post.author._id.toString();
      authorCounts[authorId] = (authorCounts[authorId] || 0) + 1;

      if (authorCounts[authorId] <= maxPerAuthor) {
        diversified.push(post);
      }
    }

    return diversified;
  }

  /**
   * Shuffle array (Fisher-Yates algorithm)
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export default FeedService;
