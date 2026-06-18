/**
 * dynamicDataRouter.js
 *
 * Single router handling CRUD for ALL module data collections.
 * Mounted at /api — handles /api/:moduleSlug and /api/:moduleSlug/:id
 *
 * Model resolution:
 *   1. Already in mongoose.models (registered by legacy generated file) → use it
 *   2. Not cached → look up Module in DB → build Schema → cache → use it
 *   3. Module not found in DB → 404
 */

const express   = require('express');
const mongoose  = require('mongoose');
const Module    = require('../models/Module');
const { authenticate }  = require('../middleware/auth');
const { AppError }      = require('../middleware/errorHandler');
const logger            = require('../config/logger');

const router = express.Router();
router.use(authenticate);

// Slugs owned by other routers — skip them
const SKIP_SLUGS = new Set(['auth', 'modules']);

// ── Resolve (or lazily build) a Mongoose model for the given moduleSlug ───────
const resolveModel = async (moduleSlug) => {
  if (SKIP_SLUGS.has(moduleSlug)) return null;

  // 1. Already registered (e.g. by a legacy generated model file) → reuse
  if (mongoose.models[moduleSlug]) {
    return mongoose.models[moduleSlug];
  }

  // 2. Look up module in DB
  const mod = await Module.findOne({
    $or: [
      { moduleSlug },
      { moduleName: new RegExp(`^${moduleSlug}$`, 'i') },
    ],
    isActive: true,
  }).lean();

  if (!mod) return null;

  // 3. Build schema from field definitions
  const schemaFields = {};
  (mod.fields || []).forEach((f) => {
    let type = String;
    if (['number', 'range'].includes(f.fieldType))              type = Number;
    else if (f.fieldType === 'checkbox')                        type = Boolean;
    else if (['date', 'datetime-local'].includes(f.fieldType))  type = Date;

    schemaFields[f.fieldName] = {
      type,
      required: f.validations?.required || false,
      ...(f.defaultValue !== undefined && f.defaultValue !== ''
        ? { default: f.defaultValue } : {}),
    };
  });
  schemaFields._createdBy = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };
  schemaFields._updatedBy = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };

  const collectionName = mod.moduleSlug; // canonical slug from DB
  const schema = new mongoose.Schema(schemaFields, { timestamps: true });
  const Model  = mongoose.model(collectionName, schema, collectionName);

  // Ensure physical collection exists
  try {
    const db   = mongoose.connection.db;
    const cols = await db.listCollections({ name: collectionName }).toArray();
    if (cols.length === 0) {
      await db.createCollection(collectionName);
      logger.info(`🗄️  Auto-created collection: ${collectionName}`);
    }
  } catch (e) {
    logger.warn(`Collection init (${collectionName}):`, e.message);
  }

  logger.info(`⚡ Resolved model on-demand: ${collectionName}`);
  return Model;
};

// ── GET /:moduleSlug — list records ───────────────────────────────────────────
router.get('/:moduleSlug', async (req, res, next) => {
  try {
    const { moduleSlug } = req.params;
    const Model = await resolveModel(moduleSlug);
    if (!Model) return next(new AppError(`Module '${moduleSlug}' not found.`, 404));

    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let filter = {};
    if (search) {
      const mod = await Module.findOne({ moduleSlug }).lean();
      const textFields = (mod?.fields || [])
        .filter((f) => ['text', 'email', 'textarea', 'url', 'tel', 'password'].includes(f.fieldType))
        .map((f) => f.fieldName);

      if (textFields.length) {
        filter = { $or: textFields.map((fn) => ({ [fn]: { $regex: search, $options: 'i' } })) };
      }
    }

    const [records, total] = await Promise.all([
      Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Model.countDocuments(filter),
    ]);

    res.json({ success: true, data: { records, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
});

// ── GET /:moduleSlug/:id — get one ────────────────────────────────────────────
router.get('/:moduleSlug/:id', async (req, res, next) => {
  try {
    const Model = await resolveModel(req.params.moduleSlug);
    if (!Model) return next(new AppError(`Module '${req.params.moduleSlug}' not found.`, 404));

    const record = await Model.findById(req.params.id).lean();
    if (!record) return next(new AppError('Record not found.', 404));

    res.json({ success: true, data: { record } });
  } catch (err) { next(err); }
});

// ── POST /:moduleSlug — create ────────────────────────────────────────────────
router.post('/:moduleSlug', async (req, res, next) => {
  try {
    const Model = await resolveModel(req.params.moduleSlug);
    if (!Model) return next(new AppError(`Module '${req.params.moduleSlug}' not found.`, 404));

    const record = await Model.create({
      ...req.body,
      _createdBy: req.user._id,
      _updatedBy: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Record created successfully.', data: { record } });
  } catch (err) { next(err); }
});

// ── PUT /:moduleSlug/:id — update ─────────────────────────────────────────────
router.put('/:moduleSlug/:id', async (req, res, next) => {
  try {
    const Model = await resolveModel(req.params.moduleSlug);
    if (!Model) return next(new AppError(`Module '${req.params.moduleSlug}' not found.`, 404));

    const record = await Model.findByIdAndUpdate(
      req.params.id,
      { ...req.body, _updatedBy: req.user._id },
      { new: true, runValidators: true }
    );
    if (!record) return next(new AppError('Record not found.', 404));

    res.json({ success: true, message: 'Record updated successfully.', data: { record } });
  } catch (err) { next(err); }
});

// ── DELETE /:moduleSlug/:id — delete ──────────────────────────────────────────
router.delete('/:moduleSlug/:id', async (req, res, next) => {
  try {
    const Model = await resolveModel(req.params.moduleSlug);
    if (!Model) return next(new AppError(`Module '${req.params.moduleSlug}' not found.`, 404));

    const record = await Model.findByIdAndDelete(req.params.id);
    if (!record) return next(new AppError('Record not found.', 404));

    res.json({ success: true, message: 'Record deleted successfully.' });
  } catch (err) { next(err); }
});

module.exports = router;
