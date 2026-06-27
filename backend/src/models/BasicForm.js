// Auto-generated – do not edit manually. Re-generated on every module save.
const mongoose = require('mongoose');

const BasicFormSchema = new mongoose.Schema(
  {
  name: { type: String, },
  email: { type: String, },
  passoword: { type: String, },
  address: { type: String, },
  phone_nummber: { type: Number, },
    _createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    _updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError on hot-reload
module.exports =
  mongoose.models['basic-form'] ||
  mongoose.model('basic-form', BasicFormSchema, 'basic-form');
