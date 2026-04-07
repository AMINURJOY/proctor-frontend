import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { casesApi } from '../services/api';
import { Case } from '../types';

export default function ReportsPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    casesApi.getAll({ pageSize: 100 }).then(res => {
      setCases(res.data.data?.items || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0b2652' }}>Investigation Reports</h1>
        <p className="text-sm text-gray-500">Select a case to create or edit an investigation report</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Case</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reports</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {cases.map(c => {
                const reportCount = c.reports?.length || 0;
                const hasFinal = c.reports?.some(r => r.isFinal);
                return (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-medium" style={{ color: '#0b2652' }}>{c.caseNumber}</td>
                    <td className="px-4 py-3 text-sm">{c.studentName}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">{c.type.replace('-', ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 capitalize">{c.status.split('-').join(' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {reportCount === 0 ? (
                        <span className="text-gray-400">None</span>
                      ) : hasFinal ? (
                        <span className="text-green-600 font-medium">Final ({reportCount})</span>
                      ) : (
                        <span className="text-orange-600">Draft ({reportCount})</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/reports/${c.id}/edit`)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg text-white" style={{ backgroundColor: '#0b2652' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        {reportCount > 0 ? 'Edit Report' : 'Create Report'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {cases.length === 0 && (
          <div className="text-center py-12 text-gray-400">No cases available</div>
        )}
      </div>
    </div>
  );
}
