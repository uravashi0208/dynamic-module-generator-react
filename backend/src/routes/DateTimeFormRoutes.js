// Auto-generated routes for module: Date Time Form
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const dateTimeFormController = require('../controllers/DateTimeFormController');

router.use(authenticate);

router.get('/',      dateTimeFormController.getAll);
router.get('/:id',   dateTimeFormController.getOne);
router.post('/',     dateTimeFormController.create);
router.put('/:id',   dateTimeFormController.update);
router.delete('/:id',dateTimeFormController.remove);

module.exports = router;
