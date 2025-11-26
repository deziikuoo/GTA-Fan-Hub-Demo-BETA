import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import multer from "multer";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import {
  registerValidation,
  loginValidation,
  validate,
} from "./validationMiddleware.js";
import { authenticateToken, optionalAuth } from "./authMiddleware.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "./server/utils/tokenUtils.js";
import { sendPasswordResetEmail } from "./server/services/emailService.js";
import crypto from "crypto";
import User from "./server/models/User.js";
import followRoutes from "./server/routes/followRoutes.js";
import postRoutes, {
  setIoInstance as setPostIoInstance,
} from "./server/routes/postRoutes.js";
import engagementRoutes, {
  setIoInstance as setEngagementIoInstance,
} from "./server/routes/engagementRoutes.js";
import feedRoutes from "./server/routes/feedRoutes.js";
import moderationRoutes from "./server/routes/moderationRoutes.js";
import notificationRoutes from "./server/routes/notificationRoutes.js";
import { NotificationQueueService } from "./server/services/notificationQueueService.js";

// Define __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const uploadDir = path.join(__dirname, "Uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({
  dest: uploadDir,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // Increased to 10MB
    files: 1, // Limit to one file
  },
});

const app = express();
const httpServer = createServer(app);
const port = 3003;

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = (
        process.env.ALLOWED_ORIGINS ||
        "http://localhost:5173,http://localhost:5174"
      ).split(",");

      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  },
});

// Store Socket.io instance on app for use in routes
app.set("io", io);

// User model is now imported from server/models/User.js

const newsSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
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

// Carousel Image Schema
const carouselImageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, unique: true },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    alt: { type: String, default: "GTA 6 Header Image" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    uploadedAt: { type: Date, default: Date.now },
    lastModified: { type: Date, default: Date.now },
  },
  { autoIndex: false }
);

const CarouselImage = mongoose.model("CarouselImage", carouselImageSchema);
export { NewsArticle, SocialMediaArticle, CarouselImage };

mongoose
  .connect(process.env.CONNECTION_STRING, {
    retryWrites: true,
    retryReads: true,
  })
  .then(async () => {
    console.log(`🗄️  Database: Connected successfully`);
    // User collection indexes are automatically created by Mongoose schema
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    setTimeout(() => mongoose.connect(process.env.CONNECTION_STRING), 5000);
  });

const requestLogger = (req, res, next) => {
  // Removed all request logging to reduce console clutter
  next();
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (
      process.env.ALLOWED_ORIGINS ||
      "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost:3001"
    ).split(",");

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(requestLogger);

// Serve uploaded files statically
app.use("/uploads", express.static(uploadDir));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many login attempts, please try again later",
});

