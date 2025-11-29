// Mock comment data for demo
import { mockUsers } from "./users.js";

export const mockComments = {
  post1: [
    {
      _id: "comment1",
      author: mockUsers[1],
      content: "Same here! I've been counting down the days!",
      likes: 45,
      replies: 3,
      isLiked: false,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      isEdited: false,
    },
    {
      _id: "comment2",
      author: mockUsers[2],
      content: "The graphics look absolutely insane! Can't wait!",
      likes: 78,
      replies: 5,
      isLiked: true,
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      isEdited: false,
    },
  ],
  post2: [
    {
      _id: "comment3",
      author: mockUsers[0],
      content: "Lucia is going to be such a strong character! Love it!",
      likes: 123,
      replies: 8,
      isLiked: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      isEdited: false,
    },
    {
      _id: "comment4",
      author: mockUsers[3],
      content: "The character design is on point! Rockstar never disappoints.",
      likes: 234,
      replies: 12,
      isLiked: true,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      isEdited: false,
    },
  ],
  post4: [
    {
      _id: "comment5",
      author: mockUsers[1],
      content: "This is incredible! The physics look so realistic!",
      likes: 456,
      replies: 23,
      isLiked: true,
      createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
      isEdited: false,
    },
    {
      _id: "comment6",
      author: mockUsers[2],
      content: "Game of the decade incoming! 🎮",
      likes: 567,
      replies: 34,
      isLiked: false,
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
      isEdited: false,
    },
  ],
};

// Helper to get comments for a post
export function getCommentsForPost(postId) {
  return mockComments[postId] || [];
}

// Helper to add a comment
export function addComment(postId, comment) {
  if (!mockComments[postId]) {
    mockComments[postId] = [];
  }
  mockComments[postId].unshift(comment);
}

