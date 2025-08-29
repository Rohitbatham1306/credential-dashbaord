const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { listMyCredentials, confirmCredential, reportProblem } = require('../controllers/credentialController');

router.get('/', authenticate, listMyCredentials);
router.post('/:assignmentId/confirm', authenticate, confirmCredential);
router.post('/:assignmentId/report', authenticate, reportProblem);

module.exports = router;