// AWS Config
const s3Client = new S3Client({
  region: "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function ensureIndexes() {
  try {
    const collection = mongoose.connection.collection("newsarticles");
    const indexes = await collection.indexes();
    const conflictingIndex = indexes.find(
      (index) => index.name === "title_text_contentSnippet_text_author_text"
    );
    if (conflictingIndex) {
      await collection.dropIndex("title_text_contentSnippet_text_author_text");
      console.log(
        "Dropped conflicting index: title_text_contentSnippet_text_author_text"
      );
    }
    await collection.createIndex({ pubDate: 1 });
    await collection.createIndex({ title: 1 });
    await collection.createIndex(
      { title: "text", description: "text", author: "text" },
      { name: "title_text_description_text_author_text" }
    );
    console.log("Indexes created successfully for NewsArticle collection");
  } catch (error) {
    console.error("Error creating NewsArticle indexes:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
  }
}
mongoose.connection.once("open", ensureIndexes);

const releaseTimes = {
  Eastern: new Date("November 19, 2026 00:00:00 EST"),
  Central: new Date("November 19, 2026 00:00:00 CST"),
  Mountain: new Date("November 19, 2026 00:00:00 MST"),
  Pacific: new Date("November 19, 2026 00:00:00 PST"),
  Alaska: new Date("November 19, 2026 00:00:00 AKST"),
  "Eastern Canada": new Date("November 19, 2026 00:00:00 EST"),
  "Pacific Canada": new Date("November 19, 2026 00:00:00 PST"),
  UK: new Date("November 19, 2026 00:00:00 GMT"),
  "Central Europe": new Date("November 19, 2026 00:00:00 CET"),
  "Eastern Europe": new Date("November 19, 2026 00:00:00 EET"),
  Japan: new Date("November 19, 2026 00:00:00 JST"),
  Korea: new Date("November 19, 2026 00:00:00 KST"),
  China: new Date("November 19, 2026 00:00:00 CST"),
  "Hong Kong": new Date("November 19, 2026 00:00:00 HKT"),
  Taiwan: new Date("November 19, 2026 00:00:00 CST"),
  Australia: new Date("November 19, 2026 00:00:00 AEDT"),
  "New Zealand": new Date("November 19, 2026 00:00:00 NZDT"),
  Brazil: new Date("November 19, 2026 00:00:00 BRT"),
  Argentina: new Date("November 19, 2026 00:00:00 ART"),
};

app.get("/api/countdown/release-times", (req, res) => {
  try {
    res.json(releaseTimes);
  } catch (error) {
    console.error("Error in release times:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/countdown/server-time", (req, res) => {
  try {
    const serverTime = new Date().toISOString();
    res.json({ server_time: serverTime });
    // Removed verbose server time log
  } catch (error) {
    console.error("Error in server time:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/countdown/target-date", (req, res) => {
  try {
    const userRegion = "Pacific";
    const targetDate = releaseTimes[userRegion] || releaseTimes["Eastern"];
    res.json({ target_date: targetDate.toISOString() });
  } catch (error) {
    console.error("Error in target date:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/user-profile", async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error in user profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error("Error in user fetch:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/news", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database not connected");
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortField = req.query.sortField === "title" ? "title" : "pubDate";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const sourceType = req.query.sourceType || "all"; // Default to all articles // "rss", "twitter", or "all"
    const query = req.query.query
      ? decodeURIComponent(req.query.query).trim()
      : "";
    const skip = (page - 1) * limit;

    let dbQuery;
    let totalArticles;

    // Build base query with sourceType filtering
    // Include all source types for the news page
    const baseQuery = {};
    if (sourceType !== "all") {
      if (sourceType === "rss") {
        // For RSS, include articles with sourceType "rss" OR no sourceType field (legacy articles)
        baseQuery.$or = [
          { sourceType: "rss" },
          { sourceType: { $exists: false } },
        ];
      } else {
        baseQuery.sourceType = sourceType;
      }
    }
    // Note: Reddit posts are fetched separately from SocialMediaArticle collection

    if (query) {
      console.log("Searching articles");
      const escapedQuery = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      dbQuery = NewsArticle.find({
        ...baseQuery,
        $or: [
          { title: { $regex: `^${escapedQuery}$`, $options: "i" } },
          { title: { $regex: escapedQuery, $options: "i" } },
          { description: { $regex: escapedQuery, $options: "i" } },
          { author: { $regex: escapedQuery, $options: "i" } },
        ],
      }).sort({ [sortField]: sortOrder });

      const regexResults = await dbQuery.skip(skip).limit(limit);
      totalArticles = await NewsArticle.countDocuments({
        ...baseQuery,
        $or: [
          { title: { $regex: `^${escapedQuery}$`, $options: "i" } },
          { title: { $regex: escapedQuery, $options: "i" } },
          { description: { $regex: escapedQuery, $options: "i" } },
          { author: { $regex: escapedQuery, $options: "i" } },
        ],
      });

      if (regexResults.length === 0) {
        console.log("No regex matches, trying text search");
        dbQuery = NewsArticle.find(
          { ...baseQuery, $text: { $search: query } },
          { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" }, [sortField]: sortOrder });

        const textResults = await dbQuery.skip(skip).limit(limit);
        totalArticles = await NewsArticle.countDocuments({
          ...baseQuery,
          $text: { $search: query },
        });

        return res.json({
          articles: textResults,
          totalArticles,
          totalPages: Math.ceil(totalArticles / limit),
          currentPage: page,
        });
      }

      return res.json({
        articles: regexResults,
        totalArticles,
        totalPages: Math.ceil(totalArticles / limit),
        currentPage: page,
      });
    } else {
      // Handle different sourceType scenarios
      if (sourceType === "all") {
        // Fetch from both NewsArticle (RSS only) and SocialMediaArticle (Reddit)
        // This prevents duplicates since Reddit posts are in SocialMediaArticle
        const rssQuery = NewsArticle.find({
          $or: [{ sourceType: "rss" }, { sourceType: { $exists: false } }],
        }).sort({ [sortField]: sortOrder });

        const redditQuery = SocialMediaArticle.find({
          sourceType: "reddit",
        }).sort({ [sortField]: sortOrder });

        const [rssArticles, redditPosts] = await Promise.all([
          rssQuery.skip(skip).limit(limit),
          redditQuery.skip(skip).limit(limit),
        ]);

        // Merge and sort the results, removing any duplicates by link
        const seenLinks = new Set();
        const allArticles = [...rssArticles, ...redditPosts]
          .filter((article) => {
            if (seenLinks.has(article.link)) {
              return false;
            }
            seenLinks.add(article.link);
            return true;
          })
          .sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];
            if (sortField === "pubDate") {
              return sortOrder === 1
                ? new Date(aValue) - new Date(bValue)
                : new Date(bValue) - new Date(aValue);
            } else {
              return sortOrder === 1
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            }
          });

        const totalRssArticles = await NewsArticle.countDocuments({
          sourceType: "rss",
        });
        const totalRedditPosts = await SocialMediaArticle.countDocuments({
          sourceType: "reddit",
        });
        totalArticles = totalRssArticles + totalRedditPosts;

        return res.json({
          articles: allArticles,
          totalArticles,
          totalPages: Math.ceil(totalArticles / limit),
          currentPage: page,
        });
      } else if (sourceType === "reddit") {
        // Fetch only from SocialMediaArticle for Reddit posts
        const redditPosts = await SocialMediaArticle.find({
          sourceType: "reddit",
        })
          .sort({ [sortField]: sortOrder })
          .skip(skip)
          .limit(limit);

        totalArticles = await SocialMediaArticle.countDocuments({
          sourceType: "reddit",
        });

        return res.json({
          articles: redditPosts,
          totalArticles,
          totalPages: Math.ceil(totalArticles / limit),
          currentPage: page,
        });
      } else {
        // For "rss" or any other sourceType, fetch from NewsArticle
        const newsQuery = NewsArticle.find(baseQuery).sort({
          [sortField]: sortOrder,
        });

        const newsArticles = await newsQuery.skip(skip).limit(limit);
        totalArticles = await NewsArticle.countDocuments(baseQuery);

        return res.json({
          articles: newsArticles,
          totalArticles,
          totalPages: Math.ceil(totalArticles / limit),
          currentPage: page,
        });
      }
    }
  } catch (error) {
    console.error("Error fetching news:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch news", details: error.message });
  }
});

// New endpoint for trending Reddit posts
app.get("/api/reddit/trending", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const limit = parseInt(req.query.limit) || 20;

    // Get most recent Reddit posts from SocialMediaArticles collection
    const redditPosts = await SocialMediaArticle.find({ sourceType: "reddit" })
      .sort({ pubDate: -1 })
      .limit(limit);

    res.json({ posts: redditPosts });
  } catch (error) {
    console.error("Error fetching trending Reddit posts:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch Reddit posts", details: error.message });
  }
});

app.get("/api/news/count", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }
    await mongoose.connection.db.admin().ping();
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const collectionExists = collections.some((c) => c.name === "newsarticles");
    if (!collectionExists) {
      console.error("Collection 'newsarticles' does not exist");
      return res.status(500).json({ error: "Collection not found" });
    }
    const count = await NewsArticle.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error counting articles:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res
      .status(500)
      .json({ error: "Error counting articles", details: error.message });
  }
});

app.get("/api/news/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database not connected");
    }
    const article = await NewsArticle.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }
    res.json(article);
  } catch (error) {
    console.error("Error retrieving article:", error);
    res
      .status(500)
      .json({ error: "Error retrieving article", details: error.message });
  }
});

