import { useState, useEffect } from 'react';
import { studentsApi } from '../services/api';
import { SearchIcon, PlusIcon } from '../components/Icons';
import { toast } from 'sonner';

interface Student {
  id: string;
  studentId: string;
  name: string;
  department?: string;
  contact?: string;
  email?: string;
  gender: string;
  advisorName?: string;
  fatherName?: string;
  fatherContact?: string;
  guardianContact?: string;
  isActive: boolean;
}

const emptyForm = { studentId: '', name: '', department: '', contact: '', email: '', gender: 'male', fatherName: '', fatherContact: '', advisorName: '' };

const genderBadge = (g: string) => {
  const v = (g || '').toLowerCase();
  if (v === 'female') return 'bg-pink-100 text-pink-700';
  if (v === 'male') return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 text-gray-600';
};

export default function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await studentsApi.getAll();
      setStudents(res.data.data || []);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.studentId.trim() || !form.name.trim()) {
      toast.error('Student ID and name are required');
      return;
    }
    setSaving(true);
    try {
      await studentsApi.create(form);
      toast.success('Student added');
      setForm(emptyForm);
      setShowNew(false);
      await load();
    } catch (err: any) {
      toast.error('Failed to add student', { description: err?.response?.data?.message || '' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return !q ||
      s.studentId.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>Students</h1>
          <p className="text-gray-600">Student directory ({students.length})</p>
        </div>
        <button
          onClick={() => setShowNew(s => !s)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: '#0b2652' }}
        >
          <PlusIcon /> Add Student
        </button>
      </div>

      {showNew && (
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 mb-6">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#0b2652' }}>New Student</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input placeholder="Student ID *" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input placeholder="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="unspecified">Unspecified</option>
            </select>
            <input placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input placeholder="Contact / Phone" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input placeholder="Father's Name" value={form.fatherName} onChange={e => setForm({ ...form, fatherName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input placeholder="Father's Contact" value={form.fatherContact} onChange={e => setForm({ ...form, fatherContact: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input placeholder="Advisor Name" value={form.advisorName} onChange={e => setForm({ ...form, advisorName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => { setShowNew(false); setForm(emptyForm); }} className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50" style={{ backgroundColor: '#0b2652' }}>{saving ? 'Saving…' : 'Add Student'}</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ID, name or department…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No students found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Gender</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Father</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">{s.studentId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs capitalize ${genderBadge(s.gender)}`}>{s.gender}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.department || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.contact || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.fatherName ? `${s.fatherName}${s.fatherContact ? ` (${s.fatherContact})` : ''}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
