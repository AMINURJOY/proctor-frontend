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
import PlaceholderPage from './pages/PlaceholderPage';
import UsersManagement from './pages/UsersManagement';
import SettingsPage from './pages/SettingsPage';

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
      { path: 'hearings', Component: HearingManagement },
      { path: 'confidential', Component: ConfidentialCases },
      { path: 'monitoring', Component: VCMonitoring },
      { path: 'reports', Component: PlaceholderPage },
      { path: 'users', Component: UsersManagement },
      { path: 'settings', element: React.createElement(Navigate, { to: '/settings/profile', replace: true }) },
      { path: 'settings/permissions', Component: SettingsPage },
      { path: 'settings/incident-routing', Component: SettingsPage },
      { path: 'settings/case-viewing', Component: SettingsPage },
      { path: 'settings/profile', Component: SettingsPage },
      { path: '*', element: React.createElement(Navigate, { to: '/dashboard', replace: true }) },
    ],
  },
]);
