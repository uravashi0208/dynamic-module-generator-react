const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getAll, getSummary, track, create, update, remove,
} = require('../controllers/pageVisitController');

router.use(authenticate);

router.get('/summary', getSummary);   // GET  /api/page-visits/summary
router.get('/',        getAll);       // GET  /api/page-visits
router.post('/track',  track);        // POST /api/page-visits/track  (upsert hit)
router.post('/',       create);       // POST /api/page-visits         (manual create)
router.patch('/:id',   update);       // PATCH /api/page-visits/:id
router.delete('/:id',  remove);       // DELETE /api/page-visits/:id

module.exports = router;