app.get("/api/db-status", (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      res.json({ status: "connected", database: mongoose.connection.name });
    } else {
      res
        .status(503)
        .json({ status: "disconnected", error: "Database not connected" });
    }
  } catch (error) {
    console.error("Error checking DB status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/register", upload.single("profilePicture"), async (req, res) => {
  try {
    const { username, email, password, phoneNumber, address, gender } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User already exists with this email or username",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      address,
      gender,
      registeredAt: new Date(),
    });

    // Handle profile picture if uploaded
    if (req.file) {
      const fileName = path.basename(req.file.path);
      user.profilePicture = `/uploads/${fileName}`;
    }

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data and access token
    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture:
          user.profile?.profilePicture ||
          user.profilePicture ||
          "/src/assets/images/user.png",
      },
      accessToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post(
  "/api/login",
  authLimiter,
  loginValidation,
  validate,
  async (req, res) => {
    try {
      console.log("Login attempt");
      const { username, password } = req.body;
      const user = await User.findOne({
        $or: [{ username }, { email: username }],
      });
      if (!user) {
        console.log("Login attempt failed: User not found");
        return res.status(400).json({ errors: [{ msg: "User not found" }] });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("Login attempt failed: Invalid credentials");
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] });
      }

      // Generate both tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Store refresh token in user document
      user.refreshToken = refreshToken;
      await user.save();

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Send access token in response
      console.log("Login successful");
      res.json({
        message: "Login successful",
        accessToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profilePicture:
            user.profile?.profilePicture ||
            user.profilePicture ||
            "/src/assets/images/user.png",
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ errors: [{ msg: "Server error" }] });
    }
  }
);

