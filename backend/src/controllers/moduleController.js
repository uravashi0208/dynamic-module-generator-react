const mongoose = require('mongoose');
const path     = require('path');
const fs       = require('fs');
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
  const modelName = toPascalCase(moduleName);
  const collectionName = `${moduleSlug}`;

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

const injectRouteIntoServer = (moduleName, moduleSlug) => {
  const ModelName   = toPascalCase(moduleName);
  const varName     = `${toSafeVarName(moduleSlug)}Routes`;
  const requireLine = `const ${varName} = require('./routes/${ModelName}Routes');`;
  const useLine     = `app.use('/api/${moduleSlug}', apiLimiter, ${varName});`;
  const MARKER      = '// [GENERATED_ROUTES] \u2014 auto-injected below this line, do not remove this comment';

  let src = fs.readFileSync(SERVER_PATH, 'utf8');
  if (src.includes(useLine)) return;

  src = src.replace(MARKER, `${requireLine}\n${MARKER}`);
  src = src.replace(MARKER, `${MARKER}\n${useLine}`);

  fs.writeFileSync(SERVER_PATH, src, 'utf8');
  logger.info(`✅ Injected route /api/${moduleSlug} into server.js`);
};

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
  if (process.env.NODE_ENV === 'production') {
    logger.info(`[writeModuleFiles] Skipped in production for: ${moduleName}`);
    return;
  }
  logger.debug(`[writeModuleFiles] START — moduleName="${moduleName}" slug="${moduleSlug}" fields=${fields.length}`);
  try {
    const ModelName = toPascalCase(moduleName);
    logger.debug(`[writeModuleFiles] Writing Model: ${ModelName}.js`);
    fs.writeFileSync(path.join(DIRS.models,      `${ModelName}.js`),           makeModelContent(moduleName, moduleSlug, fields));
    logger.debug(`[writeModuleFiles] Writing Controller: ${ModelName}Controller.js`);
    fs.writeFileSync(path.join(DIRS.controllers, `${ModelName}Controller.js`), makeControllerContent(moduleName, moduleSlug));
    logger.debug(`[writeModuleFiles] Writing Routes: ${ModelName}Routes.js`);
    fs.writeFileSync(path.join(DIRS.routes,      `${ModelName}Routes.js`),     makeRoutesContent(moduleName, moduleSlug));
    logger.info(`[writeModuleFiles] ✅ Done — ${ModelName}.js | Controller | Routes`);
  } catch (e) {
    logger.error(`[writeModuleFiles] ❌ FAILED: ${e.message}`, { stack: e.stack });
  }
};

const deleteModuleFiles = (moduleName) => {
  if (process.env.NODE_ENV === 'production') {
    logger.info(`[deleteModuleFiles] Skipped in production for: ${moduleName}`);
    return;
  }
  logger.debug(`[deleteModuleFiles] START — moduleName="${moduleName}"`);
  try {
    const ModelName = toPascalCase(moduleName);
    const slug = moduleName.toLowerCase();
    const filesToDelete = [
      path.join(DIRS.models,      `${ModelName}.js`),
      path.join(DIRS.controllers, `${ModelName}Controller.js`),
      path.join(DIRS.routes,      `${ModelName}Routes.js`),
      path.join(DIRS.models,      'generated', `${slug}.model.js`),
      path.join(DIRS.controllers, 'generated', `${slug}.controller.js`),
      path.join(DIRS.routes,      'generated', `${slug}.routes.js`),
    ];
    filesToDelete.forEach((p) => {
      try {
        if (fs.existsSync(p)) {
          fs.unlinkSync(p);
          logger.debug(`[deleteModuleFiles] Deleted: ${p}`);
        } else {
          logger.debug(`[deleteModuleFiles] Not found (skipped): ${p}`);
        }
      } catch (fileErr) {
        logger.warn(`[deleteModuleFiles] Could not delete ${p}: ${fileErr.message}`);
      }
    });
    logger.info(`[deleteModuleFiles] ✅ Done for module: ${moduleName}`);
  } catch (e) {
    logger.error(`[deleteModuleFiles] ❌ FAILED: ${e.message}`, { stack: e.stack });
  }
};

