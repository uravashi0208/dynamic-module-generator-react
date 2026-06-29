import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute     from './components/auth/GuestRoute';
import AppLayout      from './components/layout/AppLayout';

import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import DashboardPage     from './pages/DashboardPage';
import ModulesPage       from './pages/ModulesPage';
import ModuleFormPage    from './pages/ModuleFormPage';
import ModuleDetailPage  from './pages/ModuleDetailPage';
import ProfilePage       from './pages/ProfilePage';
import NotFoundPage      from './pages/NotFoundPage';
import ModuleDataPage    from './pages/ModuleDataPage';
import ModuleDataFormPage from './pages/ModuleDataFormPage';
import PageVisitsPage    from './pages/PageVisitsPage';
import VisitorsPage      from './pages/VisitorsPage';

const App = () => (
  <BrowserRouter>
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: "'Poppins', sans-serif",
          fontSize: '13px',
          fontWeight: 500,
          borderRadius: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,.12)',
          maxWidth: '360px',
          border: '1px solid #e5e5e5',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />

    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Guest-only */}
      <Route element={<GuestRoute />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard"        element={<DashboardPage />} />
          <Route path="/page-visits"      element={<PageVisitsPage />} />
          <Route path="/visitors"         element={<VisitorsPage />} />
          <Route path="/modules"          element={<ModulesPage />} />
          <Route path="/modules/new"      element={<ModuleFormPage />} />
          <Route path="/modules/:id"      element={<ModuleDetailPage />} />
          <Route path="/modules/:id/edit" element={<ModuleFormPage />} />
          <Route path="/profile"          element={<ProfilePage />} />

          <Route path="/:moduleSlug">
            <Route index           element={<ModuleDataPage />} />
            <Route path="new"      element={<ModuleDataFormPage />} />
            <Route path=":id/edit" element={<ModuleDataFormPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);

export default App;