app.post("/api/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    console.log(
      "Logout request received, refresh token present:",
      !!refreshToken
    );

    if (refreshToken) {
      // Clear refresh token from user document
      const result = await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } }
      );
      console.log("Refresh token cleared from database");
    }

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Must match the login cookie settings
    });

    console.log("Logout completed successfully");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

app.post("/api/news", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database not connected");
    }
    const result = await NewsArticle.updateOne(
      { link: req.body.link },
      req.body,
      { upsert: true, new: true }
    );
    if (result.upsertedCount > 0) {
      console.log(`Saved article: ${req.body.title}`);
      res
        .status(201)
        .json({ message: "Article saved successfully", article: req.body });
    } else if (result.modifiedCount > 0) {
      console.log(`Updated existing article: ${req.body.title}`);
      res
        .status(200)
        .json({ message: "Article updated successfully", article: req.body });
    } else {
      console.log(`Article already exists (no changes): ${req.body.title}`);
      res.status(200).json({
        message: "Article already exists (no changes)",
        article: req.body,
      });
    }
  } catch (error) {
    console.error("Error saving/updating article:", error);
    res
      .status(400)
      .json({ error: "Error saving/updating article", details: error.message });
  }
});

app.put(
  "/api/profile/me",
  authenticateToken,
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "headerImage", maxCount: 1 },
  ]),
  (err, req, res, next) => {
    // Handle multer file upload errors
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "File too large",
          details: "Profile picture must be less than 10MB",
        });
      }
      return res.status(500).json({
        error: "File upload error",
        details: err.message,
      });
    } else if (err) {
      // An unknown error occurred
      return res.status(500).json({
        error: "Unknown upload error",
        details: err.message,
      });
    }
    next();
  },
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const updateData = req.body;

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updateData.password;
      delete updateData.email;
      delete updateData.username;
      delete updateData.refreshToken;

      // Handle file uploads (both profile picture and header image)
      if (req.files) {
        // Handle profile picture
        if (req.files.profilePicture && req.files.profilePicture[0]) {
          const fileName = path.basename(req.files.profilePicture[0].path);
          updateData["profile.profilePicture"] = `/uploads/${fileName}`;
        }

        // Handle header image
        if (req.files.headerImage && req.files.headerImage[0]) {
          const fileName = path.basename(req.files.headerImage[0].path);
          updateData["profile.headerImage"] = `/uploads/${fileName}`;
        }
      }

      // Set default profile picture if none provided
      if (updateData["profile.profilePicture"] === undefined) {
        updateData["profile.profilePicture"] = "/src/assets/images/user.png";
      }

      // Validate and sanitize the update data
      const allowedFields = [
        "profile.displayName",
        "profile.bio",
        "profile.location",
        "profile.website",
        "profile.birthDate",
        "profile.profilePicture",
        "profile.headerImage",
        "gamingProfile.playStyle",
        "gamingProfile.skillLevel",
        "gamingProfile.preferredGameMode",
        "gamingProfile.currentGame",
        "preferences.notifications",
        "preferences.privacy",
        "preferences.theme",
      ];

      const sanitizedUpdate = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          // Handle JSON string fields
          if (
            field === "gamingProfile.preferredGameMode" &&
            typeof updateData[field] === "string"
          ) {
            try {
              sanitizedUpdate[field] = JSON.parse(updateData[field]);
            } catch (error) {
              console.error("Error parsing preferredGameMode JSON:", error);
              sanitizedUpdate[field] = [];
            }
          } else {
            // Handle enum fields - don't save empty strings, only valid enum values
            if (
              field === "gamingProfile.playStyle" ||
              field === "gamingProfile.skillLevel"
            ) {
              if (updateData[field] && updateData[field].trim() !== "") {
                sanitizedUpdate[field] = updateData[field];
              }
              // If empty string, don't include in update (leave existing value)
            } else {
              sanitizedUpdate[field] = updateData[field];
            }
          }
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: sanitizedUpdate },
        { new: true, runValidators: true }
      ).select("-password -refreshToken");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        message: "Profile updated successfully",
        user: user.fullProfile,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Update data:", req.body);
      console.error("Sanitized update:", sanitizedUpdate);
      res.status(500).json({
        error: "Failed to update profile",
        details: error.message,
      });
    }
  }
);

