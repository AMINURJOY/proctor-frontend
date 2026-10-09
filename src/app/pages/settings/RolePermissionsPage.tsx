import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronRight,
  ListChecks,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { rolesApi } from '../../services/api';
import { roleLabel } from '../../utils/roles';

type Flags = { create: boolean; read: boolean; update: boolean; delete: boolean; send: boolean };
type PermissionMap = Record<string, Record<string, Flags>>;
type RoleOption = { id: string; name: string };
type MenuItem = { key: string; label: string; description: string };

const emptyFlags = (): Flags => ({ create: false, read: false, update: false, delete: false, send: false });

const menuGroups: { label: string; items: MenuItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', description: 'System overview and summary information.' },
      { key: 'advanced-search', label: 'Advanced Search', description: 'Search records using advanced filters.' },
    ],
  },
  {
    label: 'Cases & incidents',
    items: [
      { key: 'submit', label: 'Submit Incident', description: 'Create and submit a new incident.' },
      { key: 'incidents', label: 'Incidents (Type-1)', description: 'Review and manage Type-1 incidents.' },
      { key: 'cases', label: 'Cases', description: 'Access and manage disciplinary cases.' },
      { key: 'my-cases', label: 'My Cases', description: 'Access cases assigned to the current user.' },
      { key: 'confidential', label: 'Confidential Cases', description: 'Access restricted and confidential cases.' },
      { key: 'hearings', label: 'Hearing Management', description: 'Organize and manage case hearings.' },
      { key: 'monitoring', label: 'VC Monitoring', description: 'Monitor cases from the VC dashboard.' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { key: 'notifications', label: 'Notifications', description: 'Access system notifications and updates.' },
      { key: 'reports', label: 'Pending Reports', description: 'Create and update investigation reports for Type-2 cases.' },
      { key: 'completed-reports', label: 'Completed Reports', description: 'View reports after they have been finalized.' },
      { key: 'registrar-reports', label: 'Registrar Reports', description: 'Review Type-3 cases awaiting Registrar action.' },
      { key: 'vc-reports', label: 'VC Reports', description: 'Review Type-3 cases awaiting VC action.' },
      { key: 'dc-reports', label: 'DC Reports', description: 'DC Chairman case and resolution review queue.' },
      { key: 'dc-member-reports', label: 'DC Members Reports', description: 'Submit individual DC Member remarks.' },
      { key: 'dcs-reports', label: 'DCS Reports', description: 'Create and forward disciplinary resolutions.' },
      { key: 'chairman-reports', label: 'Chairman Reports', description: 'Approve final disciplinary resolutions.' },
      { key: 'users', label: 'Users / Roles', description: 'Manage system users and their roles.' },
      { key: 'audit-logs', label: 'Audit Logs', description: 'View the immutable history of user and API activity.' },
      { key: 'settings', label: 'Settings', description: 'Access application configuration.' },
    ],
  },
];

const menus = menuGroups.flatMap(group => group.items);
const actions: { key: keyof Flags; label: string; description: string }[] = [
  { key: 'read', label: 'View', description: 'See this menu and view its records.' },
  { key: 'create', label: 'Create', description: 'Add new records in this area.' },
  { key: 'update', label: 'Update', description: 'Edit existing records in this area.' },
  { key: 'delete', label: 'Delete', description: 'Permanently remove records in this area.' },
  { key: 'send', label: 'Send', description: 'Forward records from this menu into the next workflow.' },
];
const actionsForMenu = (menuKey: string) => menuKey === 'audit-logs'
  ? actions.filter(action => action.key === 'read')
  : actions;

const copyPermissions = (value: PermissionMap): PermissionMap => {
  const copy: PermissionMap = {};
  for (const [role, rolePermissions] of Object.entries(value)) {
    copy[role] = {};
    for (const [menu, flags] of Object.entries(rolePermissions)) copy[role][menu] = { ...flags };
  }
  return copy;
};

const rolePermissionSignature = (permissions: PermissionMap, role: string) =>
  menus.map(menu => actionsForMenu(menu.key).map(action => permissions[role]?.[menu.key]?.[action.key] ? '1' : '0').join('')).join('|');

