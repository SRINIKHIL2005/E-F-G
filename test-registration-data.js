// Quick test of registration data structure
console.log('Testing registration data structure...');

const testRegistrationData = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPass123!',
  role: 'student',
  department: 'Computer Science',
  phone: '1234567890',
  termsVersion: '1.0',
  privacyVersion: '1.0', 
  termsOfServiceVersion: '1.0',
  dataProcessingConsent: 'true', // MUST BE STRING 'true' - backend expects this!
  marketingConsent: true
};

console.log('🚀 Registration data:');
console.log(JSON.stringify(testRegistrationData, null, 2));
console.log('📊 Field count:', Object.keys(testRegistrationData).length);
console.log('📋 Fields:', Object.keys(testRegistrationData));

// Expected backend fields
const expectedFields = [
  'name', 'email', 'password', 'role', 'department', 
  'phone', 'termsVersion', 'privacyVersion', 'termsOfServiceVersion', 
  'dataProcessingConsent', 'marketingConsent'
];

console.log('\n✅ Expected fields:', expectedFields);
console.log('✅ Expected count:', expectedFields.length);

// Check if all expected fields are present
const missingFields = expectedFields.filter(field => !(field in testRegistrationData));
console.log('\n🔍 Missing fields:', missingFields.length === 0 ? 'None' : missingFields);

console.log('\n🎯 This structure should work with the backend!');