// Comment out session check endpoint
/*
app.get("/api/check-session", (req, res) => {
  if (req.session && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ message: "No active session" });
  }
});
*/

// Remove password reset routes and related code
app.post("/api/request-password-reset", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendPasswordResetEmail(email, resetUrl);

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Password reset request error:", error);
    res
      .status(500)
      .json({ message: "Error processing password reset request" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
});

// Add refresh token endpoint with token rotation
app.post("/api/refresh-token", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    // Removed verbose refresh token log

    if (!refreshToken) {
      console.log("Refresh token request failed: No refresh token in cookies");
      return res.status(401).json({ error: "Refresh token not found" });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    // Removed verbose token validation logs
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      console.log("Refresh token validation failed");
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Generate new tokens (token rotation for security)
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update user with new refresh token (invalidate old one)
    user.refreshToken = newRefreshToken;
    await user.save();
    // Removed verbose token save log

    // Set new refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Removed verbose token refresh log
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// Session validation endpoint
app.get("/api/check-session", optionalAuth, async (req, res) => {
  try {
    // Removed verbose session check logs

    if (!req.user?.userId) {
      console.log("Session check failed: No userId");
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await User.findById(req.user.userId).select(
      "-password -refreshToken"
    );
    if (!user) {
      console.log("Session check failed: User not found in database");
      return res.status(401).json({ error: "User not found" });
    }

    // Removed verbose session success log

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture:
          user.profile?.profilePicture ||
          user.profilePicture ||
          "/src/assets/images/user.png",
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    res.status(500).json({ error: "Session validation failed" });
  }
});

// ==================== PROFILE API ENDPOINTS ====================

// Get profile by username
app.get("/api/profile/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // First, find the user without populate to check if they exist
    const user = await User.findOne({ username }).select(
      "-password -refreshToken -email"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only populate if socialStats exists and has followers/following arrays
    if (
      user.socialStats &&
      user.socialStats.followers &&
      user.socialStats.following
    ) {
      await user.populate(
        "socialStats.followers",
        "username profile.profilePicture"
      );
      await user.populate(
        "socialStats.following",
        "username profile.profilePicture"
      );
    }

    res.json({ user: user.fullProfile });
  } catch (error) {
    console.error("Error fetching profile:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Get current user's profile
app.get("/api/profile/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password -refreshToken")
      .populate("socialStats.followers", "username profile.profilePicture")
      .populate("socialStats.following", "username profile.profilePicture");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: user.fullProfile });
  } catch (error) {
    console.error("Error fetching current user profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ==================== OLD FOLLOW ENDPOINTS (DISABLED - Using new Follow collection system) ====================
// Follow/Unfollow user - LEGACY - Replaced by server/routes/followRoutes.js
/*
app.post("/api/users/:userId/follow", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFollowing =
      currentUser.socialStats.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { "socialStats.following": targetUserId },
      });
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { "socialStats.followers": currentUserId },
      });

      res.json({ message: "Unfollowed successfully", following: false });
    } else {
      // Follow
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { "socialStats.following": targetUserId },
      });
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { "socialStats.followers": currentUserId },
      });

      res.json({ message: "Followed successfully", following: true });
    }
  } catch (error) {
    console.error("Error following/unfollowing user:", error);
    res.status(500).json({ error: "Failed to follow/unfollow user" });
  }
});

// Get followers - LEGACY - Replaced by server/routes/followRoutes.js
app.get("/api/users/:userId/followers", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId).populate({
      path: "socialStats.followers",
      select:
        "username profile.profilePicture profile.displayName gamingProfile.onlineStatus",
      options: {
        skip: (page - 1) * limit,
        limit: parseInt(limit),
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      followers: user.socialStats.followers,
      totalCount: user.socialStats.followers.length,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ error: "Failed to fetch followers" });
  }
});

// Get following - LEGACY - Replaced by server/routes/followRoutes.js
app.get("/api/users/:userId/following", async (req, res) => {
  try {
    const { userId} = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId).populate({
      path: "socialStats.following",
      select:
        "username profile.profilePicture profile.displayName gamingProfile.onlineStatus",
      options: {
        skip: (page - 1) * limit,
        limit: parseInt(limit),
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      following: user.socialStats.following,
      totalCount: user.socialStats.following.length,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Error fetching following:", error);
    res.status(500).json({ error: "Failed to fetch following" });
  }
});
*/

// Get profile stats
app.get("/api/profile/:username/stats", async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select(
      "socialStats achievements"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      stats: {
        totalPosts: user.socialStats.totalPosts,
        totalLikes: user.socialStats.totalLikes,
        totalComments: user.socialStats.totalComments,
        reputation: user.socialStats.reputation,
        level: user.socialStats.level,
        experience: user.socialStats.experience,
        followerCount: user.socialStats.followers.length,
        followingCount: user.socialStats.following.length,
        achievementCount: user.achievements.length,
      },
    });
  } catch (error) {
    console.error("Error fetching profile stats:", error);
    res.status(500).json({ error: "Failed to fetch profile stats" });
  }
});

// Get achievements
app.get("/api/profile/:username/achievements", async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select("achievements");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ achievements: user.achievements });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
});

