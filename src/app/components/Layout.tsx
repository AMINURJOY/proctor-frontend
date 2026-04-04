import { Outlet, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  DashboardIcon,
  IncidentIcon,
  CasesIcon,
  HearingIcon,
  ReportIcon,
  UsersIcon,
  SettingsIcon,
  SearchIcon,
  BellIcon,
  UserIcon,
  ChevronDownIcon,
  LogoutIcon,
  ShieldIcon,
  BarChartIcon,
  PlusIcon
} from './Icons';
import { useState } from 'react';

export default function Layout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const role = currentUser?.role || '';

  // Role-based menu items
  const allMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon, roles: 'all' },
    { path: '/submit', label: 'Submit Incident', icon: PlusIcon, roles: ['student', 'coordinator'] },
    { path: '/incidents', label: 'Incidents (Type-1)', icon: IncidentIcon, roles: ['proctor', 'deputy-proctor', 'assistant-proctor', 'coordinator', 'vc'] },
    { path: '/cases', label: 'Cases', icon: CasesIcon, roles: 'all' },
    { path: '/hearings', label: 'Hearing Management', icon: HearingIcon, roles: ['proctor', 'deputy-proctor', 'assistant-proctor', 'disciplinary-committee'] },
    { path: '/confidential', label: 'Confidential Cases', icon: ShieldIcon, roles: ['female-coordinator', 'sexual-harassment-committee', 'proctor', 'vc'] },
    { path: '/monitoring', label: 'VC Monitoring', icon: BarChartIcon, roles: ['vc'] },
    { path: '/reports', label: 'Reports', icon: ReportIcon, roles: ['proctor', 'deputy-proctor', 'registrar', 'disciplinary-committee', 'vc'] },
    { path: '/users', label: 'Users / Roles', icon: UsersIcon, roles: ['proctor', 'vc'] },
    { path: '/settings', label: 'Settings', icon: SettingsIcon, roles: 'all' },
  ];

  const menuItems = allMenuItems.filter(item =>
    item.roles === 'all' || (Array.isArray(item.roles) && item.roles.includes(role))
  );

  const isActive = (path: string) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path + '/'));

  const roleLabel = role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const roleColorMap: Record<string, string> = {
    'student': '#3b82f6',
    'coordinator': '#06b6d4',
    'proctor': '#0b2652',
    'assistant-proctor': '#4f46e5',
    'deputy-proctor': '#7c3aed',
    'registrar': '#0d9488',
    'disciplinary-committee': '#dc2626',
    'female-coordinator': '#ec4899',
    'sexual-harassment-committee': '#be123c',
    'vc': '#ca8a04',
  };

  return (
    <div className="flex min-h-screen min-w-0" style={{ backgroundColor: '#f5f7fb' }}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 shadow-lg flex flex-col" style={{ backgroundColor: '#0b2652' }}>
        {/* Logo */}
        <div className="p-6 border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">Proctor Office</h1>
              <p className="text-blue-200 text-xs">Automation System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-white/10 text-white shadow-md'
                    : 'text-blue-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Role indicator at bottom */}
        <div className="p-4 border-t border-blue-900">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: roleColorMap[role] || '#fff' }} />
            <span className="text-xs text-blue-200">Role: <span className="text-white font-medium">{roleLabel}</span></span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            {/* Search Bar */}
            <div className="w-full min-w-0 lg:max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search cases, students, or documents..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <BellIcon />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: roleColorMap[role] || '#0b2652' }}>
                    <UserIcon />
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{roleLabel}</p>
                  </div>
                  <ChevronDownIcon />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                        <p className="text-xs text-gray-500">{currentUser?.email}</p>
                        <span
                          className="inline-block mt-2 text-xs px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: roleColorMap[role] || '#0b2652' }}
                        >
                          {roleLabel}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogoutIcon />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
