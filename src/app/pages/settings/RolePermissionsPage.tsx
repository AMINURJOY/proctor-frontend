import { useEffect, useState } from 'react';
import { rolesApi } from '../../services/api';
import { roleLabel } from '../../utils/roles';

type Flags = { create: boolean; read: boolean; update: boolean; delete: boolean };
type PermissionMap = Record<string, Record<string, Flags>>;
type RoleOption = { id: string; name: string };
const emptyFlags = (): Flags => ({ create: false, read: false, update: false, delete: false });
const menus: { key: string; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' }, { key: 'advanced-search', label: 'Advanced Search' },
  { key: 'submit', label: 'Submit Incident' }, { key: 'incidents', label: 'Incidents (Type-1)' },
  { key: 'cases', label: 'Cases' }, { key: 'hearings', label: 'Hearing Management' },
  { key: 'confidential', label: 'Confidential Cases' }, { key: 'monitoring', label: 'VC Monitoring' },
  { key: 'my-cases', label: 'My Cases' }, { key: 'notifications', label: 'Notifications' },
  { key: 'reports', label: 'Reports' }, { key: 'users', label: 'Users / Roles' },
  { key: 'settings', label: 'Settings' },
];
const actions: { key: keyof Flags; label: string; description: string }[] = [
  { key: 'read', label: 'View', description: 'Visible in sidebar' },
  { key: 'create', label: 'Create', description: 'Add new records' },
  { key: 'update', label: 'Update', description: 'Edit existing records' },
  { key: 'delete', label: 'Delete', description: 'Remove records' },
];

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [selectedRole, setSelectedRole] = useState('proctor');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    rolesApi.getAll().then(res => {
      if (!active) return;
      const rows = res.data.data || res.data;
      if (!Array.isArray(rows)) throw new Error('Unexpected role response');
      const next: PermissionMap = {};
      const options: RoleOption[] = [];
      for (const row of rows) {
        const name = row.roleName || row.name;
        if (name === 'super-admin' || name === 'external') continue;
        options.push({ id: row.id, name });
        next[name] = {};
        for (const permission of row.menuPermissions || []) {
          next[name][permission.menuKey] = {
            create: !!permission.canCreate, read: !!permission.canRead,
            update: !!permission.canUpdate, delete: !!permission.canDelete
          };
        }
      }
      setRoles(options);
      setPermissions(next);
      if (!options.some(role => role.name === selectedRole)) setSelectedRole(options[0]?.name || '');
    }).catch(() => { if (active) setMessage('Could not load role permissions.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const setFlags = (menu: string, next: Flags) => setPermissions(prev => ({ ...prev,
    [selectedRole]: { ...prev[selectedRole], [menu]: next }
  }));
  const toggle = (menu: string, key: keyof Flags) => {
    const current = permissions[selectedRole]?.[menu] || emptyFlags();
    setFlags(menu, { ...current, [key]: !current[key] });
  };
  const save = async () => {
    const role = roles.find(x => x.name === selectedRole);
    if (!role) return;
    setSaving(true);
    setMessage('');
    try {
      const payload = menus.map(menu => {
        const flags = permissions[selectedRole]?.[menu.key] || emptyFlags();
        return { menuKey: menu.key, canCreate: flags.create, canRead: flags.read,
          canUpdate: flags.update, canDelete: flags.delete };
      });
      await rolesApi.updatePermissions(role.id, { permissions: payload });
      setMessage(`Permissions saved for ${roleLabel(selectedRole)}.`);
    } catch { setMessage('Could not save role permissions.'); }
    finally { setSaving(false); }
  };
  const visibleMenus = menus.filter(menu => menu.label.toLowerCase().includes(search.toLowerCase()));
  const selectedCount = menus.reduce((count, menu) => count + actions.filter(action => permissions[selectedRole]?.[menu.key]?.[action.key]).length, 0);

  return <div className="space-y-6">
    <header><h1 className="text-3xl text-[#0b2652]">Roles & Permissions</h1><p className="text-gray-600">Manage menu access and actions for each role.</p></header>
    {loading ? <p className="text-sm text-gray-500">Loading permissions…</p> : <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <section className="h-fit rounded-xl border border-gray-100 bg-white p-5 shadow-md">
        <label className="mb-1 block text-sm font-medium text-gray-700">Select role</label>
        <select value={selectedRole} onChange={e => { setSelectedRole(e.target.value); setMessage(''); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {roles.map(role => <option key={role.id} value={role.name}>{roleLabel(role.name)}</option>)}
        </select>
        <p className="mt-2 text-xs text-gray-500">Roles are system-defined.</p>
        <button onClick={save} disabled={saving || !selectedRole} className="mt-5 w-full rounded-lg bg-[#0b7a4b] px-4 py-3 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Update Role'}</button>
        {message && <p role="status" className="mt-3 text-sm text-gray-700">{message}</p>}
      </section>
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-md">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-[#0b2652]">Assign Permissions</h2><p className="text-sm text-gray-500">{roleLabel(selectedRole)}</p></div><span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">{selectedCount} selected</span></div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search permissions…" className="my-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">{visibleMenus.map(menu => {
          const flags = permissions[selectedRole]?.[menu.key] || emptyFlags();
          return <div key={menu.key} className="rounded-lg border border-gray-200 p-3">
            <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{menu.label}</h3><div className="flex gap-3 text-xs"><button onClick={() => setFlags(menu.key, { create: true, read: true, update: true, delete: true })} className="text-green-700">Select All</button><button onClick={() => setFlags(menu.key, emptyFlags())} className="text-gray-600">Clear</button></div></div>
            <div className="grid gap-2 sm:grid-cols-2">{actions.map(action => <button key={action.key} onClick={() => toggle(menu.key, action.key)} aria-pressed={flags[action.key]} className={`rounded-lg border p-3 text-left text-sm ${flags[action.key] ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}><strong className="block">{action.label}</strong><span className="text-xs text-gray-500">{action.description}</span></button>)}</div>
          </div>;
        })}{visibleMenus.length === 0 && <p className="py-6 text-center text-sm text-gray-500">No matching permissions.</p>}</div>
      </section>
    </div>}
  </div>;
}
