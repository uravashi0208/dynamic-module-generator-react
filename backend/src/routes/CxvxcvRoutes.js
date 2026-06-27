// Auto-generated routes for module: cxvxcv
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const cxvxcvController = require('../controllers/CxvxcvController');

router.use(authenticate);

router.get('/',      cxvxcvController.getAll);
router.get('/:id',   cxvxcvController.getOne);
router.post('/',     cxvxcvController.create);
router.put('/:id',   cxvxcvController.update);
router.delete('/:id',cxvxcvController.remove);

module.exports = router;
