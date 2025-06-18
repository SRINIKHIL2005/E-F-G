// Quick registration test to debug the 400 error
// This will help us see what's failing validation

async function testRegistration() {
  const testData = {
    name: "Test User",
    email: "test@example.com", 
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

  console.log("🚀 Testing registration with data:", JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('https://e-f-g.onrender.com/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log("📡 Response status:", response.status);
    
    const responseData = await response.json();
    console.log("📝 Response data:", responseData);

    if (!response.ok) {
      console.error("❌ Validation failed:");
      if (responseData.errors) {
        responseData.errors.forEach(error => {
          console.error(`  - ${error.path || error.param}: ${error.msg}`);
        });
      }
    }
  } catch (error) {
    console.error("🚨 Network error:", error);
  }
}

// Run the test
testRegistration();
