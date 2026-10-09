import { useEffect, useMemo, useState } from 'react';
import { forwardingRulesApi } from '../../services/api';
import { toast } from 'sonner';
import { roleLabel } from '../../utils/roles';

type PermissionType = 'type-1' | 'type-2';
type ForwardingRule = {
  id: string;
  fromRole: string;
  toRole: string;
  appliesToType: PermissionType;
  resultStatus?: string;
  isActive: boolean;
};

const staffRoles = [
  'coordinator', 'female-coordinator', 'proctor', 'assistant-proctor',
  'deputy-proctor', 'registrar', 'disciplinary-committee',
  'sexual-harassment-committee', 'vc', 'super-admin',
];

const permissionGroups = [
  { key: '__assign__', title: 'Assign case', description: 'Show the Assign Handlers action for this case type.', status: 'assigned' },
  { key: '__close__', title: 'Close case', description: 'Allow the role to close or resolve this case type.', status: 'closed' },
  { key: '__hearing__', title: 'Schedule hearing', description: 'Show hearing scheduling actions for this case type.', status: 'hearing-scheduled' },
  { key: '__draft_report__', title: 'Create draft report', description: 'Optional case-type grant for roles without global Pending Reports → Create permission.', status: 'draft-report' },
] as const;

export default function ForwardingPage() {
  const [rules, setRules] = useState<ForwardingRule[]>([]);
  const [selectedType, setSelectedType] = useState<PermissionType>('type-1');
  const [fromRole, setFromRole] = useState('');
  const [toRole, setToRole] = useState('');
  const [resultStatus, setResultStatus] = useState('assigned');
  const [saving, setSaving] = useState<string | null>(null);
  const allStatuses = ['assigned', 'forwarded-to-registrar', 'forwarded-to-committee', 'verified', 'hearing-scheduled'];

  const fetchRules = async () => {
    try {
      const res = await forwardingRulesApi.getAll();
      setRules(res.data.data || []);
    } catch {
      toast.error('Failed to load forwarding settings');
    }
  };

  useEffect(() => { fetchRules(); }, []);

  const forwardingRules = useMemo(
    () => rules.filter(rule => !rule.toRole.startsWith('__') && rule.appliesToType === selectedType),
    [rules, selectedType],
  );

  const grouped = useMemo(() => staffRoles.reduce((acc, role) => {
    acc[role] = forwardingRules.filter(rule => rule.fromRole === role);
    return acc;
  }, {} as Record<string, ForwardingRule[]>), [forwardingRules]);

  const togglePermission = async (role: string, key: string, result: string) => {
    const operationKey = `${selectedType}:${role}:${key}`;
    const existing = rules.find(rule =>
      rule.fromRole === role && rule.toRole === key && rule.appliesToType === selectedType,
    );

    setSaving(operationKey);
    try {
      if (existing) await forwardingRulesApi.delete(existing.id);
      else await forwardingRulesApi.create({ fromRole: role, toRole: key, resultStatus: result, appliesToType: selectedType });
      await fetchRules();
      toast.success(existing ? 'Permission removed' : 'Permission granted');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not update permission');
    } finally {
      setSaving(null);
    }
  };

  const addForwardingRule = async () => {
    try {
      await forwardingRulesApi.create({ fromRole, toRole, resultStatus, appliesToType: selectedType });
      await fetchRules();
      setFromRole('');
      setToRole('');
      toast.success('Forwarding rule added');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not add forwarding rule');
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold" style={{ color: '#0b2652' }}>Case Actions &amp; Forwarding</h3>
        <p className="mt-1 text-sm text-gray-500">Configure each case type independently so users only see actions that apply to that workflow.</p>

        <div className="mt-5 inline-flex rounded-lg bg-gray-100 p-1" role="tablist" aria-label="Case type">
          {(['type-1', 'type-2'] as PermissionType[]).map(type => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={selectedType === type}
              onClick={() => setSelectedType(type)}
              className={`rounded-md px-5 py-2 text-sm font-medium transition ${selectedType === type ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              {type === 'type-1' ? 'Type-1 Incident' : 'Type-2 Case'}
            </button>
          ))}
        </div>

        {selectedType === 'type-1' && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Initial delivery and notifications still follow the Type-1 Incident Forwarding page. The controls below decide which actions each role can take afterward.
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900">Action permissions</h4>
          <p className="text-sm text-gray-500">Changes apply only to {selectedType === 'type-1' ? 'Type-1 incidents' : 'Type-2 and confidential cases'}.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {permissionGroups.map(permission => (
            <section key={permission.key} className="rounded-xl border border-gray-200 p-4">
              <h5 className="text-sm font-semibold text-gray-900">{permission.title}</h5>
              <p className="mb-4 mt-1 text-xs text-gray-500">{permission.description}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {staffRoles.map(role => {
                  const operationKey = `${selectedType}:${role}:${permission.key}`;
                  const alwaysEnabled = role === 'super-admin';
                  const checked = alwaysEnabled || rules.some(rule =>
                    rule.fromRole === role && rule.toRole === permission.key
                    && rule.appliesToType === selectedType && rule.isActive,
                  );
                  return (
                    <label key={role} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${checked ? 'border-blue-200 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-700'} ${alwaysEnabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={alwaysEnabled || saving === operationKey}
                        onChange={() => togglePermission(role, permission.key, permission.status)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      <span>{roleLabel(role)}</span>
                      {alwaysEnabled && <span className="ml-auto text-[10px] text-gray-500">Always</span>}
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {selectedType === 'type-2' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900">Role-to-role forwarding</h4>
            <p className="text-sm text-gray-500">Type-2 and confidential cases use these destinations. Type-1 initial routing is managed on its dedicated page.</p>
          </div>

          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <SelectField label="From role" value={fromRole} onChange={setFromRole} options={staffRoles} roleOptions />
              <SelectField label="To role" value={toRole} onChange={setToRole} options={staffRoles} roleOptions />
              <SelectField label="Result status" value={resultStatus} onChange={setResultStatus} options={allStatuses} />
              <button type="button" disabled={!fromRole || !toRole} onClick={addForwardingRule} className="rounded-lg bg-[#0b2652] px-4 py-2 text-sm font-medium text-white disabled:opacity-40">Add rule</button>
            </div>
          </div>

          <div className="space-y-3">
            {staffRoles.filter(role => grouped[role]?.length).map(role => (
              <section key={role} className="rounded-lg border border-gray-200 p-3">
                <p className="mb-2 text-sm font-semibold text-gray-900">{roleLabel(role)}</p>
                <div className="flex flex-wrap gap-2">
                  {grouped[role].map(rule => (
                    <div key={rule.id} className="flex items-center gap-2 rounded-full bg-gray-100 py-1 pl-3 pr-2 text-xs text-gray-700">
                      <span>→ {roleLabel(rule.toRole)}</span>
                      <span className="text-gray-400">{rule.resultStatus?.replaceAll('-', ' ')}</span>
                      <button type="button" aria-label={`Remove forwarding rule to ${roleLabel(rule.toRole)}`} onClick={async () => { await forwardingRulesApi.delete(rule.id); await fetchRules(); toast.success('Forwarding rule removed'); }} className="flex h-5 w-5 items-center justify-center rounded-full text-red-500 hover:bg-red-100">×</button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {forwardingRules.length === 0 && <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">No Type-2 forwarding rules configured.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options, roleOptions = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  roleOptions?: boolean;
}) {
  return (
    <label className="block min-w-48">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
        <option value="">Select…</option>
        {options.map(option => <option key={option} value={option}>{roleOptions ? roleLabel(option) : option.replaceAll('-', ' ')}</option>)}
      </select>
    </label>
  );
}