// Update online status
app.put("/api/profile/me/status", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { onlineStatus, currentGame } = req.body;

    const updateData = {
      "gamingProfile.lastSeen": new Date(),
    };

    if (onlineStatus) {
      updateData["gamingProfile.onlineStatus"] = onlineStatus;
    }

    if (currentGame) {
      updateData["gamingProfile.currentGame"] = currentGame;
    }

    await User.findByIdAndUpdate(userId, { $set: updateData });

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// ==================== FOLLOW SYSTEM ROUTES ====================
// Mount follow routes
app.use("/api", followRoutes);
// Removed verbose route mounting log

// ==================== POSTING SYSTEM ROUTES ====================
// Mount post routes
app.use("/api/posts", postRoutes);
// Removed verbose route mounting log

// Mount engagement routes (likes, comments, bookmarks)
app.use("/api", engagementRoutes);
// Removed verbose route mounting log

// Mount feed routes
app.use("/api/feed", feedRoutes);
// Removed verbose route mounting log

// Mount moderation routes (report, block)
app.use("/api", moderationRoutes);
// Removed verbose route mounting log

// Mount notification routes
app.use("/api/notifications", notificationRoutes);
// Removed verbose route mounting log

// Set Socket.io instance for notification routes
setPostIoInstance(io);
setEngagementIoInstance(io);
// Removed verbose socket.io log

// ==================== SOCKET.IO CONNECTION HANDLING ====================

// Track connected users
const connectedUsers = new Map(); // userId -> socketId

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    // Removed verbose socket auth log

    if (!token) {
      console.error("[Socket.io] No token in handshake.auth");
      return next(new Error("Authentication required"));
    }

    // Verify JWT token
    const decoded = verifyToken(token);
    socket.userId = decoded.userId;
    // Removed verbose socket token log
    next();
  } catch (error) {
    console.error("[Socket.io] Authentication error:", error.message);
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.userId;
  // Removed verbose user connection log

  // Join user-specific room for targeted messages
  socket.join(userId);

  // Track connected user
  connectedUsers.set(userId, socket.id);

  // Reset notification session - user can receive batch notifications again
  NotificationQueueService.resetUserSession(userId);

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    // Removed verbose user disconnection log
    connectedUsers.delete(userId);
  });

  // Send connection confirmation
  socket.emit("connected", {
    userId,
    timestamp: new Date(),
    message: "Socket.io connected successfully",
  });
});

