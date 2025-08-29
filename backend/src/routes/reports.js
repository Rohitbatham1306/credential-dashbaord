const router = require('express').Router();
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const reportsController = require('../controllers/reportsController');

// All routes require authentication and admin authorization
router.use(authenticate, authorizeAdmin);

// Dashboard statistics
router.get('/dashboard-stats', reportsController.getDashboardStats);

// Activity logs
router.get('/activity-logs', reportsController.getActivityLogs);

// Assignment reports
router.get('/assignments', reportsController.getAssignmentReport);

// User activity summary
router.get('/user-summary', reportsController.getUserActivitySummary);

// Credential status summary
router.get('/credential-summary', reportsController.getCredentialStatusSummary);

// Export reports
router.get('/export/csv/:reportType', reportsController.exportCSV);

module.exports = router;
