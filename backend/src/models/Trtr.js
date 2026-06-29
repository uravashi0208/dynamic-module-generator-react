// Auto-generated – do not edit manually. Re-generated on every module save.
const mongoose = require('mongoose');

const TrtrSchema = new mongoose.Schema(
  {
  name: { type: String, },
    _createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    _updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError on hot-reload
module.exports =
  mongoose.models['trtr'] ||
  mongoose.model('trtr', TrtrSchema, 'trtr');
