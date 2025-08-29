import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../features/authSlice';
import { clearError, clearMessage } from '../features/authSlice';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, message } = useSelector(s => s.auth);

  const onLogin = async (e) => {
    e.preventDefault();
    const res = await dispatch(login({ email, password }));
    if (res.meta.requestStatus === 'fulfilled') {
      navigate(res.payload.user.role === 'admin' ? '/admin' : '/me');
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    const res = await dispatch(register({ email, name, password }));
    if (res.meta.requestStatus === 'fulfilled') {
      setIsLoginMode(false); // Show success message
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const clearMessages = () => {
    dispatch(clearError());
    dispatch(clearMessage());
  };

  return (
    <div className="min-h-[calc(100vh-56px)] grid place-items-center px-4 py-10 bg-white">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 shadow p-8 bg-white">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          {isLoginMode ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-gray-500 mb-6">
          {isLoginMode 
            ? 'Sign in to access your credential dashboard' 
            : 'Join our credentials management system'
          }
        </p>

        {isLoginMode ? (
          // Login Form
          <form onSubmit={onLogin}>
            <div className="mb-3">
              <label className="block font-medium mb-1">Email Address</label>
              <input 
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" 
                placeholder="Enter your email" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                type="email"
                required
              />
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Password</label>
              <input 
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" 
                type="password" 
                placeholder="Enter your password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                required
              />
            </div>
            <button 
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 font-medium shadow hover:shadow-md transform hover:-translate-y-0.5 transition disabled:opacity-60" 
              disabled={status==='loading'}
              type="submit"
            >
              Sign In
            </button>
          </form>
        ) : (
          // Register Form
          <form onSubmit={onRegister}>
            <div className="mb-3">
              <label className="block font-medium mb-1">Full Name</label>
              <input 
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" 
                placeholder="Enter your full name" 
                value={name} 
                onChange={e=>setName(e.target.value)} 
                required
              />
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Email Address</label>
              <input 
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" 
                placeholder="Enter your email" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                type="email"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Password</label>
              <input 
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" 
                type="password" 
                placeholder="Enter your password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                minLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
            </div>
            <button 
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 font-medium shadow hover:shadow-md transform hover:-translate-y-0.5 transition disabled:opacity-60" 
              disabled={status==='loading'}
              type="submit"
            >
              Create Account
            </button>
          </form>
        )}

        {/* Success Message for Registration */}
        {!isLoginMode && status === 'succeeded' && message && (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            <h4 className="font-semibold mb-2">Registration Successful!</h4>
            <p className="text-sm">{message}</p>
            {window.location.hostname === 'localhost' && (
              <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg text-sm">
                <p className="font-semibold mb-1">Development Mode:</p>
                <p>Email verification may not be configured. Check the console for verification URL or contact administrator.</p>
              </div>
            )}
            <button
              onClick={() => setIsLoginMode(true)}
              className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex justify-between items-start">
              <span>{error}</span>
              <button onClick={clearMessages} className="text-red-600 hover:text-red-800 ml-2">
                ×
              </button>
            </div>
          </div>
        )}

        {/* Toggle between Login and Register */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              clearMessages();
              setEmail('');
              setPassword('');
              setName('');
            }}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>

        {/* Forgot Password Link */}
        {isLoginMode && (
          <div className="mt-4 text-center">
            <button
              onClick={handleForgotPassword}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Forgot your password?
            </button>
          </div>
        )}

        {/* Demo Accounts */}
        {isLoginMode && (
          <div className="mt-6">
            <div className="inline-block text-xs font-bold bg-indigo-100 text-indigo-800 rounded-full px-2 py-1 mb-2">Demo Accounts (Click to Auto-fill)</div>
            <div className="flex flex-col gap-2">
              <button 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-left hover:bg-gray-50 transition" 
                onClick={()=>{ setEmail('newtester@gmail.com'); setPassword('Rohit@1306'); }}
              >
              newtester@gmail.com
                <span className="ml-2 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-full px-2 py-1">USER</span>
              </button>
              <button 
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-left hover:bg-gray-50 transition" 
                onClick={()=>{ setEmail('admin1306@gmail.com'); setPassword('Rohit@1306'); }}
              >
               admin1306@gmail.com
                <span className="ml-2 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-full px-2 py-1">ADMIN</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

