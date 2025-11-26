// src/plugins/socket.js

import { io } from "socket.io-client";

// Socket.io client instance
export const socket = io("http://localhost:3003", {
  autoConnect: false, // Don't connect automatically, wait for login
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

// Connection state
let isConnected = false;
let reconnectAttempts = 0;

// Connection helpers
export const connectSocket = () => {
  const token = localStorage.getItem("accessToken");

  console.log("[Socket] Attempting to connect...");
  console.log("[Socket] Token available:", !!token);

  if (!token) {
    console.warn("[Socket] No access token found, cannot connect");
    return;
  }

  if (isConnected) {
    console.log("[Socket] Already connected");
    return;
  }

  // Set the auth token before connecting
  socket.auth = { token };
  console.log("[Socket] Auth set with token, connecting to server...");

  socket.connect();
};

export const disconnectSocket = () => {
  if (!isConnected) {
    console.log("[Socket] Already disconnected");
    return;
  }

  console.log("[Socket] Disconnecting...");
  socket.disconnect();
  isConnected = false;
};

export const isSocketConnected = () => {
  return isConnected;
};

// ==================== EVENT LISTENERS ====================

socket.on("connect", () => {
  isConnected = true;
  reconnectAttempts = 0;
  console.log("[Socket] Connected successfully (ID:", socket.id, ")");
});

socket.on("connected", (data) => {
  console.log("[Socket] Server confirmed connection:", data.message);
});

socket.on("disconnect", (reason) => {
  isConnected = false;
  console.log("[Socket] Disconnected:", reason);

  if (reason === "io server disconnect") {
    // Server disconnected us, try to reconnect
    console.log(
      "[Socket] Server initiated disconnect, attempting reconnect..."
    );
    socket.connect();
  }
});

socket.on("connect_error", (error) => {
  console.error("[Socket] Connection error:", error.message);
  reconnectAttempts++;

  // Check if it's an authentication error
  if (error.message.includes("Authentication")) {
    console.error(
      "[Socket] Authentication failed - token may be invalid or expired"
    );
    console.error(
      "[Socket] Current token:",
      localStorage.getItem("accessToken") ? "exists" : "missing"
    );

    // Don't retry on auth errors
    socket.disconnect();
    return;
  }

  if (reconnectAttempts > 3) {
    console.error("[Socket] Multiple connection failures, please check server");
  }
});

socket.on("reconnect", (attemptNumber) => {
  console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
  reconnectAttempts = 0;
});

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log(`[Socket] Reconnection attempt ${attemptNumber}...`);

  // Update auth token before reconnecting (in case it was refreshed)
  const token = localStorage.getItem("accessToken");
  if (token) {
    socket.auth = { token };
  }
});

socket.on("reconnect_failed", () => {
  console.error("[Socket] Reconnection failed after all attempts");
  isConnected = false;
});

// Export helpers
export default {
  socket,
  connectSocket,
  disconnectSocket,
  isSocketConnected,
};
