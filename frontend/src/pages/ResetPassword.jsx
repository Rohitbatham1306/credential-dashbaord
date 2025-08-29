import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../features/authSlice';
import { clearError, clearMessage } from '../features/authSlice';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, message } = useSelector(s => s.auth);
  
  const token = searchParams.get('token');
  
  const validatePassword = () => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    setPasswordError('');
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    
    const result = await dispatch(resetPassword({ token, password }));
    if (resetPassword.fulfilled.match(result)) {
      // Redirect to login after successful password reset
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };
  
  const handleGoToLogin = () => {
    navigate('/login');
  };
  
  if (!token) {
    return (
      <div className="min-h-[calc(100vh-56px)] grid place-items-center px-4 py-10 bg-white">
        <div className="w-full max-w-xl rounded-2xl border border-gray-200 shadow p-8 bg-white text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-red-600">Invalid Link</h1>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <button
            onClick={handleGoToLogin}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-[calc(100vh-56px)] grid place-items-center px-4 py-10 bg-white">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 shadow p-8 bg-white">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-center">Reset Password</h1>
        <p className="text-gray-500 mb-6 text-center">Enter your new password below</p>
        
        {status === 'succeeded' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Password Reset Successfully!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to login page...</p>
          </div>
        )}
        
        {status !== 'succeeded' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-2">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                placeholder="Enter new password"
                required
              />
            </div>
            
            <div>
              <label className="block font-medium mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                placeholder="Confirm new password"
                required
              />
            </div>
            
            {passwordError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {passwordError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 font-medium shadow hover:shadow-md transform hover:-translate-y-0.5 transition disabled:opacity-60"
            >
              {status === 'loading' ? 'Resetting Password...' : 'Reset Password'}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleGoToLogin}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
        
        {message && status !== 'succeeded' && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
