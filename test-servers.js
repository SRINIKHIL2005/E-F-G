const http = require('http');

// Test backend server
const backendOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET'
};

const frontendOptions = {
  hostname: 'localhost', 
  port: 5173,
  path: '/',
  method: 'GET'
};

console.log('Testing servers...');

// Test backend
const backendReq = http.request(backendOptions, (res) => {
  console.log(`Backend Status: ${res.statusCode}`);
  console.log('Backend server is running ✓');
});

backendReq.on('error', (err) => {
  console.log('Backend server is NOT running ✗');
  console.error('Backend error:', err.message);
});

backendReq.end();

// Test frontend  
const frontendReq = http.request(frontendOptions, (res) => {
  console.log(`Frontend Status: ${res.statusCode}`);
  console.log('Frontend server is running ✓');
});

frontendReq.on('error', (err) => {
  console.log('Frontend server is NOT running ✗');
  console.error('Frontend error:', err.message);
});

frontendReq.end();
