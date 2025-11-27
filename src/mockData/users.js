// Avatar management
import { getUserAvatar, getUserHeader, getUserProfile, saveUserProfile } from "@/utils/avatarManager.js";

// Mock user data for demo
export const mockUsers = [
  {
    _id: "user1",
    id: "user1",
    username: "gta6fan",
    email: "gta6fan@example.com",
    profile: {
      displayName: "GTA 6 Fan",
      bio: "Huge fan of GTA series! Can't wait for GTA 6! 🎮",
      profilePicture: "/mockusers_avatar/mockusers_avatar1.jpg",
      headerImage: "/images/HeaderImages/Bros.jpg",
      verified: true,
      location: "Los Santos",
      website: "https://gta6fan.com",
      joinedDate: new Date("2023-01-15"),
    },
    followers: 1250,
    following: 342,
    posts: 89,
    reputation: 850,
    level: 12,
    createdAt: new Date("2023-01-15"),
  },
  {
    _id: "user2",
    id: "user2",
    username: "lucialover",
    email: "lucialover@example.com",
    profile: {
      displayName: "Lucia Fan",
      bio: "Team Lucia all the way! 🔥",
      profilePicture: "/mockusers_gifs/usergif.gif",
      headerImage: "/images/HeaderImages/LuciaPool.jpg",
      verified: false,
      location: "Vice City",
      website: null,
      joinedDate: new Date("2023-03-20"),
    },
    followers: 890,
    following: 156,
    posts: 45,
    reputation: 620,
    level: 8,
    createdAt: new Date("2023-03-20"),
  },
  {
    _id: "user3",
    id: "user3",
    username: "jasonfan",
    email: "jasonfan@example.com",
    profile: {
      displayName: "Jason Enthusiast",
      bio: "Jason is the GOAT! 🐐",
      profilePicture: "/mockusers_avatar/mockusers_avatar2.jpg",
      headerImage: "/images/HeaderImages/draco.jpg",
      verified: true,
      location: "Miami",
      website: null,
      joinedDate: new Date("2023-02-10"),
    },
    followers: 2100,
    following: 567,
    posts: 134,
    reputation: 1200,
    level: 15,
    createdAt: new Date("2023-02-10"),
  },
  {
    _id: "user4",
    id: "user4",
    username: "gtanews",
    email: "gtanews@example.com",
    profile: {
      displayName: "GTA News Hub",
      bio: "Your source for all GTA 6 news and updates 📰",
      profilePicture: "/mockusers_avatar/mockusers_avatar3.jpg",
      headerImage: "/images/HeaderImages/RaulBoat.jpg",
      verified: true,
      location: "Global",
      website: "https://gtanews.com",
      joinedDate: new Date("2022-12-01"),
    },
    followers: 5600,
    following: 234,
    posts: 456,
    reputation: 2500,
    level: 25,
    createdAt: new Date("2022-12-01"),
  },
  {
    _id: "user5",
    id: "user5",
    username: "vicecityvibes",
    email: "vicecityvibes@example.com",
    profile: {
      displayName: "Vice City Vibes",
      bio: "Living that Vice City life 🌴",
      profilePicture: "/mockusers_avatar/mockusers_avatar4.jpg",
      headerImage: "/images/HeaderImages/Stripaz.jpg",
      verified: false,
      location: "Vice City",
      website: null,
      joinedDate: new Date("2023-04-05"),
    },
    followers: 445,
    following: 89,
    posts: 23,
    reputation: 320,
    level: 5,
    createdAt: new Date("2023-04-05"),
  },
];

// Current logged in user (demo user)
// This function creates the demo user with random avatar/header and saved profile data
export function getCurrentDemoUser() {
  // Get saved profile data or use defaults
  const savedProfile = getUserProfile();
  const userAvatar = getUserAvatar(); // This will get or create a random avatar (sessionStorage)
  const userHeader = getUserHeader(); // This will get or create a random header (sessionStorage)
  
  const baseUser = {
    _id: "demo_user",
    id: "demo_user",
    username: "demouser",
    email: "demo@example.com",
    profile: {
      displayName: savedProfile?.displayName || "Demo User",
      bio: savedProfile?.bio || "This is a demo account. Explore the features!",
      // Priority: saved custom profilePicture (from profile data) > getUserAvatar() (checks custom localStorage, then sessionStorage random)
      // If savedProfile has profilePicture, it's a custom upload that was saved
      // Otherwise, getUserAvatar() will return custom from localStorage or random from sessionStorage
      profilePicture: savedProfile?.profilePicture || userAvatar,
      // Priority: saved custom headerImage (from profile data) > getUserHeader() (checks custom localStorage, then sessionStorage random)
      headerImage: savedProfile?.headerImage || userHeader,
      verified: savedProfile?.verified || false,
      location: savedProfile?.location || "Demo City",
      website: savedProfile?.website || null,
      joinedDate: savedProfile?.joinedDate ? new Date(savedProfile.joinedDate) : new Date("2024-01-01"),
      headerImagePosition: savedProfile?.headerImagePosition || "50% 50%",
    },
    gamingProfile: {
      onlineStatus: "offline",
      lastSeen: new Date(),
          favoriteGame: "GTA 6",
          playtime: 0,
        },
    socialStats: {
      totalPosts: 0,
      totalLikes: 0,
      totalReposts: 0,
      totalComments: 0,
      level: 1,
      reputation: 0,
    },
    stats: {
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
    },
    achievements: [],
    followers: 0,
    following: 0,
    posts: 0,
    reputation: 0,
    level: 1,
    createdAt: new Date("2024-01-01"),
  };
  
  return baseUser;
}

// Export a constant for backward compatibility (will be initialized on first use)
export const currentDemoUser = getCurrentDemoUser();

