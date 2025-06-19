import fetch from 'node-fetch';

async function testAllUsers() {
  console.log('🧪 Testing updated API endpoints...');
  
  try {
    const response = await fetch('http://localhost:5000/api/hod/debug-dashboard');
    const data = await response.json();
    
    console.log('📊 Dashboard Summary:');
    console.log(`  Total Students: ${data.summary.totalStudents}`);
    console.log(`  Total Faculty: ${data.summary.totalFaculty}`);
    console.log(`  Students in response: ${data.students.length}`);
    console.log(`  Faculty in response: ${data.faculty.length}`);
    
    console.log('\n👥 All Students:');
    data.students.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.name} (${student.email}) - ${student.department}`);
    });
    
    console.log('\n👨‍🏫 All Faculty:');
    data.faculty.forEach((teacher, index) => {
      console.log(`  ${index + 1}. ${teacher.name} (${teacher.email}) - ${teacher.department}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAllUsers();
