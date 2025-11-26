//C:\Users\dawan\OneDrive\Documents\Coding Files\GtaFanHub\validationMiddleware.js

import { body, validationResult } from "express-validator";

export const loginValidation = [
  body("username").notEmpty().withMessage("Username or email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const registerValidation = [
  body("username")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be 3-20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, or underscores"),
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number")
    .matches(/[!@#$%^&*]/)
    .withMessage("Password must contain a special character"),
  body("phoneNumber")
    .optional()
    .matches(/^\d{10,15}$/)
    .withMessage(
      "Phone number must contain 10 to 15 digits only (e.g, 1234567890"
    ),
  body("address").optional().isString().withMessage("Invalid address format"),
  body("gender")
    .optional()
    .isIn(["male", "female", "other", "Prefer not to say"])
    .withMessage("Invalid gender"),
];

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array()); // Debug
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
