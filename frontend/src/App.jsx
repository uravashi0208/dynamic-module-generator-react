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

// Dynamic module page registry — auto-updated by backend on module create/delete
import moduleRegistry from './pages/modules/_registry';

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

            {/* Core app pages */}
            <Route path="/dashboard"       element={<DashboardPage />} />
            <Route path="/modules"         element={<ModulesPage />} />
            <Route path="/modules/new"     element={<ModuleFormPage />} />
            <Route path="/modules/:id"     element={<ModuleDetailPage />} />
            <Route path="/modules/:id/edit" element={<ModuleFormPage />} />
            <Route path="/profile"         element={<ProfilePage />} />

            {/*
              ── Dynamic module data routes ─────────────────────────────────
              Each module gets 3 clean routes (no /data/ prefix):
                /:slug          → ListPage  (records table)
                /:slug/new      → FormPage  (create)
                /:slug/:id/edit → FormPage  (edit)

              These are generated from _registry.js which the backend
              updates automatically whenever a module is created/deleted.
            */}
            {moduleRegistry.map(({ slug, ListPage, FormPage }) => (
              <Route key={slug} path={`/${slug}`}>
                <Route index                  element={<ListPage />} />
                <Route path="new"             element={<FormPage />} />
                <Route path=":id/edit"        element={<FormPage />} />
              </Route>
            ))}

          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
