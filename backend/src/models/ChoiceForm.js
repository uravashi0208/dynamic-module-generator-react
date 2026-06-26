// Auto-generated – do not edit manually. Re-generated on every module save.
const mongoose = require('mongoose');

const ChoiceFormSchema = new mongoose.Schema(
  {
  hobby: { type: [String], default: [] },
  gender: { type: String, },
  city: { type: String, },
    _createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    _updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError on hot-reload
module.exports =
  mongoose.models['choice-form'] ||
  mongoose.model('choice-form', ChoiceFormSchema, 'choice-form');