import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ParticipantProfile from './pages/ParticipantProfile';
import Layout from './components/Layout';

function ProtectedRoute({ children, requireSuperAdmin, requireAdmin }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-mu-navy"><div className="text-mu-gold">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && user.role !== 'super_admin') return <Navigate to="/" replace />;
  if (requireAdmin && user.role !== 'admin' && user.role !== 'super_admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/super-admin" element={<ProtectedRoute requireSuperAdmin><Layout><SuperAdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireAdmin><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><ParticipantProfile /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
