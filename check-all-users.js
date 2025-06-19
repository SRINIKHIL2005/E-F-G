import mongoose from 'mongoose';

async function checkAllUsers() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://dummy:EFG@edu-feedback-galaxy.blnogp8.mongodb.net/?retryWrites=true&w=majority&appName=EDU-FEEDBACK-GALAXY';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB connected successfully');
    
    // Simple user schema
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      role: String,
      department: String
    }, { collection: 'users' });
    
    const User = mongoose.model('User', userSchema);
    
    // Count ALL users
    const totalUsers = await User.countDocuments({});
    const studentCount = await User.countDocuments({ role: 'student' });
    const teacherCount = await User.countDocuments({ role: 'teacher' });
    
    console.log(`📊 TOTAL DATABASE COUNTS:`);
    console.log(`  Total Users: ${totalUsers}`);
    console.log(`  Students: ${studentCount}`);
    console.log(`  Teachers: ${teacherCount}`);
    
    // Get ALL students (not limited)
    const allStudents = await User.find({ role: 'student' }).select('name email department');
    console.log(`\n👨‍🎓 ALL ${allStudents.length} STUDENTS:`);
    allStudents.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.name} (${student.email}) - Dept: ${student.department}`);
    });
    
    // Get ALL teachers (not limited)
    const allTeachers = await User.find({ role: 'teacher' }).select('name email department');
    console.log(`\n👨‍🏫 ALL ${allTeachers.length} TEACHERS:`);
    allTeachers.forEach((teacher, index) => {
      console.log(`  ${index + 1}. ${teacher.name} (${teacher.email}) - Dept: ${teacher.department}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

checkAllUsers();
