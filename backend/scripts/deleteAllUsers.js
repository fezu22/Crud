require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');

const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Media = require('../models/Media');
const ChatMessage = require('../models/ChatMessage');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crudapp';

async function deleteAllUsers() {
  if (process.argv.includes('--confirm') !== true) {
    console.error(
      'Refusing to run without confirmation. Re-run with: node scripts/deleteAllUsers.js --confirm',
    );
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');

    const [userCount, taskCount, projectCount, mediaCount, chatCount] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Project.countDocuments(),
      Media.countDocuments(),
      ChatMessage.countDocuments(),
    ]);

    console.log(
      `Found ${userCount} users, ${taskCount} tasks, ${projectCount} projects, ${mediaCount} media items, and ${chatCount} chat messages.`,
    );

    const result = await Promise.all([
      ChatMessage.deleteMany({}),
      Media.deleteMany({}),
      Task.deleteMany({}),
      Project.deleteMany({}),
      User.deleteMany({}),
    ]);

    console.log('Deleted all records from the database:');
    console.log(`- chat messages: ${result[0].deletedCount}`);
    console.log(`- media: ${result[1].deletedCount}`);
    console.log(`- tasks: ${result[2].deletedCount}`);
    console.log(`- projects: ${result[3].deletedCount}`);
    console.log(`- users: ${result[4].deletedCount}`);
  } catch (error) {
    console.error(`Failed to delete users: ${error.message || error}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

deleteAllUsers();
