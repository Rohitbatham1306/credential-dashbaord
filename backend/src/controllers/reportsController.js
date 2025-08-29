const ReportingService = require('../services/reportingService');
const User = require('../models/User');
const Credential = require('../models/Credential');
const Assignment = require('../models/Assignment');

// Get dashboard statistics
async function getDashboardStats(req, res) {
  try {
    const stats = await ReportingService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Failed to get dashboard statistics' });
  }
}

// Get activity logs with filters
async function getActivityLogs(req, res) {
  try {
    const filters = {
      userEmail: req.query.userEmail,
      action: req.query.action,
      category: req.query.category,
      severity: req.query.severity,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: parseInt(req.query.limit) || 100
    };

    const logs = await ReportingService.getActivityLogs(filters);
    res.json(logs);
  } catch (error) {
    console.error('Error getting activity logs:', error);
    res.status(500).json({ message: 'Failed to get activity logs' });
  }
}

// Get assignment lifecycle report
async function getAssignmentReport(req, res) {
  try {
    const assignments = await ReportingService.getAssignmentLifecycleReport();
    res.json(assignments);
  } catch (error) {
    console.error('Error getting assignment report:', error);
    res.status(500).json({ message: 'Failed to get assignment report' });
  }
}

// Export CSV report
async function exportCSV(req, res) {
  try {
    const { reportType } = req.params;
    const filters = req.query;

    const csvContent = await ReportingService.generateCSVReport(reportType, filters);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}_report_${Date.now()}.csv"`);
    
    res.send(csvContent);

    // Log the export action
    await ReportingService.logAction({
      userEmail: req.user?.email || 'system',
      action: 'export_csv',
      details: { reportType, filters },
      adminEmail: req.user?.email,
      category: 'report',
      severity: 'low'
    });

  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ message: 'Failed to export CSV report' });
  }
}

// Get user activity summary
async function getUserActivitySummary(req, res) {
  try {
    const users = await User.findAll({
      include: [
        {
          model: Assignment,
          include: [{ model: Credential }]
        }
      ]
    });

    const summary = users.map(user => ({
      email: user.email,
      name: user.name,
      status: user.status,
      role: user.role,
      totalAssignments: user.Assignments?.length || 0,
      confirmedAssignments: user.Assignments?.filter(a => a.confirmed).length || 0,
      problematicAssignments: user.Assignments?.filter(a => a.problematic).length || 0,
      inactiveAssignments: user.Assignments?.filter(a => a.inactive).length || 0,
      lastActivity: user.lastLoginAt
    }));

    res.json(summary);
  } catch (error) {
    console.error('Error getting user activity summary:', error);
    res.status(500).json({ message: 'Failed to get user activity summary' });
  }
}

// Get credential status summary
async function getCredentialStatusSummary(req, res) {
  try {
    const credentials = await Credential.findAll({
      include: [{ model: Assignment }]
    });

    const summary = credentials.map(cred => ({
      name: cred.name,
      description: cred.description,
      totalAssignments: cred.Assignments?.length || 0,
      confirmedAssignments: cred.Assignments?.filter(a => a.confirmed).length || 0,
      problematicAssignments: cred.Assignments?.filter(a => a.problematic).length || 0,
      inactiveAssignments: cred.Assignments?.filter(a => a.inactive).length || 0,
      pendingAssignments: cred.Assignments?.filter(a => !a.confirmed && !a.problematic && !a.inactive).length || 0
    }));

    res.json(summary);
  } catch (error) {
    console.error('Error getting credential status summary:', error);
    res.status(500).json({ message: 'Failed to get credential status summary' });
  }
}

module.exports = {
  getDashboardStats,
  getActivityLogs,
  getAssignmentReport,
  exportCSV,
  getUserActivitySummary,
  getCredentialStatusSummary
};
