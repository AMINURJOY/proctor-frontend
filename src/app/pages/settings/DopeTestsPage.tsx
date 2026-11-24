import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { dopeTestDefinitionsApi } from '../../services/api';
import type { DopeTestDefinition } from '../../types';

const emptyForm = { name: '', isActive: true, sortOrder: 0 };

export default function DopeTestsPage() {
  const [items, setItems] = useState<DopeTestDefinition[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await dopeTestDefinitionsApi.getAll(true);
      setItems(response.data?.data || []);
    } catch (error: any) {
      toast.error('Could not load dope test names', { description: error?.response?.data?.message || '' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error('Test name is required');
    setSaving(true);
    try {
      const payload = { ...form, name: form.name.trim() };
      if (editingId) {
        await dopeTestDefinitionsApi.update(editingId, payload);
        toast.success('Dope test name updated');
      } else {
        await dopeTestDefinitionsApi.create(payload);
        toast.success('Dope test name added');
      }
      reset();
      await load();
    } catch (error: any) {
      toast.error('Could not save test name', { description: error?.response?.data?.message || '' });
    } finally {
      setSaving(false);
    }
  };

  const edit = (item: DopeTestDefinition) => {
    setEditingId(item.id);
    setForm({ name: item.name, isActive: item.isActive, sortOrder: item.sortOrder });
  };

  const remove = async (item: DopeTestDefinition) => {
    if (!window.confirm(`Delete “${item.name}”? Existing case reports will keep the recorded test name.`)) return;
    try {
      await dopeTestDefinitionsApi.delete(item.id);
      toast.success('Dope test name deleted');
      if (editingId === item.id) reset();
      await load();
    } catch (error: any) {
      toast.error('Could not delete test name', { description: error?.response?.data?.message || '' });
    }
  };

  return (
    <div className="max-w-4xl rounded-xl border border-gray-100 bg-white p-6 shadow-md">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-[#0b2652]">Dope Test Names</h3>
        <p className="mt-1 text-sm text-gray-500">Manage the test names Assistant and Deputy Proctors can select while reviewing a case.</p>
      </div>

      <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="mb-3 font-medium text-gray-800">{editingId ? 'Edit test name' : 'Add test name'}</h4>
        <div className="grid gap-3 md:grid-cols-[1fr_120px_auto] md:items-end">
          <label className="text-sm font-medium text-gray-700">Test name
            <input autoFocus value={form.name} maxLength={200} onChange={event => setForm(value => ({ ...value, name: event.target.value }))}
              placeholder="e.g. Urine drug screening" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-gray-700">Sort order
            <input type="number" value={form.sortOrder} onChange={event => setForm(value => ({ ...value, sortOrder: Number(event.target.value) || 0 }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
          </label>
          <label className="flex h-10 items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.isActive} onChange={event => setForm(value => ({ ...value, isActive: event.target.checked }))} /> Active
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {editingId && <button type="button" onClick={reset} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Cancel</button>}
          <button type="button" disabled={saving || !form.name.trim()} onClick={save}
            className="rounded-lg bg-[#0b2652] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {saving ? 'Saving…' : editingId ? 'Update' : 'Add Test Name'}
          </button>
        </div>
      </div>

      {loading ? <p className="text-sm text-gray-500">Loading…</p> : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">No test names configured yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className={`flex items-center gap-3 rounded-lg border p-3 ${item.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">{item.sortOrder}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.isActive ? 'Available for selection' : 'Inactive'}</p>
              </div>
              <button type="button" onClick={() => edit(item)} className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50">Edit</button>
              <button type="button" onClick={() => remove(item)} className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
