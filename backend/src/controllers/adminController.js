const { Op } = require('sequelize');
const User = require('../models/User');
const Credential = require('../models/Credential');
const Assignment = require('../models/Assignment');
const ActionLog = require('../models/ActionLog');
const { recomputeUserStatus } = require('../utils/lifecycle');
const { 
  sendOnboardingEmail, 
  sendOffboardingEmail, 
  notifyOffboardingComplete 
} = require('../services/mailer');
const ReportingService = require('../services/reportingService');

async function getOverview(req, res) {
  try {
    const users = await User.findAll({ attributes: ['id', 'email', 'name', 'status', 'role'] });
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: 'Overview failed' });
  }
}

async function addCredential(req, res) {
  try {
    const { name, description } = req.body;
    const cred = await Credential.create({ name, description });
    await ActionLog.create({ action: 'credential_add', details: JSON.stringify({ id: cred.id, name }) });
    res.json({ 
      ...cred.toJSON(), 
      message: `Credential "${name}" created successfully!` 
    });
  } catch (e) { res.status(500).json({ message: 'Create credential failed' }); }
}

async function listCredentials(req, res) {
  try {
    const creds = await Credential.findAll();
    res.json(creds);
  } catch (e) { res.status(500).json({ message: 'List credentials failed' }); }
}

async function editCredential(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const cred = await Credential.findByPk(id);
    if (!cred) return res.status(404).json({ message: 'Not found' });
    if (name) cred.name = name;
    if (description) cred.description = description;
    await cred.save();
    await ActionLog.create({ action: 'credential_edit', details: JSON.stringify({ id }) });
    res.json(cred);
  } catch (e) { res.status(500).json({ message: 'Edit credential failed' }); }
}

async function deleteCredential(req, res) {
  try {
    const { id } = req.params;
    const cred = await Credential.findByPk(id);
    if (!cred) return res.status(404).json({ message: 'Not found' });
    await cred.destroy();
    await ActionLog.create({ action: 'credential_delete', details: JSON.stringify({ id }) });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: 'Delete credential failed' }); }
}

async function assignCredential(req, res) {
  try {
    let { userId, credentialId, email, credentialName } = req.body;
    if (!userId && email) {
      const u = await User.findOne({ where: { email } });
      if (!u) return res.status(404).json({ message: 'User not found' });
      userId = u.id;
    }
    if (!credentialId && credentialName) {
      const c = await Credential.findOne({ where: { name: credentialName } });
      if (!c) return res.status(404).json({ message: 'Credential not found' });
      credentialId = c.id;
    }
    if (!userId || !credentialId) return res.status(400).json({ message: 'Provide userId/credentialId or email/credentialName' });
    
    // Check user status before assignment
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.status === 'Offboarding-In-Progress' || user.status === 'Offboarded') {
      return res.status(400).json({ 
        message: `Cannot assign credentials to user with status "${user.status}". User must be in "Pending" or "Onboarded" status.` 
      });
    }
    
    const existing = await Assignment.findOne({ where: { userId, credentialId } });
    if (existing) return res.status(400).json({ message: 'Already assigned' });
    
    const assignment = await Assignment.create({ userId, credentialId });
    await ActionLog.create({ action: 'assign', details: JSON.stringify({ userId, credentialId }) });
    
    // Get credential details for the message
    const credential = await Credential.findByPk(credentialId);
    
    res.json({ 
      ...assignment.toJSON(), 
      message: `Credential "${credential.name}" assigned to ${user.email} successfully!` 
    });
  } catch (e) { res.status(500).json({ message: 'Assign failed' }); }
}

async function markInactive(req, res) {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Not found' });
    assignment.inactive = true;
    await assignment.save();
    await ActionLog.create({ action: 'mark_inactive', details: JSON.stringify({ assignmentId }) });

    // Recompute lifecycle state
    const remaining = await Assignment.count({ where: { userId: assignment.userId, inactive: { [Op.eq]: false } } });
    if (remaining === 0) {
      const user = await User.findByPk(assignment.userId);
      if (user) {
        user.status = 'Offboarded';
        await user.save();
        try { req.app.get('io').emit('offboardingComplete', { userId: user.id, email: user.email }); } catch (_) {}
        try {
          const { notifyOffboardingComplete } = require('../services/mailer');
          await notifyOffboardingComplete({ email: user.email });
        } catch (_) {}
      }
    } else {
      const user = await User.findByPk(assignment.userId);
      if (user && user.status !== 'Offboarding-In-Progress') { user.status = 'Offboarding-In-Progress'; await user.save(); }
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: 'Mark inactive failed' }); }
}

