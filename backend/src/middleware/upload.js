/**
 * upload.js — Cloudinary + Multer middleware
 * Free tier: 25GB storage, 25GB bandwidth/month
 *
 * Required env vars in backend/.env:
 *   CLOUDINARY_CLOUD_NAME=your_cloud_name
 *   CLOUDINARY_API_KEY=your_api_key
 *   CLOUDINARY_API_SECRET=your_api_secret
 */
const multer        = require('multer');
const cloudinary    = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ── Configure Cloudinary ──────────────────────────────────────────────────────
cloudinary.config({
  cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
  api_key    : process.env.CLOUDINARY_API_KEY,
  api_secret : process.env.CLOUDINARY_API_SECRET,
});

// ── Cloudinary Storage ────────────────────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const moduleSlug = req.params.moduleSlug || 'misc';
    const isImage    = file.mimetype.startsWith('image/');
    return {
      folder         : `dynamic-modules/${moduleSlug}`,
      resource_type  : isImage ? 'image' : 'raw',
      // Keep original filename (sanitised) + timestamp
      public_id      : `${file.fieldname}_${Date.now()}`,
      // Auto-optimise images
      ...(isImage && {
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      }),
    };
  },
});

// ── File filter ───────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|xls|xlsx|csv|txt|zip/;
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (allowed.test(ext)) return cb(null, true);
  cb(new Error(`File type .${ext} not allowed`));
};

// ── Export multer instance ────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = upload;