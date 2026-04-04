import { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { EyeIcon, LockIcon } from '../components/Icons';
import { Case, CaseStatus, Priority } from '../types';
import { dashboardApi, casesApi } from '../services/api';

export default function VCMonitoring() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, casesRes] = await Promise.allSettled([
          dashboardApi.getStats(),
          casesApi.getAll(),
        ]);
        if (casesRes.status === 'fulfilled') {
          setCases(casesRes.value.data.data?.items || []);
        }
      } catch {
        // API unavailable - empty state shown
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (currentUser?.role !== 'vc' && currentUser?.role !== 'super-admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white rounded-xl shadow-md p-10 border border-gray-100 max-w-md">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-yellow-100">
            <LockIcon />
          </div>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: '#0b2652' }}>VC Access Only</h2>
          <p className="text-gray-600">This monitoring dashboard is only accessible to the Vice Chancellor.</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<CaseStatus, string> = {
    'submitted': 'bg-blue-100 text-blue-700',
    'pending': 'bg-yellow-100 text-yellow-700',
    'under-review': 'bg-indigo-100 text-indigo-700',
    'verified': 'bg-cyan-100 text-cyan-700',
    'assigned': 'bg-purple-100 text-purple-700',
    'hearing-scheduled': 'bg-orange-100 text-orange-700',
    'hearing-completed': 'bg-teal-100 text-teal-700',
    'resolved': 'bg-green-100 text-green-700',
    'closed': 'bg-gray-100 text-gray-700',
    'rejected': 'bg-red-100 text-red-700',
    'on-hold': 'bg-amber-100 text-amber-700'
  };

  // Analytics data
  const totalCases = cases.length;
  const activeCases = cases.filter(c => !['closed', 'resolved', 'rejected'].includes(c.status)).length;
  const resolvedCases = cases.filter(c => c.status === 'closed' || c.status === 'resolved').length;
  const confidentialCount = cases.filter(c => c.type === 'confidential').length;

  const statusDistribution = [
    { name: 'Submitted', value: cases.filter(c => c.status === 'submitted').length, color: '#3b82f6' },
    { name: 'Under Review', value: cases.filter(c => c.status === 'under-review').length, color: '#4f46e5' },
    { name: 'Verified', value: cases.filter(c => c.status === 'verified').length, color: '#06b6d4' },
    { name: 'Hearing Scheduled', value: cases.filter(c => c.status === 'hearing-scheduled').length, color: '#f97316' },
    { name: 'On Hold', value: cases.filter(c => c.status === 'on-hold').length, color: '#f59e0b' },
    { name: 'Closed', value: cases.filter(c => c.status === 'closed' || c.status === 'resolved').length, color: '#16a34a' },
    { name: 'Rejected', value: cases.filter(c => c.status === 'rejected').length, color: '#dc2626' },
  ].filter(s => s.value > 0);

  const rolePerformance = [
    { role: 'Coordinator', handled: 8, avgDays: 1.5 },
    { role: 'Proctor', handled: 6, avgDays: 2.0 },
    { role: 'Asst. Proctor', handled: 5, avgDays: 5.0 },
    { role: 'Deputy Proctor', handled: 4, avgDays: 3.5 },
    { role: 'Registrar', handled: 2, avgDays: 4.0 },
    { role: 'DC', handled: 1, avgDays: 7.0 },
  ];

  const monthlyTrend = [
    { month: 'Jan', submitted: 3, resolved: 1 },
    { month: 'Feb', submitted: 4, resolved: 2 },
    { month: 'Mar', submitted: 6, resolved: 3 },
    { month: 'Apr', submitted: 3, resolved: 1 },
  ];

  const priorityDistribution = [
    { name: 'Low', value: cases.filter(c => c.priority === 'low').length, color: '#64748b' },
    { name: 'Medium', value: cases.filter(c => c.priority === 'medium').length, color: '#3b82f6' },
    { name: 'High', value: cases.filter(c => c.priority === 'high').length, color: '#f97316' },
    { name: 'Urgent', value: cases.filter(c => c.priority === 'urgent').length, color: '#dc2626' },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl" style={{ color: '#0b2652' }}>Monitoring Dashboard</h1>
          <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">Read Only</span>
        </div>
        <p className="text-gray-600">Vice Chancellor - Complete case oversight and analytics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Cases', value: totalCases, color: '#0b2652', bg: '#e0e7ff' },
          { label: 'Active Cases', value: activeCases, color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Resolved/Closed', value: resolvedCases, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Confidential', value: confidentialCount, color: '#dc2626', bg: '#fee2e2' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: stat.bg }}>
              <span className="text-lg font-bold" style={{ color: stat.color }}>#</span>
            </div>
            <h3 className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Case Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={90}
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="submitted" stroke="#3b82f6" strokeWidth={2} name="Submitted" />
              <Line type="monotone" dataKey="resolved" stroke="#16a34a" strokeWidth={2} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Role Performance */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Role-wise Performance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rolePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="role" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="handled" fill="#0b2652" name="Cases Handled" />
              <Bar dataKey="avgDays" fill="#f59e0b" name="Avg. Days" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={priorityDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                label={({ name, value }) => `${name}: ${value}`}
                dataKey="value"
              >
                {priorityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Cases Table (Read-only) */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold" style={{ color: '#0b2652' }}>All Cases Overview</h3>
          <p className="text-sm text-gray-500">Read-only view of all cases in the system</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200" style={{ backgroundColor: '#f5f7fb' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Case</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cases.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{c.caseNumber}</span>
                      {c.type === 'confidential' && <LockIcon />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{c.studentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      c.type === 'type-1' ? 'bg-blue-100 text-blue-700' :
                      c.type === 'type-2' ? 'bg-purple-100 text-purple-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {c.type === 'type-1' ? 'Type-1' : c.type === 'type-2' ? 'Type-2' : 'Confidential'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[c.status]}`}>
                      {c.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      c.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      c.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      c.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {c.priority.charAt(0).toUpperCase() + c.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.assignedTo || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/cases/${c.id}`)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <EyeIcon />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
