// Auto-generated routes for module: Basic Form
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const basicFormController = require('../controllers/BasicFormController');

router.use(authenticate);

router.get('/',      basicFormController.getAll);
router.get('/:id',   basicFormController.getOne);
router.post('/',     basicFormController.create);
router.put('/:id',   basicFormController.update);
router.delete('/:id',basicFormController.remove);

module.exports = router;
