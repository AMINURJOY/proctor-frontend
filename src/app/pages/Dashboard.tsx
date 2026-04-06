import { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { CasesIcon, ClockIcon, CheckIcon, EyeIcon } from '../components/Icons';
import { useNavigate } from 'react-router';
import { Case, Priority } from '../types';
import { dashboardApi, casesApi } from '../services/api';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'my-tasks' | 'pending' | 'completed'>('overview');
  const [cases, setCases] = useState<Case[]>([]);
  const [dashboardStats, setDashboardStats] = useState({ totalCases: 0, pendingCases: 0, underReview: 0, resolvedCases: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const role = currentUser?.role || '';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, activityRes, casesRes] = await Promise.allSettled([
          dashboardApi.getStats(),
          dashboardApi.getRecentActivity(),
          casesApi.getAll(),
        ]);

        if (statsRes.status === 'fulfilled') {
          setDashboardStats(statsRes.value.data.data);
        }
        if (activityRes.status === 'fulfilled') {
          setRecentActivity(activityRes.value.data.data || []);
        }
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

  // Filter cases based on role - uses forwardedToRole for accurate matching
  const getMyTasks = () => {
    return cases.filter(c => {
      if (c.status === 'closed' || c.status === 'resolved' || c.status === 'rejected') return false;
      if (c.type === 'confidential' && !['proctor', 'female-coordinator', 'sexual-harassment-committee', 'vc', 'super-admin'].includes(role)) return false;

      switch (role) {
        case 'student': return c.studentId === currentUser?.id;
        case 'coordinator': return (c.status === 'submitted' || c.status === 'resubmission-requested') && c.type !== 'confidential';
        case 'female-coordinator': return (c.status === 'submitted' || c.status === 'resubmission-requested') && c.type === 'confidential';
        case 'proctor': return c.forwardedToRole === 'proctor';
        case 'assistant-proctor': return c.forwardedToRole === 'assistant-proctor';
        case 'deputy-proctor': return c.forwardedToRole === 'deputy-proctor';
        case 'registrar': return c.forwardedToRole === 'registrar';
        case 'disciplinary-committee': return c.forwardedToRole === 'disciplinary-committee';
        case 'sexual-harassment-committee': return c.forwardedToRole === 'sexual-harassment-committee';
        case 'vc': return false; // VC only monitors
        case 'super-admin': return true;
        default: return false;
      }
    });
  };

  const getPendingCases = () => {
    return cases.filter(c => {
      if (c.type === 'confidential' && !['proctor', 'female-coordinator', 'sexual-harassment-committee', 'vc', 'super-admin'].includes(role)) return false;
      return !['closed', 'resolved', 'rejected'].includes(c.status);
    });
  };

  const getCompletedCases = () => {
    return cases.filter(c => {
      if (c.type === 'confidential' && !['proctor', 'female-coordinator', 'sexual-harassment-committee', 'vc', 'super-admin'].includes(role)) return false;
      return ['closed', 'resolved', 'rejected'].includes(c.status);
    });
  };

  const myTasks = getMyTasks();
  const pendingCases = getPendingCases();
  const completedCases = getCompletedCases();

  const statusColors: Record<string, string> = {
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
    'on-hold': 'bg-amber-100 text-amber-700',
    'suggested-type-2': 'bg-violet-100 text-violet-700',
    'police-case': 'bg-red-200 text-red-800',
    'forwarded-to-registrar': 'bg-teal-100 text-teal-700',
    'forwarded-to-committee': 'bg-rose-100 text-rose-700',
    'resubmission-requested': 'bg-orange-100 text-orange-700',
  };

  const priorityColors: Record<Priority, string> = {
    'low': 'bg-slate-100 text-slate-700',
    'medium': 'bg-blue-100 text-blue-700',
    'high': 'bg-orange-100 text-orange-700',
    'urgent': 'bg-red-100 text-red-700'
  };

  const statsCards = [
    { label: 'Total Cases', value: dashboardStats.totalCases, icon: CasesIcon, color: '#0b2652', bgColor: '#e0e7ff' },
    { label: 'My Tasks', value: myTasks.length, icon: ClockIcon, color: '#f59e0b', bgColor: '#fef3c7' },
    { label: 'Pending', value: pendingCases.length, icon: EyeIcon, color: '#1e3a8a', bgColor: '#dbeafe' },
    { label: 'Resolved', value: completedCases.length, icon: CheckIcon, color: '#16a34a', bgColor: '#dcfce7' }
  ];

  const pieData = [
    { name: 'Submitted', value: cases.filter(c => c.status === 'submitted').length, color: '#3b82f6' },
    { name: 'Under Review', value: cases.filter(c => c.status === 'under-review' || c.status === 'verified').length, color: '#4f46e5' },
    { name: 'Hearing', value: cases.filter(c => c.status === 'hearing-scheduled').length, color: '#f97316' },
    { name: 'On Hold', value: cases.filter(c => c.status === 'on-hold').length, color: '#f59e0b' },
    { name: 'Closed', value: cases.filter(c => c.status === 'closed' || c.status === 'resolved').length, color: '#16a34a' },
    { name: 'Rejected', value: cases.filter(c => c.status === 'rejected').length, color: '#dc2626' },
  ].filter(d => d.value > 0);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const lineData = (() => {
    const counts: Record<string, number> = {};
    cases.forEach(c => {
      const d = new Date(c.createdDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      return { month: monthNames[d.getMonth()], cases: counts[key] || 0 };
    });
  })();

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const CaseRow = ({ c }: { c: Case }) => (
    <div
      className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
      onClick={() => navigate(`/cases/${c.id}`)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-medium text-sm">{c.caseNumber}</span>
          <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[c.status]}`}>
            {c.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded-full ${priorityColors[c.priority]}`}>
            {c.priority.charAt(0).toUpperCase() + c.priority.slice(1)}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate">{c.studentName} - {c.description}</p>
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">{new Date(c.updatedDate).toLocaleDateString()}</span>
    </div>
  );

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'my-tasks' as const, label: `My Tasks (${myTasks.length})` },
    { id: 'pending' as const, label: `Pending (${pendingCases.length})` },
    { id: 'completed' as const, label: `Completed (${completedCases.length})` },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>
          Welcome back, {currentUser?.name}
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your cases today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.bgColor }}>
                  <span style={{ color: stat.color }}><Icon /></span>
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</h3>
              <p className="text-gray-600 text-sm">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#0b2652' }} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Case Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={90} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Monthly Case Trends</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="cases" stroke="#0b2652" strokeWidth={2} dot={{ fill: '#0b2652', r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Activity */}
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Recent Activity</h3>
              <div className="space-y-2">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                    onClick={() => {
                      const caseItem = cases.find(c => c.caseNumber === activity.caseNumber);
                      if (caseItem) navigate(`/cases/${caseItem.id}`);
                    }}
                  >
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#0b2652' }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-600">{activity.caseNumber} &middot; {activity.user}</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Tasks Tab */}
          {activeTab === 'my-tasks' && (
            <div>
              {myTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckIcon />
                  </div>
                  <p className="text-gray-500">No pending tasks assigned to you</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {myTasks.map(c => <CaseRow key={c.id} c={c} />)}
                </div>
              )}
            </div>
          )}

          {/* Pending Tab */}
          {activeTab === 'pending' && (
            <div className="divide-y divide-gray-100">
              {pendingCases.map(c => <CaseRow key={c.id} c={c} />)}
            </div>
          )}

          {/* Completed Tab */}
          {activeTab === 'completed' && (
            <div>
              {completedCases.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No completed cases</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {completedCases.map(c => <CaseRow key={c.id} c={c} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
