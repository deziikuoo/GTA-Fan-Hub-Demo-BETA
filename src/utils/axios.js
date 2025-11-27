// Mock axios wrapper - uses mockApi for demo
import mockApi, { refreshAccessToken } from "@/services/mockApi";

// Export mockApi as default (replaces axios)
export default mockApi;

// Export refreshAccessToken helper for compatibility
export { refreshAccessToken };
