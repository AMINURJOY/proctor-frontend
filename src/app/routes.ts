import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CasesList from './pages/CasesList';
import CaseDetail from './pages/CaseDetail';
import PlaceholderPage from './pages/PlaceholderPage';

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
      { path: 'incidents', Component: PlaceholderPage },
      { path: 'cases', Component: CasesList },
      { path: 'cases/:id', Component: CaseDetail },
      { path: 'hearings', Component: PlaceholderPage },
      { path: 'reports', Component: PlaceholderPage },
      { path: 'users', Component: PlaceholderPage },
      { path: 'settings', Component: PlaceholderPage },
      { path: '*', element: React.createElement(Navigate, { to: '/dashboard', replace: true }) },
    ],
  },
]);