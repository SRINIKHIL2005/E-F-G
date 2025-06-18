// Quick registration test for Node.js
import fetch from 'node-fetch';

async function testRegistration() {
  const testData = {
    name: "Test User",
    email: "testuser" + Date.now() + "@example.com",
    password: "TestPass123!",
    role: "student",
    department: "Computer Science",
    phone: "+1234567890",
    termsVersion: "1.0",
    privacyVersion: "1.0",
    termsOfServiceVersion: "1.0",
    dataProcessingConsent: "true",
    marketingConsent: true
  };

  console.log('🔧 Testing backend with complete data...');

  try {
    const response = await fetch('https://e-f-g.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);

    if (response.ok) {
      console.log('✅ Backend works with complete data!');
    } else {
      console.log('❌ Backend validation errors:', data.errors);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRegistration();
