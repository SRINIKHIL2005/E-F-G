// Deployment configuration for Vite-based React app
export const DEPLOYMENT_CONFIG = {
  // Render deployment configuration
  IS_RENDER: !!import.meta.env.VITE_RENDER_DEPLOYMENT,
  IS_GITHUB_PAGES: !import.meta.env.VITE_RENDER_DEPLOYMENT,
  BASE_PATH: import.meta.env.VITE_RENDER_DEPLOYMENT ? '/' : '/EDUGALXY',
  
  // Build configuration
  BUILD_OUTPUT_DIR: import.meta.env.VITE_RENDER_DEPLOYMENT ? 'dist' : 'docs',
  VITE_BUILD: true,
  
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
  
  // Feature flags for deployment
  FEATURES: {
    // Enable backend-dependent features when API URL is available
    ENABLE_AUTH: !!import.meta.env.VITE_API_BASE_URL || import.meta.env.DEV,
    ENABLE_AI_FEATURES: !!import.meta.env.VITE_GEMINI_API_KEY,
    ENABLE_REALTIME: !!import.meta.env.VITE_API_BASE_URL || import.meta.env.DEV,
    DEMO_MODE: !import.meta.env.VITE_API_BASE_URL && !import.meta.env.DEV,
  }
};

// Firebase configuration for deployment
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id"
};
