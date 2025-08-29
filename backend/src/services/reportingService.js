const { sequelize } = require('../config/database');
const User = require('../models/User');
const Credential = require('../models/Credential');
const Assignment = require('../models/Assignment');
const ActionLog = require('../models/ActionLog');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReportingService {
  // Log actions with detailed information
  static async logAction({
    userEmail,
    action,
    details,
    userId = null,
    credentialId = null,
    assignmentId = null,
    adminEmail = null,
    ipAddress = null,
    userAgent = null,
    severity = 'low',
    category = 'system'
  }) {
    try {
      await ActionLog.create({
        userEmail,
        action,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        userId,
        credentialId,
        assignmentId,
        adminEmail,
        ipAddress,
        userAgent,
        severity,
        category,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }

  // Get comprehensive activity logs
  static async getActivityLogs(filters = {}) {
    const whereClause = {};

    if (filters.userEmail) whereClause.userEmail = filters.userEmail;
    if (filters.action) whereClause.action = filters.action;
    if (filters.category) whereClause.category = filters.category;
    if (filters.severity) whereClause.severity = filters.severity;
    if (filters.startDate) whereClause.timestamp = { [sequelize.Op.gte]: new Date(filters.startDate) };
    if (filters.endDate) whereClause.timestamp = { [sequelize.Op.lte]: new Date(filters.endDate) };

    return await ActionLog.findAll({
      where: whereClause,
      order: [['timestamp', 'DESC']],
      limit: filters.limit || 1000
    });
  }

  // Get assignment lifecycle report
  static async getAssignmentLifecycleReport() {
    const assignments = await Assignment.findAll({
      include: [
        { model: User, attributes: ['email', 'name', 'status'] },
        { model: Credential, attributes: ['name', 'description'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return assignments.map(assignment => ({
      id: assignment.id,
      userEmail: assignment.User?.email,
      userName: assignment.User?.name,
      userStatus: assignment.User?.status,
      credentialName: assignment.Credential?.name,
      credentialDescription: assignment.Credential?.description,
      status: assignment.confirmed ? 'Confirmed' : 
              assignment.problematic ? 'Problematic' : 
              assignment.inactive ? 'Inactive' : 'Pending',
      assignedAt: assignment.createdAt,
      confirmedAt: assignment.confirmedAt,
      lastUpdated: assignment.updatedAt
    }));
  }

  // Generate CSV report
  static async generateCSVReport(reportType, filters = {}) {
    let data = [];
    let headers = [];

    switch (reportType) {
      case 'activity_logs':
        const logs = await this.getActivityLogs(filters);
        headers = ['Timestamp', 'User Email', 'Action', 'Category', 'Severity', 'Details'];
        data = logs.map(log => [
          log.timestamp,
          log.userEmail,
          log.action,
          log.category,
          log.severity,
          log.details
        ]);
        break;

      case 'assignments':
        const assignments = await this.getAssignmentLifecycleReport();
        headers = ['Assignment ID', 'User Email', 'User Name', 'User Status', 'Credential', 'Assignment Status', 'Assigned Date'];
        data = assignments.map(assignment => [
          assignment.id,
          assignment.userEmail,
          assignment.userName,
          assignment.userStatus,
          assignment.credentialName,
          assignment.status,
          assignment.assignedAt
        ]);
        break;
    }

    const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
    return csvContent;
  }

  // Get dashboard statistics
  static async getDashboardStats() {
    const [
      totalUsers,
      totalCredentials,
      totalAssignments,
      confirmedAssignments,
      problematicAssignments,
      inactiveAssignments,
      recentActivities
    ] = await Promise.all([
      User.count(),
      Credential.count(),
      Assignment.count(),
      Assignment.count({ where: { confirmed: true } }),
      Assignment.count({ where: { problematic: true } }),
      Assignment.count({ where: { inactive: true } }),
      ActionLog.count({ 
        where: { 
          timestamp: { [sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
        } 
      })
    ]);

    return {
      totalUsers,
      totalCredentials,
      totalAssignments,
      confirmedAssignments,
      problematicAssignments,
      inactiveAssignments,
      recentActivities,
      pendingAssignments: totalAssignments - confirmedAssignments - problematicAssignments - inactiveAssignments
    };
  }
}

module.exports = ReportingService;
