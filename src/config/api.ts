// API Configuration for deployment
const getApiBaseUrl = () => {
  // For Render deployment
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Development fallback
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  
  // Production fallback (same domain, different port)
  return `${window.location.protocol}//${window.location.hostname}:5000`;
};

const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  // Fallback to demo mode if no backend is available
  DEMO_MODE: !import.meta.env.VITE_API_BASE_URL && !import.meta.env.DEV,
  TIMEOUT: 30000, // Increased timeout for Render cold starts
};

export default API_CONFIG;
