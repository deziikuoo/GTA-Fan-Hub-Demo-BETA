// notificationSound.js
// Utility for playing notification sounds with user preference support

class NotificationSound {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
    this.volume = 0.3;
    this.soundType = "default"; // 'default', 'gentle', 'none'

    this.initializeAudioContext();
  }

  initializeAudioContext() {
    try {
      // Try to create AudioContext
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    } catch (error) {
      console.warn("Web Audio API not supported:", error);
      this.audioContext = null;
    }
  }

  // Play notification sound based on notification type
  playNotification(type = "default", volume = null) {
    if (!this.isEnabled || !this.audioContext) {
      return;
    }

    // Resume audio context if suspended (required by some browsers)
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch((error) => {
        console.warn("Could not resume audio context:", error);
        return;
      });
    }

    const soundVolume = volume !== null ? volume : this.volume;

    switch (type) {
      case "like":
        this.playLikeSound(soundVolume);
        break;
      case "comment":
        this.playCommentSound(soundVolume);
        break;
      case "follow":
        this.playFollowSound(soundVolume);
        break;
      case "bulk":
        this.playBulkSound(soundVolume);
        break;
      default:
        this.playDefaultSound(soundVolume);
    }
  }

  // Create a pleasant notification sound using Web Audio API
  createTone(frequency, duration, volume, type = "sine") {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Set oscillator type
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(
        frequency,
        this.audioContext.currentTime
      );

      // Create envelope for smooth sound
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);
    } catch (error) {
      console.warn("Error playing notification sound:", error);
    }
  }

  // Different sounds for different notification types
  playDefaultSound(volume) {
    // Simple two-tone notification
    this.createTone(800, 0.1, volume, "sine");
    setTimeout(() => {
      this.createTone(600, 0.1, volume, "sine");
    }, 150);
  }

  playLikeSound(volume) {
    // Heart-like sound (ascending tone)
    this.createTone(600, 0.08, volume, "sine");
    setTimeout(() => {
      this.createTone(800, 0.08, volume, "sine");
    }, 100);
    setTimeout(() => {
      this.createTone(1000, 0.12, volume, "sine");
    }, 200);
  }

  playCommentSound(volume) {
    // Chat-like sound (quick beep)
    this.createTone(1000, 0.05, volume, "square");
    setTimeout(() => {
      this.createTone(1200, 0.05, volume, "square");
    }, 80);
  }

  playFollowSound(volume) {
    // Welcoming sound (gentle ascending)
    this.createTone(400, 0.1, volume, "sine");
    setTimeout(() => {
      this.createTone(600, 0.1, volume, "sine");
    }, 120);
    setTimeout(() => {
      this.createTone(800, 0.15, volume, "sine");
    }, 240);
  }

  playBulkSound(volume) {
    // More noticeable sound for bulk notifications
    this.createTone(600, 0.08, volume * 1.2, "triangle");
    setTimeout(() => {
      this.createTone(800, 0.08, volume * 1.2, "triangle");
    }, 100);
    setTimeout(() => {
      this.createTone(1000, 0.08, volume * 1.2, "triangle");
    }, 200);
    setTimeout(() => {
      this.createTone(800, 0.12, volume * 1.2, "triangle");
    }, 300);
  }

  // Control methods
  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setSoundType(type) {
    this.soundType = type;
  }

  // Test sound (for settings/preferences)
  playTestSound() {
    if (this.soundType === "none") {
      return;
    }

    this.playDefaultSound(this.volume);
  }

  // Check if audio is supported
  isSupported() {
    return this.audioContext !== null;
  }

  // Handle browser autoplay policies
  async enableAudioContext() {
    if (!this.audioContext) return false;

    try {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      return true;
    } catch (error) {
      console.warn("Could not enable audio context:", error);
      return false;
    }
  }
}

// Create singleton instance
const notificationSound = new NotificationSound();

// Export for use in components
export default notificationSound;

// Export class for testing or custom instances
export { NotificationSound };
