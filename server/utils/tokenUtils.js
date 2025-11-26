import crypto from "crypto";
import jwt from "jsonwebtoken";

// Generate a secure random token
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Generate access token (short-lived)
export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" } // Access token expires in 15 minutes
  );
};

// Generate refresh token (long-lived)
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" } // Refresh token expires in 7 days
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

// Hash the reset token before storing in database
export const hashResetToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
