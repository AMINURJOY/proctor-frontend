import { useEffect, useState } from 'react';
import { settingsApi } from '../../services/api';
import { roleLabel } from '../../utils/roles';

type CaseTrack = 'type1' | 'type2' | 'confidential';
const tracks: { key: CaseTrack; label: string; setting: string }[] = [
  { key: 'type1', label: 'Type-1 (Instant Incidents)', setting: 'case_viewing_type1' },
  { key: 'type2', label: 'Type-2 (Formal Cases)', setting: 'case_viewing_type2' },
  { key: 'confidential', label: 'Confidential Cases', setting: 'case_viewing_confidential' },
];
const roles = ['student', 'coordinator', 'proctor', 'assistant-proctor', 'deputy-proctor', 'registrar', 'disciplinary-committee', 'female-coordinator', 'sexual-harassment-committee', 'vc', 'super-admin'];

export default function CaseViewingPage() {
  const [viewers, setViewers] = useState<Record<CaseTrack, string[]>>({ type1: [], type2: [], confidential: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    settingsApi.getByCategory('case_viewing').then(res => {
      if (!active) return;
      const rows = res.data.data || res.data;
      if (!Array.isArray(rows)) return;
      setViewers(prev => {
        const next = { ...prev };
        for (const track of tracks) {
          const value = rows.find((row: any) => row.key === track.setting)?.value;
          if (typeof value === 'string') next[track.key] = value.split(',').map((x: string) => x.trim()).filter(Boolean);
        }
        return next;
      });
    }).catch(() => { if (active) setMessage('Could not load case viewing settings.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const toggle = (track: CaseTrack, role: string) => setViewers(prev => ({ ...prev,
    [track]: prev[track].includes(role) ? prev[track].filter(x => x !== role) : [...prev[track], role]
  }));
  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      await Promise.all(tracks.map(track => settingsApi.update(track.setting, viewers[track.key].join(','))));
      setMessage('Case viewing settings saved.');
    } catch { setMessage('Could not save case viewing settings.'); }
    finally { setSaving(false); }
  };

  return <div className="max-w-4xl space-y-6">
    <header><h1 className="text-3xl text-[#0b2652]">Case Viewing</h1><p className="text-gray-600">Choose which roles can view each case track.</p></header>
    {loading ? <p className="text-sm text-gray-500">Loading settings…</p> : <>
      {tracks.map(track => <section key={track.key} className="rounded-xl border border-gray-100 bg-white p-6 shadow-md">
        <h2 className="mb-3 text-lg font-semibold text-[#0b2652]">{track.label}</h2>
        <div className="grid gap-3 sm:grid-cols-2">{roles.map(role => <label key={role} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm">
          <input type="checkbox" checked={viewers[track.key].includes(role)} onChange={() => toggle(track.key, role)} />{roleLabel(role)}
        </label>)}</div>
      </section>)}
      <button onClick={save} disabled={saving} className="rounded-lg bg-[#0b2652] px-4 py-2 text-sm text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Case Viewing Settings'}</button>
    </>}
    {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
  </div>;
}
