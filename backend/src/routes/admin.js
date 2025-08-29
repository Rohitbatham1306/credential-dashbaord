const router = require('express').Router();
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const Assignment = require('../models/Assignment');
const Credential = require('../models/Credential');
const User = require('../models/User');
const { recomputeUserStatus } = require('../utils/lifecycle');
const fs = require('fs');



router.use(authenticate, authorizeAdmin);

// Overview and statistics
router.get('/overview', adminController.getOverview);
router.get('/stats', adminController.getStats);

// Credential management
router.get('/credentials', adminController.listCredentials);
router.post('/credentials', adminController.addCredential);
router.put('/credentials/:id', adminController.editCredential);
router.delete('/credentials/:id', adminController.deleteCredential);

// Assignment management
router.post('/assign', adminController.assignCredential);
router.post('/assignment/:assignmentId/inactive', adminController.markInactive);

// User management
router.get('/users/:userId', adminController.getUserDetails);
router.post('/users/:userId/onboard', adminController.onboardUser);
router.post('/users/:userId/initiate-offboarding', adminController.initiateOffboarding);
router.post('/users/:userId/complete-offboarding', adminController.completeOffboarding);

// CSV/PDF exports
const { exportCsv, exportPdf } = require('../utils/report');
const path = require('path');
const { notifyIssueToAdmin } = require('../services/mailer');
router.get('/export/csv', async (req, res) => {
  try {
    const rows = await Assignment.findAll({ include: [User, Credential] });
    const records = rows.map(r => ({ 
      user: r.User?.email, 
      credential: r.Credential?.name, 
      confirmed: r.confirmed, 
      problematic: r.problematic, 
      inactive: r.inactive 
    }));
    
    if (records.length === 0) {
      return res.status(404).json({ message: 'No data to export' });
    }
    
    const file = path.join(__dirname, '../../tmp_assignments.csv');
    await exportCsv(file, records);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="assignments.csv"');
    res.download(file, 'assignments.csv', (err) => {
      // Clean up the temporary file
      try {
        fs.unlinkSync(file);
      } catch (unlinkError) {
        console.error('Failed to delete temporary CSV file:', unlinkError);
      }
    });
  } catch (e) { 
    console.error('CSV export error:', e);
    res.status(500).json({ message: 'Export CSV failed' }); 
  }
});
router.get('/export/pdf', async (req, res) => {
  try {
    const rows = await Assignment.findAll({ include: [User, Credential] });
    const records = rows.map(r => ({ 
      user: r.User?.email, 
      credential: r.Credential?.name, 
      confirmed: r.confirmed, 
      problematic: r.problematic, 
      inactive: r.inactive 
    }));
    
    if (records.length === 0) {
      return res.status(404).json({ message: 'No data to export' });
    }
    
    const file = path.join(__dirname, '../../tmp_report.pdf');
    await exportPdf(file, 'Assignments Report', records);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
    res.download(file, 'report.pdf', (err) => {
      // Clean up the temporary file
      try {
        fs.unlinkSync(file);
      } catch (unlinkError) {
        console.error('Failed to delete temporary PDF file:', unlinkError);
      }
    });
  } catch (e) { 
    console.error('PDF export error:', e);
    res.status(500).json({ message: 'Export PDF failed' }); 
  }
});

router.post('/test-email', async (req, res) => {
  try {
    await notifyIssueToAdmin({ userEmail: 'test@local', note: 'SMTP test message' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: 'Email failed' }); }
});

// User detail: list assignments for a given user
router.get('/users/:userId/assignments', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const assignments = await Assignment.findAll({ where: { userId }, include: [Credential] });
    const items = assignments.map(a => ({ id: a.id, credentialId: a.credentialId, name: a.Credential?.name, description: a.Credential?.description, confirmed: a.confirmed, problematic: a.problematic, inactive: a.inactive }));
    res.json({ user: { id: user.id, email: user.email, name: user.name, status: user.status }, items });
  } catch (e) { res.status(500).json({ message: 'Fetch failed' }); }
});

// Revoke (mark inactive) an assignment
router.post('/assignments/:assignmentId/revoke', async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Not found' });
    const user = await User.findByPk(assignment.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Allow revoke regardless; deletion restricted during offboarding
    assignment.inactive = true;
    await assignment.save();
    await recomputeUserStatus(assignment.userId);
    const fresh = await User.findByPk(assignment.userId);
    res.json({ ok: true, status: fresh?.status });
  } catch (e) { res.status(500).json({ message: 'Revoke failed' }); }
});

// Delete assignment (not allowed during Offboarding-In-Progress)
router.delete('/assignments/:assignmentId', async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Not found' });
    const user = await User.findByPk(assignment.userId);
    if (user?.status === 'Offboarding-In-Progress') return res.status(400).json({ message: 'Cannot delete during offboarding' });
    await assignment.destroy();
    await recomputeUserStatus(assignment.userId);
    const fresh = await User.findByPk(assignment.userId);
    res.json({ ok: true, status: fresh?.status });
  } catch (e) { res.status(500).json({ message: 'Delete failed' }); }
});

module.exports = router;

