// Test unique email registration endpoint
console.log('🧪 Testing /register-unique endpoint...');

const testUniqueRegistration = async () => {
  try {
    const response = await fetch('https://e-f-g.onrender.com/api/auth/register-unique', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test User',
        password: 'Password123!',
        department: 'Computer Science'
      })
    });
    
    console.log('📡 Response status:', response.status);
    const data = await response.json();
    console.log('📝 Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('🎉 UNIQUE REGISTRATION SUCCESSFUL!');
      console.log('Generated email:', data.generatedEmail);
      console.log('User ID:', data.user?.id);
      console.log('Token received:', data.token ? 'Yes' : 'No');
    } else {
      console.log('❌ Registration failed:', data.message);
      console.log('Error details:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

testUniqueRegistration();
