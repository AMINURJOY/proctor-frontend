import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router';
import { rolesApi, settingsApi, checklistApi, ranksApi, articlesApi, forwardingRulesApi } from '../services/api';
import { toast } from 'sonner';

const menuItems = [
  'Dashboard', 'Submit Incident', 'Incidents (Type-1)', 'Cases',
  'Hearing Management', 'Confidential Cases', 'VC Monitoring',
  'My Cases', 'Notifications', 'Reports', 'Users / Roles', 'Settings',
];

const menuLabelToKey: Record<string, string> = {
  'Dashboard': 'dashboard',
  'Submit Incident': 'submit',
  'Incidents (Type-1)': 'incidents',
  'Cases': 'cases',
  'Hearing Management': 'hearings',
  'Confidential Cases': 'confidential',
  'VC Monitoring': 'monitoring',
  'My Cases': 'my-cases',
  'Notifications': 'notifications',
  'Reports': 'reports',
  'Users / Roles': 'users',
  'Settings': 'settings',
};

const roleLabels = [
  'student', 'coordinator', 'proctor', 'assistant-proctor', 'deputy-proctor',
  'registrar', 'disciplinary-committee', 'female-coordinator',
  'sexual-harassment-committee', 'vc',
];

const allRolesForRouting = [
  { value: 'proctor', label: 'Proctor' },
  { value: 'deputy-proctor', label: 'Deputy Proctor' },
  { value: 'assistant-proctor', label: 'Assistant Proctor' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'registrar', label: 'Registrar' },
];

type PermissionMap = Record<string, Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean }>>;

