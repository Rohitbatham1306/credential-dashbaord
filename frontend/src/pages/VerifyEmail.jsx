import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyEmail, resendVerification } from '../features/authSlice';
import { clearError, clearMessage } from '../features/authSlice';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [showResendForm, setShowResendForm] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, message } = useSelector(s => s.auth);
  
  const token = searchParams.get('token');
  
  useEffect(() => {
    if (token) {
      console.log('Verifying email with token:', token);
      dispatch(verifyEmail(token));
    }
  }, [token, dispatch]);
  
  useEffect(() => {
    // Clear messages after 5 seconds
    const timer = setTimeout(() => {
      if (message) dispatch(clearMessage());
      if (error) dispatch(clearError());
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [message, error, dispatch]);
  
  const handleResendVerification = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    const result = await dispatch(resendVerification(email));
    if (resendVerification.fulfilled.match(result)) {
      setShowResendForm(false);
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
            This verification link is invalid or has expired.
          </p>
          <button
            onClick={() => setShowResendForm(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            Resend Verification Email
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-[calc(100vh-56px)] grid place-items-center px-4 py-10 bg-white">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 shadow p-8 bg-white text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold mb-2">Verifying Email...</h1>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </>
        )}
        
        {status === 'succeeded' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-4">Email Verified!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={handleGoToLogin}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-green-700 transition"
            >
              Go to Login
            </button>
          </>
        )}
        
        {status === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-red-600 mb-4">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => setShowResendForm(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition w-full"
              >
                Resend Verification Email
              </button>
              <button
                onClick={handleGoToLogin}
                className="bg-gray-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-700 transition w-full"
              >
                Go to Login
              </button>
            </div>
          </>
        )}
        
        {message && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Resend Verification Form */}
        {showResendForm && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-3">Resend Verification Email</h3>
            <form onSubmit={handleResendVerification} className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                required
              />
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-60"
                >
                  {status === 'loading' ? 'Sending...' : 'Send Email'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResendForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
