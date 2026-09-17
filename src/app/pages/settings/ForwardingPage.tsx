import { useEffect, useState } from 'react';
import { forwardingRulesApi } from '../../services/api';
import { toast } from 'sonner';
import { roleLabel } from '../../utils/roles';

export default function ForwardingPage() {
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
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Case Forwarding Rules &amp; Permissions</h3>
      <p className="text-sm text-gray-500 mb-4">
        These rules are the forwarding permissions. Each rule (<span className="font-medium">From role → To role</span>)
        grants that role the ability to forward cases — every active member of the allowed target roles
        will appear in that role's unified <span className="font-medium">Forward</span> dropdown on the case screen.
      </p>

      {/* Add new rule */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <p className="text-sm font-medium text-blue-700 mb-2">Add Forwarding Rule</p>
        <div className="flex gap-2 items-end flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From Role</label>
            <select value={fromRole} onChange={e => setFromRole(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
              <option value="">Select...</option>
              {allRoles.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To Role</label>
            <select value={toRole} onChange={e => setToRole(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
              <option value="">Select...</option>
              {allRoles.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
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
                  <span className="font-medium">&rarr; {roleLabel(rule.toRole)}</span>
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
                <span className="text-xs text-gray-700">{roleLabel(role)}</span>
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
                <span className="text-xs text-gray-700">{roleLabel(role)}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Draft Report Permission */}
      <div className="mt-4 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-1" style={{ color: '#0b2652' }}>Draft Report Permission</h4>
        <p className="text-xs text-gray-500 mb-3">Which roles can create draft reports for cases (a <span className="font-medium">Draft Report</span> button appears on the case for these roles)</p>
        <div className="flex flex-wrap gap-3">
          {allRoles.map(role => {
            const hasRule = rules.some((r: any) => r.fromRole === role && r.toRole === '__draft_report__' && r.isActive);
            return (
              <label key={role} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={hasRule} onChange={async () => {
                  const existing = rules.find((r: any) => r.fromRole === role && r.toRole === '__draft_report__');
                  if (existing) { await forwardingRulesApi.delete(existing.id); }
                  else { await forwardingRulesApi.create({ fromRole: role, toRole: '__draft_report__', resultStatus: 'draft-report' }); }
                  fetchRules();
                }} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600" />
                <span className="text-xs text-gray-700">{roleLabel(role)}</span>
              </label>
            );
          })}
        </div>
      </div>

    </div>
  );
}
