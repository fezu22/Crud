require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const identity = process.argv[2];
if (!identity) { console.error('Usage: node scripts/makeAdmin.js <email-or-phone>'); process.exit(1); }
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crudapp').then(async () => {
  const user = await User.findOne({ $or: [{ email: identity.toLowerCase() }, { phoneNumber: identity }] });
  if (!user) throw new Error(`User not found: ${identity}`);
  user.role = 'admin'; await user.save(); console.log(`Admin role set for ${user.email || user.phoneNumber}`); await mongoose.disconnect();
}).catch(error => { console.error(error.message); process.exit(1); });
