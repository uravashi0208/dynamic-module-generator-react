const mongoose = require('mongoose');

const pageVisitSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      trim: true,
      default: '',
    },
    views: {
      type: Number,
      default: 0,
    },
    bounceRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // true = bounceRate trending up (bad), false = trending down (good)
    bounceUp: {
      type: Boolean,
      default: false,
    },
    lastVisitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One document per unique path
pageVisitSchema.index({ path: 1 }, { unique: true });

module.exports =
  mongoose.models['PageVisit'] ||
  mongoose.model('PageVisit', pageVisitSchema, 'pagevisits');