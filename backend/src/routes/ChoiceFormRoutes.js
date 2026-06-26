// Auto-generated routes for module: Choice Form
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const choiceFormController = require('../controllers/ChoiceFormController');

router.use(authenticate);

router.get('/',      choiceFormController.getAll);
router.get('/:id',   choiceFormController.getOne);
router.post('/',     choiceFormController.create);
router.put('/:id',   choiceFormController.update);
router.delete('/:id',choiceFormController.remove);

module.exports = router;
