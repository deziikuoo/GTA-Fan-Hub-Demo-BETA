// Mock notification data for demo
import { mockUsers } from "./users.js";
import { mockPosts } from "./posts.js";

export const mockNotifications = [
  {
    _id: "notif1",
    type: "like",
    user: mockUsers[1],
    post: mockPosts[0],
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    _id: "notif2",
    type: "follow",
    user: mockUsers[2],
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    _id: "notif3",
    type: "comment",
    user: mockUsers[3],
    post: mockPosts[1],
    read: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
  },
  {
    _id: "notif4",
    type: "repost",
    user: mockUsers[4],
    post: mockPosts[0],
    read: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    _id: "notif5",
    type: "like",
    user: mockUsers[0],
    post: mockPosts[2],
    read: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    _id: "notif6",
    type: "follow",
    user: mockUsers[1],
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
];

// Helper to get unread count
export function getUnreadCount() {
  return mockNotifications.filter((n) => !n.read).length;
}

// Helper to mark as read
export function markAsRead(notificationId) {
  const notif = mockNotifications.find((n) => n._id === notificationId);
  if (notif) {
    notif.read = true;
  }
}

// Helper to mark all as read
export function markAllAsRead() {
  mockNotifications.forEach((n) => {
    n.read = true;
  });
}