// ─── Re-register mongoose model at runtime (no restart needed) ────────────────

const registerDynamicModel = async (moduleName, moduleSlug, fields) => {
  if (process.env.NODE_ENV === 'production') {
    logger.info(`[registerDynamicModel] Skipped in production for: ${moduleSlug}`);
    return null;
  }

  logger.debug(`[registerDynamicModel] START — slug="${moduleSlug}" fields=${(fields || []).length}`);
  try {
    const collectionName = moduleSlug;

    if (mongoose.models[collectionName]) {
      logger.debug(`[registerDynamicModel] Existing model found — deleting before re-register: ${collectionName}`);
      mongoose.deleteModel(collectionName);
    }

    const schemaFields = {};
    (fields || []).forEach((f) => {
      let type = String;
      if (['number', 'range'].includes(f.fieldType))             type = Number;
      else if (f.fieldType === 'checkbox')                       type = Boolean;
      else if (['date', 'datetime-local'].includes(f.fieldType)) type = Date;
      schemaFields[f.fieldName] = {
        type,
        required: f.validations?.required || false,
      };
      logger.debug(`[registerDynamicModel]   Field: ${f.fieldName} (${f.fieldType}) required=${f.validations?.required || false}`);
    });
    schemaFields._createdBy = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };
    schemaFields._updatedBy = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };

    logger.debug(`[registerDynamicModel] Building schema with ${Object.keys(schemaFields).length} fields`);
    const schema = new mongoose.Schema(schemaFields, { timestamps: true });
    const Model  = mongoose.model(collectionName, schema, collectionName);
    logger.debug(`[registerDynamicModel] Mongoose model created: ${collectionName}`);

    const db = mongoose.connection.db;
    if (db) {
      logger.debug(`[registerDynamicModel] Checking collection existence: ${collectionName}`);
      const cols = await db.listCollections({ name: collectionName }).toArray();
      if (!cols.length) {
        logger.debug(`[registerDynamicModel] Collection not found — creating: ${collectionName}`);
        await db.createCollection(collectionName);
        logger.info(`[registerDynamicModel] 🗄️  Created new collection: ${collectionName}`);
      } else {
        logger.debug(`[registerDynamicModel] Collection already exists: ${collectionName}`);
      }
      logger.debug(`[registerDynamicModel] Creating indexes for: ${collectionName}`);
      await Model.createIndexes();
      logger.debug(`[registerDynamicModel] Indexes created`);
    } else {
      logger.warn(`[registerDynamicModel] mongoose.connection.db is null — skipping collection/index setup`);
    }

    logger.info(`[registerDynamicModel] ✅ Registered: ${collectionName}`);
    return Model;
  } catch (err) {
    logger.error(`[registerDynamicModel] ❌ FAILED: ${err.message}`, { stack: err.stack });
    return null;
  }
};

// ─── CRUD Controllers ──────────────────────────────────────────────────────────

