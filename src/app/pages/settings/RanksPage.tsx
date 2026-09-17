import { useEffect, useState } from 'react';
import { ranksApi } from '../../services/api';
import { toast } from 'sonner';

export default function RanksPage() {
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