export default function RolePermissionsPage() {
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [savedPermissions, setSavedPermissions] = useState<PermissionMap>({});
  const [selectedRole, setSelectedRole] = useState('proctor');
  const [selectedMenuKey, setSelectedMenuKey] = useState(menus[0].key);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState(false);

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
            create: !!permission.canCreate,
            read: !!permission.canRead,
            update: !!permission.canUpdate,
            delete: !!permission.canDelete,
            send: !!permission.canSend,
          };
        }
      }

      setRoles(options);
      setPermissions(next);
      setSavedPermissions(copyPermissions(next));
      setSelectedRole(current => options.some(role => role.name === current) ? current : options[0]?.name || '');
    }).catch(() => {
      if (active) setLoadError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, []);

  const query = search.trim().toLowerCase();
  const visibleGroups = useMemo(() => menuGroups.map(group => ({
    ...group,
    items: group.items.filter(menu => !query || [menu.label, menu.description, menu.key, ...actionsForMenu(menu.key).map(action => action.label)]
      .some(value => value.toLowerCase().includes(query))),
  })).filter(group => group.items.length > 0), [query]);

  const visibleMenus = visibleGroups.flatMap(group => group.items);
  const selectedMenu = visibleMenus.find(menu => menu.key === selectedMenuKey) || visibleMenus[0] || null;
  const selectedFlags = selectedMenu ? permissions[selectedRole]?.[selectedMenu.key] || emptyFlags() : emptyFlags();
  const selectedCount = menus.reduce((count, menu) => count + actionsForMenu(menu.key).filter(action => permissions[selectedRole]?.[menu.key]?.[action.key]).length, 0);
  const permissionCount = menus.reduce((count, menu) => count + actionsForMenu(menu.key).length, 0);
  const isDirty = rolePermissionSignature(permissions, selectedRole) !== rolePermissionSignature(savedPermissions, selectedRole);

  const setFlags = (menu: string, next: Flags) => setPermissions(previous => ({
    ...previous,
    [selectedRole]: { ...previous[selectedRole], [menu]: next },
  }));

  const toggle = (menu: string, key: keyof Flags) => {
    const current = permissions[selectedRole]?.[menu] || emptyFlags();
    setFlags(menu, { ...current, [key]: !current[key] });
    setMessage('');
  };

  const discardChanges = () => {
    setPermissions(previous => ({
      ...previous,
      [selectedRole]: copyPermissions({ [selectedRole]: savedPermissions[selectedRole] || {} })[selectedRole],
    }));
    setMessage('Changes discarded.');
  };

  const changeRole = (nextRole: string) => {
    if (isDirty && !window.confirm(`Discard unsaved changes for ${roleLabel(selectedRole)}?`)) return;
    if (isDirty) {
      setPermissions(previous => ({
        ...previous,
        [selectedRole]: copyPermissions({ [selectedRole]: savedPermissions[selectedRole] || {} })[selectedRole],
      }));
    }
    setSelectedRole(nextRole);
    setMessage('');
  };

  const save = async () => {
    const role = roles.find(item => item.name === selectedRole);
    if (!role) return;
    setSaving(true);
    setMessage('');
    try {
      const payload = menus.map(menu => {
        const flags = permissions[selectedRole]?.[menu.key] || emptyFlags();
        return {
          menuKey: menu.key,
          canCreate: flags.create,
          canRead: flags.read,
          canUpdate: flags.update,
          canDelete: flags.delete,
          canSend: flags.send,
        };
      });
      await rolesApi.updatePermissions(role.id, { permissions: payload });
      setSavedPermissions(previous => ({
        ...previous,
        [selectedRole]: copyPermissions({ [selectedRole]: permissions[selectedRole] || {} })[selectedRole],
      }));
      setMessage(`Permissions saved for ${roleLabel(selectedRole)}.`);
    } catch {
      setMessage('Could not save role permissions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">Loading permissions…</div>;
  }

  if (loadError) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Could not load role permissions. Refresh the page to try again.</div>;
  }

  return <div className="space-y-4 text-slate-800">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <ShieldCheck size={22} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Permissions <span className="text-slate-400">—</span> {roleLabel(selectedRole)}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">Choose a menu, then enable only the actions this role may perform.</p>
        </div>
      </div>

      <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-600">
        Role
        <select
          value={selectedRole}
          onChange={event => changeRole(event.target.value)}
          className="min-w-48 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          {roles.map(role => <option key={role.id} value={role.name}>{roleLabel(role.name)}</option>)}
        </select>
      </label>
    </header>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-200 p-3 sm:p-4">
        <div className="mb-3 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-100">
          <ListChecks size={17} aria-hidden="true" />
          Menu permissions
        </div>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
          <span className="sr-only">Search permissions</span>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search menu, permission name, or code…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
        </label>
      </div>

      <div className="grid min-h-[440px] lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50/50 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Application menu</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">Mirrors the order of the main sidebar.</p>
          </div>
          <nav aria-label="Permission menus" className="max-h-[520px] space-y-4 overflow-y-auto p-2.5">
            {visibleGroups.map(group => <div key={group.label}>
              <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(menu => {
                  const flags = permissions[selectedRole]?.[menu.key] || emptyFlags();
                  const menuActions = actionsForMenu(menu.key);
                  const count = menuActions.filter(action => flags[action.key]).length;
                  const active = selectedMenu?.key === menu.key;
                  return <button
                    type="button"
                    key={menu.key}
                    onClick={() => setSelectedMenuKey(menu.key)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${active ? 'bg-[#173f12] text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">{menu.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] tabular-nums ${active ? 'bg-white/20 text-white' : count ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                      {count}/{menuActions.length}
                    </span>
                  </button>;
                })}
              </div>
            </div>)}
            {visibleGroups.length === 0 && <div className="px-4 py-10 text-center text-sm text-slate-500">No matching permissions.</div>}
          </nav>
        </aside>

        <div className="min-w-0">
          {selectedMenu ? <>
            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                  Menu <ChevronRight size={14} className="text-slate-400" aria-hidden="true" /> {selectedMenu.label}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{selectedMenu.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setFlags(selectedMenu.key, selectedMenu.key === 'audit-logs' ? { ...emptyFlags(), read: true } : { create: true, read: true, update: true, delete: true, send: true }); setMessage(''); }}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => { setFlags(selectedMenu.key, emptyFlags()); setMessage(''); }}
                  disabled={!Object.values(selectedFlags).some(Boolean)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear all
                </button>
              </div>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
              {actionsForMenu(selectedMenu.key).map(action => {
                const enabled = selectedFlags[action.key];
                return <button
                  type="button"
                  key={action.key}
                  onClick={() => toggle(selectedMenu.key, action.key)}
                  aria-pressed={enabled}
                  className={`group min-h-32 rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${enabled ? 'border-emerald-400 bg-emerald-50/80 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                >
                  <span className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${enabled ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                      {enabled && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">{action.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{action.description}</span>
                    </span>
                  </span>
                  <span className="mt-3 block pl-8 font-mono text-[10px] uppercase tracking-wide text-slate-400">{selectedMenu.key}.{action.label}</span>
                </button>;
              })}
            </div>
          </> : <div className="flex min-h-[360px] items-center justify-center p-8 text-center text-sm text-slate-500">Try a different search to find a permission.</div>}
        </div>
      </div>

      <footer className="flex flex-col justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-600"><strong className="font-semibold text-slate-900">{selectedCount}</strong> of {permissionCount} permissions selected</p>
          {message && <p role="status" className={`mt-0.5 text-xs ${message.startsWith('Could not') ? 'text-red-600' : 'text-emerald-700'}`}>{message}</p>}
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={discardChanges}
            disabled={!isDirty || saving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!isDirty || saving || !selectedRole}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2f5f0d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#264e0a] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            <Save size={16} aria-hidden="true" />
            {saving ? 'Saving…' : 'Save permissions'}
          </button>
        </div>
      </footer>
    </section>
  </div>;
}
