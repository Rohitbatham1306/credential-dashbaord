const router = require('express').Router();
const { 
  register, 
  login, 
  verifyEmail, 
  resendVerification, 
  forgotPassword, 
  resetPassword, 
  refreshToken, 
  changePassword 
} = require('../controllers/authController');
  //const auth = require('../middleware/auth');
const { authenticate, authorizeAdmin } = require('../middleware/auth');


// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);

// Protected routes (require authentication)
// router.post('/change-password', auth, changePassword);
router.post('/change-password', authenticate, changePassword);


module.exports = router;

