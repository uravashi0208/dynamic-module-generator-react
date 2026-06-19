const path     = require('path');
const fs       = require('fs');
const mongoose = require('mongoose');
const Module   = require('../models/Module');
const logger   = require('../config/logger');
const { AppError } = require('../middleware/errorHandler');
const { generateModulePages, deleteModulePages } = require('../utils/feFileGenerator');

// ─── Helpers ───────────────────────────────────────────────────────────────────

const toPascalCase = (str) =>
  str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());

const toSafeVarName = (slug) =>
  slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); // test-one → testOne

// ─── File content generators ───────────────────────────────────────────────────

const makeModelContent = (moduleName, moduleSlug, fields) => {
  const modelName = toPascalCase(moduleName);          // "test1" → "Test1"
  const collectionName = `${moduleSlug}`;         // MongoDB collection

  const fieldLines = fields.map((f) => {
    let type = 'String';
    if (['number', 'range'].includes(f.fieldType))          type = 'Number';
    else if (f.fieldType === 'checkbox')                    type = 'Boolean';
    else if (['date', 'datetime-local'].includes(f.fieldType)) type = 'Date';

    const req  = f.validations?.required
      ? `\n    required: [true, '${f.fieldLabel} is required'],` : '';
    const def  = (f.defaultValue !== undefined && f.defaultValue !== '')
      ? `\n    default: ${JSON.stringify(f.defaultValue)},` : '';

    return `  ${f.fieldName}: { type: ${type},${req}${def} },`;
  }).join('\n');

  return `// Auto-generated – do not edit manually. Re-generated on every module save.
const mongoose = require('mongoose');

const ${modelName}Schema = new mongoose.Schema(
  {
${fieldLines}
    _createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    _updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Prevent OverwriteModelError on hot-reload
module.exports =
  mongoose.models['${collectionName}'] ||
  mongoose.model('${collectionName}', ${modelName}Schema, '${collectionName}');
`;
};

const makeControllerContent = (moduleName, moduleSlug) => {
  const ModelName = toPascalCase(moduleName);

  return `// Auto-generated controller for module: ${moduleName}
const ${ModelName} = require('../models/${ModelName}');
const { AppError } = require('../middleware/errorHandler');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      ${ModelName}.find().sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      ${ModelName}.countDocuments(),
    ]);
    res.json({ success: true, data: { records, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const record = await ${ModelName}.findById(req.params.id).lean();
    if (!record) return next(new AppError('Record not found.', 404));
    res.json({ success: true, data: { record } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const record = await ${ModelName}.create({
      ...req.body,
      _createdBy: req.user._id,
      _updatedBy: req.user._id,
    });
    res.status(201).json({ success: true, message: 'Record created.', data: { record } });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const record = await ${ModelName}.findByIdAndUpdate(
      req.params.id,
      { ...req.body, _updatedBy: req.user._id },
      { new: true, runValidators: true }
    );
    if (!record) return next(new AppError('Record not found.', 404));
    res.json({ success: true, message: 'Record updated.', data: { record } });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const record = await ${ModelName}.findByIdAndDelete(req.params.id);
    if (!record) return next(new AppError('Record not found.', 404));
    res.json({ success: true, message: 'Record deleted.' });
  } catch (err) { next(err); }
};
`;
};

const makeRoutesContent = (moduleName, moduleSlug) => {
  const ModelName = toPascalCase(moduleName);
  const ctrlVar   = `${toSafeVarName(moduleSlug)}Controller`;

  return `// Auto-generated routes for module: ${moduleName}
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const ${ctrlVar} = require('../controllers/${ModelName}Controller');

router.use(authenticate);

router.get('/',      ${ctrlVar}.getAll);
router.get('/:id',   ${ctrlVar}.getOne);
router.post('/',     ${ctrlVar}.create);
router.put('/:id',   ${ctrlVar}.update);
router.delete('/:id',${ctrlVar}.remove);

module.exports = router;
`;
};

// ─── server.js auto-inject / auto-remove ─────────────────────────────────────

const SERVER_PATH = path.join(__dirname, '..', 'server.js');

/**
 * Inject one line into server.js, just like authRoutes / moduleRoutes.
 *
 * Adds two lines inside the "Routes" block:
 *   const test1Routes = require('./routes/Test1Routes');
 *   app.use('/api/test1', apiLimiter, test1Routes);
 */
