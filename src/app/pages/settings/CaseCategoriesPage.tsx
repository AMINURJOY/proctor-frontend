import { useEffect, useState } from 'react';
import { caseCategoriesApi, caseSubjectsApi } from '../../services/api';
import { toast } from 'sonner';
import { roleLabel } from '../../utils/roles';

export default function CaseCategoriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', isConfidential: false, isActive: true,
    appliesToType: 'both', sortOrder: 0, subjectId: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [catRes, subRes] = await Promise.all([
        caseCategoriesApi.getAll(true),
        caseSubjectsApi.getAll(true),
      ]);
      setItems(catRes.data?.data || []);
      setSubjects(subRes.data?.data || []);
    } catch (err: any) {
      toast.error('Failed to load categories', { description: err?.response?.data?.message || '' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const subjectName = (id?: string) => subjects.find(s => String(s.id) === String(id))?.subject;

  const resetForm = () => {
    setForm({ name: '', description: '', isConfidential: false, isActive: true, appliesToType: 'both', sortOrder: 0, subjectId: '' });
    setEditingId(null);
    setShowNew(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      if (editingId) {
        await caseCategoriesApi.update(editingId, form);
        toast.success('Category updated');
      } else {
        await caseCategoriesApi.create(form);
        toast.success('Category created');
      }
      resetForm();
      await load();
    } catch (err: any) {
      toast.error('Save failed', { description: err?.response?.data?.message || '' });
    }
  };

  const startEdit = (item: any) => {
    setForm({
      name: item.name,
      description: item.description || '',
      isConfidential: !!item.isConfidential,
      isActive: !!item.isActive,
      appliesToType: item.appliesToType || 'both',
      sortOrder: item.sortOrder || 0,
      subjectId: item.subjectId || ''
    });
    setEditingId(item.id);
    setShowNew(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deactivate this category? (Existing cases referencing it will not be affected.)')) return;
    try {
      await caseCategoriesApi.delete(id);
      toast.success('Category deactivated');
      await load();
    } catch (err: any) {
      toast.error('Delete failed', { description: err?.response?.data?.message || '' });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: '#0b2652' }}>Case Categories</h3>
          <p className="text-sm text-gray-500">Manage the categories students choose when filing a Type-2 case. Categories marked Confidential auto-route the case privately.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowNew(true); }}
          className="px-3 py-2 rounded-lg text-white text-sm hover:opacity-90"
          style={{ backgroundColor: '#0b2652' }}
        >
          + New Category
        </button>
      </div>

      {showNew && (
        <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
          <h4 className="font-medium mb-3">{editingId ? 'Edit Category' : 'New Category'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Applies To</label>
              <select value={form.appliesToType} onChange={e => setForm({ ...form, appliesToType: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
                <option value="both">Both Type-1 and Type-2</option>
                <option value="type-1">Type-1 only</option>
                <option value="type-2">Type-2 only</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Subject</label>
              <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm">
                <option value="">— No subject (won't appear under any subject on the Type-2 form) —</option>
                {subjects.map((s: any) => (<option key={s.id} value={s.id}>{s.subject}</option>))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Maps this category under a subject. On the Type-2 form the student picks the subject first, then only its mapped categories appear.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value || '0', 10) })}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
            </div>
            <div className="flex items-center gap-4 mt-5">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isConfidential}
                  onChange={e => setForm({ ...form, isConfidential: e.target.checked })} />
                Confidential
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                Active
              </label>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={resetForm} className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-white">
              Cancel
            </button>
            <button onClick={handleSave}
              className="px-3 py-1.5 text-sm rounded text-white"
              style={{ backgroundColor: '#0b2652' }}>
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No categories yet. Add one to enable the category dropdown for Type-2 case submissions.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${!item.isActive ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
              <div>
                <p className="font-medium text-sm">
                  {item.name}
                  {item.isConfidential && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">
                      Confidential
                    </span>
                  )}
                  {!item.isActive && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700">
                      Inactive
                    </span>
                  )}
                </p>
                {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                <p className="text-xs text-gray-400">
                  Applies to: {roleLabel(item.appliesToType)} · Order {item.sortOrder}
                  {subjectName(item.subjectId) ? ` · Subject: ${subjectName(item.subjectId)}` : ' · No subject'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(item)}
                  className="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50">
                  Edit
                </button>
                {item.isActive && (
                  <button onClick={() => handleDelete(item.id)}
                    className="px-3 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50">
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
