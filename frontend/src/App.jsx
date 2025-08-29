import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserDetail from './pages/AdminUserDetail';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function PrivateRoute({ children, roles }) {
  const { accessToken, user } = useSelector(s => s.auth);
  if (!accessToken) return <Navigate to="/login" />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/me" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute roles={["admin"]}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/user/:id" element={<PrivateRoute roles={["admin"]}><AdminUserDetail /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}



