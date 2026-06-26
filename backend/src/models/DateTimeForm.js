// Auto-generated – do not edit manually. Re-generated on every module save.
const mongoose = require('mongoose');

const DateTimeFormSchema = new mongoose.Schema(
  {
  dob: { type: Date, },
  login_date_time: { type: Date, },
    _createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    _updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError on hot-reload
module.exports =
  mongoose.models['date-time-form'] ||
  mongoose.model('date-time-form', DateTimeFormSchema, 'date-time-form');
