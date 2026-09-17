import { useEffect, useState } from 'react';
import { checklistApi } from '../../services/api';

export default function ChecklistPage() {
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
