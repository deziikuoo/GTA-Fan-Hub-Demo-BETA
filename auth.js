/*// routes/auth.js
import express from "express";
const jwt = require("jsonwebtoken");
const User = require("./generalServer"); // Adjust the path as needed
const router = express.Router();

// Endpoint to handle login and return token
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });
    /*
    const token = jwt.sign({ id: user._id }, process.env.API_KEY, {
      expiresIn: "1h", 
    });*/
/*  res.json({ accessToken: token });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

/*
// Endpoint for silent authentication (to check session validity)
router.get("/silent-auth", async (req, res) => {
  // Implement session validation logic here (e.g., check cookies or tokens)
  // If valid, return a new access token
  const userId = req.user.id; // Assuming you have middleware to attach user info
  const newToken = jwt.sign({ id: userId }, process.env.API_KEY, {
    expiresIn: "1h",
  });
  res.json({ accessToken: newToken });
});*/

module.exports = router;
