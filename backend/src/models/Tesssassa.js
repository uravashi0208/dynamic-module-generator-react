// Auto-generated – do not edit manually. Re-generated on every module save.
const mongoose = require('mongoose');

const TesssassaSchema = new mongoose.Schema(
  {
  test1: { type: String, },
  test2: { type: String, },
  email: { type: String, },
  password: { type: String, },
  gender: { type: String, },
  hobby: { type: Boolean, },
    _createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    _updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError on hot-reload
module.exports =
  mongoose.models['tesssassa'] ||
  mongoose.model('tesssassa', TesssassaSchema, 'tesssassa');
