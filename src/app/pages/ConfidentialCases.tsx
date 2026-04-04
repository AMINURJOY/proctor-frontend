import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { LockIcon, EyeIcon, ShieldIcon, CheckIcon } from '../components/Icons';
import { Case, CaseStatus } from '../types';
import { casesApi } from '../services/api';

export default function ConfidentialCases() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  const canView = currentUser?.role === 'female-coordinator' ||
    currentUser?.role === 'sexual-harassment-committee' ||
    currentUser?.role === 'proctor' ||
    currentUser?.role === 'vc' ||
    currentUser?.role === 'super-admin';

  useEffect(() => {
    if (!canView) return;
    const fetchCases = async () => {
      setLoading(true);
      try {
        const response = await casesApi.getAll({ type: 'confidential' });
        setCases(response.data.data?.items || []);
      } catch {
        setCases([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [canView]);

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white rounded-xl shadow-md p-10 border border-red-200 max-w-md">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-red-100">
            <LockIcon />
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-red-600">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            This section contains confidential cases and is only accessible to authorized personnel.
          </p>
          <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700">
            <p>Authorized roles: Female Coordinator, Sexual Harassment Committee, Proctor, Vice Chancellor</p>
          </div>
        </div>
      </div>
    );
  }

  const confidentialCases = cases.filter(c => c.type === 'confidential');
  const activeCases = confidentialCases.filter(c => c.status !== 'closed' && c.status !== 'resolved');
  const closedCases = confidentialCases.filter(c => c.status === 'closed' || c.status === 'resolved');

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

  const isCommittee = currentUser?.role === 'sexual-harassment-committee';
  const isFemaleCoord = currentUser?.role === 'female-coordinator';

  const currentCases = activeTab === 'active' ? activeCases : closedCases;

  return (
    <div>
      {/* Restricted Access Banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
          <ShieldIcon />
        </div>
        <div>
          <p className="font-medium text-red-700">Confidential Access Area</p>
          <p className="text-sm text-red-600">
            All information in this section is strictly confidential. Unauthorized disclosure is prohibited.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>Confidential Cases</h1>
          <p className="text-gray-600">Sexual Harassment Committee - Restricted Access</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 rounded-lg">
          <LockIcon />
          <span className="text-sm font-medium text-red-700">Restricted View</span>
        </div>
      </div>

      {/* Workflow for this role */}
      {(isFemaleCoord || isCommittee) && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">CONFIDENTIAL CASE WORKFLOW</h3>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`px-3 py-1.5 rounded-lg ${isFemaleCoord ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>
              Female Coordinator Review
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className={`px-3 py-1.5 rounded-lg ${isCommittee ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>
              SH Committee Investigation
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">Decision</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">Closure</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="border-b border-gray-200 flex">
          <button
            onClick={() => setActiveTab('active')}
            className={`relative px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'active' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Active Cases ({activeCases.length})
            {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />}
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`relative px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'closed' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Closed Cases ({closedCases.length})
            {activeTab === 'closed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />}
          </button>
        </div>

        <div className="p-6">
          {currentCases.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No cases in this category</p>
          ) : (
            <div className="space-y-4">
              {currentCases.map(c => (
                <div key={c.id} className="border border-red-100 rounded-lg p-5 bg-red-50/30">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <LockIcon />
                        <h3 className="font-semibold" style={{ color: '#0b2652' }}>{c.caseNumber}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[c.status]}`}>
                          {c.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Urgent</span>
                      </div>

                      {/* Masked data */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
                        <div>
                          <span className="text-gray-500">Student: </span>
                          <span className="font-medium text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
                            {c.studentName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">ID: </span>
                          <span className="font-mono text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
                            {c.studentId}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Assigned: </span>
                          <span className="font-medium">{c.assignedTo}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Filed: </span>
                          <span>{new Date(c.createdDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600">{c.description}</p>

                      {/* Timeline mini */}
                      <div className="mt-3 pt-3 border-t border-red-100">
                        <p className="text-xs text-gray-500 mb-2">Recent Activity:</p>
                        {c.timeline.slice(-2).map(t => (
                          <div key={t.id} className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            <span className="font-medium">{t.action}</span>
                            <span>-</span>
                            <span>{t.user}</span>
                            <span className="text-gray-400">{new Date(t.timestamp).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => navigate(`/cases/${c.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <EyeIcon />
                        View Details
                      </button>
                      {isCommittee && (
                        <>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">
                            <CheckIcon />
                            Add Decision
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-600 text-white hover:bg-gray-700">
                            Close Case
                          </button>
                        </>
                      )}
                      {isFemaleCoord && (
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">
                          Forward to Committee
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
