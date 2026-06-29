const Visitor        = require('../models/Visitor');
const parseUserAgent = require('../utils/parseUserAgent');
const https          = require('https');

// ── Geo lookup via ip-api.com (free, no key needed) ─────────────────────────
const getGeoInfo = (ip) =>
  new Promise((resolve) => {
    if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return resolve({ country: 'Local', countryCode: '', city: 'Local', region: '', timezone: '', isp: '' });
    }
    const url = `https://ip-api.com/json/${ip}?fields=status,country,countryCode,city,regionName,timezone,isp`;
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.status === 'success') {
            return resolve({ country: j.country || 'Unknown', countryCode: j.countryCode || '', city: j.city || 'Unknown', region: j.regionName || '', timezone: j.timezone || '', isp: j.isp || '' });
          }
        } catch {}
        resolve({ country: 'Unknown', countryCode: '', city: 'Unknown', region: '', timezone: '', isp: '' });
      });
    });
    req.on('error', () => resolve({ country: 'Unknown', countryCode: '', city: 'Unknown', region: '', timezone: '', isp: '' }));
    req.setTimeout(3000, () => { req.destroy(); resolve({ country: 'Unknown', countryCode: '', city: 'Unknown', region: '', timezone: '', isp: '' }); });
  });

const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || 'Unknown';
};

// ── POST /api/visitors/track  (PUBLIC) ──────────────────────────────────────
exports.track = async (req, res) => {
  try {
    const ip       = getClientIP(req);
    const ua       = req.headers['user-agent'] || '';
    const page     = req.body.page     || '/';
    const referrer = req.body.referrer || req.headers['referer'] || '';

    const parsed = parseUserAgent(ua);

    // Check if we already have this IP
    const existing = await Visitor.findOne({ ip });

    if (existing) {
      // Upsert — increment count, update lastSeen, push page to history (keep last 50)
      await Visitor.updateOne(
        { ip },
        {
          $inc: { visitCount: 1 },
          $set: {
            lastSeenAt: new Date(),
            browser:   parsed.browser,
            os:        parsed.os,
            device:    parsed.device,
            userAgent: ua,
          },
          $push: {
            pages: {
              $each: [{ page, referrer, visitedAt: new Date() }],
              $slice: -50,   // keep only last 50 page hits
            },
          },
        }
      );
      return res.json({ success: true, data: { id: existing._id, returning: true } });
    }

    // New visitor — fetch geo then create
    const geo = await getGeoInfo(ip);

    const visitor = await Visitor.create({
      ip,
      ...geo,
      ...parsed,
      userAgent: ua,
      visitCount:  1,
      firstSeenAt: new Date(),
      lastSeenAt:  new Date(),
      pages: [{ page, referrer, visitedAt: new Date() }],
    });

    res.status(201).json({ success: true, data: { id: visitor._id, returning: false } });
  } catch (err) {
    res.status(200).json({ success: false });
  }
};

// ── GET /api/visitors  (auth) ────────────────────────────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, country, device, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (country) filter.country = country;
    if (device)  filter.device  = device;
    if (search)  filter.$or = [
      { ip:      { $regex: search, $options: 'i' } },
      { country: { $regex: search, $options: 'i' } },
      { city:    { $regex: search, $options: 'i' } },
      { browser: { $regex: search, $options: 'i' } },
    ];

    const [visitors, total] = await Promise.all([
      Visitor.find(filter)
        .sort({ lastSeenAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-pages -userAgent')   // don't send full page history in list
        .lean(),
      Visitor.countDocuments(filter),
    ]);

    res.json({ success: true, data: { visitors, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
};

// ── GET /api/visitors/stats  (auth) ─────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const now   = new Date();
    const day   = new Date(now); day.setHours(0, 0, 0, 0);
    const week  = new Date(now); week.setDate(now.getDate() - 7);
    const month = new Date(now); month.setDate(now.getDate() - 30);

    const [
      uniqueVisitors, totalHits, todayNew, thisWeekNew, thisMonthNew,
      byCountry, byDevice, byBrowser,
    ] = await Promise.all([
      Visitor.countDocuments(),
      Visitor.aggregate([{ $group: { _id: null, total: { $sum: '$visitCount' } } }]),
      Visitor.countDocuments({ firstSeenAt: { $gte: day } }),
      Visitor.countDocuments({ firstSeenAt: { $gte: week } }),
      Visitor.countDocuments({ firstSeenAt: { $gte: month } }),

      Visitor.aggregate([
        { $group: { _id: '$country', count: { $sum: '$visitCount' }, countryCode: { $first: '$countryCode' } } },
        { $sort: { count: -1 } }, { $limit: 10 },
        { $project: { _id: 0, country: '$_id', countryCode: 1, count: 1 } },
      ]),

      Visitor.aggregate([
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, device: '$_id', count: 1 } },
      ]),

      Visitor.aggregate([
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 6 },
        { $project: { _id: 0, browser: '$_id', count: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        total:      uniqueVisitors,
        totalHits:  totalHits[0]?.total || 0,
        today:      todayNew,
        thisWeek:   thisWeekNew,
        thisMonth:  thisMonthNew,
        byCountry, byDevice, byBrowser,
      },
    });
  } catch (err) { next(err); }
};

// ── GET /api/visitors/:id/pages  (auth) — page history for one IP ────────────
exports.getPages = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id).select('ip pages').lean();
    if (!visitor) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: { ip: visitor.ip, pages: visitor.pages.slice().reverse() } });
  } catch (err) { next(err); }
};