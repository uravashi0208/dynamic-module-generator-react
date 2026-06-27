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
const path      = require('path');
const Module    = require('../models/Module');
const { authenticate }  = require('../middleware/auth');
const { AppError }      = require('../middleware/errorHandler');
const logger            = require('../config/logger');
const upload            = require('../middleware/upload');

const router = express.Router();
router.use(authenticate);

// Slugs owned by other routers — skip them
const SKIP_SLUGS = new Set(['auth', 'modules']);

// ── Resolve (or lazily build) a Mongoose model for the given moduleSlug ───────
const resolveModel = async (moduleSlug) => {
  if (SKIP_SLUGS.has(moduleSlug)) return null;

  try {
    // 1. Always fetch fresh module definition from DB so schema stays in sync
    let mod = await Module.findOne({ moduleSlug }).lean();
    if (!mod) mod = await Module.findOne({ moduleName: new RegExp('^' + moduleSlug + '$', 'i') }).lean();
    if (!mod) return null;

    const slug = mod.moduleSlug;

    // 2. Delete stale cached model so we always rebuild from the latest DB schema.
    //    This prevents old Boolean/String types surviving across hot-reloads or code fixes.
    if (mongoose.models[slug]) {
      delete mongoose.models[slug];
      if (mongoose.modelSchemas) delete mongoose.modelSchemas[slug];
    }

    // 3. Build schema from current field definitions
    const schemaFields = {};
    (mod.fields || []).forEach((f) => {
      if (['number', 'range'].includes(f.fieldType)) {
        schemaFields[f.fieldName] = { type: Number, required: f.validations?.required || false };
      } else if (f.fieldType === 'checkbox') {
        // Multi-checkbox: stores an array of selected string values
        schemaFields[f.fieldName] = { type: [String], default: [] };
      } else if (['date', 'datetime-local'].includes(f.fieldType)) {
        schemaFields[f.fieldName] = { type: Date, required: f.validations?.required || false };
      } else if (f.fieldType === 'file') {
        // File fields store the uploaded file path/URL as string
        schemaFields[f.fieldName] = { type: String, default: '' };
      } else {
        schemaFields[f.fieldName] = { type: String, required: f.validations?.required || false };
      }
    });
    schemaFields._createdBy = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };
    schemaFields._updatedBy = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };

    const schema = new mongoose.Schema(schemaFields, { timestamps: true });
    const Model  = mongoose.model(slug, schema, slug);

    // Ensure collection exists in MongoDB (non-fatal)
    try {
      const db = mongoose.connection.db;
      if (db) {
        const cols = await db.listCollections({ name: slug }).toArray();
        if (!cols.length) await db.createCollection(slug);
      }
    } catch (e) {
      logger.warn('[resolveModel] collection init warning: ' + e.message);
    }

    logger.info('[resolveModel] resolved: ' + slug);
    return Model;

  } catch (err) {
    logger.error('[resolveModel] failed for ' + moduleSlug + ': ' + err.message);
    return null;
  }
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

// Files served directly from Cloudinary CDN — no local static route needed

