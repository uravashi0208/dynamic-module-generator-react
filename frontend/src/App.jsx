import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Auth guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';

// Layout
import AppLayout from './components/layout/AppLayout';

// Static pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ModulesPage from './pages/ModulesPage';
import ModuleFormPage from './pages/ModuleFormPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Generic dynamic data pages — work for ANY module without code generation
// These read module definition from moduleStore and render dynamically
import ModuleDataPage from './pages/ModuleDataPage';
import ModuleDataFormPage from './pages/ModuleDataFormPage';

const App = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            maxWidth: '360px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
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

            {/* Core pages */}
            <Route path="/dashboard"        element={<DashboardPage />} />
            <Route path="/modules"          element={<ModulesPage />} />
            <Route path="/modules/new"      element={<ModuleFormPage />} />
            <Route path="/modules/:id"      element={<ModuleDetailPage />} />
            <Route path="/modules/:id/edit" element={<ModuleFormPage />} />
            <Route path="/profile"          element={<ProfilePage />} />

            {/*
              ── Dynamic module data routes ──────────────────────────────
              Single wildcard handles ALL modules — no registry needed.
              Module create thay atle TARAT route work kare — no build needed.

              /:moduleSlug          → list page  (records table)
              /:moduleSlug/new      → create form
              /:moduleSlug/:id/edit → edit form
            */}
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
};

export default App;
