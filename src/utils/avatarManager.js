// Avatar management utility for demo mode
// Handles random avatar/header selection (sessionStorage) and custom uploads (localStorage)

const AVATAR_COUNT = 9; // Number of avatars available (demouser_avatar1.jpg through demouser_avatar9.jpg)
const HEADER_COUNT = 6; // Number of headers available (demouser_header1.jpg through demouser_header6.jpg)

// sessionStorage keys (persist per session, cleared on browser close)
const SESSION_AVATAR_KEY = "gtafanhub-session-avatar";
const SESSION_HEADER_KEY = "gtafanhub-session-header";

// localStorage keys (persist custom uploads)
const CUSTOM_AVATAR_KEY = "gtafanhub-custom-avatar";
const CUSTOM_HEADER_KEY = "gtafanhub-custom-header";
const PROFILE_STORAGE_KEY = "gtafanhub-demo-profile";

/**
 * Check if an image path is a custom upload (data URL or not from demouser folders)
 * @param {string} imagePath - Path or data URL to check
 * @returns {boolean} True if custom, false if random selection
 */
function isCustomImage(imagePath) {
  if (!imagePath) return false;
  // Data URLs are always custom
  if (imagePath.startsWith("data:")) return true;
  // If it doesn't contain demouser_avatar or demouser_header, it's custom
  if (!imagePath.includes("demouser_avatar") && !imagePath.includes("demouser_header")) {
    return true;
  }
  return false;
}

/**
 * Get a random avatar path
 * @param {number} index - Optional specific avatar index (1-9), if not provided, selects randomly
 * @returns {string} Path to the avatar image
 */
export function getRandomAvatar(index = null) {
  const avatarIndex = index || Math.floor(Math.random() * AVATAR_COUNT) + 1;
  return `/src/assets/demouser_avatars/demouser_avatar${avatarIndex}.jpg`;
}

/**
 * Get a random header path
 * @param {number} index - Optional specific header index (1-6), if not provided, selects randomly
 * @returns {string} Path to the header image
 */
export function getRandomHeader(index = null) {
  const headerIndex = index || Math.floor(Math.random() * HEADER_COUNT) + 1;
  return `/src/assets/demouser_headers/demouser_header${headerIndex}.jpg`;
}

/**
 * Get or set the user's avatar
 * Priority: custom upload (localStorage) > session random (sessionStorage) > new random
 * @returns {string} Path to the user's avatar
 */
export function getUserAvatar() {
  // First check for custom upload in localStorage
  const customAvatar = localStorage.getItem(CUSTOM_AVATAR_KEY);
  if (customAvatar) {
    return customAvatar;
  }
  
  // Then check sessionStorage for random selection
  const sessionAvatar = sessionStorage.getItem(SESSION_AVATAR_KEY);
  if (sessionAvatar) {
    return sessionAvatar;
  }
  
  // No avatar stored, select a random one and save to sessionStorage
  const randomAvatar = getRandomAvatar();
  sessionStorage.setItem(SESSION_AVATAR_KEY, randomAvatar);
  return randomAvatar;
}

/**
 * Get or set the user's header image
 * Priority: custom upload (localStorage) > session random (sessionStorage) > new random
 * @returns {string} Path to the user's header image
 */
export function getUserHeader() {
  // First check for custom upload in localStorage
  const customHeader = localStorage.getItem(CUSTOM_HEADER_KEY);
  if (customHeader) {
    return customHeader;
  }
  
  // Then check sessionStorage for random selection
  const sessionHeader = sessionStorage.getItem(SESSION_HEADER_KEY);
  if (sessionHeader) {
    return sessionHeader;
  }
  
  // No header stored, select a random one and save to sessionStorage
  const randomHeader = getRandomHeader();
  sessionStorage.setItem(SESSION_HEADER_KEY, randomHeader);
  return randomHeader;
}

/**
 * Save the user's avatar
 * Custom uploads go to localStorage, random selections go to sessionStorage
 * @param {string} avatarPath - Path to the avatar image
 */
export function saveUserAvatar(avatarPath) {
  if (isCustomImage(avatarPath)) {
    // Custom upload - save to localStorage
    localStorage.setItem(CUSTOM_AVATAR_KEY, avatarPath);
    // Clear session storage if it exists (user replaced random with custom)
    sessionStorage.removeItem(SESSION_AVATAR_KEY);
  } else {
    // Random selection - save to sessionStorage
    sessionStorage.setItem(SESSION_AVATAR_KEY, avatarPath);
  }
}

/**
 * Save the user's header image
 * Custom uploads go to localStorage, random selections go to sessionStorage
 * @param {string} headerPath - Path to the header image
 */
export function saveUserHeader(headerPath) {
  if (isCustomImage(headerPath)) {
    // Custom upload - save to localStorage
    localStorage.setItem(CUSTOM_HEADER_KEY, headerPath);
    // Clear session storage if it exists (user replaced random with custom)
    sessionStorage.removeItem(SESSION_HEADER_KEY);
  } else {
    // Random selection - save to sessionStorage
    sessionStorage.setItem(SESSION_HEADER_KEY, headerPath);
  }
}

/**
 * Get the user's profile data from localStorage
 * @returns {Object|null} User profile data or null if not found
 */
export function getUserProfile() {
  const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Save the user's profile data to localStorage
 * Note: Avatar and header images are also saved separately via saveUserAvatar/saveUserHeader
 * but we include them in profile data for consistency
 * @param {Object} profileData - Profile data to save (including profilePicture and headerImage)
 */
export function saveUserProfile(profileData) {
  // Save all profile data including profilePicture and headerImage
  // The saveUserAvatar/saveUserHeader functions handle the separate storage logic
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
}

/**
 * Clear all demo user data
 * Clears both sessionStorage (random selections) and localStorage (custom uploads)
 */
export function clearDemoUserData() {
  // Clear session storage (random selections)
  sessionStorage.removeItem(SESSION_AVATAR_KEY);
  sessionStorage.removeItem(SESSION_HEADER_KEY);
  
  // Clear localStorage (custom uploads and profile data)
  localStorage.removeItem(CUSTOM_AVATAR_KEY);
  localStorage.removeItem(CUSTOM_HEADER_KEY);
  localStorage.removeItem(PROFILE_STORAGE_KEY);
}

