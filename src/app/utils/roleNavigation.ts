const REPORT_PATH_BY_ROLE: Record<string, string> = {
  registrar: '/registrar-reports',
  'disciplinary-committee': '/completed-reports',
  'sexual-harassment-committee': '/confidential',
  vc: '/vc-reports',
  'dc-chairman': '/dc-reports',
  'dc-member': '/dc-member-reports',
  'dc-secretary': '/dcs-reports',
  chairman: '/chairman-reports',
};

const REPORT_MENU_BY_ROLE: Record<string, string> = {
  registrar: 'registrar-reports',
  'disciplinary-committee': 'completed-reports',
  'sexual-harassment-committee': 'confidential',
  vc: 'vc-reports',
  'dc-chairman': 'dc-reports',
  'dc-member': 'dc-member-reports',
  'dc-secretary': 'dcs-reports',
  chairman: 'chairman-reports',
};

export function focusedReportMenuForRole(role?: string): string | undefined {
  return role ? REPORT_MENU_BY_ROLE[role] : undefined;
}

export function landingPathForRole(role?: string): string {
  if (role === 'student') return '/submit';
  return (role && REPORT_PATH_BY_ROLE[role]) || '/dashboard';
}

export function notificationPathForRole(role: string | undefined, caseId: string): string {
  const reportPath = role ? REPORT_PATH_BY_ROLE[role] : undefined;
  if (!reportPath) return `/cases/${caseId}`;
  return `${reportPath}?openCase=${encodeURIComponent(caseId)}`;
}
