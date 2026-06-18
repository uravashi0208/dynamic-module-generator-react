// Auto-generated – do not edit manually. Re-generated on every module save.
const mongoose = require('mongoose');

const Test1Schema = new mongoose.Schema(
  {
  name: { type: String, },
    _createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    _updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError on hot-reload
module.exports =
  mongoose.models['test1'] ||
  mongoose.model('test1', Test1Schema, 'test1');
