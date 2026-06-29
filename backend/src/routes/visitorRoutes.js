const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const { track, getAll, getStats, getPages } = require('../controllers/visitorController');

router.post('/track',       track);                    // PUBLIC
router.get('/stats',        authenticate, getStats);
router.get('/',             authenticate, getAll);
router.get('/:id/pages',    authenticate, getPages);   // page history for one IP

module.exports = router;