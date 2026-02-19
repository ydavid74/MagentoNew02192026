// API configuration for external services

// Get API URL from environment variables
// For local development: use localhost
// For production: use Railway URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === "production"
    ? "https://shopify-database-sync-production.up.railway.app"
    : "http://localhost:3000");

export const API_CONFIG = {
  // Shopify Database Sync API
  SHOPIFY_SYNC_BASE_URL: `${API_BASE_URL}/api`,

  // API base URL for direct access
  API_BASE_URL: API_BASE_URL,

  // Default headers for all API requests
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    // Bypass ngrok browser interstitial warning
    "ngrok-skip-browser-warning": "1",
  },
} as const;

// Helper function to create fetch options with default headers
export function createFetchOptions(options: RequestInit = {}): RequestInit {
  return {
    ...options,
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...options.headers,
    },
  };
}
