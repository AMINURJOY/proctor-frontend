import { useEffect, useState } from 'react';
import { caseSubjectsApi } from '../../services/api';
import { toast } from 'sonner';

export default function CaseSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => { fetchSubjects(); }, []);
  const fetchSubjects = async () => {
    try { const res = await caseSubjectsApi.getAll(true); setSubjects(res.data.data || []); } catch {}
  };

  const handleCreate = () => {
    if (!newSubject.trim()) return;
    caseSubjectsApi.create({ subject: newSubject.trim(), order: subjects.length })
      .then(() => { setNewSubject(''); fetchSubjects(); toast.success('Subject added'); })
      .catch((e: any) => toast.error(e?.response?.data?.message || 'Failed'));
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 max-w-2xl">
      <h3 className="text-lg font-semibold mb-1" style={{ color: '#0b2652' }}>Case Subjects</h3>
      <p className="text-sm text-gray-500 mb-4">Predefined subjects suggested to students on the Type-2 "Case Subject" field as they type.</p>
      <div className="space-y-2 mb-4">
        {subjects.length === 0 ? (
          <p className="text-gray-400 text-sm py-2">No subjects yet. Add some below.</p>
        ) : subjects.map((s: any) => (
          <div key={s.id} className={`flex items-center gap-2 p-3 rounded-lg ${s.isActive ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}>
            {editId === s.id ? (
              <>
                <input value={editValue} onChange={e => setEditValue(e.target.value)} className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" />
                <button onClick={async () => { await caseSubjectsApi.update(s.id, { subject: editValue }); setEditId(null); fetchSubjects(); toast.success('Updated'); }}
                  className="px-3 py-1 text-xs rounded bg-green-600 text-white">Save</button>
                <button onClick={() => setEditId(null)} className="px-3 py-1 text-xs rounded border border-gray-300">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{s.subject}</span>
                <button onClick={async () => { await caseSubjectsApi.update(s.id, { isActive: !s.isActive }); fetchSubjects(); }}
                  className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100">{s.isActive ? 'Disable' : 'Enable'}</button>
                <button onClick={() => { setEditId(s.id); setEditValue(s.subject); }} className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100">Edit</button>
                <button onClick={async () => { await caseSubjectsApi.delete(s.id); fetchSubjects(); toast.success('Deleted'); }}
                  className="px-3 py-1 text-xs rounded text-red-600 hover:bg-red-50">Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="New case subject..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }} />
        <button disabled={!newSubject.trim()} onClick={handleCreate}
          className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50" style={{ backgroundColor: '#0b2652' }}>Add</button>
      </div>
    </div>
  );
}
