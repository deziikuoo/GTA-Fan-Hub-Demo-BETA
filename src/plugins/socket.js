// Mock Socket.io implementation for demo
// Creates a mock socket that emits events based on user actions

// Connection state
let isConnected = false;
let eventListeners = {};

// Mock socket object
const mockSocket = {
  id: "demo_socket_" + Date.now(),
  auth: {},
  
  on(event, callback) {
    if (!eventListeners[event]) {
      eventListeners[event] = [];
    }
    eventListeners[event].push(callback);
  },
  
  off(event, callback) {
    if (eventListeners[event]) {
      eventListeners[event] = eventListeners[event].filter((cb) => cb !== callback);
    }
  },
  
  emit(event, data) {
    console.log("[Mock Socket] Emit:", event, data);
    // In a real implementation, this would send to server
    // For demo, we just log it
  },
  
  connect() {
    isConnected = true;
    this.trigger("connect");
    this.trigger("connected", { message: "Connected to demo server" });
  },
  
  disconnect() {
    isConnected = false;
    this.trigger("disconnect", "client disconnect");
  },
  
  trigger(event, data) {
    if (eventListeners[event]) {
      eventListeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[Mock Socket] Error in ${event} listener:`, error);
        }
      });
    }
  },
};

// Connection helpers
export const connectSocket = () => {
  const token = localStorage.getItem("accessToken");

  console.log("[Mock Socket] Attempting to connect...");
  console.log("[Mock Socket] Token available:", !!token);

  if (!token) {
    console.warn("[Mock Socket] No access token found, cannot connect");
    return;
  }

  if (isConnected) {
    console.log("[Mock Socket] Already connected");
    return;
  }

  // Set the auth token
  mockSocket.auth = { token };
  console.log("[Mock Socket] Auth set with token, connecting...");

  // Simulate connection delay
  setTimeout(() => {
    mockSocket.connect();
  }, 100);
};

export const disconnectSocket = () => {
  if (!isConnected) {
    console.log("[Mock Socket] Already disconnected");
    return;
  }

  console.log("[Mock Socket] Disconnecting...");
  mockSocket.disconnect();
};

export const isSocketConnected = () => {
  return isConnected;
};

// Helper to emit mock notifications (for demo purposes)
export const emitMockNotification = (notification) => {
  if (isConnected) {
    mockSocket.trigger("notification", notification);
  }
};

// Export socket (mimics socket.io-client export)
export const socket = mockSocket;

// Export helpers
export default {
  socket,
  connectSocket,
  disconnectSocket,
  isSocketConnected,
  emitMockNotification,
};
