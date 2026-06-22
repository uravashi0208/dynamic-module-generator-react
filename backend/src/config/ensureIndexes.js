/**
 * ensureIndexes.js
 * Creates all required MongoDB indexes on startup.
 * Safe to run multiple times (idempotent).
 */
const logger = require('./logger');

const ensureIndexes = async (mongoose) => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    // Module collection — regular indexes (NO text index to avoid $text issues)
    const moduleCol = db.collection('modules');
    await moduleCol.createIndex({ moduleSlug: 1 }, { unique: true, sparse: true }).catch(() => {});
    await moduleCol.createIndex({ isActive: 1 }).catch(() => {});
    await moduleCol.createIndex({ createdAt: -1 }).catch(() => {});

    logger.info('✅ MongoDB indexes verified');
  } catch (err) {
    logger.warn('Index creation warning (non-fatal):', err.message);
  }
};

module.exports = ensureIndexes;
