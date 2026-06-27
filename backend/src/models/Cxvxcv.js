// Auto-generated – do not edit manually. Re-generated on every module save.
const mongoose = require('mongoose');

const CxvxcvSchema = new mongoose.Schema(
  {
  test1: { type: String, },
  test2: { type: String, },
  test3: { type: String, },
  test4: { type: String, },
  test5: { type: String, },
  test6: { type: String, },
    _createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    _updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError on hot-reload
module.exports =
  mongoose.models['cxvxcv'] ||
  mongoose.model('cxvxcv', CxvxcvSchema, 'cxvxcv');
