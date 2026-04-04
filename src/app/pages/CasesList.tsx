import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { FilterIcon, PlusIcon, EyeIcon, LockIcon, XIcon } from '../components/Icons';
import { Case, CaseStatus, CaseType, Priority } from '../types';
import { useAuth } from '../context/AuthContext';
import { casesApi, settingsApi } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

export default function CasesList() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [filterStatus, setFilterStatus] = useState<CaseStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<CaseType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowedTypes, setAllowedTypes] = useState<string[]>(['type-1', 'type-2', 'confidential']);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const permissions = usePermissions();
  const canDelete = permissions['cases']?.canDelete ?? false;

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (filterStatus !== 'all') params.status = filterStatus;
        if (filterType !== 'all') params.type = filterType;
        if (filterPriority !== 'all') params.priority = filterPriority;
        if (searchQuery) params.search = searchQuery;

        const response = await casesApi.getAll(params);
        setCases(response.data.data?.items || response.data.data || []);
      } catch {
        setCases([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [filterStatus, filterType, filterPriority, searchQuery]);

  useEffect(() => {
    if (!currentUser?.role) return;
    const fetchViewingSettings = async () => {
      try {
        const res = await settingsApi.getByCategory('case_viewing');
        const settings = res.data.data || res.data;
        if (Array.isArray(settings)) {
          const types: string[] = [];
          for (const s of settings) {
            const roles = s.value.split(',').map((r: string) => r.trim());
            if (roles.includes(currentUser.role)) {
              if (s.key === 'case_viewing_type1') types.push('type-1');
              if (s.key === 'case_viewing_type2') types.push('type-2');
              if (s.key === 'case_viewing_confidential') types.push('confidential');
            }
          }
          setAllowedTypes(types);
        }
      } catch { /* keep defaults */ }
    };
    fetchViewingSettings();
  }, [currentUser?.role]);

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
    'on-hold': 'bg-amber-100 text-amber-700',
    'suggested-type-2': 'bg-purple-100 text-purple-700'
  };

  const priorityColors: Record<Priority, string> = {
    'low': 'bg-slate-100 text-slate-700',
    'medium': 'bg-blue-100 text-blue-700',
    'high': 'bg-orange-100 text-orange-700',
    'urgent': 'bg-red-100 text-red-700'
  };

  const typeColors: Record<CaseType, string> = {
    'type-1': 'bg-blue-100 text-blue-700',
    'type-2': 'bg-purple-100 text-purple-700',
    'confidential': 'bg-red-100 text-red-700'
  };

  // Client-side filtering as fallback
  const filteredCases = cases.filter(c => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesType = filterType === 'all' || c.type === filterType;
    const matchesPriority = filterPriority === 'all' || c.priority === filterPriority;
    const matchesSearch = searchQuery === '' ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesType && matchesPriority && matchesSearch;
  });

  const canViewConfidential = allowedTypes.includes('confidential');

  const displayedCases = filteredCases.filter(c => allowedTypes.includes(c.type));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>
            Case Management
          </h1>
          <p className="text-gray-600">
            View and manage all cases
          </p>
        </div>
        {(currentUser?.role === 'student' || currentUser?.role === 'coordinator') && (
          <button
            onClick={() => navigate('/submit')}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-white transition-colors hover:opacity-90 sm:w-auto"
            style={{ backgroundColor: '#0b2652' }}
          >
            <PlusIcon />
            Submit New Case
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <FilterIcon />
          <h3 className="font-medium" style={{ color: '#0b2652' }}>Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Case number, student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as CaseStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="under-review">Under Review</option>
              <option value="assigned">Assigned</option>
              <option value="hearing-scheduled">Hearing Scheduled</option>
              <option value="hearing-completed">Hearing Completed</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as CaseType | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="type-1">Type-1</option>
              <option value="type-2">Type-2</option>
              {canViewConfidential && <option value="confidential">Confidential</option>}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Cases Table */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200" style={{ backgroundColor: '#f5f7fb' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Case ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedCases.map((caseItem) => (
                  <tr
                    key={caseItem.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/cases/${caseItem.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{caseItem.caseNumber}</span>
                        {caseItem.type === 'confidential' && (
                          <LockIcon />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{caseItem.studentName}</div>
                        <div className="text-sm text-gray-500">{caseItem.studentId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${typeColors[caseItem.type]}`}>
                        {caseItem.type === 'type-1' ? 'Type-1' : caseItem.type === 'type-2' ? 'Type-2' : 'Confidential'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${statusColors[caseItem.status]}`}>
                        {caseItem.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${priorityColors[caseItem.priority]}`}>
                        {caseItem.priority.charAt(0).toUpperCase() + caseItem.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {caseItem.assignedTo || '\u2014'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(caseItem.createdDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cases/${caseItem.id}`);
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <EyeIcon />
                          View
                        </button>
                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(caseItem.id);
                            }}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <XIcon />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {displayedCases.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No cases found matching your filters</p>
            </div>
          )}
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setDeleteId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2 text-red-600">Delete Case</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to permanently delete this case? All associated data will be removed. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await casesApi.delete(deleteId);
                      setCases(prev => prev.filter(c => c.id !== deleteId));
                    } catch { /* silent */ }
                    setDeleteId(null);
                  }}
                  className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
