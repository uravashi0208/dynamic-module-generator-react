import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import {
  Layers, LayoutDashboard, LogOut, Menu, X, User,
  ChevronRight, Cpu, Bell, Plus,
  ChevronDown, ChevronUp, Database,
} from 'lucide-react';
import useAuthStore from '../../context/authStore';
import useModuleStore from '../../context/moduleStore';
import clsx from 'clsx';

const staticNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/modules', icon: Layers, label: 'Modules' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modulesExpanded, setModulesExpanded] = useState(true);
  const { user, logout } = useAuthStore();
  const { modules, fetchModules } = useModuleStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchModules();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeModules = modules.filter((m) => m.isActive);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
        <div className="flex items-center justify-center w-9 h-9 bg-brand-600 rounded-xl shadow-glow-sm">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 leading-tight">ModuleGen</p>
          <p className="text-xs text-slate-400">Dynamic Builder</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Navigation</p>
        {staticNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-50 text-brand-700 shadow-glow-sm'
                  : 'text-slate-600 hover:bg-surface-100 hover:text-slate-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={clsx('w-4.5 h-4.5', isActive ? 'text-brand-600' : 'text-slate-400')} size={18} />
                {label}
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-brand-400" />}
              </>
            )}
          </NavLink>
        ))}

        {/* ─── Dynamic Modules Section ─────────────────────────────── */}
        {activeModules.length > 0 && (
          <div className="pt-3">
            <button
              onClick={() => setModulesExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-2 mb-1 group"
            >
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-600 transition-colors">
                My Modules
              </span>
              {modulesExpanded
                ? <ChevronUp className="w-3 h-3 text-slate-400" />
                : <ChevronDown className="w-3 h-3 text-slate-400" />
              }
            </button>

            {modulesExpanded && (
              <div className="space-y-0.5 mt-1">
                {activeModules.map((mod) => {
                  const dataPath = `/${mod.moduleSlug}`;
                  const configPath = `/modules/${mod._id}`;
                  const isDataActive = location.pathname.startsWith(dataPath);
                  const isConfigActive = location.pathname === configPath;

                  return (
                    <NavLink
                      key={mod._id}
                      to={dataPath}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                        isDataActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                      )}
                    >
                      <div className={clsx(
                        'flex items-center justify-center w-5 h-5 rounded flex-shrink-0',
                        isDataActive ? 'bg-indigo-100' : 'bg-slate-100'
                      )}>
                        <Database className={clsx('w-3 h-3', isDataActive ? 'text-indigo-600' : 'text-slate-400')} />
                      </div>
                      <span className="truncate flex-1">{mod.moduleName}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {mod.recordCount ?? 0}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-slate-200">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center shadow-glow-sm">
            <span className="text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 flex-shrink-0 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 flex flex-col w-72 bg-white h-full shadow-2xl animate-slide-in-right">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 flex items-center justify-between h-14 px-4 lg:px-6 bg-white border-b border-slate-200 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-2">
            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-4.5 h-4.5" size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-500 rounded-full" />
            </button>
            <div
              className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center shadow-glow-sm cursor-pointer"
              onClick={() => navigate('/profile')}
            >
              <span className="text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;