const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Injects the target database name into the MongoDB connection URI.
 *
 * Problem: Standard Atlas multi-host URIs end with /?querystring
 * Mongoose defaults to "test" DB when path is just "/".
 *
 * Before: mongodb://user:pass@h1:27017,h2:27017,h3:27017/?ssl=true&...
 * After:  mongodb://user:pass@h1:27017,h2:27017,h3:27017/dynamic_module_gen?ssl=true&...
 *
 * Uses regex instead of URL() — URL() cannot parse multi-host MongoDB URIs.
 */
const injectDbName = (uri, dbName) => {
  // Already has a real DB path segment — do not override
  // Pattern: after the host(s) there is /something (not just /)
  if (/\/\/[^/]+\/[^/?]+(\?|$)/.test(uri)) {
    return uri;
  }
  // Insert dbName right before "?"
  if (uri.includes('?')) {
    return uri.replace('/?', `/${dbName}?`);
  }
  // No query string — append
  return uri.replace(/\/?$/, `/${dbName}`);
};

const connectDB = async () => {
  try {
    const DB_NAME = process.env.DB_NAME || 'dynamic_module_gen';
    const uri = injectDbName(process.env.MONGODB_URI, DB_NAME);

    logger.info(`Connecting to database: "${DB_NAME}"...`);

    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB Connected | Host: ${conn.connection.host} | DB: ${conn.connection.name}`);

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
