const mongoose = require('mongoose');

// Auto-generate fieldName from fieldLabel
// "First Name" → "first_name", "Email Address" → "email_address"
const toFieldName = (label) =>
  label
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

const fieldSchema = new mongoose.Schema(
  {
    fieldLabel: {
      type: String,
      required: [true, 'Field label is required'],
      trim: true,
      maxlength: [100, 'Field label cannot exceed 100 characters'],
    },
    fieldName: {
      type: String,
      trim: true,
      // NOT required — auto-generated from fieldLabel in pre-save hook
    },
    fieldType: {
      type: String,
      required: [true, 'Field type is required'],
      enum: [
        'text', 'email', 'password', 'number', 'textarea',
        'checkbox', 'radio', 'select', 'date', 'datetime-local',
        'file', 'url', 'tel', 'color', 'range',
      ],
    },
    placeholder: {
      type: String,
      trim: true,
      default: '',
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    options: [
      {
        label: String,
        value: String,
      },
    ],
    validations: {
      required:  { type: Boolean, default: false },
      minLength: { type: Number },
      maxLength: { type: Number },
      min:       { type: Number },
      max:       { type: Number },
      pattern:   { type: String },
    },
    order: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const moduleSchema = new mongoose.Schema(
  {
    moduleName: {
      type: String,
      required: [true, 'Module name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Module name must be at least 2 characters'],
      maxlength: [100, 'Module name cannot exceed 100 characters'],
      match: [
        /^[a-zA-Z][a-zA-Z0-9\s_-]*$/,
        'Module name must start with a letter',
      ],
    },
    moduleSlug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    icon: {
      type: String,
      default: 'cube',
    },
    fields: [fieldSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save: auto-generate moduleSlug and fieldName for each field
moduleSchema.pre('save', function (next) {
  // Generate moduleSlug from moduleName
  if (this.isModified('moduleName')) {
    this.moduleSlug = this.moduleName
      .toLowerCase()
      .trim()
      .replace(/[\s]+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');
  }

  // Auto-generate fieldName from fieldLabel for every field that is missing it
  if (this.fields && this.fields.length > 0) {
    this.fields.forEach((field, index) => {
      // Always regenerate fieldName from fieldLabel
      if (field.fieldLabel) {
        field.fieldName = toFieldName(field.fieldLabel) || `field_${index + 1}`;
      }
      // Set order if not set
      if (!field.order) {
        field.order = index + 1;
      }
    });
  }

  next();
});

moduleSchema.virtual('fieldCount').get(function () {
  return this.fields?.length || 0;
});

moduleSchema.index({ moduleName: 'text', description: 'text' });

module.exports = mongoose.model('Module', moduleSchema);
