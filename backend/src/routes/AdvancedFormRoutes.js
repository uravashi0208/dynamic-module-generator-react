// Auto-generated routes for module: Advanced Form
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const advancedFormController = require('../controllers/AdvancedFormController');

router.use(authenticate);

router.get('/',      advancedFormController.getAll);
router.get('/:id',   advancedFormController.getOne);
router.post('/',     advancedFormController.create);
router.put('/:id',   advancedFormController.update);
router.delete('/:id',advancedFormController.remove);

module.exports = router;
