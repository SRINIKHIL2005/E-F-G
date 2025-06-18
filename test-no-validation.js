// Test registration without any validation
console.log('🚨 TESTING: Zero validation registration');

const testData = {
  name: 'Test User',
  email: 'test@test.com',
  password: 'Password123!',
  role: 'student',
  department: 'CS',
  phone: '1234567890',
  termsVersion: '1.0',
  privacyVersion: '1.0',
  termsOfServiceVersion: '1.0',
  dataProcessingConsent: 'true',
  marketingConsent: true
};

console.log('🚀 Test data structure:');
console.log(JSON.stringify(testData, null, 2));
console.log('📊 Fields:', Object.keys(testData).length);

// Test the API call format
console.log('\n📡 Testing API call format...');
const apiUrl = 'https://e-f-g.onrender.com/api/auth/register';

console.log('URL:', apiUrl);
console.log('Method: POST');
console.log('Headers: Content-Type: application/json');
console.log('Body:', JSON.stringify(testData));

console.log('\n✅ This should work with NO validation on backend!');
