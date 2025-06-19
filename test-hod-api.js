import http from 'http';

// Test the HOD debug dashboard endpoint
const testAPI = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/hod/debug-dashboard',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ API Response Status:', res.statusCode);
        console.log('📊 Dashboard Data:');
        console.log('  Students:', jsonData.summary?.totalStudents || 'N/A');
        console.log('  Teachers:', jsonData.summary?.totalFaculty || 'N/A');
        console.log('  Courses:', jsonData.summary?.totalCourses || 'N/A');
        console.log('  Feedback Forms:', jsonData.summary?.totalFeedbacks || 'N/A');
        console.log('\nFull Response:', JSON.stringify(jsonData, null, 2));
      } catch (error) {
        console.error('❌ Error parsing JSON:', error);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error);
  });

  req.end();
};

console.log('🔍 Testing HOD Dashboard API...');
testAPI();
