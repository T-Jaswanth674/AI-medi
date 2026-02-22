import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

// Auth
import Login from './pages/auth/Login';
import LandingPage from './pages/LandingPage';

// Admin
import AdminDashboard from './pages/dashboards/AdminDashboard';
import AdminUserManagement from './pages/admin/UserManagement';
import AdminAppointments from './pages/admin/AdminAppointments';

// Doctor
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import ReportGenerator from './pages/doctor/ReportGenerator';
import PatientManagement from './pages/doctor/PatientManagement';
import AllReports from './pages/doctor/AllReports';
import ReportHistory from './pages/doctor/ReportHistory';
import DoctorAppointments from './pages/doctor/DoctorAppointments';

// Nurse
import NurseDashboard from './pages/dashboards/NurseDashboard';
import NurseNotes from './pages/nurse/NurseNotes';

// Patient
import PatientPortal from './pages/dashboards/PatientPortal';
import PatientReports from './pages/patient/PatientReports';
import PatientAppointments from './pages/patient/PatientAppointments';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><AdminDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><AdminUserManagement /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/appointments" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><AdminAppointments /></Layout>
        </ProtectedRoute>
      } />

      {/* Doctor Routes */}
      <Route path="/doctor" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <ErrorBoundary><Layout><DoctorDashboard /></Layout></ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="/doctor/new-report" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <Layout><ReportGenerator /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/patients" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <Layout><PatientManagement /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/reports" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <Layout><AllReports /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/history" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <Layout><ReportHistory /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/doctor/appointments" element={
        <ProtectedRoute allowedRoles={['doctor']}>
          <Layout><DoctorAppointments /></Layout>
        </ProtectedRoute>
      } />

      {/* Nurse Routes */}
      <Route path="/nurse" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <Layout><NurseDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/nurse/notes" element={
        <ProtectedRoute allowedRoles={['nurse']}>
          <Layout><NurseNotes /></Layout>
        </ProtectedRoute>
      } />

      {/* Patient Routes */}
      <Route path="/patient" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <Layout><PatientPortal /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/patient/reports" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <Layout><PatientReports /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/patient/appointments" element={
        <ProtectedRoute allowedRoles={['patient']}>
          <Layout><PatientAppointments /></Layout>
        </ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
