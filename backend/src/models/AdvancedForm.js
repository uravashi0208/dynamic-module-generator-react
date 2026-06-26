// Auto-generated – do not edit manually. Re-generated on every module save.
const mongoose = require('mongoose');

const AdvancedFormSchema = new mongoose.Schema(
  {
  profile_pic: { type: String, },
  protfolio_url: { type: String,
    required: [true, 'Protfolio URL is required'], },
  phone_number: { type: String, },
  theme_color: { type: String, },
  slider: { type: Number, },
    _createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    _updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError on hot-reload
module.exports =
  mongoose.models['advanced-form'] ||
  mongoose.model('advanced-form', AdvancedFormSchema, 'advanced-form');
