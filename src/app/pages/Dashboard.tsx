import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dashboardStats, recentActivity, mockCases } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { CasesIcon, ClockIcon, CheckIcon, EyeIcon } from '../components/Icons';
import { useNavigate } from 'react-router';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const statsCards = [
    { label: 'Total Cases', value: dashboardStats.totalCases, icon: CasesIcon, color: '#0b2652', bgColor: '#e0e7ff' },
    { label: 'Pending Cases', value: dashboardStats.pendingCases, icon: ClockIcon, color: '#f59e0b', bgColor: '#fef3c7' },
    { label: 'Under Review', value: dashboardStats.underReview, icon: EyeIcon, color: '#1e3a8a', bgColor: '#dbeafe' },
    { label: 'Resolved Cases', value: dashboardStats.resolvedCases, icon: CheckIcon, color: '#16a34a', bgColor: '#dcfce7' }
  ];

  const pieData = [
    { name: 'Pending', value: 2, color: '#f59e0b' },
    { name: 'Under Review', value: 2, color: '#1e3a8a' },
    { name: 'Resolved', value: 1, color: '#16a34a' },
    { name: 'On Hold', value: 1, color: '#dc2626' }
  ];

  const lineData = [
    { month: 'Jan', cases: 8 },
    { month: 'Feb', cases: 12 },
    { month: 'Mar', cases: 15 },
    { month: 'Apr', cases: 6 }
  ];

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

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
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: stat.bgColor }}
                >
                  <span style={{ color: stat.color }}>
                    <Icon />
                  </span>
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-1" style={{ color: stat.color }}>
                {stat.value}
              </h3>
              <p className="text-gray-600 text-sm">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-xl mb-4" style={{ color: '#0b2652' }}>
            Case Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-xl mb-4" style={{ color: '#0b2652' }}>
            Monthly Case Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="cases"
                stroke="#0b2652"
                strokeWidth={2}
                dot={{ fill: '#0b2652', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-xl mb-4" style={{ color: '#0b2652' }}>
          Recent Activity
        </h3>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              onClick={() => {
                const caseItem = mockCases.find(c => c.caseNumber === activity.caseNumber);
                if (caseItem) navigate(`/cases/${caseItem.id}`);
              }}
            >
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#0b2652' }}></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{activity.action}</p>
                <p className="text-sm text-gray-600">
                  {activity.caseNumber} · {activity.user}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
