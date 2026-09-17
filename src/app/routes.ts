import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AdvancedSearch from './pages/AdvancedSearch';
import CasesList from './pages/CasesList';
import CaseDetail from './pages/CaseDetail';
import SubmitIncident from './pages/SubmitIncident';
import IncidentsList from './pages/IncidentsList';
import HearingManagement from './pages/HearingManagement';
import ConfidentialCases from './pages/ConfidentialCases';
import VCMonitoring from './pages/VCMonitoring';
import ReportsPage from './pages/ReportsPage';
import ReportEditorPage from './pages/ReportEditorPage';
import DraftReportsPage from './pages/DraftReportsPage';
import UsersManagement from './pages/UsersManagement';
import MyCases from './pages/MyCases';
import NotificationsPage from './pages/NotificationsPage';
import CaseReport from './pages/CaseReport';
import CaseEdit from './pages/CaseEdit';
import StudentsList from './pages/StudentsList';

// Students land on /submit instead of /dashboard.
function StudentDashboardGuard() {
  const { currentUser } = useAuth();
  if (currentUser?.role === 'student') {
    return React.createElement(Navigate, { to: '/submit', replace: true });
  }
  return React.createElement(Dashboard);
}

// Catch-all redirect: students go to /submit, everyone else to /dashboard.
function StudentCatchAllRedirect() {
  const { currentUser } = useAuth();
  const target = currentUser?.role === 'student' ? '/submit' : '/dashboard';
  return React.createElement(Navigate, { to: target, replace: true });
}

function AdminSettingsGuard() {
  const { currentUser, loading } = useAuth();
  if (loading) return React.createElement('div', { className: 'p-6 text-sm text-gray-500' }, 'Loading settings…');
  return currentUser?.role === 'super-admin'
    ? React.createElement(Outlet)
    : React.createElement(Navigate, { to: '/settings/profile', replace: true });
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LoginPage,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      { path: 'dashboard', Component: StudentDashboardGuard },
      { path: 'advanced-search', Component: AdvancedSearch },
      { path: 'submit', Component: SubmitIncident },
      { path: 'incidents', Component: IncidentsList },
      { path: 'cases', Component: CasesList },
      { path: 'cases/:id', Component: CaseDetail },
      { path: 'cases/:id/edit', Component: CaseEdit },
      { path: 'cases/:id/report', Component: CaseReport },
      { path: 'my-cases', Component: MyCases },
      { path: 'notifications', Component: NotificationsPage },
      { path: 'hearings', Component: HearingManagement },
      { path: 'confidential', Component: ConfidentialCases },
      { path: 'monitoring', Component: VCMonitoring },
      { path: 'reports', Component: ReportsPage },
      { path: 'reports/:caseId/edit', Component: ReportEditorPage },
      { path: 'draft-reports', Component: DraftReportsPage },
      { path: 'users', Component: UsersManagement },
      { path: 'students', Component: StudentsList },
      { path: 'settings', children: [
        { index: true, element: React.createElement(Navigate, { to: '/settings/profile', replace: true }) },
        { path: 'profile', lazy: async () => ({ Component: (await import('./pages/settings/ProfilePage')).default }) },
        { element: React.createElement(AdminSettingsGuard), children: [
          { path: 'menu-access', element: React.createElement(Navigate, { to: '/settings/permissions', replace: true }) },
          { path: 'permissions', lazy: async () => ({ Component: (await import('./pages/settings/RolePermissionsPage')).default }) },
          { path: 'incident-routing', lazy: async () => ({ Component: (await import('./pages/settings/IncidentRoutingPage')).default }) },
          { path: 'case-viewing', lazy: async () => ({ Component: (await import('./pages/settings/CaseViewingPage')).default }) },
          { path: 'checklist', lazy: async () => ({ Component: (await import('./pages/settings/ChecklistPage')).default }) },
          { path: 'case-categories', lazy: async () => ({ Component: (await import('./pages/settings/CaseCategoriesPage')).default }) },
          { path: 'case-subjects', lazy: async () => ({ Component: (await import('./pages/settings/CaseSubjectsPage')).default }) },
          { path: 'ranks', lazy: async () => ({ Component: (await import('./pages/settings/RanksPage')).default }) },
          { path: 'articles', lazy: async () => ({ Component: (await import('./pages/settings/ArticlesPage')).default }) },
          { path: 'forwarding', lazy: async () => ({ Component: (await import('./pages/settings/ForwardingPage')).default }) },
          { path: 'ai', lazy: async () => ({ Component: (await import('./pages/settings/AiIntegrationPage')).default }) },
        ] },
      ] },
      { path: '*', Component: StudentCatchAllRedirect },
    ],
  },
]);
