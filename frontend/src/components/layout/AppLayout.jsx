import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import useModuleStore from '../../context/moduleStore';

const staticNavItems = [
  { to: '/dashboard', icon: 'ti-home',         label: 'Dashboard' },
  { to: '/modules',   icon: 'ti-box-seam',      label: 'Modules' },
  { to: '/profile',   icon: 'ti-user-circle',   label: 'Profile' },
];

const AppLayout = () => {
  const [collapsed, setCollapsed]       = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [modulesOpen, setModulesOpen]   = useState(true);
  const { user, logout }                = useAuthStore();
  const { modules, fetchModules }       = useModuleStore();
  const navigate                        = useNavigate();
  const location                        = useLocation();
  const overlayRef                      = useRef(null);

  useEffect(() => { fetchModules(); }, []); // eslint-disable-line

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const activeModules = modules.filter((m) => m.isActive);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Overlay (mobile) */}
      <div
        ref={overlayRef}
        className={`overlay${mobileOpen ? ' show' : ''}`}
        onClick={closeMobile}
      />

      {/* ── Sidebar ── */}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-show' : ''}`}>
        {/* Logo */}
        <div className="logo-area">
          <i className="ti ti-cpu fs-5 text-primary" />
          <span className="logo-text fw-bold" style={{ fontSize: 15 }}>ModuleGen</span>
        </div>

        {/* Nav */}
        <nav>
          <p className="nav-label">Main</p>
          {staticNavItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMobile}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <i className={`ti ${icon}`} />
              <span className="nav-text">{label}</span>
            </NavLink>
          ))}

          {/* Dynamic modules */}
          {activeModules.length > 0 && (
            <>
              <button
                onClick={() => setModulesOpen((v) => !v)}
                className="nav-link border-0 bg-transparent w-100 text-start"
                style={{ cursor: 'pointer' }}
              >
                <i className="ti ti-database" />
                <span className="nav-text">My Modules</span>
                <i className={`ti ${modulesOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 12, marginLeft:56 }} />
              </button>
              {modulesOpen && activeModules.map((mod) => {
                const dataPath   = `/${mod.moduleSlug}`;
                const isActive   = location.pathname.startsWith(dataPath);
                return (
                  <NavLink
                    key={mod._id}
                    to={dataPath}
                    onClick={closeMobile}
                    className={`nav-link${isActive ? ' active' : ''}`}
                    style={{ paddingLeft: 20 }}
                  >
                    <i className="ti ti-point" style={{ fontSize: 14 }} />
                    <span className="nav-text flex-grow-1 text-truncate">{mod.moduleName}</span>
                    <span className="nav-badge nav-text">{mod.recordCount ?? 0}</span>
                  </NavLink>
                );
              })}
            </>
          )}

          <p className="nav-label mt-3">Account</p>
          <button
            onClick={handleLogout}
            className="nav-link border-0 bg-transparent w-100 text-start text-danger"
            style={{ cursor: 'pointer' }}
          >
            <i className="ti ti-logout" />
            <span className="nav-text">Sign out</span>
          </button>
        </nav>
      </aside>

      {/* ── Topbar ── */}
      <nav className={`topbar${collapsed ? ' full' : ''}`}>
        {/* Desktop toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="btn btn-light btn-icon btn-sm d-none d-lg-inline-flex me-2"
        >
          <i className="ti ti-layout-sidebar-left-expand" />
        </button>
        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="btn btn-light btn-icon btn-sm d-lg-none me-2"
        >
          <i className="ti ti-layout-sidebar-left-expand" />
        </button>

        {/* Spacer */}
        <div className="flex-grow-1" />

        {/* Actions */}
        <div className="d-flex align-items-center gap-2">
          {/* Bell */}
          <div className="dropdown">
            <a
              href="#"
              className="position-relative btn btn-light btn-icon btn-sm rounded-circle"
              data-bs-toggle="dropdown"
              onClick={(e) => e.preventDefault()}
            >
              <i className="ti ti-bell" style={{ fontSize: 18 }} />
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger mt-2 ms-n2" style={{ fontSize: 9 }}>
                2
              </span>
            </a>
          </div>

          {/* User avatar */}
          <div
            className="avatar-sm rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
            style={{ background: 'var(--primary)', cursor: 'pointer', fontSize: 13 }}
            onClick={() => navigate('/profile')}
            title="Profile"
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className={`content${collapsed ? ' full' : ''} animate-fade-in`}>
        <Outlet />
      </main>
    </>
  );
};

export default AppLayout;
