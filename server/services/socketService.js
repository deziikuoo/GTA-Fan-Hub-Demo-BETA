// server/services/socketService.js

/**
 * Socket.io service for real-time events
 * Provides helper functions to emit events to specific users
 */

export const SocketService = {
  /**
   * Check if user is currently connected
   * @param {Object} io - Socket.io server instance
   * @param {string} userId - User ID to check
   * @returns {boolean} True if user has active socket connection
   */
  isUserConnected(io, userId) {
    if (!io) return false;

    const sockets = io.sockets.adapter.rooms.get(userId);
    return sockets && sockets.size > 0;
  },

  /**
   * Get count of currently connected users
   * @param {Object} io - Socket.io server instance
   * @returns {number} Number of connected users
   */
  getConnectedUsersCount(io) {
    if (!io) return 0;

    return io.sockets.sockets.size;
  },
};

export default SocketService;
