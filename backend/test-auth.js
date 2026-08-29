const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Task = require('./models/Task');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crudapp';
const logLines = [];
function log(msg) {
  console.log(msg);
  logLines.push(msg);
}

async function testAuth() {
  try {
    log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    log('✅ Connected to MongoDB');

    // 1. Clean up previous test user
    const testEmail = 'authtest_' + Date.now() + '@example.com';
    await User.deleteMany({ email: { $regex: /^authtest_/ } });

    // 2. Test User Registration / Creation with Password Hashing
    log('--- 1. Testing User Registration & Hashing ---');
    const rawPassword = 'SecretPassword123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const user = await User.create({
      name: 'Test Auth User',
      email: testEmail,
      password: hashedPassword,
    });
    log(`✅ User registered successfully in MongoDB: ${user._id} (${user.email})`);

    // 3. Test Password Comparison
    log('--- 2. Testing Password Verification (Login) ---');
    const isMatch = await bcrypt.compare(rawPassword, user.password);
    const isWrongMatch = await bcrypt.compare('WrongPassword', user.password);
    if (isMatch && !isWrongMatch) {
      log('✅ Password hash verification succeeded');
    } else {
      throw new Error('Password verification failed');
    }

    // 4. Test JWT Signing and Verification
    log('--- 3. Testing JWT Token Generation & Verification ---');
    const secret = process.env.JWT_SECRET || 'default_jwt_secret';
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' });
    const decoded = jwt.verify(token, secret);
    if (decoded.id.toString() === user._id.toString()) {
      log(`✅ JWT generated and verified correctly: ${token.substring(0, 25)}...`);
    } else {
      throw new Error('JWT verification mismatch');
    }

    // 5. Test User-associated Task Creation & Scoping
    log('--- 4. Testing User-Scoped Task CRUD ---');
    const task = await Task.create({
      user: user._id,
      title: 'Authenticated Task Demo',
      description: 'Only accessible by this user',
      completed: false,
    });
    log(`✅ Created user-associated task: ${task._id} for user: ${task.user}`);

    const userTasks = await Task.find({ user: user._id });
    log(`✅ Found ${userTasks.length} task(s) belonging to user.`);

    // 6. Cleanup
    await Task.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);
    log('✅ Cleaned up test records from MongoDB');

    log('🎉 ALL AUTH & MONGODB TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    log(`❌ Auth Test Error: ${err.message || err}`);
  } finally {
    try {
      await mongoose.disconnect();
      log('Disconnected from MongoDB.');
    } catch (e) {}
    fs.writeFileSync('./auth-test-log.txt', logLines.join('\n'), 'utf8');
  }
}

testAuth();
