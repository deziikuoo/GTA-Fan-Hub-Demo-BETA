import "dotenv/config";
import mongoose from "mongoose";
import Parser from "rss-parser";
import axios from "axios";
import cron from "node-cron";
import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";

const parser = new Parser();
const app = express();
const port = 3004;

// Configure CORS to allow requests from the frontend
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3003"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.CONNECTION_STRING, {
    retryWrites: true,
    retryReads: true,
  })
  .then(() => {
    console.log(`🗄️  Database: Connected successfully`);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    setTimeout(() => mongoose.connect(process.env.CONNECTION_STRING), 5000);
  });

// Define database schemas
const newsSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    content: String,
    pubDate: Date,
    link: { type: String, unique: true },
    author: String,
    source: String,
    sourceType: {
      type: String,
      enum: ["rss", "reddit"],
      default: "rss",
    },
    redditData: new mongoose.Schema(
      {
        subreddit: String,
        author: String,
        upvotes: Number,
        postId: String,
        flair: String,
        isSelfPost: { type: Boolean, default: false },
        thumbnail: String,
        preview: String,
        subredditIcon: String,
      },
      { _id: false }
    ),
    enclosure: new mongoose.Schema(
      { url: String, type: String, length: String },
      { _id: false }
    ),
  },
  { autoIndex: false }
);
delete mongoose.connection.models["NewsArticle"];
const NewsArticle = mongoose.model("NewsArticle", newsSchema);

// Social Media Articles Schema (for Reddit posts)
const socialMediaSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    pubDate: Date,
    link: { type: String, unique: true },
    author: String,
    source: String,
    sourceType: { type: String, enum: ["reddit"], default: "reddit" },
    redditData: new mongoose.Schema(
      {
        subreddit: String,
        author: String,
        upvotes: Number,
        postId: String,
        flair: String,
        isSelfPost: { type: Boolean, default: false },
        thumbnail: String,
        preview: String,
        subredditIcon: String,
      },
      { _id: false }
    ),
    enclosure: new mongoose.Schema(
      { url: String, type: String, length: String },
      { _id: false }
    ),
  },
  { autoIndex: false }
);

const SocialMediaArticle = mongoose.model(
  "SocialMediaArticle",
  socialMediaSchema
);

// Reddit API configuration
const REDDIT_CLIENT_ID =
  process.env.REDDIT_CLIENT_ID || "I2fEDXpH_JZhYK8g2_Th3Q";
const REDDIT_CLIENT_SECRET =
  process.env.REDDIT_CLIENT_SECRET || "uhsYSbV5fg4jZbvk6UZPSMKy0cvgAQ";
const REDDIT_USER_AGENT = "GTAFanHub/1.0 by deziikuoo";

// Reddit subreddits to monitor
const redditSubreddits = process.env.REDDIT_SUBREDDITS
  ? process.env.REDDIT_SUBREDDITS.split(",").map((sub) => sub.trim())
  : ["GTA6", "GTA", "rockstar"];

// Reddit access token (will be fetched)
let redditAccessToken = null;
const subredditIcons = new Map(); // Cache for subreddit icons
const userAvatars = new Map(); // Cache for user avatars
let cacheDisabled = false; // Flag to disable caching - ENABLED BY DEFAULT

const feedUrls = [
  "https://www.ign.com/rss/v2/articles/feed",
  "https://www.ign.com/rss/v2/videos/feed",
  //"https://www.ign.com/rss/wikis/feed", Create Help Guidesm and Wiki page for this link
  "https://www.gamespot.com/feeds/news/",
  "https://www.polygon.com/rss/index.xml",
  "https://kotaku.com/rss",
  "https://www.eurogamer.net/feed",
  "https://www.gamesradar.com/feeds.xml",
  "https://gtaforums.com/forum/430-gta-6.xml/?member=&type=rss",
];

