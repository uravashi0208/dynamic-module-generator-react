require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB         = require('./config/database');
const logger            = require('./config/logger');
const authRoutes        = require('./routes/authRoutes');
const moduleRoutes      = require('./routes/moduleRoutes');
const dynamicDataRouter = require('./routes/dynamicDataRouter');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { success: false, message: 'Too many requests. Try again in 15 minutes.' },
  standardHeaders: true, legacyHeaders: false,
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  message: { success: false, message: 'Too many requests. Try again later.' },
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

// ─── Routes ───────────────────────────────────────────────────────────────────
// Order matters: specific paths first, wildcard last.
app.use('/api/auth',    authLimiter, authRoutes);
app.use('/api/modules', apiLimiter,  moduleRoutes);

// Dynamic data router — catches /api/:moduleSlug and /api/:moduleSlug/:id
// All module CRUD is handled here without any per-module route files.
app.use('/api', apiLimiter, dynamicDataRouter);

// ─── Serve FE Static Files (production) ──────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const feDistDir = process.env.FE_DIST_DIR
    || path.join(__dirname, '..', '..', 'fe', 'dist')
    || path.join(__dirname, '..', '..', 'frontend', 'dist');

  if (fs.existsSync(feDistDir)) {
    app.use(express.static(feDistDir));
    // SPA fallback — all non-API routes serve index.html
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(feDistDir, 'index.html'));
    });
    logger.info(`🌐 Serving FE from: ${feDistDir}`);
  } else {
    logger.warn(`⚠️  FE dist not found at: ${feDistDir}`);
  }
}

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

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
        let type = String;
        if (['number', 'range'].includes(f.fieldType))              type = Number;
        else if (f.fieldType === 'checkbox')                        type = Boolean;
        else if (['date', 'datetime-local'].includes(f.fieldType))  type = Date;
        schemaFields[f.fieldName] = {
          type,
          required: f.validations?.required || false,
        };
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

process.on('unhandledRejection', (err) => { logger.error(err); process.exit(1); });
process.on('uncaughtException',  (err) => { logger.error(err); process.exit(1); });

startServer();
module.exports = app;