const getModules = async (req, res, next) => {
  const reqId = `[getModules][${Date.now()}]`;
  logger.debug(`${reqId} START — query: ${JSON.stringify(req.query)} user: ${req.user?.email}`);
  try {
    const {
      page = 1, limit = 10, search = '', isActive,
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const filter = {};
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or = [{ moduleName: regex }, { description: regex }];
      logger.debug(`${reqId} Applying search filter: "${search}"`);
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
      logger.debug(`${reqId} Applying isActive filter: ${filter.isActive}`);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    logger.debug(`${reqId} Querying DB — page=${page} limit=${limit} skip=${skip} sort=${JSON.stringify(sort)}`);

    const [modules, total] = await Promise.all([
      Module.find(filter)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Module.countDocuments(filter),
    ]);
    logger.debug(`${reqId} DB returned ${modules.length} modules, total=${total}`);

    const db = mongoose.connection.db;
    logger.debug(`${reqId} Attaching recordCount for ${modules.length} modules`);
    const modulesWithCount = await Promise.all(
      modules.map(async (mod) => {
        try {
          if (!db || !mod.moduleSlug) return { ...mod, recordCount: 0 };
          const cols = await db.listCollections({ name: mod.moduleSlug }).toArray();
          if (!cols.length) return { ...mod, recordCount: 0 };
          const count = await db.collection(mod.moduleSlug).countDocuments();
          logger.debug(`${reqId}   ${mod.moduleSlug} → recordCount=${count}`);
          return { ...mod, recordCount: count };
        } catch (countErr) {
          logger.warn(`${reqId} recordCount failed for ${mod.moduleSlug}: ${countErr.message}`);
          return { ...mod, recordCount: 0 };
        }
      })
    );

    logger.info(`${reqId} ✅ Returning ${modulesWithCount.length}/${total} modules`);
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
  } catch (err) {
    logger.error(`${reqId} ❌ FATAL: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

const getModule = async (req, res, next) => {
  const reqId = `[getModule][${req.params.id}]`;
  logger.debug(`${reqId} START — user: ${req.user?.email}`);
  try {
    const module = await Module.findById(req.params.id)
      .populate('createdBy updatedBy', 'name email');
    if (!module) {
      logger.warn(`${reqId} Not found`);
      return next(new AppError('Module not found.', 404));
    }
    logger.info(`${reqId} ✅ Found: "${module.moduleName}"`);
    res.json({ success: true, data: { module } });
  } catch (err) {
    logger.error(`${reqId} ❌ FATAL: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

const createModule = async (req, res, next) => {
  const reqId = `[createModule][${Date.now()}]`;
  logger.info(`${reqId} ▶ REQUEST RECEIVED — user: ${req.user?.email} body: ${JSON.stringify({ moduleName: req.body?.moduleName, icon: req.body?.icon, fieldCount: req.body?.fields?.length ?? 0 })}`);

  let module = null;
  try {
    const { moduleName, description, icon, fields } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!moduleName || !moduleName.trim()) {
      logger.warn(`${reqId} ❌ Validation failed: moduleName is empty`);
      return res.status(400).json({ success: false, message: 'Module name is required.' });
    }
    logger.debug(`${reqId} Validation OK — moduleName="${moduleName.trim()}" description="${description?.substring(0, 40)}" icon="${icon}" fields=${fields?.length ?? 0}`);

    // ── Step 1: Save to MongoDB ──────────────────────────────────────────────
    logger.info(`${reqId} [Step 1] Saving module to MongoDB...`);
    module = await Module.create({
      moduleName: moduleName.trim(),
      description: description || '',
      icon: icon || 'cube',
      fields: fields || [],
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });
    logger.info(`${reqId} [Step 1] ✅ Saved — _id=${module._id} slug="${module.moduleSlug}"`);

    // ── Step 2: Populate ─────────────────────────────────────────────────────
    logger.debug(`${reqId} [Step 2] Populating createdBy...`);
    try {
      await module.populate('createdBy', 'name email');
      logger.debug(`${reqId} [Step 2] ✅ Populated — createdBy: ${module.createdBy?.email}`);
    } catch (e) {
      logger.warn(`${reqId} [Step 2] ⚠️  populate failed (non-fatal): ${e.message}`);
    }

    // ── Step 3: Write BE files ───────────────────────────────────────────────
    logger.debug(`${reqId} [Step 3] Writing BE files (env=${process.env.NODE_ENV})...`);
    try {
      writeModuleFiles(module.moduleName, module.moduleSlug, module.fields);
      logger.debug(`${reqId} [Step 3] ✅ BE files done`);
    } catch (e) {
      logger.warn(`${reqId} [Step 3] ⚠️  writeModuleFiles skipped: ${e.message}`);
    }

    // ── Step 4: Register Mongoose model ──────────────────────────────────────
    logger.debug(`${reqId} [Step 4] Registering Mongoose model in memory...`);
    try {
      await registerDynamicModel(module.moduleName, module.moduleSlug, module.fields);
      logger.debug(`${reqId} [Step 4] ✅ Model registered`);
    } catch (e) {
      logger.warn(`${reqId} [Step 4] ⚠️  registerDynamicModel skipped: ${e.message}`);
    }

    // ── Step 5: Generate FE pages ─────────────────────────────────────────────
    logger.debug(`${reqId} [Step 5] Generating FE pages (env=${process.env.NODE_ENV})...`);
    try {
      generateModulePages(module.moduleName, module.moduleSlug, module.fields);
      logger.debug(`${reqId} [Step 5] ✅ FE pages generated`);
    } catch (e) {
      logger.warn(`${reqId} [Step 5] ⚠️  generateModulePages skipped: ${e.message}`);
    }

    // ── Response ──────────────────────────────────────────────────────────────
    logger.info(`${reqId} ✅ ALL STEPS DONE — responding 201. slug="${module.moduleSlug}"`);
    return res.status(201).json({
      success: true,
      message: `Module '${module.moduleName}' created successfully.`,
      data: { module },
    });

  } catch (err) {
    logger.error(`${reqId} ❌ FATAL ERROR: ${err.message}`, { stack: err.stack });

    if (module && module._id) {
      logger.warn(`${reqId} Module was saved (_id=${module._id}) but post-processing failed — returning 201 anyway`);
      return res.status(201).json({
        success: true,
        message: `Module '${module.moduleName}' created successfully.`,
        data: { module },
      });
    }

    logger.error(`${reqId} Module was NOT saved — passing to errorHandler`);
    return next(err);
  }
};

const updateModule = async (req, res, next) => {
  const reqId = `[updateModule][${req.params.id}]`;
  logger.info(`${reqId} ▶ REQUEST RECEIVED — user: ${req.user?.email} body keys: ${Object.keys(req.body).join(', ')}`);
  try {
    const { moduleName, description, icon, fields, isActive } = req.body;
    logger.debug(`${reqId} Fetching module from DB...`);
    const module = await Module.findById(req.params.id);
    if (!module) {
      logger.warn(`${reqId} ❌ Module not found`);
      return next(new AppError('Module not found.', 404));
    }
    logger.debug(`${reqId} Found: "${module.moduleName}" slug="${module.moduleSlug}"`);

    const oldName = module.moduleName;
    const oldSlug = module.moduleSlug;

    if (moduleName  !== undefined) { logger.debug(`${reqId} Updating moduleName: "${oldName}" → "${moduleName}"`); module.moduleName  = moduleName; }
    if (description !== undefined) { logger.debug(`${reqId} Updating description`); module.description = description; }
    if (icon        !== undefined) { logger.debug(`${reqId} Updating icon: "${module.icon}" → "${icon}"`); module.icon        = icon; }
    if (fields      !== undefined) { logger.debug(`${reqId} Updating fields: ${module.fields.length} → ${fields.length}`); module.fields      = fields; }
    if (isActive    !== undefined) { logger.debug(`${reqId} Updating isActive: ${module.isActive} → ${isActive}`); module.isActive    = isActive; }
    module.updatedBy = req.user._id;

    logger.debug(`${reqId} Saving to DB...`);
    await module.save();
    logger.info(`${reqId} ✅ Saved to DB`);
    await module.populate('createdBy updatedBy', 'name email');

    if (oldName !== module.moduleName) {
      logger.info(`${reqId} Name changed: "${oldName}" → "${module.moduleName}" — deleting old files`);
      deleteModuleFiles(oldName);
    }

    logger.debug(`${reqId} [Step 1] writeModuleFiles...`);
    try { writeModuleFiles(module.moduleName, module.moduleSlug, module.fields); logger.debug(`${reqId} [Step 1] ✅`); }
    catch (e) { logger.warn(`${reqId} [Step 1] ⚠️  writeModuleFiles skipped: ${e.message}`); }

    logger.debug(`${reqId} [Step 2] registerDynamicModel...`);
    try { await registerDynamicModel(module.moduleName, module.moduleSlug, module.fields); logger.debug(`${reqId} [Step 2] ✅`); }
    catch (e) { logger.warn(`${reqId} [Step 2] ⚠️  registerDynamicModel skipped: ${e.message}`); }

    logger.debug(`${reqId} [Step 3] generateModulePages...`);
    try { generateModulePages(module.moduleName, module.moduleSlug, module.fields); logger.debug(`${reqId} [Step 3] ✅`); }
    catch (feErr) { logger.warn(`${reqId} [Step 3] ⚠️  generateModulePages skipped: ${feErr.message}`); }

    logger.info(`${reqId} ✅ ALL DONE — responding 200`);
    res.json({
      success: true,
      message: `Module '${module.moduleName}' updated.`,
      data: { module },
    });
  } catch (err) {
    logger.error(`${reqId} ❌ FATAL: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

const deleteModule = async (req, res, next) => {
  const reqId = `[deleteModule][${req.params.id}]`;
  logger.info(`${reqId} ▶ REQUEST RECEIVED — user: ${req.user?.email}`);
  try {
    const mongoose = require('mongoose');
    logger.debug(`${reqId} Fetching module from DB...`);
    const module = await Module.findById(req.params.id);
    if (!module) {
      logger.warn(`${reqId} ❌ Module not found`);
      return next(new AppError('Module not found.', 404));
    }

    const { moduleName, moduleSlug } = module;
    const collectionName = `${moduleSlug}`;
    logger.info(`${reqId} Deleting module: "${moduleName}" slug="${moduleSlug}"`);

    // Step 1 — Delete BE files
    logger.debug(`${reqId} [Step 1] Deleting BE files...`);
    try { deleteModuleFiles(moduleName); logger.debug(`${reqId} [Step 1] ✅ BE files deleted`); }
    catch (e) { logger.warn(`${reqId} [Step 1] ⚠️  deleteModuleFiles skipped: ${e.message}`); }

    // Step 2 — Delete FE pages
    logger.debug(`${reqId} [Step 2] Deleting FE pages...`);
    try { deleteModulePages(moduleName); logger.debug(`${reqId} [Step 2] ✅ FE pages deleted`); }
    catch (feErr) { logger.warn(`${reqId} [Step 2] ⚠️  deleteModulePages skipped: ${feErr.message}`); }

    // Step 3 — Remove mongoose model
    logger.debug(`${reqId} [Step 3] Removing mongoose model: "${collectionName}"`);
    if (mongoose.models[collectionName]) {
      mongoose.deleteModel(collectionName);
      logger.debug(`${reqId} [Step 3] ✅ Model removed`);
    } else {
      logger.debug(`${reqId} [Step 3] Model not registered — skipped`);
    }

    // Step 4 — Delete Module document from MongoDB
    logger.debug(`${reqId} [Step 4] Deleting Module document from MongoDB...`);
    await Module.findByIdAndDelete(req.params.id);
    logger.info(`${reqId} [Step 4] ✅ Module document deleted`);

    // Step 5 — Drop MongoDB collection
    logger.debug(`${reqId} [Step 5] Dropping collection: "${collectionName}"...`);
    try {
      const db = mongoose.connection.db;
      const cols = await db.listCollections({ name: collectionName }).toArray();
      if (cols.length > 0) {
        await db.dropCollection(collectionName);
        logger.info(`${reqId} [Step 5] ✅ Dropped collection: "${collectionName}"`);
      } else {
        logger.debug(`${reqId} [Step 5] Collection not found — skipped`);
      }
    } catch (dropErr) {
      logger.warn(`${reqId} [Step 5] ⚠️  Could not drop collection "${collectionName}": ${dropErr.message}`);
    }

    logger.info(`${reqId} ✅ ALL DONE — Module "${moduleName}" fully deleted`);
    res.json({
      success: true,
      message: `Module '${moduleName}' deleted. Collection '${collectionName}' dropped.`,
    });
  } catch (err) {
    logger.error(`${reqId} ❌ FATAL: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

const toggleStatus = async (req, res, next) => {
  const reqId = `[toggleStatus][${req.params.id}]`;
  logger.debug(`${reqId} ▶ REQUEST RECEIVED — user: ${req.user?.email}`);
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      logger.warn(`${reqId} ❌ Module not found`);
      return next(new AppError('Module not found.', 404));
    }
    const prevStatus = module.isActive;
    module.isActive  = !module.isActive;
    module.updatedBy = req.user._id;
    await module.save();
    logger.info(`${reqId} ✅ "${module.moduleName}" toggled: ${prevStatus} → ${module.isActive}`);
    res.json({
      success: true,
      message: `Module '${module.moduleName}' is now ${module.isActive ? 'active' : 'inactive'}.`,
      data: { isActive: module.isActive },
    });
  } catch (err) {
    logger.error(`${reqId} ❌ FATAL: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

const addField = async (req, res, next) => {
  const reqId = `[addField][${req.params.id}]`;
  logger.debug(`${reqId} ▶ REQUEST RECEIVED — user: ${req.user?.email} field: ${JSON.stringify(req.body)}`);
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      logger.warn(`${reqId} ❌ Module not found`);
      return next(new AppError('Module not found.', 404));
    }
    logger.debug(`${reqId} Adding field to "${module.moduleName}" (currently ${module.fields.length} fields)`);
    module.fields.push(req.body);
    module.updatedBy = req.user._id;
    await module.save();
    logger.info(`${reqId} ✅ Field added — now ${module.fields.length} fields`);

    try { writeModuleFiles(module.moduleName, module.moduleSlug, module.fields); }
    catch(e) { logger.warn(`${reqId} ⚠️  writeModuleFiles skipped: ${e.message}`); }
    try { await registerDynamicModel(module.moduleName, module.moduleSlug, module.fields); }
    catch(e) { logger.warn(`${reqId} ⚠️  registerDynamicModel skipped: ${e.message}`); }

    res.status(201).json({ success: true, message: 'Field added.', data: { module } });
  } catch (err) {
    logger.error(`${reqId} ❌ FATAL: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

const removeField = async (req, res, next) => {
  const reqId = `[removeField][moduleId=${req.params.id}][fieldId=${req.params.fieldId}]`;
  logger.debug(`${reqId} ▶ REQUEST RECEIVED — user: ${req.user?.email}`);
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      logger.warn(`${reqId} ❌ Module not found`);
      return next(new AppError('Module not found.', 404));
    }
    const idx = module.fields.findIndex((f) => f._id.toString() === req.params.fieldId);
    if (idx === -1) {
      logger.warn(`${reqId} ❌ Field not found`);
      return next(new AppError('Field not found.', 404));
    }
    logger.debug(`${reqId} Removing field at index ${idx}: "${module.fields[idx].fieldName}"`);
    module.fields.splice(idx, 1);
    module.updatedBy = req.user._id;
    await module.save();
    logger.info(`${reqId} ✅ Field removed — now ${module.fields.length} fields`);

    try { writeModuleFiles(module.moduleName, module.moduleSlug, module.fields); }
    catch(e) { logger.warn(`${reqId} ⚠️  writeModuleFiles skipped: ${e.message}`); }
    try { await registerDynamicModel(module.moduleName, module.moduleSlug, module.fields); }
    catch(e) { logger.warn(`${reqId} ⚠️  registerDynamicModel skipped: ${e.message}`); }

    res.json({ success: true, message: 'Field removed.', data: { module } });
  } catch (err) {
    logger.error(`${reqId} ❌ FATAL: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

const getStats = async (req, res, next) => {
  const reqId = `[getStats][${Date.now()}]`;
  logger.debug(`${reqId} ▶ REQUEST RECEIVED — user: ${req.user?.email}`);
  try {
    logger.debug(`${reqId} Running aggregate queries...`);
    const [total, active, inactive, recentModules] = await Promise.all([
      Module.countDocuments(),
      Module.countDocuments({ isActive: true }),
      Module.countDocuments({ isActive: false }),
      Module.find().sort({ createdAt: -1 }).limit(5).select('moduleName createdAt').lean(),
    ]);
    logger.debug(`${reqId} Stats: total=${total} active=${active} inactive=${inactive}`);

    const fieldTypeCounts = await Module.aggregate([
      { $unwind: '$fields' },
      { $group: { _id: '$fields.fieldType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    logger.debug(`${reqId} fieldTypeCounts: ${fieldTypeCounts.map(f => `${f._id}=${f.count}`).join(', ')}`);
    logger.info(`${reqId} ✅ Stats ready — total=${total}`);

    res.json({ success: true, data: { stats: { total, active, inactive }, recentModules, fieldTypeCounts } });
  } catch (err) {
    logger.error(`${reqId} ❌ FATAL: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

module.exports = {
  getModules, getModule, createModule, updateModule,
  deleteModule, toggleStatus, addField, removeField, getStats,
};