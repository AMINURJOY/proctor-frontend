import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { casesApi } from '../services/api';
import { Case } from '../types';

type SortKey = 'caseNumber' | 'studentName' | 'type' | 'status' | 'createdDate' | 'updatedDate';
type SortDir = 'asc' | 'desc';

export default function ReportsPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    casesApi.getAll({ pageSize: 100 }).then(res => {
      setCases(res.data.data?.items || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const visibleCases = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? cases.filter(c =>
          c.caseNumber.toLowerCase().includes(term) ||
          (c.studentName || '').toLowerCase().includes(term) ||
          (c.studentId || '').toLowerCase().includes(term))
      : cases;
    const sorted = [...filtered].sort((a, b) => {
      const av = (a as any)[sortKey] ?? '';
      const bv = (b as any)[sortKey] ?? '';
      // Date columns: compare as Date when possible
      if (sortKey === 'createdDate' || sortKey === 'updatedDate') {
        const ad = new Date(av).getTime() || 0;
        const bd = new Date(bv).getTime() || 0;
        return sortDir === 'asc' ? ad - bd : bd - ad;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [cases, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'createdDate' || key === 'updatedDate' ? 'desc' : 'asc');
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <span className="text-gray-300">↕</span>;
    return <span className="text-blue-600">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0b2652' }}>Investigation Reports</h1>
          <p className="text-sm text-gray-500">Select a case to create or edit an investigation report</p>
        </div>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by case number, student name, or ID..."
            className="w-full sm:w-80 pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none" onClick={() => toggleSort('caseNumber')}>
                  Case {sortIcon('caseNumber')}
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none" onClick={() => toggleSort('studentName')}>
                  Student {sortIcon('studentName')}
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none" onClick={() => toggleSort('type')}>
                  Type {sortIcon('type')}
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none" onClick={() => toggleSort('status')}>
                  Status {sortIcon('status')}
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none" onClick={() => toggleSort('createdDate')}>
                  Case Date {sortIcon('createdDate')}
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none" onClick={() => toggleSort('updatedDate')}>
                  Updated {sortIcon('updatedDate')}
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reports</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleCases.map(c => {
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
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {c.createdDate ? new Date(c.createdDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {c.updatedDate ? new Date(c.updatedDate).toLocaleDateString() : '-'}
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
        {visibleCases.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {search.trim() ? `No cases match "${search}"` : 'No cases available'}
          </div>
        )}
      </div>
    </div>
  );
}
