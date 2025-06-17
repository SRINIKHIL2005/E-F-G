import React from 'react';

const DebugPage: React.FC = () => {
  const envVars = {
    NODE_ENV: import.meta.env.NODE_ENV,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_RENDER_DEPLOYMENT: import.meta.env.VITE_RENDER_DEPLOYMENT,
    MODE: import.meta.env.MODE,
  };

  const apiConfig = {
    currentUrl: window.location.href,
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol,
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug Information</h1>
      
      <h2>Environment Variables:</h2>
      <pre>{JSON.stringify(envVars, null, 2)}</pre>
      
      <h2>Current Location:</h2>
      <pre>{JSON.stringify(apiConfig, null, 2)}</pre>
      
      <h2>API Test:</h2>
      <button 
        onClick={async () => {
          try {
            const response = await fetch('/api/health');
            console.log('API Response:', response);
            alert(`API Status: ${response.status}`);
          } catch (error) {
            console.error('API Error:', error);
            alert(`API Error: ${error.message}`);
          }
        }}
      >
        Test API Connection
      </button>
      
      <h2>Static Asset Test:</h2>
      <img 
        src="/favicon.svg" 
        alt="Favicon test" 
        style={{ width: '32px', height: '32px' }}
        onLoad={() => console.log('Favicon loaded successfully')}
        onError={() => console.log('Favicon failed to load')}
      />
    </div>
  );
};

export default DebugPage;
