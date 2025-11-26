// server.js

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json()); // Middleware for parsing JSON bodies

// Connect to MongoDB
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));
//                      SCHEMAS
//                    User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

//                    News Article Schema
const newsSchema = new mongoose.Schema({
  title: String,
  description: String,
  pubDate: Date,
  link: String,
  author: String,
  source: String,
});

const NewsArticle = mongoose.model("NewsArticle", newsSchema);

//                   ENDPOINTS
//                    Register endpoint
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ error: "Error registering user" });
  }
});

//                           ROUTES
app.get("/api/news", async (req, res) => {
  try {
    const articles = await NewsArticle.find().sort({ pubDate: -1 }).limit(20);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving articles" });
  }
});
app.get("/api/news/:id", async (req, res) => {
  try {
    const article = await NewsArticle.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving article" });
  }
});

//                    Login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Create a token
    const token = jwt.sign({ id: user._id }, process.env.API_KEY, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

//                    News Article endpoint
app.post("/api/news", async (req, res) => {
  try {
    const article = new NewsArticle(req.body);
    await article.save();
    res.status(201).json({ message: "Article saved successfully", article });
  } catch (error) {
    res.status(400).json({ error: "Error saving article" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