const injectRouteIntoServer = (moduleName, moduleSlug) => {
  const ModelName   = toPascalCase(moduleName);
  const varName     = `${toSafeVarName(moduleSlug)}Routes`;
  const requireLine = `const ${varName} = require('./routes/${ModelName}Routes');`;
  const useLine     = `app.use('/api/${moduleSlug}', apiLimiter, ${varName});`;
  const MARKER      = '// [GENERATED_ROUTES] \u2014 auto-injected below this line, do not remove this comment';

  let src = fs.readFileSync(SERVER_PATH, 'utf8');
  if (src.includes(useLine)) return; // already injected

  // Insert require line just before the marker
  src = src.replace(MARKER, `${requireLine}\n${MARKER}`);
  // Insert app.use line just after the marker
  src = src.replace(MARKER, `${MARKER}\n${useLine}`);

  fs.writeFileSync(SERVER_PATH, src, 'utf8');
  logger.info(`✅ Injected route /api/${moduleSlug} into server.js`);
};

/**
 * Remove the two lines we injected when module is deleted.
 */
const removeRouteFromServer = (moduleName, moduleSlug) => {
  const ModelName  = toPascalCase(moduleName);
  const varName    = `${toSafeVarName(moduleSlug)}Routes`;
  const requireLine = `const ${varName} = require('./routes/${ModelName}Routes');\n`;
  const useLine     = `app.use('/api/${moduleSlug}', apiLimiter, ${varName});\n`;

  let src = fs.readFileSync(SERVER_PATH, 'utf8');
  src = src.replace(requireLine, '').replace(useLine, '');
  fs.writeFileSync(SERVER_PATH, src, 'utf8');
  logger.info(`🗑️  Removed route /api/${moduleSlug} from server.js`);
};

// ─── Write / delete the 3 files ───────────────────────────────────────────────

const DIRS = {
  models:      path.join(__dirname, '..', 'models'),
  controllers: path.join(__dirname, '..', 'controllers'),
  routes:      path.join(__dirname, '..', 'routes'),
};

const writeModuleFiles = (moduleName, moduleSlug, fields) => {
  // In production, dynamicDataRouter handles all module routes — no files needed
  if (process.env.NODE_ENV === 'production') {
    logger.info(`[writeModuleFiles] Skipped in production for: ${moduleName}`);
    return;
  }
  try {
    const ModelName = toPascalCase(moduleName);
    fs.writeFileSync(path.join(DIRS.models,      `${ModelName}.js`),           makeModelContent(moduleName, moduleSlug, fields));
    fs.writeFileSync(path.join(DIRS.controllers, `${ModelName}Controller.js`), makeControllerContent(moduleName, moduleSlug));
    fs.writeFileSync(path.join(DIRS.routes,      `${ModelName}Routes.js`),     makeRoutesContent(moduleName, moduleSlug));
    logger.info(`Files written: ${ModelName}.js | Controller | Routes`);
  } catch (e) {
    logger.warn(`[writeModuleFiles] Failed (non-fatal): ${e.message}`);
  }
};

const deleteModuleFiles = (moduleName) => {
  if (process.env.NODE_ENV === 'production') {
    logger.info(`[deleteModuleFiles] Skipped in production for: ${moduleName}`);
    return;
  }
  try {
    const ModelName = toPascalCase(moduleName);
    const slug = moduleName.toLowerCase();
    [
      path.join(DIRS.models,      `${ModelName}.js`),
      path.join(DIRS.controllers, `${ModelName}Controller.js`),
      path.join(DIRS.routes,      `${ModelName}Routes.js`),
      path.join(DIRS.models,      'generated', `${slug}.model.js`),
      path.join(DIRS.controllers, 'generated', `${slug}.controller.js`),
      path.join(DIRS.routes,      'generated', `${slug}.routes.js`),
    ].forEach((p) => { try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch(_) {} });
    logger.info(`Files deleted for module: ${moduleName}`);
  } catch (e) {
    logger.warn(`[deleteModuleFiles] Failed (non-fatal): ${e.message}`);
  }
};

// ─── Re-register mongoose model at runtime (no restart needed) ────────────────

