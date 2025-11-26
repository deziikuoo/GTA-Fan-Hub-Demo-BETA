// View Tracking Service
// Implements modern social media view tracking with debouncing and duplicate prevention

import axios from "@/utils/axios";

class ViewTrackingService {
  constructor() {
    this.viewedPosts = new Set(); // Track posts already viewed in this session
    this.viewTimers = new Map(); // Track view start times
    this.minimumViewTime = 2000; // 2 seconds minimum (LinkedIn standard)
    this.debounceDelay = 1000; // 1 second debounce
    this.pendingViews = new Map(); // Track pending view submissions
  }

  /**
   * Start tracking a view for a post
   * @param {string} postId - The post ID to track
   * @param {Object} options - Tracking options
   */
  startTracking(postId, options = {}) {
    // Don't track if already viewed in this session
    if (this.viewedPosts.has(postId)) {
      return;
    }

    // Don't track if already being tracked
    if (this.viewTimers.has(postId)) {
      return;
    }

    console.log(`Starting view tracking for post: ${postId}`);

    // Set a timer for minimum view time
    const timer = setTimeout(() => {
      this.recordView(postId, options);
    }, this.minimumViewTime);

    this.viewTimers.set(postId, timer);
  }

  /**
   * Stop tracking a view (when post leaves viewport)
   * @param {string} postId - The post ID to stop tracking
   */
  stopTracking(postId) {
    const timer = this.viewTimers.get(postId);
    if (timer) {
      clearTimeout(timer);
      this.viewTimers.delete(postId);
      console.log(`Stopped view tracking for post: ${postId}`);
    }
  }

  /**
   * Record a view after minimum time has passed
   * @param {string} postId - The post ID
   * @param {Object} options - Additional options
   */
  async recordView(postId, options = {}) {
    // Mark as viewed in this session
    this.viewedPosts.add(postId);

    // Clear the timer
    this.viewTimers.delete(postId);

    // Debounce multiple rapid calls
    if (this.pendingViews.has(postId)) {
      return;
    }

    this.pendingViews.set(postId, true);

    try {
      console.log(`Recording view for post: ${postId}`);

      // Call the view tracking API
      await axios.post(`/api/posts/${postId}/view`, {
        timestamp: new Date().toISOString(),
        ...options,
      });

      console.log(`Successfully recorded view for post: ${postId}`);
    } catch (error) {
      console.error("Error recording view:", error);

      // If API fails, still mark as viewed to prevent retries
      // but don't add to session set so it can be retried later
    } finally {
      // Clear debounce after delay
      setTimeout(() => {
        this.pendingViews.delete(postId);
      }, this.debounceDelay);
    }
  }

  /**
   * Force track a view immediately (for modal views, etc.)
   * @param {string} postId - The post ID
   * @param {Object} options - Additional options
   */
  async forceTrackView(postId, options = {}) {
    // Mark as viewed in this session
    this.viewedPosts.add(postId);

    // Clear any existing timer
    this.stopTracking(postId);

    try {
      console.log(`Force tracking view for post: ${postId}`);

      await axios.post(`/api/posts/${postId}/view`, {
        timestamp: new Date().toISOString(),
        forced: true,
        ...options,
      });

      console.log(`Successfully force tracked view for post: ${postId}`);
    } catch (error) {
      console.error("Error force tracking view:", error);
    }
  }

  /**
   * Check if a post has been viewed in this session
   * @param {string} postId - The post ID
   * @returns {boolean}
   */
  hasViewed(postId) {
    return this.viewedPosts.has(postId);
  }

  /**
   * Reset the view tracking (for new sessions, etc.)
   */
  reset() {
    this.viewedPosts.clear();
    this.viewTimers.forEach((timer) => clearTimeout(timer));
    this.viewTimers.clear();
    this.pendingViews.clear();
    console.log("View tracking service reset");
  }
}

// Create singleton instance
const viewTracker = new ViewTrackingService();

export default viewTracker;
