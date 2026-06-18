// Auto-generated – do not edit manually. Re-generated on every module save.
const mongoose = require('mongoose');

const Test5Schema = new mongoose.Schema(
  {
  emailssss: { type: String, },
    _createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    _updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError on hot-reload
module.exports =
  mongoose.models['test5'] ||
  mongoose.model('test5', Test5Schema, 'test5');
