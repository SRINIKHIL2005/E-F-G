import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://dummy:EFG@edu-feedback-galaxy.blnogp8.mongodb.net/?retryWrites=true&w=majority&appName=EDU-FEEDBACK-GALAXY';

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  department: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function testDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Count users by role
    const studentCount = await User.countDocuments({ role: 'student' });
    const teacherCount = await User.countDocuments({ role: 'teacher' });
    const hodCount = await User.countDocuments({ role: 'hod' });
    
    console.log('\n📊 User Counts:');
    console.log(`  Students: ${studentCount}`);
    console.log(`  Teachers: ${teacherCount}`);
    console.log(`  HODs: ${hodCount}`);
    
    // Get sample users with departments
    const sampleStudents = await User.find({ role: 'student' }).limit(5).select('name email department');
    const sampleTeachers = await User.find({ role: 'teacher' }).limit(5).select('name email department');
    
    console.log('\n👨‍🎓 Sample Students:');
    sampleStudents.forEach(student => {
      console.log(`  - ${student.name} (${student.email}) - Dept: ${student.department || 'Not Set'}`);
    });
    
    console.log('\n👨‍🏫 Sample Teachers:');
    sampleTeachers.forEach(teacher => {
      console.log(`  - ${teacher.name} (${teacher.email}) - Dept: ${teacher.department || 'Not Set'}`);
    });
    
    // Check available departments
    const studentDepts = await User.distinct('department', { role: 'student' });
    const teacherDepts = await User.distinct('department', { role: 'teacher' });
    
    console.log('\n🏫 Available Departments:');
    console.log(`  Student departments: ${JSON.stringify(studentDepts)}`);
    console.log(`  Teacher departments: ${JSON.stringify(teacherDepts)}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Database test completed');
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    process.exit(1);
  }
}

console.log('🔍 Testing database connection and user data...');
testDatabase();
