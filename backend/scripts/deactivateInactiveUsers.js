require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const cutoff = new Date(Date.now() - FIVE_DAYS_MS);
const applyChanges = process.argv.includes('--apply');

// lastActiveAt is included as an additional safety guard: an account with a
// stale login timestamp but an active authenticated session must not be swept.
const inactiveUserFilter = {
  role: { $ne: 'admin' },
  isSystem: { $ne: true },
  isActive: { $ne: false },
  // $type prevents legacy documents with null/missing lastLoginAt from being
  // treated as older than the cutoff before they have a trustworthy login.
  lastLoginAt: { $type: 'date', $lt: cutoff },
  $or: [
    { lastActiveAt: { $lt: cutoff } },
    { lastActiveAt: null },
    { lastActiveAt: { $exists: false } },
  ],
};

async function deactivateInactiveUsers() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crudapp';

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

    const affected = await User.countDocuments(inactiveUserFilter);
    console.log(`Users eligible for safe deactivation: ${affected}`);

    if (!applyChanges) {
      console.log('Dry run only. Re-run with --apply to deactivate eligible users.');
      return;
    }

    const result = await User.updateMany(inactiveUserFilter, {
      $set: { isActive: false },
    });
    console.log(`Users deactivated: ${result.modifiedCount}`);
  } catch (error) {
    console.error(`Inactive-user maintenance failed: ${error.message || error}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

deactivateInactiveUsers();
