// Auto-generated routes for module: Test1
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const test1Controller = require('../controllers/Test1Controller');

router.use(authenticate);

router.get('/',      test1Controller.getAll);
router.get('/:id',   test1Controller.getOne);
router.post('/',     test1Controller.create);
router.put('/:id',   test1Controller.update);
router.delete('/:id',test1Controller.remove);

module.exports = router;
