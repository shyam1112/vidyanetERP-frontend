import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import InstallBanner from './components/common/InstallBanner';
import UpdateBanner from './components/common/UpdateBanner';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Students from './pages/students/Students';
import Marks from './pages/marks/Marks';
import Marksheet from './pages/marks/Marksheet';
import Fees from './pages/fees/Fees';
import Registrations from './pages/admin/Registrations';
import AdminLogin from './pages/admin/AdminLogin';
import ForgotPassword from './pages/ForgotPassword';
import Team from './pages/team/Team';
import Configuration from './pages/Configuration';
import GradeConfig from './pages/GradeConfig';
import FeeConfig from './pages/FeeConfig';
import WhatsApp from './pages/WhatsApp';
import LeavingCertificate from './pages/documents/LeavingCertificate';
import AdmissionForm from './pages/documents/AdmissionForm';
import BonafideCertificate from './pages/documents/BonafideCertificate';
import CharacterCertificate from './pages/documents/CharacterCertificate';
import DOBCertificate from './pages/documents/DOBCertificate';
import Attendance from './pages/attendance/Attendance';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'superadmin') return <Navigate to="/admin/registrations" replace />;
  return <Layout>{children}</Layout>;
}

// Dashboard and Team: admin only — teachers get sent to /students
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'superadmin') return <Navigate to="/admin/registrations" replace />;
  if (user.role === 'teacher') return <Navigate to="/students" replace />;
  return <Layout>{children}</Layout>;
}

function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-950" />;
  if (!user) return <Navigate to="/admin" replace />;
  if (user.role !== 'superadmin') return <Navigate to="/" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

function PrintRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AdminPublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === 'superadmin') return <Navigate to="/admin/registrations" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public school routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Internal admin routes */}
      <Route path="/admin" element={<AdminPublicRoute><AdminLogin /></AdminPublicRoute>} />
      <Route path="/admin/registrations" element={<SuperAdminRoute><Registrations /></SuperAdminRoute>} />

      {/* School routes */}
      <Route path="/" element={<AdminRoute><Dashboard /></AdminRoute>} />
      <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
      <Route path="/marks" element={<ProtectedRoute><Marks /></ProtectedRoute>} />
      <Route path="/marks/:id" element={<PrintRoute><Marksheet /></PrintRoute>} />
      <Route path="/fees" element={<ProtectedRoute><Fees /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/team" element={<AdminRoute><Team /></AdminRoute>} />
      <Route path="/configuration" element={<Navigate to="/configuration/school" replace />} />
      <Route path="/configuration/school" element={<AdminRoute><Configuration /></AdminRoute>} />
      <Route path="/configuration/grade" element={<AdminRoute><GradeConfig /></AdminRoute>} />
      <Route path="/configuration/fees" element={<AdminRoute><FeeConfig /></AdminRoute>} />
      <Route path="/whatsapp" element={<ProtectedRoute><WhatsApp /></ProtectedRoute>} />
      <Route path="/documents" element={<Navigate to="/documents/leaving-certificate" replace />} />
      <Route path="/documents/leaving-certificate" element={<AdminRoute><LeavingCertificate /></AdminRoute>} />
      <Route path="/documents/admission-form" element={<AdminRoute><AdmissionForm /></AdminRoute>} />
      <Route path="/documents/bonafide-certificate" element={<AdminRoute><BonafideCertificate /></AdminRoute>} />
      <Route path="/documents/character-certificate" element={<AdminRoute><CharacterCertificate /></AdminRoute>} />
      <Route path="/documents/dob-certificate" element={<AdminRoute><DOBCertificate /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <UpdateBanner />
        <AppRoutes />
        <InstallBanner />
      </AuthProvider>
    </BrowserRouter>
  );
}
