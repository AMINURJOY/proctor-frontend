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
import { useState, useEffect, useRef, useCallback } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { notificationsApi, casesApi } from '../services/api';
import { AppNotification } from '../types';

export default function Layout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(location.pathname.startsWith('/settings'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [myCasesCount, setMyCasesCount] = useState(0);
  const permissions = usePermissions();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const role = currentUser?.role || '';
  const isSuperAdmin = role === 'super-admin';

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Notification polling
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      const data = res.data.data || res.data;
      setUnreadCount(data.count ?? 0);
    } catch { /* silent */ }
  }, []);

  const fetchMyCasesCount = useCallback(async () => {
    if (role === 'student') return;
    try {
      const res = await casesApi.getMyCasesCount();
      const data = res.data.data ?? res.data;
      setMyCasesCount(typeof data === 'number' ? data : data.count ?? 0);
    } catch { /* silent */ }
  }, [role]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.getAll();
      setNotifications(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    fetchMyCasesCount();
    const interval = setInterval(() => { fetchUnreadCount(); fetchMyCasesCount(); }, 30000);
    const onFocus = () => { if (document.visibilityState === 'visible') { fetchUnreadCount(); fetchMyCasesCount(); } };
    document.addEventListener('visibilitychange', onFocus);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onFocus); };
  }, [fetchUnreadCount, fetchMyCasesCount]);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.isRead) {
      try {
        await notificationsApi.markAsRead(n.id);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch { /* silent */ }
    }
    setShowNotifications(false);
    if (n.caseId) navigate(`/cases/${n.caseId}`);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Menu items with backend permission keys
  const allMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon, menuKey: 'dashboard' },
    { path: '/submit', label: 'Submit Incident', icon: PlusIcon, menuKey: 'submit' },
    { path: '/incidents', label: 'Incidents (Type-1)', icon: IncidentIcon, menuKey: 'incidents' },
    { path: '/cases', label: 'Cases', icon: CasesIcon, menuKey: 'cases' },
    { path: '/hearings', label: 'Hearing Management', icon: HearingIcon, menuKey: 'hearings' },
    { path: '/confidential', label: 'Confidential Cases', icon: ShieldIcon, menuKey: 'confidential' },
    { path: '/monitoring', label: 'VC Monitoring', icon: BarChartIcon, menuKey: 'monitoring' },
    { path: '/my-cases', label: 'My Cases', icon: CasesIcon, menuKey: 'my-cases' },
    { path: '/notifications', label: 'Notifications', icon: BellIcon, menuKey: 'notifications' },
    { path: '/reports', label: 'Reports', icon: ReportIcon, menuKey: 'reports' },
    { path: '/users', label: 'Users / Roles', icon: UsersIcon, menuKey: 'users' },
  ];

  const menuItems = allMenuItems.filter(item => {
    // My Cases: visible for all except student
    if (item.menuKey === 'my-cases') return role !== 'student';
    // Notifications: visible for all
    if (item.menuKey === 'notifications') return true;
    return isSuperAdmin || permissions[item.menuKey]?.canRead;
  });

  const showSettings = isSuperAdmin || permissions['settings']?.canRead;

  // Settings sub-menu items
  const settingsSubItems = [
    { path: '/settings/permissions', label: 'Role Permissions', superAdminOnly: true },
    { path: '/settings/incident-routing', label: 'Incident Routing', superAdminOnly: true },
    { path: '/settings/case-viewing', label: 'Case Viewing', superAdminOnly: true },
    { path: '/settings/checklist', label: 'Verification Checklist', superAdminOnly: true },
    { path: '/settings/profile', label: 'Profile', superAdminOnly: false },
  ].filter(item => isSuperAdmin || !item.superAdminOnly);

  const isActive = (path: string) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path + '/'));
  const isSettingsActive = location.pathname.startsWith('/settings');

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
    'super-admin': '#059669',
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-blue-900 flex items-center justify-between">
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
        {/* Close button - mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 text-blue-200 hover:text-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
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
              <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
              {item.menuKey === 'my-cases' && myCasesCount > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{myCasesCount > 99 ? '99+' : myCasesCount}</span>
              )}
              {item.menuKey === 'notifications' && unreadCount > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>
          );
        })}

        {/* General Settings - collapsible */}
        {showSettings && (
          <div>
            <button
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isSettingsActive
                  ? 'bg-white/10 text-white shadow-md'
                  : 'text-blue-200 hover:bg-white/5 hover:text-white'
              }`}
            >
              <SettingsIcon />
              <span className="text-sm font-medium flex-1 text-left">General Settings</span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`transition-transform duration-200 ${settingsExpanded ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {settingsExpanded && (
              <div className="ml-4 mt-1 space-y-1">
                {settingsSubItems.map((sub) => {
                  const subActive = location.pathname === sub.path;
                  return (
                    <button
                      key={sub.path}
                      onClick={() => navigate(sub.path)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                        subActive
                          ? 'bg-white/10 text-white'
                          : 'text-blue-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${subActive ? 'bg-white' : 'bg-blue-400'}`} />
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Role indicator at bottom */}
      <div className="p-4 border-t border-blue-900">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: roleColorMap[role] || '#fff' }} />
          <span className="text-xs text-blue-200">Role: <span className="text-white font-medium">{roleLabel}</span></span>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen min-w-0" style={{ backgroundColor: '#f5f7fb' }}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - mobile: overlay, desktop: static */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 shadow-lg flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ backgroundColor: '#0b2652' }}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="flex items-center gap-3">
              {/* Hamburger - mobile only */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

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
            </div>

            {/* Right Section */}
            <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={handleBellClick}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-[70vh] flex flex-col">
                      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                          <p className="text-center text-gray-500 text-sm py-8">No notifications</p>
                        ) : (
                          notifications.map(n => (
                            <button
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                                !n.isRead ? 'bg-blue-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                                <div className={`flex-1 min-w-0 ${n.isRead ? 'ml-4' : ''}`}>
                                  <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                    {n.title}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">{n.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