const registerDynamicModel = async (moduleName, moduleSlug, fields) => {
  const mongoose = require('mongoose');
  const collectionName = `${moduleSlug}`;

  // Remove cached model so schema updates take effect
  // Use deleteModel() — compatible with Mongoose 8.x (modelSchemas was removed)
  if (mongoose.models[collectionName]) mongoose.deleteModel(collectionName);

  const schemaFields = {};
  fields.forEach((f) => {
    let type = String;
    if (['number', 'range'].includes(f.fieldType))             type = Number;
    else if (f.fieldType === 'checkbox')                       type = Boolean;
    else if (['date', 'datetime-local'].includes(f.fieldType)) type = Date;

    schemaFields[f.fieldName] = {
      type,
      required: f.validations?.required || false,
      ...(f.defaultValue !== undefined && f.defaultValue !== ''
        ? { default: f.defaultValue } : {}),
    };
  });
  schemaFields._createdBy = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };
  schemaFields._updatedBy = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };

  const schema = new mongoose.Schema(schemaFields, { timestamps: true });
  const Model  = mongoose.model(collectionName, schema, collectionName);

  // ✅ Force MongoDB to physically create the collection + indexes RIGHT NOW.
  // createCollection() is idempotent — safe to call even if it already exists.
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: collectionName }).toArray();
    if (collections.length === 0) {
      await db.createCollection(collectionName);
      logger.info(`🗄️  MongoDB collection created: ${collectionName}`);
    }
    await Model.createIndexes();
  } catch (err) {
    logger.warn(`Collection init warning for ${collectionName}:`, err.message);
  }

  logger.info(`🔄 Mongoose model registered: ${collectionName}`);
  return Model;
};

// ─── CRUD Controllers ──────────────────────────────────────────────────────────

const getModules = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, search = '', isActive,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const filter = {};
    if (search)            filter.$text   = { $search: search };
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [modules, total] = await Promise.all([
      Module.find(filter)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Module.countDocuments(filter),
    ]);

    // Attach actual record count from each module collection
    const db = mongoose.connection.db;
    const modulesWithCount = await Promise.all(
      modules.map(async (mod) => {
        try {
          if (!db) return { ...mod, recordCount: 0 };
          const count = await db.collection(mod.moduleSlug).countDocuments();
          return { ...mod, recordCount: count };
        } catch (_) {
          return { ...mod, recordCount: 0 };
        }
      })
    );

    res.json({
      success: true,
      data: {
        modules: modulesWithCount,
        pagination: {
          total, page: parseInt(page), limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
          hasNextPage: skip + modules.length < total,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (err) { next(err); }
};

const getModule = async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.id)
      .populate('createdBy updatedBy', 'name email');
    if (!module) return next(new AppError('Module not found.', 404));
    res.json({ success: true, data: { module } });
  } catch (err) { next(err); }
};

