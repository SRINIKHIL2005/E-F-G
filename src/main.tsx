import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add error logging for debugging
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('Starting React app...');
console.log('Environment:', import.meta.env.MODE);

createRoot(document.getElementById("root")!).render(<App />);
