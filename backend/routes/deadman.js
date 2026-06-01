const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getStatus, confirmCheckin, updateInterval } = require('../controllers/deadmanController');

router.use(authenticate);
router.get('/',           getStatus);
router.get('/status',     getStatus);
router.post('/checkin',   confirmCheckin);
router.put('/interval',   updateInterval);
router.patch('/interval', updateInterval);

module.exports = router;