// Enhanced extraction for images and videos from HTML content
function extractMediaFromContent(content) {
  if (!content) return null;

  try {
    const $ = cheerio.load(content);

    // Try to get video first (videos are often more engaging)
    const video = $(
      "video, iframe[src*='youtube'], iframe[src*='vimeo'], embed[src*='video']"
    ).first();
    if (video.length) {
      let videoUrl = video.attr("src") || video.attr("data-src");
      if (!videoUrl && video.is("iframe")) {
        // Handle YouTube embeds
        const embedSrc = video.attr("src");
        if (embedSrc && embedSrc.includes("youtube")) {
          videoUrl = embedSrc;
        }
      }

      if (
        videoUrl &&
        (videoUrl.startsWith("http") || videoUrl.startsWith("//"))
      ) {
        return {
          url: videoUrl.startsWith("//") ? "https:" + videoUrl : videoUrl,
          type: "video/mp4",
        };
      }
    }

    // If no video, try to get image
    const img = $("img").first();
    if (img.length) {
      let imgUrl =
        img.attr("src") || img.attr("data-src") || img.attr("data-original");

      // Handle relative URLs
      if (imgUrl && !imgUrl.startsWith("http") && !imgUrl.startsWith("//")) {
        // Try to construct full URL from common forum patterns
        if (imgUrl.startsWith("/")) {
          // This is a root-relative URL, we'd need the base domain
          // For now, skip these as we don't know the domain
          return null;
        }
      }

      if (imgUrl && (imgUrl.startsWith("http") || imgUrl.startsWith("//"))) {
        return {
          url: imgUrl.startsWith("//") ? "https:" + imgUrl : imgUrl,
          type: "image/jpeg",
        };
      }
    }

    // Try to extract from data attributes or other sources
    const dataImg = $("[data-src], [data-original], [data-lazy]").first();
    if (dataImg.length) {
      const dataUrl =
        dataImg.attr("data-src") ||
        dataImg.attr("data-original") ||
        dataImg.attr("data-lazy");
      if (dataUrl && (dataUrl.startsWith("http") || dataUrl.startsWith("//"))) {
        return {
          url: dataUrl.startsWith("//") ? "https:" + dataUrl : dataUrl,
          type:
            dataUrl.includes("video") || dataUrl.includes("mp4")
              ? "video/mp4"
              : "image/jpeg",
        };
      }
    }
  } catch (error) {
    console.error("Error extracting media from content:", error.message);
  }

  return null;
}

// Keep the old function name for compatibility but use enhanced logic
function extractImageFromContent(content) {
  return extractMediaFromContent(content);
}

function isGTA6Related(item) {
  const keywords = ["GTA 6", "Grand Theft Auto VI", "Rockstar Games"];
  const content = `${item.title || ""} ${item.content || ""} ${
    item.contentSnippet || ""
  }`.toLowerCase();
  return keywords.some((keyword) => content.includes(keyword.toLowerCase()));
}

