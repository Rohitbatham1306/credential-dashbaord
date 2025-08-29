import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../features/authSlice';
import { clearError, clearMessage } from '../features/authSlice';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, message } = useSelector(s => s.auth);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    await dispatch(forgotPassword(email));
  };
  
  const handleGoToLogin = () => {
    navigate('/login');
  };
  
  return (
    <div className="min-h-[calc(100vh-56px)] grid place-items-center px-4 py-10 bg-white">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 shadow p-8 bg-white">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-center">Forgot Password?</h1>
        <p className="text-gray-500 mb-6 text-center">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {status === 'succeeded' ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Email Sent!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={handleGoToLogin}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-green-700 transition"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                placeholder="Enter your email address"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 font-medium shadow hover:shadow-md transform hover:-translate-y-0.5 transition disabled:opacity-60"
            >
              {status === 'loading' ? 'Sending Email...' : 'Send Reset Email'}
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
