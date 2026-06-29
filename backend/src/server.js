require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB         = require('./config/database');
const ensureIndexes     = require('./config/ensureIndexes');
const logger            = require('./config/logger');
const authRoutes        = require('./routes/authRoutes');
const moduleRoutes      = require('./routes/moduleRoutes');
const pageVisitRoutes   = require('./routes/pageVisitRoutes');
const visitorRoutes     = require('./routes/visitorRoutes');
const dynamicDataRouter = require('./routes/dynamicDataRouter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ─── Trust Proxy ──────────────────────────────────────────────────────────────
// Required for Render/Heroku/Railway — they sit behind a reverse proxy.
// Without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// and CORS headers may not work correctly.
app.set('trust proxy', 1);

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
// CORS — allow all Render subdomains + localhost
app.use(cors({
  origin: (origin, callback) => {
    // Always allow — BE and FE may be on different Render subdomains
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { success: false, message: 'Too many requests. Try again in 15 minutes.' },
  standardHeaders: true, legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  message: { success: false, message: 'Too many requests. Try again later.' },
  standardHeaders: true, legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (m) => logger.info(m.trim()) } }));
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() })
);

// ─── Uploads — serve uploaded files statically ───────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ─── Routes ───────────────────────────────────────────────────────────────────
// Order matters: specific paths first, wildcard last.
app.use('/api/auth',         authLimiter, authRoutes);
app.use('/api/modules',      apiLimiter,  moduleRoutes);
app.use('/api/page-visits',  apiLimiter,  pageVisitRoutes);
app.use('/api/visitors',     apiLimiter,  visitorRoutes);

// Dynamic data router — catches /api/:moduleSlug and /api/:moduleSlug/:id
// All module CRUD is handled here without any per-module route files.
app.use('/api', apiLimiter, dynamicDataRouter);

// ─── Serve FE Static Files ────────────────────────────────────────────────────
// Check env var first, then common relative paths
const possibleDistDirs = [
  process.env.FE_DIST_DIR,
  path.join(__dirname, '..', '..', 'fe', 'dist'),
  path.join(__dirname, '..', '..', 'frontend', 'dist'),
  path.join(__dirname, '..', 'public'),
].filter(Boolean);

const feDistDir = possibleDistDirs.find((d) => fs.existsSync(d));

if (feDistDir) {
  app.use(express.static(feDistDir));
  // SPA fallback — non-API GET requests serve index.html so React Router works on refresh
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.sendFile(path.join(feDistDir, 'index.html'));
  });
  logger.info('Serving FE dist from: ' + feDistDir);
} else {
  logger.warn('FE dist directory not found - API only mode');
}

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await ensureIndexes(require('mongoose'));

  // On startup: pre-register all active module Mongoose models so the first
  // request to any module is instant (no on-demand build delay).
  try {
    const mongoose = require('mongoose');
    const Module   = require('./models/Module');
    const db       = mongoose.connection.db;
    const modules  = await Module.find({ isActive: true }).lean();

    for (const mod of modules) {
      const slug = mod.moduleSlug;

      // If already registered (e.g. by a legacy generated model file), skip
      if (mongoose.models[slug]) {
        logger.info(`✅ Model already registered: ${slug}`);
        continue;
      }

      const schemaFields = {};
      (mod.fields || []).forEach((f) => {
        if (['number', 'range'].includes(f.fieldType)) {
          schemaFields[f.fieldName] = { type: Number, required: f.validations?.required || false };
        } else if (f.fieldType === 'checkbox') {
          // Multi-checkbox stores array of selected string values — NOT Boolean
          schemaFields[f.fieldName] = { type: [String], default: [] };
        } else if (['date', 'datetime-local'].includes(f.fieldType)) {
          schemaFields[f.fieldName] = { type: Date, required: f.validations?.required || false };
        } else if (f.fieldType === 'file') {
          // File fields store the uploaded file path as a string
          schemaFields[f.fieldName] = { type: String, default: '' };
        } else {
          schemaFields[f.fieldName] = { type: String, required: f.validations?.required || false };
        }
      });
      schemaFields._createdBy = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };
      schemaFields._updatedBy = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };

      const schema = new mongoose.Schema(schemaFields, { timestamps: true });
      mongoose.model(slug, schema, slug);

      // Ensure physical collection exists
      const cols = await db.listCollections({ name: slug }).toArray();
      if (cols.length === 0) {
        await db.createCollection(slug);
        logger.info(`🗄️  Created collection on boot: ${slug}`);
      } else {
        logger.info(`✅ Collection ready: ${slug}`);
      }
    }

    if (modules.length > 0)
      logger.info(`⚡ ${modules.length} module(s) synced on startup`);
  } catch (err) {
    logger.warn('Startup module sync warning:', err.message);
  }

  app.listen(PORT, () => {
    logger.info(`🚀  Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    logger.info(`❤️   Health: http://localhost:${PORT}/health`);
    logger.info(`🔌  Dynamic data API: /api/:moduleSlug`);
  });
};

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UnhandledRejection at:', promise, 'reason:', reason);
  // Don't exit — log and continue so server stays alive
});
process.on('uncaughtException', (err) => {
  logger.error('UncaughtException:', err.message, err.stack);
  // Don't exit on non-fatal errors
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE') return;
  process.exit(1);
});

startServer();
module.exports = app;