const { Op } = require('sequelize');
const User = require('../models/User');
const Credential = require('../models/Credential');
const Assignment = require('../models/Assignment');
const ActionLog = require('../models/ActionLog');
const { notifyIssueToAdmin } = require('../services/mailer');
const { recomputeUserStatus } = require('../utils/lifecycle');

async function listMyCredentials(req, res) {
  try {
    const userId = req.user.id;
    const assignments = await Assignment.findAll({
      where: { userId },
      include: [{ model: Credential }],
    });
    const data = assignments.map(a => ({
      assignmentId: a.id,
      credentialId: a.credentialId,
      name: a.Credential?.name,
      description: a.Credential?.description,
      confirmed: a.confirmed,
      problematic: a.problematic,
      inactive: a.inactive,
    }));
    await recomputeUserStatus(userId);
    const user = await User.findByPk(userId);
    return res.json({ items: data, status: user?.status });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to fetch credentials' });
  }
}

async function confirmCredential(req, res) {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findOne({ where: { id: assignmentId, userId: req.user.id } });
    if (!assignment) return res.status(404).json({ message: 'Not found' });
    assignment.confirmed = true;
    assignment.problematic = false;
    await assignment.save();
    await ActionLog.create({ userEmail: req.user.email, action: 'confirm', details: JSON.stringify({ assignmentId }) });
    await recomputeUserStatus(req.user.id);
    const freshUser = await User.findByPk(req.user.id);
    return res.json({ ok: true, status: freshUser?.status });
  } catch (e) {
    return res.status(500).json({ message: 'Confirm failed' });
  }
}

async function reportProblem(req, res) {
  try {
    const { assignmentId } = req.params;
    const { note } = req.body;
    const assignment = await Assignment.findOne({ where: { id: assignmentId, userId: req.user.id } });
    if (!assignment) return res.status(404).json({ message: 'Not found' });
    assignment.problematic = true;
    await assignment.save();
    await ActionLog.create({ userEmail: req.user.email, action: 'report_problem', details: JSON.stringify({ assignmentId, note }) });
    try { req.app.get('io').emit('issueReported', { assignmentId, userEmail: req.user.email, note }); } catch (_) {}
    try { await notifyIssueToAdmin({ userEmail: req.user.email, note }); } catch (_) {}
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ message: 'Report failed' });
  }
}

module.exports = { listMyCredentials, confirmCredential, reportProblem };

