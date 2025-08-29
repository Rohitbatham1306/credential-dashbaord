import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/authSlice';

export default function NavBar() {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  return (
    <nav className="w-full border-b border-gray-200 bg-white/70 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link to="/login" className="font-semibold tracking-tight hover:text-indigo-600 transition-colors">CredentialTracker</Link>
        <div className="flex items-center gap-3 text-sm">
          {user?.role === 'admin' && <Link to="/admin" className="text-gray-600 hover:text-indigo-600 transition-colors">Admin</Link>}
          {user && <Link to="/me" className="text-gray-600 hover:text-indigo-600 transition-colors">My Credentials</Link>}
        </div>
        <div className="flex-1" />
        {user ? (
          <button className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-sm transition-colors" onClick={()=>dispatch(logout())}>Logout</button>
        ) : (
          <Link to="/login" className="px-3 py-1.5 rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm shadow hover:shadow-md transform hover:-translate-y-0.5 transition">Login</Link>
        )}
      </div>
    </nav>
  );
}

