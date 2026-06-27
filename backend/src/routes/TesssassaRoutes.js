// Auto-generated routes for module: tesssassa
const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const tesssassaController = require('../controllers/TesssassaController');

router.use(authenticate);

router.get('/',      tesssassaController.getAll);
router.get('/:id',   tesssassaController.getOne);
router.post('/',     tesssassaController.create);
router.put('/:id',   tesssassaController.update);
router.delete('/:id',tesssassaController.remove);

module.exports = router;
