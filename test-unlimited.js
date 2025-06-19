import fetch from 'node-fetch';

async function testUnlimited() {
  console.log('🚀 Testing UNLIMITED API (no limits)...');
  
  try {
    const response = await fetch('http://localhost:5000/api/hod/debug-dashboard');
    const data = await response.json();
    
    console.log('✅ SUCCESS - ALL DATA UNLIMITED:');
    console.log(`📊 Total Students: ${data.summary.totalStudents}`);
    console.log(`👨‍🏫 Total Faculty: ${data.summary.totalFaculty}`);
    console.log(`🎯 Students returned: ${data.students.length}`);
    console.log(`🎯 Faculty returned: ${data.faculty.length}`);
    
    if (data.students.length === data.summary.totalStudents && 
        data.faculty.length === data.summary.totalFaculty) {
      console.log('🎉 PERFECT! All users are being returned without limits!');
    } else {
      console.log('⚠️ Still some limits detected');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUnlimited();
