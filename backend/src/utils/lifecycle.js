const { Op } = require('sequelize');
const User = require('../models/User');
const Assignment = require('../models/Assignment');

async function recomputeUserStatus(userId) {
  const total = await Assignment.count({ where: { userId } });
  const inactive = await Assignment.count({ where: { userId, inactive: true } });
  const confirmed = await Assignment.count({ where: { userId, confirmed: true } });

  const user = await User.findByPk(userId);
  if (!user) return;

  if (total > 0 && inactive === total) {
    user.status = 'Offboarded';
  } else if (inactive > 0) {
    user.status = 'Offboarding-In-Progress';
  } else if (total > 0 && confirmed === total) {
    user.status = 'Onboarded';
  } else {
    user.status = 'Pending';
  }
  await user.save();
}

module.exports = { recomputeUserStatus };


