// Auto-generated controller for module: trtr
const Trtr = require('../models/Trtr');
const { AppError } = require('../middleware/errorHandler');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      Trtr.find().sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Trtr.countDocuments(),
    ]);
    res.json({ success: true, data: { records, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const record = await Trtr.findById(req.params.id).lean();
    if (!record) return next(new AppError('Record not found.', 404));
    res.json({ success: true, data: { record } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const record = await Trtr.create({
      ...req.body,
      _createdBy: req.user._id,
      _updatedBy: req.user._id,
    });
    res.status(201).json({ success: true, message: 'Record created.', data: { record } });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const record = await Trtr.findByIdAndUpdate(
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
    const record = await Trtr.findByIdAndDelete(req.params.id);
    if (!record) return next(new AppError('Record not found.', 404));
    res.json({ success: true, message: 'Record deleted.' });
  } catch (err) { next(err); }
};
