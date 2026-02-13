/**
 * Application configuration - reads from environment variables
 */

// API host from environment variable, defaults to localhost:8000
const API_HOST = import.meta.env.VITE_API_HOST || 'localhost:8000'

// Determine protocol based on current page (for production HTTPS support)
const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
const httpProtocol = isSecure ? 'https:' : 'http:'
const wsProtocol = isSecure ? 'wss:' : 'ws:'

export const config = {
  apiHost: API_HOST,
  apiBaseUrl: `${httpProtocol}//${API_HOST}`,
  wsBaseUrl: `${wsProtocol}//${API_HOST}`,
}
