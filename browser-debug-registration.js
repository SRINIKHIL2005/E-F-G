// Browser Console Debug Script
// Copy and paste this into your browser console on the registration page

// Override the original fetch to intercept registration requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  if (url.includes('/api/auth/register')) {
    console.log('🔍 INTERCEPTED REGISTRATION REQUEST:');
    console.log('URL:', url);
    console.log('Method:', options.method);
    console.log('Headers:', options.headers);
    console.log('Body (raw):', options.body);
    
    try {
      const parsedBody = JSON.parse(options.body);
      console.log('Body (parsed):', parsedBody);
      
      // Validate each field
      console.log('🧪 FIELD VALIDATION:');
      console.log('- name:', typeof parsedBody.name, parsedBody.name);
      console.log('- email:', typeof parsedBody.email, parsedBody.email);
      console.log('- password:', typeof parsedBody.password, parsedBody.password?.length, 'chars');
      console.log('- role:', typeof parsedBody.role, parsedBody.role);
      console.log('- department:', typeof parsedBody.department, parsedBody.department);
      console.log('- phone:', typeof parsedBody.phone, parsedBody.phone);
      console.log('- termsVersion:', typeof parsedBody.termsVersion, parsedBody.termsVersion);
      console.log('- privacyVersion:', typeof parsedBody.privacyVersion, parsedBody.privacyVersion);
      console.log('- termsOfServiceVersion:', typeof parsedBody.termsOfServiceVersion, parsedBody.termsOfServiceVersion);
      console.log('- dataProcessingConsent:', typeof parsedBody.dataProcessingConsent, parsedBody.dataProcessingConsent);
      console.log('- marketingConsent:', typeof parsedBody.marketingConsent, parsedBody.marketingConsent);
    } catch (e) {
      console.error('❌ Failed to parse request body:', e);
    }
  }
  
  return originalFetch.apply(this, args).then(response => {
    if (url.includes('/api/auth/register')) {
      console.log('📡 REGISTRATION RESPONSE:');
      console.log('Status:', response.status);
      console.log('OK:', response.ok);
      
      // Clone response to read it without consuming it
      return response.clone().json().then(data => {
        console.log('Response Data:', data);
        return response;
      }).catch(() => response);
    }
    return response;
  });
};

console.log('✅ Registration debugging enabled! Now try to register and check the console.');