const createModule = async (req, res, next) => {
  try {
    const { moduleName, description, icon, fields } = req.body;

    const module = await Module.create({
      moduleName, description, icon,
      fields: fields || [],
      createdBy: req.user._id,
      updatedBy:  req.user._id,
    });
    await module.populate('createdBy', 'name email');

    // ✅ 1. Write BE files (local dev only — skipped gracefully in production)
    try { writeModuleFiles(module.moduleName, module.moduleSlug, module.fields); }
    catch (e) { logger.warn('[writeModuleFiles] Skipped:', e.message); }

    // ✅ 2. Register mongoose model in memory (no restart needed)
    await registerDynamicModel(module.moduleName, module.moduleSlug, module.fields);

    // ✅ 3. Generate FE pages (non-blocking — never fails module creation)
    try { generateModulePages(module.moduleName, module.moduleSlug, module.fields); }
    catch (feErr) { logger.warn('[FE Generator] Skipped:', feErr.message); }

    logger.info(`Module created: ${moduleName} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `Module '${moduleName}' created. Route: /api/${module.moduleSlug}`,
      data: { module },
    });
  } catch (err) { next(err); }
};

const updateModule = async (req, res, next) => {
  try {
    const { moduleName, description, icon, fields, isActive } = req.body;
    const module = await Module.findById(req.params.id);
    if (!module) return next(new AppError('Module not found.', 404));

    const oldName = module.moduleName;
    const oldSlug = module.moduleSlug;

    if (moduleName  !== undefined) module.moduleName  = moduleName;
    if (description !== undefined) module.description = description;
    if (icon        !== undefined) module.icon        = icon;
    if (fields      !== undefined) module.fields      = fields;
    if (isActive    !== undefined) module.isActive    = isActive;
    module.updatedBy = req.user._id;

    await module.save();
    await module.populate('createdBy updatedBy', 'name email');

    // If name changed, remove old files first, then write new ones
    if (oldName !== module.moduleName) {
      deleteModuleFiles(oldName);
    }

    try { writeModuleFiles(module.moduleName, module.moduleSlug, module.fields); }
    catch (e) { logger.warn('[writeModuleFiles] Skipped:', e.message); }
    await registerDynamicModel(module.moduleName, module.moduleSlug, module.fields);
    try { generateModulePages(module.moduleName, module.moduleSlug, module.fields); }
    catch (feErr) { logger.warn('[FE Generator] Skipped:', feErr.message); }

    res.json({
      success: true,
      message: `Module '${module.moduleName}' updated.`,
      data: { module },
    });
  } catch (err) { next(err); }
};

const deleteModule = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const module = await Module.findById(req.params.id);
    if (!module) return next(new AppError('Module not found.', 404));

    const { moduleName, moduleSlug } = module;
    const collectionName = `${moduleSlug}`;

    // 1. Delete generated BE files (Model, Controller, Routes)
    //    AND FE pages (ListPage, FormPage, update _registry.js)
    try { deleteModuleFiles(moduleName); } catch(e) { logger.warn('[deleteModuleFiles] Skipped:', e.message); }
    try { deleteModulePages(moduleName); }
    catch (feErr) { logger.warn('[FE Generator] Delete skipped:', feErr.message); }

    // 2. Remove mongoose model from registry
    if (mongoose.models[collectionName]) {
      mongoose.deleteModel(collectionName);
    }

    // 3. Delete from MongoDB (Module document)
    await Module.findByIdAndDelete(req.params.id);

    // 4. DROP the actual MongoDB collection for this module
    try {
      const db = mongoose.connection.db;
      const cols = await db.listCollections({ name: collectionName }).toArray();
      if (cols.length > 0) {
        await db.dropCollection(collectionName);
        logger.info(`🗄️  Dropped MongoDB collection: ${collectionName}`);
      }
    } catch (dropErr) {
      logger.warn(`Could not drop collection ${collectionName}:`, dropErr.message);
    }

    // Note: No server.js manipulation needed — server.js now auto-scans
    // the routes/ folder at startup, so deleted files are simply not loaded.

    logger.info(`Module deleted: ${moduleName} by ${req.user.email}`);
    res.json({
      success: true,
      message: `Module '${moduleName}' deleted. Collection '${collectionName}' dropped.`,
    });
  } catch (err) { next(err); }
};

const toggleStatus = async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return next(new AppError('Module not found.', 404));
    module.isActive  = !module.isActive;
    module.updatedBy = req.user._id;
    await module.save();
    res.json({
      success: true,
      message: `Module '${module.moduleName}' is now ${module.isActive ? 'active' : 'inactive'}.`,
      data: { isActive: module.isActive },
    });
  } catch (err) { next(err); }
};

const addField = async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return next(new AppError('Module not found.', 404));
    module.fields.push(req.body);
    module.updatedBy = req.user._id;
    await module.save();
    try { writeModuleFiles(module.moduleName, module.moduleSlug, module.fields); } catch(e) { logger.warn('[writeModuleFiles] Skipped:', e.message); }
    await registerDynamicModel(module.moduleName, module.moduleSlug, module.fields);
    res.status(201).json({ success: true, message: 'Field added.', data: { module } });
  } catch (err) { next(err); }
};

const removeField = async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return next(new AppError('Module not found.', 404));
    const idx = module.fields.findIndex((f) => f._id.toString() === req.params.fieldId);
    if (idx === -1) return next(new AppError('Field not found.', 404));
    module.fields.splice(idx, 1);
    module.updatedBy = req.user._id;
    await module.save();
    try { writeModuleFiles(module.moduleName, module.moduleSlug, module.fields); } catch(e) { logger.warn('[writeModuleFiles] Skipped:', e.message); }
    await registerDynamicModel(module.moduleName, module.moduleSlug, module.fields);
    res.json({ success: true, message: 'Field removed.', data: { module } });
  } catch (err) { next(err); }
};

const getStats = async (req, res, next) => {
  try {
    const [total, active, inactive, recentModules] = await Promise.all([
      Module.countDocuments(),
      Module.countDocuments({ isActive: true }),
      Module.countDocuments({ isActive: false }),
      Module.find().sort({ createdAt: -1 }).limit(5).select('moduleName createdAt').lean(),
    ]);
    const fieldTypeCounts = await Module.aggregate([
      { $unwind: '$fields' },
      { $group: { _id: '$fields.fieldType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data: { stats: { total, active, inactive }, recentModules, fieldTypeCounts } });
  } catch (err) { next(err); }
};

module.exports = {
  getModules, getModule, createModule, updateModule,
  deleteModule, toggleStatus, addField, removeField, getStats,
};