async function getStats(req, res) {
  try {
    const total = await User.count();
    const onboarded = await User.count({ where: { status: 'Onboarded' } });
    const pending = await User.count({ where: { status: 'Pending' } });
    const offboarding = await User.count({ where: { status: 'Offboarding-In-Progress' } });
    const issues = await Assignment.count({ where: { problematic: true } });
    res.json({ total, onboarded, pending, offboarding, issues });
  } catch (e) { res.status(500).json({ message: 'Stats failed' }); }
}

async function onboardUser(req, res) {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.status === 'Onboarded') {
      return res.status(400).json({ message: 'User is already onboarded' });
    }
    
    // Update user status
    await user.update({ 
      status: 'Onboarded',
      onboardedAt: new Date()
    });
    
    // Send onboarding email
    try {
      await sendOnboardingEmail({ email: user.email, name: user.name });
    } catch (emailError) {
      console.error('Failed to send onboarding email:', emailError);
      // Don't fail onboarding if email fails
    }
    
    // Log action
    await ActionLog.create({ 
      userEmail: user.email, 
      action: 'user_onboarded', 
      details: JSON.stringify({ 
        userId: user.id, 
        timestamp: new Date(),
        adminId: req.user.id 
      }) 
    });
    
    res.json({ 
      message: 'User onboarded successfully',
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        status: user.status 
      } 
    });
  } catch (e) {
    console.error('Onboard user error:', e);
    res.status(500).json({ message: 'Onboarding failed' });
  }
}

async function initiateOffboarding(req, res) {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.status === 'Offboarded') {
      return res.status(400).json({ message: 'User is already offboarded' });
    }
    
    // Update user status
    await user.update({ 
      status: 'Offboarding-In-Progress'
    });
    
    // Send offboarding notification email
    try {
      await sendOffboardingEmail({ email: user.email, name: user.name });
    } catch (emailError) {
      console.error('Failed to send offboarding email:', emailError);
      // Don't fail offboarding initiation if email fails
    }
    
    // Log action
    await ActionLog.create({ 
      userEmail: user.email, 
      action: 'offboarding_initiated', 
      details: JSON.stringify({ 
        userId: user.id, 
        timestamp: new Date(),
        adminId: req.user.id 
      }) 
    });
    
    res.json({ 
      message: 'Offboarding initiated successfully',
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        status: user.status 
      } 
    });
  } catch (e) {
    console.error('Initiate offboarding error:', e);
    res.status(500).json({ message: 'Failed to initiate offboarding' });
  }
}

async function completeOffboarding(req, res) {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.status === 'Offboarded') {
      return res.status(400).json({ message: 'User is already offboarded' });
    }
    
    // Mark all user's credentials as inactive
    await Assignment.update(
      { inactive: true },
      { where: { userId: user.id } }
    );
    
    // Update user status
    await user.update({ 
      status: 'Offboarded',
      offboardedAt: new Date()
    });
    
    // Send offboarding completion notification to admin
    try {
      await notifyOffboardingComplete({ email: user.email, name: user.name });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
      // Don't fail offboarding completion if email fails
    }
    
    // Log action
    await ActionLog.create({ 
      userEmail: user.email, 
      action: 'offboarding_completed', 
      details: JSON.stringify({ 
        userId: user.id, 
        timestamp: new Date(),
        adminId: req.user.id 
      }) 
    });
    
    // Emit socket event
    try {
      req.app.get('io').emit('offboardingComplete', { 
        userId: user.id, 
        email: user.email 
      });
    } catch (_) {}
    
    res.json({ 
      message: 'Offboarding completed successfully',
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        status: user.status 
      } 
    });
  } catch (e) {
    console.error('Complete offboarding error:', e);
    res.status(500).json({ message: 'Failed to complete offboarding' });
  }
}

async function getUserDetails(req, res) {
  try {
    const { userId } = req.params;
    
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Assignment,
          include: [{ model: Credential }]
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (e) {
    console.error('Get user details error:', e);
    res.status(500).json({ message: 'Failed to get user details' });
  }
}

module.exports = { 
  getOverview, 
  addCredential, 
  editCredential, 
  deleteCredential, 
  assignCredential, 
  markInactive, 
  getStats, 
  listCredentials,
  onboardUser,
  initiateOffboarding,
  completeOffboarding,
  getUserDetails
};

