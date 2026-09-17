import { useEffect, useState } from 'react';
import { settingsApi } from '../../services/api';
import { roleLabel } from '../../utils/roles';

const forwardingChoices = ['proctor', 'deputy-proctor', 'assistant-proctor', 'coordinator', 'registrar'];

export default function IncidentRoutingPage() {
  const [roles, setRoles] = useState<string[]>(['proctor', 'deputy-proctor']);
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'roles' | 'number' | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([settingsApi.getByKey('type1_forwarding_roles'), settingsApi.getByKey('control_room_number')])
      .then(([routing, control]) => {
        if (!active) return;
        const value = (routing.data.data || routing.data)?.value;
        if (value) setRoles(value.split(',').map((x: string) => x.trim()).filter(Boolean));
        setNumber(((control.data.data || control.data)?.value || '').trim());
      })
      .catch(() => { if (active) setMessage('Could not load incident routing settings.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const save = async (kind: 'roles' | 'number') => {
    setSaving(kind);
    setMessage('');
    try {
      if (kind === 'number') await settingsApi.update('control_room_number', number.trim());
      else await settingsApi.update('type1_forwarding_roles', roles.join(','));
      setMessage(kind === 'number' ? 'Control Room number saved.' : 'Incident routing saved.');
    } catch { setMessage('Could not save settings.'); }
    finally { setSaving(null); }
  };

  return <div className="max-w-3xl space-y-6">
    <header><h1 className="text-3xl text-[#0b2652]">Incident Routing</h1><p className="text-gray-600">Configure Type-1 incident contacts and forwarding.</p></header>
    {loading ? <p className="text-sm text-gray-500">Loading settings…</p> : <>
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-[#0b2652]">24/7 Control Room Number</h2>
        <p className="mb-4 text-sm text-gray-500">Included in acknowledgments for Fast (Type-1) incidents.</p>
        <input type="tel" value={number} onChange={e => setNumber(e.target.value)} placeholder="+880 1XXX XXXXXX" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        <p className="mt-2 text-xs text-gray-500">Leave blank to omit the contact line.</p>
        <button onClick={() => save('number')} disabled={saving !== null} className="mt-4 rounded-lg bg-[#0b2652] px-4 py-2 text-sm text-white disabled:opacity-50">{saving === 'number' ? 'Saving…' : 'Save Number'}</button>
      </section>
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-[#0b2652]">Type-1 Incident Forwarding</h2>
        <p className="mb-4 text-sm text-gray-500">Select the roles that receive new instant incidents.</p>
        <div className="space-y-2">{forwardingChoices.map(role => <label key={role} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm">
          <input type="checkbox" checked={roles.includes(role)} onChange={() => setRoles(prev => prev.includes(role) ? prev.filter(x => x !== role) : [...prev, role])} />{roleLabel(role)}
        </label>)}</div>
        <p className="mt-3 text-sm text-gray-600">Preview: {roles.map(roleLabel).join(' / ') || 'No roles selected'}</p>
        <button onClick={() => save('roles')} disabled={saving !== null || roles.length === 0} className="mt-4 rounded-lg bg-[#0b2652] px-4 py-2 text-sm text-white disabled:opacity-50">{saving === 'roles' ? 'Saving…' : 'Save Routing'}</button>
      </section>
    </>}
    {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
  </div>;
}