// Socket.io health check endpoint
app.get("/api/socket/health", (req, res) => {
  res.json({
    status: "healthy",
    connectedUsers: connectedUsers.size,
    uptime: process.uptime(),
  });
});

// Socket.io debug endpoint
app.get("/api/debug/socket", (req, res) => {
  const io = req.app.get("io");
  const rooms = Array.from(io.sockets.adapter.rooms.keys());
  const sockets = Array.from(io.sockets.sockets.keys());

  res.json({
    totalConnections: io.sockets.sockets.size,
    connectedUsers: connectedUsers.size,
    socketIds: sockets,
    rooms: rooms,
    connectedUsersMap: Object.fromEntries(connectedUsers),
  });
});

console.log("[Server] Socket.io initialized");

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error.stack);
});

// Carousel Images API endpoints
app.get("/api/carousel", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const images = await CarouselImage.find({ isActive: true })
      .sort({ order: 1, uploadedAt: -1 })
      .select("filename path alt order uploadedAt");

    res.json({ images });
  } catch (error) {
    console.error("Error fetching carousel images:", error);
    res.status(500).json({ error: "Failed to fetch carousel images" });
  }
});

app.post("/api/carousel", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const { filename, originalName, path, alt, order } = req.body;

    const carouselImage = new CarouselImage({
      filename,
      originalName,
      path,
      alt: alt || "GTA 6 Header Image",
      order: order || 0,
    });

    await carouselImage.save();
    res.status(201).json(carouselImage);
  } catch (error) {
    console.error("Error creating carousel image:", error);
    res.status(500).json({ error: "Failed to create carousel image" });
  }
});

app.put("/api/carousel/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const { id } = req.params;
    const updates = { ...req.body, lastModified: new Date() };

    const carouselImage = await CarouselImage.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!carouselImage) {
      return res.status(404).json({ error: "Carousel image not found" });
    }

    res.json(carouselImage);
  } catch (error) {
    console.error("Error updating carousel image:", error);
    res.status(500).json({ error: "Failed to update carousel image" });
  }
});

app.delete("/api/carousel/:id", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const { id } = req.params;
    const carouselImage = await CarouselImage.findByIdAndDelete(id);

    if (!carouselImage) {
      return res.status(404).json({ error: "Carousel image not found" });
    }

    res.json({ message: "Carousel image deleted successfully" });
  } catch (error) {
    console.error("Error deleting carousel image:", error);
    res.status(500).json({ error: "Failed to delete carousel image" });
  }
});

httpServer.listen(port, () => {
  console.log(`🚀 Main Server: Running on http://localhost:${port}`);
  console.log(`🔌 Socket.io: Ready for real-time connections`);
});
