// Auto-generated routes for module: test5
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const test5Controller = require('../controllers/Test5Controller');

router.use(authenticate);

router.get('/',      test5Controller.getAll);
router.get('/:id',   test5Controller.getOne);
router.post('/',     test5Controller.create);
router.put('/:id',   test5Controller.update);
router.delete('/:id',test5Controller.remove);

module.exports = router;
