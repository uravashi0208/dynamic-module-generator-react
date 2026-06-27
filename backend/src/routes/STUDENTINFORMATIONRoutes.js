// Auto-generated routes for module: STUDENT INFORMATION
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const studentInformationController = require('../controllers/STUDENTINFORMATIONController');

router.use(authenticate);

router.get('/',      studentInformationController.getAll);
router.get('/:id',   studentInformationController.getOne);
router.post('/',     studentInformationController.create);
router.put('/:id',   studentInformationController.update);
router.delete('/:id',studentInformationController.remove);

module.exports = router;
