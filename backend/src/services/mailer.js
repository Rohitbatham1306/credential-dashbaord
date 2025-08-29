const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Check if email configuration is available
const isEmailConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

const transporter = isEmailConfigured ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}) : null;

async function sendMail({ to, subject, text, html }) {
  try {
    if (!isEmailConfigured) {
      console.warn('Email not configured. Skipping email send.');
      console.log('Would send email to:', to);
      console.log('Subject:', subject);
      console.log('Text content:', text);
      return;
    }
    
    await transporter.sendMail({ 
      from: process.env.EMAIL_FROM || 'noreply@example.com', 
      to, 
      subject, 
      text,
      html 
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (e) {
    console.error('Email sending failed:', e);
    throw e;
  }
}

// Email verification email
async function sendVerificationEmail({ email, name, token }) {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Welcome to Credentials Dashboard!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Hi ${name}, please verify your email address</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
          Thank you for registering with our credentials management system. To complete your registration and start using the platform, please verify your email address by clicking the button below:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 25px;">
          If the button doesn't work, you can copy and paste this link into your browser:<br>
          <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 25px;">
          This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© 2024 Credentials Dashboard. All rights reserved.</p>
      </div>
    </div>
  `;

  const text = `
Welcome to Credentials Dashboard!

Hi ${name}, please verify your email address

Thank you for registering with our credentials management system. To complete your registration and start using the platform, please verify your email address by visiting this link:

${verificationUrl}

This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.

© 2024 Credentials Dashboard. All rights reserved.
  `;

  await sendMail({
    to: email,
    subject: 'Verify Your Email - Credentials Dashboard',
    text,
    html
  });
}

// Onboarding welcome email
async function sendOnboardingEmail({ email, name }) {
  const dashboardUrl = `${process.env.FRONTEND_URL}/me`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Welcome Aboard!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Your account has been successfully onboarded</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
          Congratulations ${name}! Your account has been successfully onboarded and you now have full access to the credentials management system.
        </p>
        
        <div style="background: #e8f5e8; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0;">
          <h3 style="margin: 0 0 10px 0; color: #065f46;">What's Next?</h3>
          <ul style="margin: 0; padding-left: 20px; color: #065f46;">
            <li>Access your personal dashboard</li>
            <li>View and manage your credentials</li>
            <li>Request access to new systems</li>
            <li>Track your credential lifecycle</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
            Access Your Dashboard
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 25px;">
          If you have any questions or need assistance, please don't hesitate to contact our support team.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© 2024 Credentials Dashboard. All rights reserved.</p>
      </div>
    </div>
  `;

  const text = `
🎉 Welcome Aboard!

Your account has been successfully onboarded

Congratulations ${name}! Your account has been successfully onboarded and you now have full access to the credentials management system.

What's Next?
• Access your personal dashboard
• View and manage your credentials
• Request access to new systems
• Track your credential lifecycle

Access your dashboard: ${dashboardUrl}

If you have any questions or need assistance, please don't hesitate to contact our support team.

© 2024 Credentials Dashboard. All rights reserved.
  `;

  await sendMail({
    to: email,
    subject: 'Welcome Aboard! - Your Account is Now Active',
    text,
    html
  });
}

// Offboarding notification email
async function sendOffboardingEmail({ email, name }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Account Offboarding</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Important information about your account status</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
          Dear ${name},
        </p>
        
        <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
          This email is to inform you that your account offboarding process has been initiated. Your access to the credentials management system will be restricted as part of this process.
        </p>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0;">
          <h3 style="margin: 0 0 10px 0; color: #991b1b;">What This Means:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #991b1b;">
            <li>Your credentials are being reviewed and deactivated</li>
            <li>Access to systems will be gradually restricted</li>
            <li>Your account will be marked as inactive</li>
            <li>All data will be securely archived</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 25px;">
          If you believe this is an error or have any questions, please contact your system administrator immediately.
        </p>
        
        <p style="color: #666; font-size: 14px;">
          Thank you for using our credentials management system.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© 2024 Credentials Dashboard. All rights reserved.</p>
      </div>
    </div>
  `;

  const text = `
Account Offboarding

Important information about your account status

Dear ${name},

This email is to inform you that your account offboarding process has been initiated. Your access to the credentials management system will be restricted as part of this process.

What This Means:
• Your credentials are being reviewed and deactivated
• Access to systems will be gradually restricted
• Your account will be marked as inactive
• All data will be securely archived

If you believe this is an error or have any questions, please contact your system administrator immediately.

Thank you for using our credentials management system.

© 2024 Credentials Dashboard. All rights reserved.
  `;

  await sendMail({
    to: email,
    subject: 'Account Offboarding Notice - Credentials Dashboard',
    text,
    html
  });
}

// Password reset email
async function sendPasswordResetEmail({ email, name, token }) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Hi ${name}, reset your password</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
          We received a request to reset your password for your credentials dashboard account. If you didn't make this request, you can safely ignore this email.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
            Reset Password
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 25px;">
          If the button doesn't work, you can copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #f59e0b;">${resetUrl}</a>
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 25px;">
          This password reset link will expire in 1 hour. For security reasons, please change your password immediately after logging in.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© 2024 Credentials Dashboard. All rights reserved.</p>
      </div>
    </div>
  `;

  const text = `
Password Reset Request

Hi ${name}, reset your password

We received a request to reset your password for your credentials dashboard account. If you didn't make this request, you can safely ignore this email.

Reset your password: ${resetUrl}

This password reset link will expire in 1 hour. For security reasons, please change your password immediately after logging in.

© 2024 Credentials Dashboard. All rights reserved.
  `;

  await sendMail({
    to: email,
    subject: 'Password Reset Request - Credentials Dashboard',
    text,
    html
  });
}

// Admin notification for offboarding
async function notifyOffboardingComplete({ email, name }) {
  const to = process.env.ADMIN_EMAIL || 'admin@company.com';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Offboarding Complete</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">User account has been successfully offboarded</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
          The offboarding process for user <strong>${name} (${email})</strong> has been completed successfully.
        </p>
        
        <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0;">
          <h3 style="margin: 0 0 10px 0; color: #0c4a6e;">Actions Completed:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #0c4a6e;">
            <li>All credentials marked as inactive</li>
            <li>User account status updated to 'Offboarded'</li>
            <li>Access permissions revoked</li>
            <li>Offboarding notification sent to user</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 25px;">
          The user has been notified of the completion of their offboarding process.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© 2024 Credentials Dashboard. All rights reserved.</p>
      </div>
    </div>
  `;

  const text = `
Offboarding Complete

User account has been successfully offboarded

The offboarding process for user ${name} (${email}) has been completed successfully.

Actions Completed:
• All credentials marked as inactive
• User account status updated to 'Offboarded'
• Access permissions revoked
• Offboarding notification sent to user

The user has been notified of the completion of their offboarding process.

© 2024 Credentials Dashboard. All rights reserved.
  `;

  await sendMail({
    to,
    subject: `Offboarding Complete - ${name} (${email})`,
    text,
    html
  });
}

// Admin notification for issue reports
async function notifyIssueToAdmin({ userEmail, note }) {
  const to = process.env.ADMIN_EMAIL || 'admin@company.com';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Credential Issue Reported</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">User has reported a problem</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
          A user has reported an issue with their credentials that requires your attention.
        </p>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 5px 5px 0;">
          <h3 style="margin: 0 0 10px 0; color: #991b1b;">Issue Details:</h3>
          <p style="margin: 0; color: #991b1b;"><strong>User:</strong> ${userEmail}</p>
          <p style="margin: 5px 0 0 0; color: #991b1b;"><strong>Note:</strong> ${note || 'No additional details provided'}</p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 25px;">
          Please review this issue and take appropriate action. You can access the admin dashboard to investigate further.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© 2024 Credentials Dashboard. All rights reserved.</p>
      </div>
    </div>
  `;

  const text = `
Credential Issue Reported

User has reported a problem

A user has reported an issue with their credentials that requires your attention.

Issue Details:
User: ${userEmail}
Note: ${note || 'No additional details provided'}

Please review this issue and take appropriate action. You can access the admin dashboard to investigate further.

© 2024 Credentials Dashboard. All rights reserved.
  `;

  await sendMail({
    to,
    subject: 'Credential Issue Reported - Action Required',
    text,
    html
  });
}

// Generate random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { 
  sendMail, 
  sendVerificationEmail,
  sendOnboardingEmail,
  sendOffboardingEmail,
  sendPasswordResetEmail,
  notifyOffboardingComplete,
  notifyIssueToAdmin,
  generateToken
};

