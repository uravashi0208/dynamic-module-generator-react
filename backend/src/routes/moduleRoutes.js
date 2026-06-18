const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const {
  getModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
  toggleStatus,
  addField,
  removeField,
  getStats,
} = require('../controllers/moduleController');

const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All routes are protected
router.use(authenticate);

const VALID_FIELD_TYPES = [
  'text', 'email', 'password', 'number', 'textarea',
  'checkbox', 'radio', 'select', 'date', 'datetime-local',
  'file', 'url', 'tel', 'color', 'range',
];

const fieldValidation = [
  body('fields.*.fieldLabel')
    .trim()
    .notEmpty().withMessage('Field label is required')
    .isLength({ max: 100 }).withMessage('Field label max 100 characters'),
  body('fields.*.fieldType')
    .notEmpty().withMessage('Field type is required')
    .isIn(VALID_FIELD_TYPES).withMessage(`Field type must be one of: ${VALID_FIELD_TYPES.join(', ')}`),
];

const moduleValidation = [
  body('moduleName')
    .trim()
    .notEmpty().withMessage('Module name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Module name must be 2-100 characters')
    .matches(/^[a-zA-Z][a-zA-Z0-9\s_-]*$/).withMessage('Module name must start with a letter'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description max 500 characters'),
  ...fieldValidation,
];

// Stats
router.get('/stats/summary', getStats);

// CRUD
router.get('/', getModules);
router.get('/:id', getModule);
router.post('/', moduleValidation, validate, createModule);
router.put('/:id', moduleValidation, validate, updateModule);
router.delete('/:id', deleteModule);
router.patch('/:id/toggle-status', toggleStatus);

// Fields
router.post('/:id/fields', [
  body('fieldLabel').trim().notEmpty().withMessage('Field label is required'),
  body('fieldType').isIn(VALID_FIELD_TYPES).withMessage('Invalid field type'),
], validate, addField);
router.delete('/:id/fields/:fieldId', removeField);

module.exports = router;
