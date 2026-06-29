const PageVisit  = require('../models/PageVisit');
const { AppError } = require('../middleware/errorHandler');

// ── GET /api/page-visits — list all (sorted by views desc) ───────────────────
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', sortBy = 'views', sortOrder = 'desc' } = req.query;

    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const filter = search ? { path: { $regex: search, $options: 'i' } } : {};
    const sort   = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [visits, total] = await Promise.all([
      PageVisit.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      PageVisit.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        visits,
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) { next(err); }
};

// ── GET /api/page-visits/summary — totals for dashboard cards ────────────────
exports.getSummary = async (req, res, next) => {
  try {
    const all = await PageVisit.find().lean();

    const totalViews = all.reduce((s, p) => s + (p.views || 0), 0);
    const avgBounce  = all.length
      ? parseFloat((all.reduce((s, p) => s + (p.bounceRate || 0), 0) / all.length).toFixed(2))
      : 0;

    res.json({
      success: true,
      data: { totalViews, avgBounce, count: all.length },
    });
  } catch (err) { next(err); }
};

// ── POST /api/page-visits/track — record a hit (upsert) ─────────────────────
exports.track = async (req, res, next) => {
  try {
    const { path, label, bounceRate, bounceUp } = req.body;

    if (!path) return next(new AppError('path is required.', 400));

    // Compute a realistic bounceRate if not provided
    const rate = bounceRate !== undefined
      ? bounceRate
      : parseFloat((Math.random() * 75 + 5).toFixed(2));
    const up = bounceUp !== undefined ? bounceUp : Math.random() > 0.5;

    const visit = await PageVisit.findOneAndUpdate(
      { path },
      {
        $inc: { views: 1 },
        $set: {
          lastVisitedAt: new Date(),
          bounceRate: rate,
          bounceUp:   up,
          ...(label && { label }),
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: { visit } });
  } catch (err) { next(err); }
};

// ── POST /api/page-visits — create manually ──────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const { path, views = 0, bounceRate = 0, bounceUp = false } = req.body;
    if (!path) return next(new AppError('path is required.', 400));

    const existing = await PageVisit.findOne({ path });
    if (existing) return next(new AppError('A record for this path already exists. Use PATCH to update.', 409));

    const visit = await PageVisit.create({ path, views, bounceRate, bounceUp });
    res.status(201).json({ success: true, message: 'Page visit record created.', data: { visit } });
  } catch (err) { next(err); }
};

// ── PATCH /api/page-visits/:id — update ──────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const { path, views, bounceRate, bounceUp } = req.body;

    const visit = await PageVisit.findByIdAndUpdate(
      req.params.id,
      { $set: { ...(path !== undefined && { path }), ...(views !== undefined && { views }), ...(bounceRate !== undefined && { bounceRate }), ...(bounceUp !== undefined && { bounceUp }) } },
      { new: true, runValidators: true }
    );
    if (!visit) return next(new AppError('Record not found.', 404));

    res.json({ success: true, message: 'Updated.', data: { visit } });
  } catch (err) { next(err); }
};

// ── DELETE /api/page-visits/:id ───────────────────────────────────────────────
exports.remove = async (req, res, next) => {
  try {
    const visit = await PageVisit.findByIdAndDelete(req.params.id);
    if (!visit) return next(new AppError('Record not found.', 404));
    res.json({ success: true, message: 'Deleted.' });
  } catch (err) { next(err); }
};