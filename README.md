# Credentials Dashboard

A comprehensive credentials management system with user authentication, admin controls, and lifecycle management.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL database
- Email service (for verification emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd credentials-dashboard
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Database Setup**
   - Create a MySQL database
   - Update database configuration in `backend/.env`

5. **Email Configuration (Required for email verification)**
   ```bash
   cd backend
   npm run setup-email
   ```
   
   This interactive script will help you configure email settings for:
   - Gmail (recommended for testing)
   - Mailtrap (for development)
   - Outlook/Hotmail
   - Custom SMTP

6. **Start the Application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## 🔧 Email Verification Fix

### Problem
The email verification system was not working due to missing email configuration.

### Solution
The following improvements have been implemented:

1. **Better Error Handling**: Email failures no longer break registration
2. **Development Mode Support**: Verification URLs are logged in development
3. **Configuration Validation**: Checks for email configuration before sending
4. **Setup Script**: Interactive email configuration setup
5. **Improved Logging**: Better debugging information

### Manual Email Setup
If you prefer to configure email manually:

1. Copy `backend/env.example` to `backend/.env`
2. Update the email configuration:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   FRONTEND_URL=http://localhost:5173
   ```

### Gmail Setup (Recommended)
1. Enable 2-factor authentication in your Google Account
2. Generate an App Password for "Mail"
3. Use the App Password instead of your regular password

### Development Mode
In development mode, if email is not configured:
- Verification URLs are logged to the console
- Registration response includes the verification token
- Manual verification is possible using the token

## 📧 Email Configuration Options

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Mailtrap (Development)
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-password
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

## 🔍 Troubleshooting

### Email Verification Issues
1. **Check email configuration**: Ensure SMTP settings are correct
2. **Verify credentials**: Test with a simple email client
3. **Check console logs**: Look for email-related errors
4. **Development mode**: Use the logged verification URL

### Common Issues
- **"Email not configured"**: Run `npm run setup-email` in backend
- **"Invalid token"**: Token may be expired, request new verification
- **"SMTP connection failed"**: Check firewall and SMTP settings

### Manual Verification (Development)
If email is not working, you can manually verify by:
1. Register a new account
2. Check console for verification URL
3. Copy the URL and open in browser
4. Or use: `http://localhost:5173/verify-email?token=YOUR_TOKEN`

## 🏗️ Architecture

### Backend
- **Express.js** - Web framework
- **Sequelize** - ORM for database
- **MySQL** - Database
- **Nodemailer** - Email service
- **JWT** - Authentication

### Frontend
- **React** - UI framework
- **Redux Toolkit** - State management
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## 📁 Project Structure

```
credentials-dashboard/
├── backend/
│   ├── src/
│   │   ├── controllers/    # API controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Custom middleware
│   ├── .env               # Environment variables
│   └── setup-email.js     # Email setup script
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── features/       # Redux slices
│   │   └── services/       # API services
│   └── package.json
└── README.md
```

## 🔐 Security Features

- Email verification for new accounts
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Session management
- Input validation

## 🚀 Deployment

### Production Considerations
1. Use environment-specific email services (SendGrid, Mailgun, AWS SES)
2. Configure proper CORS settings
3. Set up HTTPS
4. Use production database
5. Configure proper logging

### Environment Variables
Ensure all required environment variables are set:
- Database configuration
- JWT secrets
- Email settings
- Frontend URL
- Admin email

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the email configuration guide
3. Check console logs for errors
4. Create an issue with detailed information
