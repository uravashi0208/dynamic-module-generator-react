// Auto-generated routes for module: trtr
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const trtrController = require('../controllers/TrtrController');

router.use(authenticate);

router.get('/',      trtrController.getAll);
router.get('/:id',   trtrController.getOne);
router.post('/',     trtrController.create);
router.put('/:id',   trtrController.update);
router.delete('/:id',trtrController.remove);

module.exports = router;
