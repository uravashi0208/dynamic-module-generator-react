const mongoose = require('mongoose');

const pageHistorySchema = new mongoose.Schema({
  page:      { type: String, default: '/' },
  referrer:  { type: String, default: '' },
  visitedAt: { type: Date, default: Date.now },
}, { _id: false });

const visitorSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true, unique: true },

    // Geo (set on first visit, refreshed if changed)
    country:     { type: String, default: 'Unknown' },
    countryCode: { type: String, default: '' },
    city:        { type: String, default: 'Unknown' },
    region:      { type: String, default: '' },
    timezone:    { type: String, default: '' },
    isp:         { type: String, default: '' },

    // Device / Browser (from latest visit)
    browser:   { type: String, default: 'Unknown' },
    os:        { type: String, default: 'Unknown' },
    device:    { type: String, enum: ['Desktop', 'Mobile', 'Tablet', 'Bot', 'Unknown'], default: 'Unknown' },
    userAgent: { type: String, default: '' },

    // Visit tracking
    visitCount:  { type: Number, default: 1 },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt:  { type: Date, default: Date.now },

    // Last 50 page hits for this IP
    pages: { type: [pageHistorySchema], default: [] },
  },
  { timestamps: false }
);

visitorSchema.index({ lastSeenAt: -1 });
visitorSchema.index({ country: 1 });
visitorSchema.index({ device: 1 });

module.exports =
  mongoose.models['Visitor'] ||
  mongoose.model('Visitor', visitorSchema, 'visitors');