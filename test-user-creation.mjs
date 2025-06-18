// Test user creation directly
import mongoose from 'mongoose';
import User from './server/models/user.model.js';

// Simple test data
const testUser = {
  name: 'Test User',
  email: 'test@test.com',
  password: 'Password123!',
  role: 'student',
  department: 'CS'
};

console.log('🧪 Testing User model creation...');
console.log('Test data:', testUser);

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eduFeedback';
console.log('Connecting to:', mongoURI);

try {
  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log('✅ Connected to MongoDB');
  
  // Try to create user
  const user = new User(testUser);
  const savedUser = await user.save();
  
  console.log('✅ User created successfully!');
  console.log('User ID:', savedUser._id);
  console.log('Hashed password length:', savedUser.password.length);
  
  // Clean up - delete the test user
  await User.deleteOne({ _id: savedUser._id });
  console.log('🧹 Test user cleaned up');
  
} catch (error) {
  console.error('❌ Error creating user:');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
} finally {
  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB');
}
