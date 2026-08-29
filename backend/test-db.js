const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('URI: mongodb://127.0.0.1:27017/crudapp');

mongoose.connect('mongodb://127.0.0.1:27017/crudapp', {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => {
    console.log('SUCCESS: Connected to MongoDB!');
    process.exit(0);
  })
  .catch(err => {
    console.error('FAILED: Could not connect to MongoDB!');
    console.error('Error:', err.message);
    process.exit(1);
  });
