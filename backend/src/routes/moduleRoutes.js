const express = require('express');
const { body, param, query } = require('express-validator');
const router  = express.Router();

const {
  getModules, getModule, createModule, updateModule,
  deleteModule, toggleStatus, addField, removeField, getStats,
  downloadModuleFiles,
} = require('../controllers/moduleController');

const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All routes require auth
router.use(authenticate);

// All known field types — extended list, future-proof
const VALID_FIELD_TYPES = [
  'text', 'email', 'password', 'number', 'textarea',
  'checkbox', 'radio', 'select', 'date', 'datetime-local',
  'file', 'url', 'tel', 'color', 'range',
  'time', 'week', 'month', 'search', 'hidden',
];

// Field-level validation — lenient, only check what must be present
const fieldValidation = [
  body('fields')
    .optional()
    .isArray().withMessage('Fields must be an array'),

  body('fields.*.fieldLabel')
    .optional()
    .trim()
    .notEmpty().withMessage('Field label cannot be empty')
    .isLength({ max: 100 }).withMessage('Field label max 100 chars'),

  body('fields.*.fieldType')
    .optional()
    .trim()
    .custom((value) => {
      // Accept any string field type — log unknown ones but don't reject
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error('Field type must be a non-empty string');
      }
      return true;
    }),
];

// Module-level validation — relaxed
const moduleValidation = [
  body('moduleName')
    .trim()
    .notEmpty().withMessage('Module name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Module name must be 2-100 characters')
    .matches(/^[a-zA-Z][a-zA-Z0-9\s_-]*$/).withMessage('Module name must start with a letter and contain only letters, numbers, spaces, hyphens, or underscores'),

  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Description max 500 chars'),

  body('icon')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  ...fieldValidation,
];

// ── Routes ────────────────────────────────────────────────────────────────────
router.get('/stats/summary', getStats);
router.get('/',              getModules);
router.get('/:id',           getModule);
router.post('/',             moduleValidation, validate, createModule);
router.put('/:id',           moduleValidation, validate, updateModule);
router.delete('/:id',        deleteModule);
router.patch('/:id/toggle-status', toggleStatus);
router.get('/:id/download',  downloadModuleFiles);

// Fields
router.post('/:id/fields', [
  body('fieldLabel')
    .trim()
    .notEmpty().withMessage('Field label is required')
    .isLength({ max: 100 }).withMessage('Field label max 100 chars'),
  body('fieldType')
    .trim()
    .notEmpty().withMessage('Field type is required')
    .custom((value) => {
      if (typeof value !== 'string' || !value.trim()) throw new Error('Invalid field type');
      return true;
    }),
], validate, addField);

router.delete('/:id/fields/:fieldId', removeField);

module.exports = router;