const formatRole = (role: string) =>
  role.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isSuperAdmin = currentUser?.role === 'super-admin';

  // Determine active tab from route
  const getActiveTab = () => {
    if (location.pathname.includes('/menu-access')) return 'menu-access';
    if (location.pathname.includes('/permissions')) return 'permissions';
    if (location.pathname.includes('/incident-routing')) return 'incident-routing';
    if (location.pathname.includes('/case-viewing')) return 'case-viewing';
    if (location.pathname.includes('/checklist')) return 'checklist';
    if (location.pathname.includes('/ranks')) return 'ranks';
    if (location.pathname.includes('/articles')) return 'articles';
    if (location.pathname.includes('/forwarding')) return 'forwarding';
    return 'profile';
  };
  const activeTab = getActiveTab();

  // --- Role Permissions State ---
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [roleIdMap, setRoleIdMap] = useState<Record<string, string>>({});
  const [permLoading, setPermLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  // --- Incident Routing State ---
  const [forwardingRoles, setForwardingRoles] = useState<string[]>(['proctor', 'deputy-proctor']);
  const [routingLoading, setRoutingLoading] = useState(true);
  const [routingSaving, setRoutingSaving] = useState(false);
  const [routingSavedMsg, setRoutingSavedMsg] = useState('');

  // --- Case Viewing State ---
  const [caseViewingType1, setCaseViewingType1] = useState<string[]>([]);
  const [caseViewingType2, setCaseViewingType2] = useState<string[]>([]);
  const [caseViewingConfidential, setCaseViewingConfidential] = useState<string[]>([]);
  const [caseViewingLoading, setCaseViewingLoading] = useState(true);
  const [caseViewingSaving, setCaseViewingSaving] = useState(false);
  const [caseViewingSavedMsg, setCaseViewingSavedMsg] = useState('');

  // Fetch permissions data
  useEffect(() => {
    if (!isSuperAdmin || activeTab !== 'permissions') return;
    const fetchRoles = async () => {
      setPermLoading(true);
      try {
        const response = await rolesApi.getAll();
        const rolesData = response.data.data || response.data;
        if (Array.isArray(rolesData) && rolesData.length > 0) {
          const permMap: PermissionMap = {};
          const idMap: Record<string, string> = {};
          for (const role of rolesData) {
            const roleName = role.roleName || role.name;
            idMap[roleName] = role.id;
            if (role.menuPermissions && Array.isArray(role.menuPermissions)) {
              permMap[roleName] = {};
              for (const mp of role.menuPermissions) {
                const menuKey = mp.menuKey || mp.menu;
                const menuLabel = menuItems.find(m => m.toLowerCase().replace(/[^a-z0-9]/g, '-').includes(menuKey)) || menuKey;
                permMap[roleName][menuLabel] = {
                  create: mp.canCreate ?? false,
                  read: mp.canRead ?? false,
                  update: mp.canUpdate ?? false,
                  delete: mp.canDelete ?? false,
                };
              }
            }
          }
          if (Object.keys(permMap).length > 0) {
            setRoleIdMap(idMap);
            setPermissions(permMap);
            setPermLoading(false);
            return;
          }
        }
        initDefaultPermissions();
      } catch {
        initDefaultPermissions();
      } finally {
        setPermLoading(false);
      }
    };
    fetchRoles();
  }, [isSuperAdmin, activeTab]);

  // Fetch incident routing settings
  useEffect(() => {
    if (!isSuperAdmin || activeTab !== 'incident-routing') return;
    const fetchRouting = async () => {
      setRoutingLoading(true);
      try {
        const response = await settingsApi.getByKey('type1_forwarding_roles');
        const setting = response.data.data || response.data;
        if (setting?.value) {
          setForwardingRoles(setting.value.split(',').map((s: string) => s.trim()).filter(Boolean));
        }
      } catch {
        // Keep defaults
      } finally {
        setRoutingLoading(false);
      }
    };
    fetchRouting();
  }, [isSuperAdmin, activeTab]);

  // Fetch case viewing settings
  useEffect(() => {
    if (!isSuperAdmin || activeTab !== 'case-viewing') return;
    const fetchCaseViewing = async () => {
      setCaseViewingLoading(true);
      try {
        const response = await settingsApi.getByCategory('case_viewing');
        const settings = response.data.data || response.data;
        if (Array.isArray(settings)) {
          for (const s of settings) {
            const roles = s.value.split(',').map((r: string) => r.trim()).filter(Boolean);
            if (s.key === 'case_viewing_type1') setCaseViewingType1(roles);
            if (s.key === 'case_viewing_type2') setCaseViewingType2(roles);
            if (s.key === 'case_viewing_confidential') setCaseViewingConfidential(roles);
          }
        }
      } catch {
        // Keep defaults
      } finally {
        setCaseViewingLoading(false);
      }
    };
    fetchCaseViewing();
  }, [isSuperAdmin, activeTab]);

  const initDefaultPermissions = () => {
    const defaultPerms: PermissionMap = {};
    roleLabels.forEach(role => {
      defaultPerms[role] = {};
      menuItems.forEach(menu => {
        defaultPerms[role][menu] = { create: false, read: true, update: false, delete: false };
      });
    });
    defaultPerms['proctor'] = {};
    menuItems.forEach(menu => {
      defaultPerms['proctor'][menu] = { create: true, read: true, update: true, delete: true };
    });
    setPermissions(defaultPerms);
  };

  const togglePermission = (role: string, menu: string, perm: 'create' | 'read' | 'update' | 'delete') => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [menu]: {
          ...(prev[role]?.[menu] || { create: false, read: false, update: false, delete: false }),
          [perm]: !(prev[role]?.[menu]?.[perm] ?? false),
        },
      },
    }));
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    setSavedMessage('');
    try {
      const promises = roleLabels.map(role => {
        const roleId = roleIdMap[role] || role;
        const rolePerms = permissions[role] || {};
        const permissionsArray = Object.entries(rolePerms).map(([menuLabel, perms]) => ({
          menuKey: menuLabelToKey[menuLabel] || menuLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          canCreate: perms.create,
          canRead: perms.read,
          canUpdate: perms.update,
          canDelete: perms.delete,
        }));
        return rolesApi.updatePermissions(roleId, { permissions: permissionsArray });
      });
      await Promise.allSettled(promises);
      setSavedMessage('Permissions saved successfully.');
    } catch {
      setSavedMessage('Failed to save some permissions.');
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  const toggleForwardingRole = (role: string) => {
    setForwardingRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSaveRouting = async () => {
    setRoutingSaving(true);
    setRoutingSavedMsg('');
    try {
      await settingsApi.update('type1_forwarding_roles', forwardingRoles.join(','));
      setRoutingSavedMsg('Incident routing saved successfully.');
    } catch {
      setRoutingSavedMsg('Failed to save routing settings.');
    } finally {
      setRoutingSaving(false);
      setTimeout(() => setRoutingSavedMsg(''), 3000);
    }
  };

  const toggleCaseViewingRole = (caseType: 'type1' | 'type2' | 'confidential', role: string) => {
    const setters = { type1: setCaseViewingType1, type2: setCaseViewingType2, confidential: setCaseViewingConfidential };
    setters[caseType](prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const handleSaveCaseViewing = async () => {
    setCaseViewingSaving(true);
    setCaseViewingSavedMsg('');
    try {
      await Promise.all([
        settingsApi.update('case_viewing_type1', caseViewingType1.join(',')),
        settingsApi.update('case_viewing_type2', caseViewingType2.join(',')),
        settingsApi.update('case_viewing_confidential', caseViewingConfidential.join(',')),
      ]);
      setCaseViewingSavedMsg('Case viewing settings saved successfully.');
    } catch {
      setCaseViewingSavedMsg('Failed to save case viewing settings.');
    } finally {
      setCaseViewingSaving(false);
      setTimeout(() => setCaseViewingSavedMsg(''), 3000);
    }
  };

  // Non-super-admin: always show profile
  if (!isSuperAdmin) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>Settings</h1>
          <p className="text-gray-600">Account settings and preferences</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 max-w-2xl">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Profile Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
              <p className="text-gray-900 font-medium">{currentUser?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <p className="text-gray-900">{currentUser?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
              <span className="inline-flex px-2.5 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                {formatRole(currentUser?.role || '')}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">User ID</label>
              <p className="text-gray-900 font-mono text-sm">{currentUser?.id}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>General Settings</h1>
        <p className="text-gray-600">System configuration and access management</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 max-w-fit">
        {[
          { key: 'profile', label: 'Profile', path: '/settings/profile' },
          { key: 'permissions', label: 'Role Permissions', path: '/settings/permissions' },
          { key: 'incident-routing', label: 'Incident Routing', path: '/settings/incident-routing' },
          { key: 'case-viewing', label: 'Case Viewing', path: '/settings/case-viewing' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 max-w-2xl">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Profile Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
              <p className="text-gray-900 font-medium">{currentUser?.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <p className="text-gray-900">{currentUser?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
              <span className="inline-flex px-2.5 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                {formatRole(currentUser?.role || '')}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">User ID</label>
              <p className="text-gray-900 font-mono text-sm">{currentUser?.id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Menu Access Tab — controls who can SEE each menu (R only) */}
      {activeTab === 'menu-access' && isSuperAdmin && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">Toggle which menus each role can see in the sidebar</p>
            <div className="flex items-center gap-3">
              {savedMessage && (
                <span className={`text-sm ${savedMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {savedMessage}
                </span>
              )}
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{ backgroundColor: '#0b2652' }}
              >
                {saving ? 'Saving...' : 'Save Menu Access'}
              </button>
            </div>
          </div>

          {permLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200" style={{ backgroundColor: '#f5f7fb' }}>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                        Menu Item
                      </th>
                      {roleLabels.map(role => (
                        <th key={role} className="px-2 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[80px]">
                          <div className="whitespace-nowrap">{formatRole(role)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {menuItems.map((menu) => (
                      <tr key={menu} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-100">
                          {menu}
                        </td>
                        {roleLabels.map(role => {
                          const perms = permissions[role]?.[menu] || { create: false, read: false, update: false, delete: false };
                          return (
                            <td key={role} className="px-2 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={perms.read}
                                onChange={() => togglePermission(role, menu, 'read')}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                title="Visible in sidebar"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="mt-4 bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <p className="text-sm text-gray-600">A checked box means that role will see this menu in the sidebar. CRUD operations within each menu are configured under <strong>Permissions (CRUD)</strong>.</p>
          </div>
        </div>
      )}

      {/* Permissions (CRUD) Tab — fine-grained C/U/D operations per menu */}
      {activeTab === 'permissions' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">Configure Create, Update, and Delete operations for each role per menu item. (Visibility is controlled in <strong>Menu Access</strong>.)</p>
            <div className="flex items-center gap-3">
              {savedMessage && (
                <span className={`text-sm ${savedMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {savedMessage}
                </span>
              )}
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{ backgroundColor: '#0b2652' }}
              >
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>

          {permLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200" style={{ backgroundColor: '#f5f7fb' }}>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                        Menu Item
                      </th>
                      {roleLabels.map(role => (
                        <th key={role} className="px-2 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[100px]">
                          <div className="whitespace-nowrap">{formatRole(role)}</div>
                          <div className="flex justify-center gap-1 mt-1 text-[10px] text-gray-400 font-normal">
                            <span>C</span><span>U</span><span>D</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {menuItems.map((menu) => (
                      <tr key={menu} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-100">
                          {menu}
                        </td>
                        {roleLabels.map(role => {
                          const perms = permissions[role]?.[menu] || { create: false, read: false, update: false, delete: false };
                          return (
                            <td key={role} className="px-2 py-3">
                              <div className="flex justify-center gap-1">
                                {(['create', 'update', 'delete'] as const).map(perm => (
                                  <label key={perm} className="cursor-pointer" title={perm}>
                                    <input
                                      type="checkbox"
                                      checked={perms[perm]}
                                      onChange={() => togglePermission(role, menu, perm)}
                                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                  </label>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="mt-4 bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Legend:</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span><strong>C</strong> = Create</span>
              <span><strong>U</strong> = Update</span>
              <span><strong>D</strong> = Delete</span>
            </div>
          </div>
        </div>
      )}

      {/* Incident Routing Tab */}
      {activeTab === 'incident-routing' && (
        <div className="max-w-2xl">
          {routingLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Type-1 Forwarding */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#0b2652' }}>
                  Type-1 Incident Forwarding
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Select which roles should receive Type-1 (instant) incident submissions.
                </p>

                <div className="space-y-3">
                  {allRolesForRouting.map(r => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        forwardingRoles.includes(r.value)
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={forwardingRoles.includes(r.value)}
                        onChange={() => toggleForwardingRole(r.value)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{r.label}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {forwardingRoles.length === 0 && (
                  <p className="mt-3 text-sm text-red-500">Please select at least one role.</p>
                )}

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Preview:</strong> Type-1 incidents will be sent to:{' '}
                    <span className="font-medium text-gray-900">
                      {forwardingRoles.length > 0
                        ? forwardingRoles.map(r => formatRole(r)).join(' / ')
                        : 'No roles selected'}
                    </span>
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleSaveRouting}
                    disabled={routingSaving || forwardingRoles.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white disabled:opacity-50"
                    style={{ backgroundColor: '#0b2652' }}
                  >
                    {routingSaving ? 'Saving...' : 'Save Routing'}
                  </button>
                  {routingSavedMsg && (
                    <span className={`text-sm ${routingSavedMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                      {routingSavedMsg}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Case Viewing Tab */}
      {activeTab === 'case-viewing' && (
        <div className="max-w-3xl">
          {caseViewingLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {([
                { key: 'type1' as const, label: 'Type-1 (Instant Incidents)', state: caseViewingType1 },
                { key: 'type2' as const, label: 'Type-2 (Formal Cases)', state: caseViewingType2 },
                { key: 'confidential' as const, label: 'Confidential Cases', state: caseViewingConfidential },
              ]).map(caseType => (
                <div key={caseType.key} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold mb-1" style={{ color: '#0b2652' }}>
                    {caseType.label}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select which roles can view {caseType.label.toLowerCase()} in the system.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { value: 'student', label: 'Student' },
                      { value: 'coordinator', label: 'Coordinator' },
                      { value: 'proctor', label: 'Proctor' },
                      { value: 'assistant-proctor', label: 'Assistant Proctor' },
                      { value: 'deputy-proctor', label: 'Deputy Proctor' },
                      { value: 'registrar', label: 'Registrar' },
                      { value: 'disciplinary-committee', label: 'Disciplinary Committee' },
                      { value: 'female-coordinator', label: 'Female Coordinator' },
                      { value: 'sexual-harassment-committee', label: 'SH Committee' },
                      { value: 'vc', label: 'VC' },
                      { value: 'super-admin', label: 'Super Admin' },
                    ].map(r => (
                      <label
                        key={r.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          caseType.state.includes(r.value)
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={caseType.state.includes(r.value)}
                          onChange={() => toggleCaseViewingRole(caseType.key, r.value)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveCaseViewing}
                  disabled={caseViewingSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white disabled:opacity-50"
                  style={{ backgroundColor: '#0b2652' }}
                >
                  {caseViewingSaving ? 'Saving...' : 'Save Case Viewing Settings'}
                </button>
                {caseViewingSavedMsg && (
                  <span className={`text-sm ${caseViewingSavedMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                    {caseViewingSavedMsg}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Verification Checklist Tab */}
      {activeTab === 'checklist' && isSuperAdmin && (
        <ChecklistManager />
      )}
      {/* Ranks Tab */}
      {activeTab === 'ranks' && isSuperAdmin && (
        <RanksManager />
      )}
      {/* Articles Tab */}
      {activeTab === 'articles' && isSuperAdmin && (
        <ArticlesManager />
      )}
      {/* Forwarding Rules Tab */}
      {activeTab === 'forwarding' && isSuperAdmin && (
        <ForwardingManager />
      )}
    </div>
  );
}

// Ranks manager component
function RanksManager() {
  const [ranks, setRanks] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => { fetchRanks(); }, []);
  const fetchRanks = async () => {
    try { const res = await ranksApi.getAll(); setRanks(res.data.data || []); } catch {}
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Manage Ranks (পদবি)</h3>
      <div className="space-y-2 mb-4">
        {ranks.map((r: any) => (
          <div key={r.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            {editId === r.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" />
                <button onClick={async () => { await ranksApi.update(r.id, { name: editName }); setEditId(null); fetchRanks(); toast.success('Updated'); }}
                  className="px-3 py-1 text-xs rounded bg-green-600 text-white">Save</button>
                <button onClick={() => setEditId(null)} className="px-3 py-1 text-xs rounded border border-gray-300">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{r.name}</span>
                <button onClick={() => { setEditId(r.id); setEditName(r.name); }} className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100">Edit</button>
                <button onClick={async () => { await ranksApi.delete(r.id); fetchRanks(); toast.success('Deleted'); }}
                  className="px-3 py-1 text-xs rounded text-red-600 hover:bg-red-50">Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New rank name..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) { ranksApi.create({ name: newName }).then(() => { setNewName(''); fetchRanks(); toast.success('Created'); }); } }} />
        <button disabled={!newName.trim()} onClick={() => { ranksApi.create({ name: newName }).then(() => { setNewName(''); fetchRanks(); toast.success('Created'); }); }}
          className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50" style={{ backgroundColor: '#0b2652' }}>Add</button>
      </div>
    </div>
  );
}

// Articles manager component
function ArticlesManager() {
  const [articles, setArticles] = useState<any[]>([]);
  const [newNo, setNewNo] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editNo, setEditNo] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => { fetchArticles(); }, []);
  const fetchArticles = async () => {
    try { const res = await articlesApi.getAll(); setArticles(res.data.data || []); } catch {}
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Manage Articles (অনুচ্ছেদ / Code of Conduct)</h3>
      <div className="space-y-2 mb-4">
        {articles.map((a: any) => (
          <div key={a.id} className="p-3 bg-gray-50 rounded-lg">
            {editId === a.id ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={editNo} onChange={e => setEditNo(e.target.value)} placeholder="No." className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" />
                </div>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" rows={2} />
                <div className="flex gap-2">
                  <button onClick={async () => { await articlesApi.update(a.id, { articleNo: editNo, title: editTitle, description: editDesc }); setEditId(null); fetchArticles(); toast.success('Updated'); }}
                    className="px-3 py-1 text-xs rounded bg-green-600 text-white">Save</button>
                  <button onClick={() => setEditId(null)} className="px-3 py-1 text-xs rounded border border-gray-300">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-mono">{a.articleNo}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.description}</p>
                </div>
                <button onClick={() => { setEditId(a.id); setEditNo(a.articleNo); setEditTitle(a.title); setEditDesc(a.description); }} className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100">Edit</button>
                <button onClick={async () => { await articlesApi.delete(a.id); fetchArticles(); toast.success('Deleted'); }}
                  className="px-2 py-1 text-xs rounded text-red-600 hover:bg-red-50">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="bg-blue-50 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium text-blue-700">Add New Article</p>
        <div className="flex gap-2">
          <input value={newNo} onChange={e => setNewNo(e.target.value)} placeholder="Article No." className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm" />
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm" />
        </div>
        <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description..." className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" rows={2} />
        <button disabled={!newNo.trim() || !newTitle.trim()} onClick={() => {
          articlesApi.create({ articleNo: newNo, title: newTitle, description: newDesc }).then(() => {
            setNewNo(''); setNewTitle(''); setNewDesc(''); fetchArticles(); toast.success('Article added');
          });
        }} className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50" style={{ backgroundColor: '#0b2652' }}>Add Article</button>
      </div>
    </div>
  );
}

// Forwarding rules manager
function ForwardingManager() {
  const [rules, setRules] = useState<any[]>([]);
  const [fromRole, setFromRole] = useState('');
  const [toRole, setToRole] = useState('');
  const [resultStatus, setResultStatus] = useState('assigned');

  const allRoles = ['student', 'coordinator', 'proctor', 'assistant-proctor', 'deputy-proctor', 'registrar', 'disciplinary-committee', 'female-coordinator', 'sexual-harassment-committee', 'vc', 'super-admin'];
  const allStatuses = ['assigned', 'forwarded-to-registrar', 'forwarded-to-committee', 'verified', 'hearing-scheduled'];

  useEffect(() => { fetchRules(); }, []);
  const fetchRules = async () => {
    try { const res = await forwardingRulesApi.getAll(); setRules(res.data.data || []); } catch {}
  };

  const grouped = allRoles.reduce((acc, role) => {
    acc[role] = rules.filter((r: any) => r.fromRole === role);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Case Forwarding Rules</h3>
      <p className="text-sm text-gray-500 mb-4">Configure which roles can forward cases to which other roles.</p>

      {/* Add new rule */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <p className="text-sm font-medium text-blue-700 mb-2">Add Forwarding Rule</p>
        <div className="flex gap-2 items-end flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Role</label>
            <select value={fromRole} onChange={e => setFromRole(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
              <option value="">Select...</option>
              {allRoles.map(r => <option key={r} value={r}>{r.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Role</label>
            <select value={toRole} onChange={e => setToRole(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
              <option value="">Select...</option>
              {allRoles.map(r => <option key={r} value={r}>{r.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Result Status</label>
            <select value={resultStatus} onChange={e => setResultStatus(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
              {allStatuses.map(s => <option key={s} value={s}>{s.split('-').join(' ')}</option>)}
            </select>
          </div>
          <button disabled={!fromRole || !toRole}
            onClick={() => { forwardingRulesApi.create({ fromRole, toRole, resultStatus }).then(() => { fetchRules(); toast.success('Rule added'); setFromRole(''); setToRole(''); }).catch((e: any) => toast.error(e?.response?.data?.message || 'Failed')); }}
            className="px-4 py-1.5 rounded-lg text-white text-sm disabled:opacity-50" style={{ backgroundColor: '#0b2652' }}>Add Rule</button>
        </div>
      </div>

      {/* Rules grouped by fromRole */}
      <div className="space-y-3">
        {allRoles.filter(r => grouped[r]?.length > 0).map(role => (
          <div key={role} className="border border-gray-200 rounded-lg p-3">
            <p className="text-sm font-semibold mb-2 capitalize">{role.split('-').join(' ')}</p>
            <div className="flex flex-wrap gap-2">
              {grouped[role].map((rule: any) => (
                <div key={rule.id} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                  <span className="font-medium">&rarr; {rule.toRole.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                  <span className="text-gray-400">({rule.resultStatus})</span>
                  <button onClick={() => { forwardingRulesApi.delete(rule.id).then(() => { fetchRules(); toast.success('Removed'); }); }}
                    className="ml-1 text-red-500 hover:text-red-700">&times;</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Case Close Permission */}
      <div className="mt-6 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-1" style={{ color: '#0b2652' }}>Case Close Permission</h4>
        <p className="text-xs text-gray-500 mb-3">Which roles can close/resolve cases</p>
        <div className="flex flex-wrap gap-3">
          {allRoles.map(role => {
            const hasRule = rules.some((r: any) => r.fromRole === role && r.toRole === '__close__' && r.isActive);
            return (
              <label key={role} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={hasRule} onChange={async () => {
                  const existing = rules.find((r: any) => r.fromRole === role && r.toRole === '__close__');
                  if (existing) { await forwardingRulesApi.delete(existing.id); }
                  else { await forwardingRulesApi.create({ fromRole: role, toRole: '__close__', resultStatus: 'closed' }); }
                  fetchRules();
                }} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600" />
                <span className="text-xs text-gray-700">{role.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Hearing Schedule Permission */}
      <div className="mt-4 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-1" style={{ color: '#0b2652' }}>Hearing Schedule Permission</h4>
        <p className="text-xs text-gray-500 mb-3">Which roles can schedule hearings</p>
        <div className="flex flex-wrap gap-3">
          {allRoles.map(role => {
            const hasRule = rules.some((r: any) => r.fromRole === role && r.toRole === '__hearing__' && r.isActive);
            return (
              <label key={role} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={hasRule} onChange={async () => {
                  const existing = rules.find((r: any) => r.fromRole === role && r.toRole === '__hearing__');
                  if (existing) { await forwardingRulesApi.delete(existing.id); }
                  else { await forwardingRulesApi.create({ fromRole: role, toRole: '__hearing__', resultStatus: 'hearing-scheduled' }); }
                  fetchRules();
                }} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600" />
                <span className="text-xs text-gray-700">{role.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ChecklistManager() {
  const [items, setItems] = useState<{ id: string; label: string; order: number }[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const res = await checklistApi.getAll();
      const data = res.data.data || [];
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    await checklistApi.create({ label: newLabel.trim() });
    setNewLabel('');
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await checklistApi.delete(id);
    fetchItems();
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 max-w-2xl">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Coordinator Verification Checklist</h3>
      <p className="text-sm text-gray-500 mb-4">Configure the checklist items that coordinators see when verifying cases.</p>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {items.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No checklist items configured. Add some below.</p>
          ) : (
            items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-400 w-6">{idx + 1}.</span>
                <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                <button onClick={() => handleDelete(item.id)}
                  className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50">
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
          placeholder="New checklist item label..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
        />
        <button onClick={handleAdd} disabled={!newLabel.trim()}
          className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50"
          style={{ backgroundColor: '#0b2652' }}>
          Add
        </button>
      </div>
    </div>
  );
}