// Reddit API functions with caching integration
async function getRedditAccessToken() {
  try {
    const response = await axios.post(
      "https://www.reddit.com/api/v1/access_token",
      new URLSearchParams({
        grant_type: "client_credentials",
      }),
      {
        auth: {
          username: REDDIT_CLIENT_ID,
          password: REDDIT_CLIENT_SECRET,
        },
        headers: {
          "User-Agent": REDDIT_USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    redditAccessToken = response.data.access_token;
    // Removed verbose Reddit token log
    return redditAccessToken;
  } catch (error) {
    console.error("Error getting Reddit access token:", error.message);
    return null;
  }
}

async function scrapeSubredditIcon(subreddit) {
  try {
    // Removed verbose subreddit scraping log
    const response = await axios.get(`https://www.reddit.com/r/${subreddit}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Try multiple selectors for subreddit icon
    let iconUrl = null;

    // Check meta tags first
    iconUrl =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('meta[property="twitter:image"]').attr("content");

    // If no meta tag, try subreddit icon selectors
    if (!iconUrl) {
      iconUrl =
        $('img[alt*="subreddit"]').attr("src") ||
        $('img[class*="subreddit"]').attr("src") ||
        $('img[class*="icon"]').attr("src") ||
        $(".subreddit-icon img").attr("src") ||
        $(".community-icon img").attr("src") ||
        $('img[src*="subreddit"]').attr("src");
    }

    if (iconUrl && iconUrl !== "" && !iconUrl.includes("default")) {
      // Make sure it's a full URL
      if (iconUrl.startsWith("//")) {
        iconUrl = "https:" + iconUrl;
      } else if (iconUrl.startsWith("/")) {
        iconUrl = "https://www.reddit.com" + iconUrl;
      }

      // Removed verbose icon found log
      return iconUrl;
    }
  } catch (error) {
    console.error(
      `Error scraping subreddit icon for r/${subreddit}:`,
      error.message
    );
  }

  return null;
}

async function getSubredditIcon(subreddit) {
  // Check cache first (unless disabled)
  if (!cacheDisabled && subredditIcons.has(subreddit)) {
    return subredditIcons.get(subreddit);
  }

  // Try web scraping first
  const scrapedIcon = await scrapeSubredditIcon(subreddit);
  if (scrapedIcon) {
    subredditIcons.set(subreddit, scrapedIcon);
    return scrapedIcon;
  }

  // Try direct Reddit icon URL (no auth needed)
  const directIconUrl = `https://www.reddit.com/r/${subreddit}/icon.png`;
  try {
    const response = await axios.head(directIconUrl);
    if (response.status === 200) {
      subredditIcons.set(subreddit, directIconUrl);
      // Removed verbose direct icon log
      return directIconUrl;
    }
  } catch (error) {
    console.log(`No direct icon for r/${subreddit}, trying API...`);
  }

  // Try Reddit API if direct URL fails
  if (!redditAccessToken) {
    await getRedditAccessToken();
  }

  if (!redditAccessToken) {
    const fallbackIcon = `https://ui-avatars.com/api/?name=${subreddit}&background=ff6b35&color=fff&size=128`;
    subredditIcons.set(subreddit, fallbackIcon);
    return fallbackIcon;
  }

  try {
    const response = await axios.get(
      `https://oauth.reddit.com/r/${subreddit}/about`,
      {
        headers: {
          Authorization: `Bearer ${redditAccessToken}`,
          "User-Agent": REDDIT_USER_AGENT,
        },
      }
    );

    const iconUrl = response.data.data.icon_img;
    // Removed verbose API icon log
    if (iconUrl && iconUrl !== "") {
      subredditIcons.set(subreddit, iconUrl);
      return iconUrl;
    }
  } catch (error) {
    console.error(
      `Error fetching subreddit icon for r/${subreddit}:`,
      error.message
    );
  }

  // Final fallback to UI Avatars
  const fallbackIcon = `https://ui-avatars.com/api/?name=${subreddit}&background=ff6b35&color=fff&size=128`;
  subredditIcons.set(subreddit, fallbackIcon);
  return fallbackIcon;
}

async function scrapeUserAvatar(username) {
  try {
    // Removed verbose user avatar scraping log
    const response = await axios.get(
      `https://www.reddit.com/user/${username}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        timeout: 10000,
      }
    );

    const $ = cheerio.load(response.data);

    // Try multiple selectors for avatar
    let avatarUrl = null;

    // Check meta tags first
    avatarUrl =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('meta[property="twitter:image"]').attr("content");

    // If no meta tag, try profile image selectors
    if (!avatarUrl) {
      avatarUrl =
        $('img[alt*="avatar"]').attr("src") ||
        $('img[class*="avatar"]').attr("src") ||
        $('img[class*="profile"]').attr("src") ||
        $(".avatar img").attr("src") ||
        $(".profile-picture img").attr("src");
    }

    if (avatarUrl && avatarUrl !== "" && !avatarUrl.includes("default")) {
      // Make sure it's a full URL
      if (avatarUrl.startsWith("//")) {
        avatarUrl = "https:" + avatarUrl;
      } else if (avatarUrl.startsWith("/")) {
        avatarUrl = "https://www.reddit.com" + avatarUrl;
      }

      // Removed verbose user avatar found log
      return avatarUrl;
    }
  } catch (error) {
    console.error(`Error scraping user avatar for ${username}:`, error.message);
  }

  return null;
}

async function getUserAvatar(username) {
  // Check cache first (unless disabled)
  if (!cacheDisabled && userAvatars.has(username)) {
    return userAvatars.get(username);
  }

  // Try web scraping first
  const scrapedAvatar = await scrapeUserAvatar(username);
  if (scrapedAvatar) {
    userAvatars.set(username, scrapedAvatar);
    return scrapedAvatar;
  }

  // Fallback to Reddit API
  if (!redditAccessToken) {
    await getRedditAccessToken();
  }

  if (!redditAccessToken) {
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${username}&background=ff4500&color=fff&size=128`;
    userAvatars.set(username, fallbackAvatar);
    return fallbackAvatar;
  }

  try {
    const response = await axios.get(
      `https://oauth.reddit.com/user/${username}/about`,
      {
        headers: {
          Authorization: `Bearer ${redditAccessToken}`,
          "User-Agent": REDDIT_USER_AGENT,
        },
      }
    );

    const userData = response.data.data;
    // Removed verbose API data log

    // Try different avatar fields
    if (userData.icon_img && userData.icon_img !== "") {
      userAvatars.set(username, userData.icon_img);
      return userData.icon_img;
    }
    if (userData.snoovatar_img && userData.snoovatar_img !== "") {
      userAvatars.set(username, userData.snoovatar_img);
      return userData.snoovatar_img;
    }
  } catch (error) {
    console.error(`Error fetching user avatar for ${username}:`, error.message);
  }

  // Final fallback to UI Avatars
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${username}&background=ff4500&color=fff&size=128`;
  userAvatars.set(username, fallbackAvatar);
  return fallbackAvatar;
}

function isRedditPostRelevant(post) {
  const title = (post.title || "").toLowerCase();
  const selftext = (post.selftext || "").toLowerCase();
  const content = `${title} ${selftext}`;

  // Include keywords
  const includeKeywords = [
    "news",
    "leak",
    "rumor",
    "rumour",
    "theory",
    "speculation",
    "easter egg",
    "detail",
    "analysis",
    "trailer",
    "official",
    "rockstar",
    "reveal",
    "release date",
    "map",
    "gameplay",
    "discussion",
    "confirmed",
    "report",
    "insider",
  ];

  // Exclude keywords (memes/jokes)
  const excludeKeywords = [
    "meme",
    "joke",
    "shitpost",
    "funny",
    "lol",
    "lmao",
    "petition",
    "unpopular opinion",
    "am i the only one",
  ];

  // Check flair
  const flair = (post.link_flair_text || "").toLowerCase();
  const excludeFlairs = ["meme", "humor", "shitpost", "satire", "low effort"];

  // Must have include keywords
  const hasIncludeKeywords = includeKeywords.some((keyword) =>
    content.includes(keyword)
  );

  // Must not have exclude keywords
  const hasExcludeKeywords = excludeKeywords.some((keyword) =>
    content.includes(keyword)
  );

  // Must not have exclude flairs
  const hasExcludeFlair = excludeFlairs.some((excludeFlair) =>
    flair.includes(excludeFlair)
  );

  // Must have decent upvotes (filter out low-quality posts)
  const hasGoodUpvotes = post.ups >= 10;

  return (
    hasIncludeKeywords &&
    !hasExcludeKeywords &&
    !hasExcludeFlair &&
    hasGoodUpvotes
  );
}

async function processRedditPost(post) {
  // Fetch both subreddit icon and user avatar
  const [subredditIcon, userAvatar] = await Promise.all([
    getSubredditIcon(post.subreddit),
    getUserAvatar(post.author),
  ]);

  const baseArticle = {
    title: post.title,
    description: post.selftext || post.title,
    link: `https://reddit.com${post.permalink}`,
    pubDate: new Date(post.created_utc * 1000),
    author: post.author,
    source: `https://reddit.com/r/${post.subreddit}`,
    sourceType: "reddit",
    redditData: {
      subreddit: post.subreddit,
      author: post.author,
      authorAvatar: userAvatar, // Fetch actual user avatar from Reddit API
      upvotes: post.ups,
      postId: post.id,
      flair: post.link_flair_text || "",
      isSelfPost: post.is_self,
      thumbnail:
        post.thumbnail && post.thumbnail !== "self" ? post.thumbnail : null,
      preview: post.preview ? post.preview.images[0]?.source?.url : null,
      subredditIcon: subredditIcon,
    },
  };

  // Add media if available
  if (post.preview && post.preview.images[0]) {
    const imageUrl = post.preview.images[0].source.url.replace(/&amp;/g, "&");
    baseArticle.enclosure = {
      url: imageUrl,
      type: "image/jpeg",
      length: "0",
    };
  }

  return baseArticle;
}

async function fetchRedditPosts(daysBack = 7) {
  if (!redditAccessToken) {
    await getRedditAccessToken();
  }

  if (!redditAccessToken) {
    console.log("No Reddit access token available");
    return [];
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const allPosts = [];

  for (const subreddit of redditSubreddits) {
    try {
      // Removed verbose Reddit fetching log

      const response = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/hot.json?limit=25`,
        {
          headers: {
            Authorization: `Bearer ${redditAccessToken}`,
            "User-Agent": REDDIT_USER_AGENT,
          },
        }
      );

      const posts = response.data.data.children.map((child) => child.data);
      const relevantPosts = posts.filter(isRedditPostRelevant);

      // Removed verbose posts found log

      // Process and filter by date
      const filteredPosts = relevantPosts.filter(
        (post) => new Date(post.created_utc * 1000) >= cutoffDate
      );
      const processedPosts = await Promise.all(
        filteredPosts.map(processRedditPost)
      );

      allPosts.push(...processedPosts);
    } catch (error) {
      console.error(`Error fetching from r/${subreddit}:`, error.message);
    }
  }

  return allPosts;
}

function processArticle(item) {
  // Try to get media from enclosure first, then extract from content
  let enclosure = item.enclosure || null;

  // If no enclosure, try to extract media from HTML content
  if (!enclosure && item.content) {
    enclosure = extractMediaFromContent(item.content);
  }

  // If still no enclosure and there's encoded content, try that
  if (!enclosure && item["content:encoded"]) {
    enclosure = extractMediaFromContent(item["content:encoded"]);
  }

  // Try other common content fields that forums might use
  if (!enclosure && item.description) {
    enclosure = extractMediaFromContent(item.description);
  }

  // Try summary field
  if (!enclosure && item.summary) {
    enclosure = extractMediaFromContent(item.summary);
  }

  const baseArticle = {
    title: item.title || "No title",
    link: item.link || "",
    pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
    description: item.contentSnippet || item.description || "",
    content: item["content:encoded"] || item.content || "",
    author: item.creator || item.author || "Unknown",
    source: item.source || item.link,
    enclosure: enclosure,
    sourceType: "rss",
  };

  return baseArticle;
}

async function fetchRssFeeds(daysBack = 90) {
  const start = performance.now();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const MAX_ARTICLES_PER_FEED = 5000;

  const allNewArticles = [];
  const fetchStats = { newArticles: 0, skipped: 0, errors: 0, sources: {} }; // Track stats

  // In-memory deduplication: Track seen links during this fetch cycle
  const seenLinks = new Set();

  for (const url of feedUrls) {
    try {
      console.log(`Processing RSS feed: ${url}`);
      const response = await axios.head(url);
      if (response.status !== 200) {
        console.warn(
          `Skipping invalid feed URL: ${url} (Status: ${response.status})`
        );
        fetchStats.skipped++;
        continue;
      }
      const feed = await parser.parseURL(url);
      console.log(`Feed items count: ${feed.items ? feed.items.length : 0}`);

      // For RSS feeds, use GTA6 filtering
      const processedItems = feed.items
        .filter((item) => {
          const itemDate = new Date(item.pubDate);
          return itemDate >= cutoffDate && isGTA6Related(item);
        })
        .slice(0, MAX_ARTICLES_PER_FEED)
        .map((item) => processArticle(item));

      console.log(`GTA6-related items found: ${processedItems.length}`);

      let newCount = 0;
      for (const article of processedItems) {
        try {
          // Skip if we've already seen this link in this fetch cycle
          if (seenLinks.has(article.link)) {
            fetchStats.skipped++;
            continue;
          }

          // Removed verbose article processing log
          const existingArticle = await NewsArticle.findOne({
            link: article.link,
          });
          if (!existingArticle) {
            const savedArticle = await NewsArticle.create(article);
            allNewArticles.push(savedArticle);
            seenLinks.add(article.link); // Mark as seen
            newCount++;
            fetchStats.newArticles++;
          } else {
            seenLinks.add(article.link); // Mark as seen even if it exists
            fetchStats.skipped++;
          }
        } catch (saveError) {
          console.error(
            `Error saving article from ${url}: ${saveError.message}`
          );
          fetchStats.errors++;
        }
      }
      fetchStats.sources[url] = newCount; // Track articles per source
      console.log(`Saved ${newCount} new articles from ${url}`);
    } catch (error) {
      console.error(`Error fetching feed from ${url}: ${error.message}`);
      if (error.response?.status === 429) {
        console.warn(`Rate limit hit for ${url}. Reduce fetch frequency.`);
      }
      fetchStats.errors++;
    }
  }

  console.log(
    `RSS feeds processed. Total new articles: ${allNewArticles.length}`
  );

  // Fetch Reddit posts using the same caching system
  try {
    console.log("Fetching Reddit posts...");
    const redditPosts = await fetchRedditPosts(daysBack);

    for (const redditPost of redditPosts) {
      try {
        // Skip if we've already seen this link in this fetch cycle
        if (seenLinks.has(redditPost.link)) {
          fetchStats.skipped++;
          continue;
        }

        const existingArticle = await SocialMediaArticle.findOne({
          link: redditPost.link,
        });
        if (!existingArticle) {
          await SocialMediaArticle.create(redditPost);
          allNewArticles.push(redditPost);
          seenLinks.add(redditPost.link); // Mark as seen
          fetchStats.newArticles++;
          console.log(`Saved new Reddit post: ${redditPost.title}`);
        } else {
          seenLinks.add(redditPost.link); // Mark as seen even if it exists
          fetchStats.skipped++;
        }
      } catch (saveError) {
        console.error(`Error saving Reddit post: ${saveError.message}`);
        fetchStats.errors++;
      }
    }

    fetchStats.sources["reddit"] = redditPosts.length;
    console
      .log
      // Removed verbose Reddit processing log
      ();
  } catch (error) {
    console.error(`Error fetching Reddit posts: ${error.message}`);
    fetchStats.errors++;
  }

  const end = performance.now();
  // Removed verbose RSS parsing time log
  return {
    articles: allNewArticles,
    executionTime: end - start,
    stats: fetchStats,
  };
}

// Cleanup job: Remove articles older than 1 year
async function cleanupOldArticles() {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const result = await NewsArticle.deleteMany({
      pubDate: { $lt: oneYearAgo },
    });
    console.log(
      `Cleanup job: Removed ${result.deletedCount} articles older than 1 year.`
    );
  } catch (error) {
    console.error(`Error in cleanup job: ${error.message}`);
  }
}

// Create TTL index for NewsArticle collection
async function createTtlIndex() {
  try {
    await NewsArticle.collection.createIndex(
      { pubDate: 1 },
      { expireAfterSeconds: 31536000 } // 1 year in seconds (365 * 24 * 60 * 60)
    );
    console.log(
      "TTL index created on NewsArticle.pubDate for 1-year expiration."
    );
  } catch (error) {
    if (error.codeName === "IndexOptionsConflict") {
      console.log("TTL index already exists on NewsArticle.pubDate.");
    } else {
      console.error(`Error creating TTL index: ${error.message}`);
    }
  }
}

// Initialize TTL index and schedule cleanup job
mongoose.connection.once("open", async () => {
  createTtlIndex();
  console.log("RSS server initialized - TTL index created");
  // Schedule cleanup job to run daily at midnight
  cron.schedule("0 0 * * *", () => {
    console.log("Running daily cleanup job for old articles...");
    cleanupOldArticles();
  });
});

// Schedule RSS feed fetch with configurable interval
// Runs every 20 minutes during 7am - 2am (active hours)
const fetchInterval = process.env.RSS_FETCH_INTERVAL || 20; // Default to 20 minutes
const cronExpression = `*/${fetchInterval} 7-23,0-1 * * *`; // Every 20 minutes during 7am-11pm and 12am-2am

// Calculate next polling time
function getNextPollingTime() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Check if we're in active hours (7am-2am)
  const isActiveHours =
    (currentHour >= 7 && currentHour <= 23) ||
    (currentHour >= 0 && currentHour <= 1);

  if (isActiveHours) {
    // Find next 20-minute interval
    const nextMinute = Math.ceil(currentMinute / fetchInterval) * fetchInterval;
    if (nextMinute >= 60) {
      const nextHour = currentHour === 23 ? 0 : currentHour + 1;
      const nextTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        nextHour,
        0
      );
      return nextTime;
    } else {
      const nextTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        currentHour,
        nextMinute
      );
      return nextTime;
    }
  } else {
    // Next active period starts at 7am
    const nextActiveTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      7,
      0
    );
    return nextActiveTime;
  }
}

const nextPolling = getNextPollingTime();
console.log(
  `📡 RSS Server: Next polling scheduled for ${nextPolling.toLocaleString()}`
);

cron.schedule(cronExpression, () => {
  console.log("🔄 RSS Polling: Fetching feeds");
  fetchRssFeeds()
    .then(() => console.log("✅ RSS Polling: Completed"))
    .catch((err) => console.error("❌ RSS Polling Error:", err.message));
});

// Manual RSS fetch trigger endpoint
app.post("/manual-fetch", async (req, res) => {
  try {
    console.log("Manual RSS fetch triggered");
    const result = await fetchRssFeeds();
    res.json({
      message: "Manual RSS fetch completed",
      stats: result.stats,
      articlesFound: result.articles.length,
      executionTime: `${(result.executionTime / 1000).toFixed(2)}s`,
    });
  } catch (error) {
    console.error("Error in manual RSS fetch:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch RSS feeds", details: error.message });
  }
});

// Clear cache endpoint
app.post("/clear-cache", (req, res) => {
  try {
    subredditIcons.clear();
    userAvatars.clear();
    redditAccessToken = null;
    cacheDisabled = false; // Re-enable caching
    console.log("All caches cleared successfully");
    res.json({ message: "Cache cleared successfully" });
  } catch (error) {
    console.error("Error clearing cache:", error);
    res.status(500).json({ error: "Failed to clear cache" });
  }
});

// Disable cache endpoint
app.post("/disable-cache", (req, res) => {
  try {
    cacheDisabled = true;
    subredditIcons.clear();
    userAvatars.clear();
    redditAccessToken = null;
    console.log("Cache disabled and cleared");
    res.json({ message: "Cache disabled and cleared" });
  } catch (error) {
    console.error("Error disabling cache:", error);
    res.status(500).json({ error: "Failed to disable cache" });
  }
});

// Enable cache endpoint
app.post("/enable-cache", (req, res) => {
  try {
    cacheDisabled = false;
    console.log("Cache re-enabled");
    res.json({ message: "Cache re-enabled" });
  } catch (error) {
    console.error("Error enabling cache:", error);
    res.status(500).json({ error: "Failed to enable cache" });
  }
});

app.listen(port, () => {
  console.log(`📡 RSS Server: Running on http://localhost:${port}`);
});