// ── POST /:moduleSlug — create ────────────────────────────────────────────────
router.post('/:moduleSlug', upload.any(), async (req, res, next) => {
  try {
    const Model = await resolveModel(req.params.moduleSlug);
    if (!Model) return next(new AppError(`Module '${req.params.moduleSlug}' not found.`, 404));

    const body = { ...req.body };

    // Attach Cloudinary URLs — multer-storage-cloudinary sets file.path = secure_url
    if (req.files && req.files.length) {
      req.files.forEach((file) => {
        body[file.fieldname] = file.path; // full Cloudinary HTTPS URL
      });
    }

    const record = await Model.create({
      ...body,
      _createdBy: req.user._id,
      _updatedBy: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Record created successfully.', data: { record } });
  } catch (err) { next(err); }
});

// ── PUT /:moduleSlug/:id — update ─────────────────────────────────────────────
router.put('/:moduleSlug/:id', upload.any(), async (req, res, next) => {
  try {
    const Model = await resolveModel(req.params.moduleSlug);
    if (!Model) return next(new AppError(`Module '${req.params.moduleSlug}' not found.`, 404));

    const body = { ...req.body };

    // Inject Cloudinary URLs into body (same as POST)
    if (req.files && req.files.length) {
      req.files.forEach((file) => {
        body[file.fieldname] = file.path; // full Cloudinary HTTPS URL
      });
    }

    // Remove only null/undefined fields — keep empty string? No, remove those too.
    // But KEEP valid string values like Cloudinary URLs passed from frontend.
    Object.keys(body).forEach((key) => {
      if (body[key] === null || body[key] === undefined) {
        delete body[key];
      }
      // Only delete empty strings for non-file fields
      // File fields will have either a Cloudinary URL or nothing
      if (body[key] === '' && !key.startsWith('_')) {
        delete body[key];
      }
    });

    const record = await Model.findByIdAndUpdate(
      req.params.id,
      { ...body, _updatedBy: req.user._id },
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
// ── GET /:moduleSlug/export/excel ─────────────────────────────────────────────
router.get('/:moduleSlug/export/excel', async (req, res, next) => {
  try {
    const { moduleSlug } = req.params;
    const Model = await resolveModel(moduleSlug);
    if (!Model) return next(new AppError(`Module '${moduleSlug}' not found.`, 404));

    const mod     = await Module.findOne({ moduleSlug }).lean();
    const fields  = mod?.fields || [];
    const records = await Model.find().sort({ createdAt: -1 }).lean();

    const ExcelJS = require('exceljs');
    const wb      = new ExcelJS.Workbook();
    const ws      = wb.addWorksheet(moduleSlug);

    // Header row
    const headers = fields.map((f) => ({ header: f.fieldLabel, key: f.fieldName, width: 20 }));
    headers.push({ header: 'Created At', key: 'createdAt', width: 20 });
    ws.columns = headers;

    // Style header
    ws.getRow(1).eachCell((cell) => {
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE66239' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Data rows
    records.forEach((r) => {
      const row = {};
      fields.forEach((f) => { row[f.fieldName] = Array.isArray(r[f.fieldName]) ? r[f.fieldName].join(', ') : (r[f.fieldName] ?? ''); });
      row.createdAt = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';
      ws.addRow(row);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${moduleSlug}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

// ── GET /:moduleSlug/export/pdf ───────────────────────────────────────────────
router.get('/:moduleSlug/export/pdf', async (req, res, next) => {
  try {
    const { moduleSlug } = req.params;
    const Model = await resolveModel(moduleSlug);
    if (!Model) return next(new AppError(`Module '${moduleSlug}' not found.`, 404));

    const mod     = await Module.findOne({ moduleSlug }).lean();
    const fields  = mod?.fields || [];
    const records = await Model.find().sort({ createdAt: -1 }).lean();

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${moduleSlug}.pdf"`);
    doc.pipe(res);

    // Title
    doc.fontSize(18).fillColor('#E66239').text(moduleSlug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) + ' Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1);

    if (fields.length === 0 || records.length === 0) {
      doc.fontSize(12).fillColor('#999').text('No records found.', { align: 'center' });
      doc.end();
      return;
    }

    // Table config
    const usableFields = fields.filter(f => !['file','password'].includes(f.fieldType)).slice(0, 7);
    const colW    = Math.floor((doc.page.width - 60) / (usableFields.length + 1));
    const rowH    = 22;
    let y         = doc.y;
    const startX  = 30;

    const drawRow = (values, isHeader = false) => {
      if (y + rowH > doc.page.height - 40) {
        doc.addPage();
        y = 30;
        drawRow(usableFields.map(f => f.fieldLabel).concat('Created At'), true);
      }
      // Row bg
      doc.rect(startX, y, doc.page.width - 60, rowH)
         .fill(isHeader ? '#E66239' : (values._idx % 2 === 0 ? '#FFF5F2' : '#FFFFFF'));

      const rowValues = isHeader ? values : usableFields.map(f => {
        const v = values[f.fieldName];
        return Array.isArray(v) ? v.join(', ') : (v == null ? '' : String(v).slice(0,40));
      }).concat(values.createdAt ? new Date(values.createdAt).toLocaleDateString() : '');

      rowValues.forEach((val, i) => {
        doc.fillColor(isHeader ? '#FFFFFF' : '#333333')
           .fontSize(isHeader ? 9 : 8)
           .text(String(val), startX + i * colW + 4, y + 6, { width: colW - 8, height: rowH - 4, ellipsis: true });
      });
      y += rowH;
    };

    drawRow(usableFields.map(f => f.fieldLabel).concat('Created At'), true);
    records.forEach((r, idx) => drawRow({ ...r, _idx: idx }));

    doc.end();
  } catch (err) { next(err); }
});
