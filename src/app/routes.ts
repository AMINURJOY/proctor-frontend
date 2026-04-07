import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CasesList from './pages/CasesList';
import CaseDetail from './pages/CaseDetail';
import SubmitIncident from './pages/SubmitIncident';
import IncidentsList from './pages/IncidentsList';
import HearingManagement from './pages/HearingManagement';
import ConfidentialCases from './pages/ConfidentialCases';
import VCMonitoring from './pages/VCMonitoring';
import ReportsPage from './pages/ReportsPage';
import ReportEditorPage from './pages/ReportEditorPage';
import UsersManagement from './pages/UsersManagement';
import SettingsPage from './pages/SettingsPage';
import MyCases from './pages/MyCases';
import NotificationsPage from './pages/NotificationsPage';
import CaseReport from './pages/CaseReport';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LoginPage,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      { path: 'dashboard', Component: Dashboard },
      { path: 'submit', Component: SubmitIncident },
      { path: 'incidents', Component: IncidentsList },
      { path: 'cases', Component: CasesList },
      { path: 'cases/:id', Component: CaseDetail },
      { path: 'cases/:id/report', Component: CaseReport },
      { path: 'my-cases', Component: MyCases },
      { path: 'notifications', Component: NotificationsPage },
      { path: 'hearings', Component: HearingManagement },
      { path: 'confidential', Component: ConfidentialCases },
      { path: 'monitoring', Component: VCMonitoring },
      { path: 'reports', Component: ReportsPage },
      { path: 'reports/:caseId/edit', Component: ReportEditorPage },
      { path: 'users', Component: UsersManagement },
      { path: 'settings', element: React.createElement(Navigate, { to: '/settings/profile', replace: true }) },
      { path: 'settings/menu-access', Component: SettingsPage },
      { path: 'settings/permissions', Component: SettingsPage },
      { path: 'settings/incident-routing', Component: SettingsPage },
      { path: 'settings/case-viewing', Component: SettingsPage },
      { path: 'settings/checklist', Component: SettingsPage },
      { path: 'settings/ranks', Component: SettingsPage },
      { path: 'settings/articles', Component: SettingsPage },
      { path: 'settings/forwarding', Component: SettingsPage },
      { path: 'settings/profile', Component: SettingsPage },
      { path: '*', element: React.createElement(Navigate, { to: '/dashboard', replace: true }) },
    ],
  },
]);
