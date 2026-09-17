import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentsApi } from '../../services/api';
import { roleLabel } from '../../utils/roles';

interface StudentProfile {
  studentId: string;
  gender: string;
  cgpa: number | null;
}

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookupFailed, setLookupFailed] = useState(false);

  useEffect(() => {
    if (currentUser?.role !== 'student') {
      setStudent(null);
      setLookupFailed(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLookupFailed(false);
    setStudent(null);
    studentsApi.getMe()
      .then(res => {
        if (!cancelled) setStudent(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setLookupFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.role]);

  const isStudent = currentUser?.role === 'student';
  const gender = student?.gender || currentUser?.gender;
  const genderLabel = gender && gender !== 'unspecified'
    ? gender.charAt(0).toUpperCase() + gender.slice(1)
    : '—';

  return <div className="space-y-6">
    <header><h1 className="text-3xl text-[#0b2652]">Profile</h1><p className="text-gray-600">Account settings and preferences</p></header>
    <section className="max-w-2xl rounded-xl border border-gray-100 bg-white p-6 shadow-md">
      <h2 className="mb-4 text-lg font-semibold text-[#0b2652]">Profile Information</h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div><dt className="text-sm text-gray-500">Name</dt><dd className="font-medium text-gray-900">{currentUser?.name || '—'}</dd></div>
        <div><dt className="text-sm text-gray-500">Email</dt><dd className="break-all text-gray-900">{currentUser?.email || '—'}</dd></div>
        <div><dt className="text-sm text-gray-500">Role</dt><dd className="text-gray-900">{roleLabel(currentUser?.role)}</dd></div>
        {isStudent
          ? <div><dt className="text-sm text-gray-500">Student ID</dt><dd className="text-gray-900">{loading ? 'Loading…' : student?.studentId || '—'}</dd></div>
          : <div><dt className="text-sm text-gray-500">User ID</dt><dd className="break-all font-mono text-sm text-gray-900">{currentUser?.id || '—'}</dd></div>}
        <div><dt className="text-sm text-gray-500">Gender</dt><dd className="text-gray-900">{genderLabel}</dd></div>
        {isStudent && <div><dt className="text-sm text-gray-500">CGPA</dt><dd className="text-gray-900">{loading ? 'Loading…' : student?.cgpa == null ? '—' : Number(student.cgpa).toFixed(2)}</dd></div>}
      </dl>
      {isStudent && lookupFailed && <p className="mt-4 text-sm text-amber-700">Student details could not be loaded. Please try again later.</p>}
    </section>
  </div>;
}
