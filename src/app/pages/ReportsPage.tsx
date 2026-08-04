import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { casesApi } from '../services/api';
import { Case } from '../types';

type SortKey = 'caseNumber' | 'studentName' | 'type' | 'status' | 'createdDate' | 'updatedDate';
type SortDir = 'asc' | 'desc';
type ReportFilter = 'all' | 'none' | 'draft' | 'final';

const titleCase = (s: string) => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export default function ReportsPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reportFilter, setReportFilter] = useState<ReportFilter>('all');

  useEffect(() => {
    casesApi.getAll({ pageSize: 100 }).then(res => {
      setCases(res.data.data?.items || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Options come from the data itself, so a new case type or status needs no code change here.
  const typeOptions = useMemo(
    () => Array.from(new Set(cases.map(c => c.type).filter(Boolean))).sort(),
    [cases]);
  const statusOptions = useMemo(
    () => Array.from(new Set(cases.map(c => c.status).filter(Boolean))).sort(),
    [cases]);

  const activeFilterCount =
    (typeFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (reportFilter !== 'all' ? 1 : 0);

  const clearFilters = () => { setTypeFilter('all'); setStatusFilter('all'); setReportFilter('all'); };

  const visibleCases = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = cases.filter(c => {
      if (term &&
        !c.caseNumber.toLowerCase().includes(term) &&
        !(c.studentName || '').toLowerCase().includes(term) &&
        !(c.studentId || '').toLowerCase().includes(term)) return false;
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (reportFilter !== 'all') {
        const count = c.reports?.length || 0;
        const hasFinal = !!c.reports?.some(r => r.isFinal);
        if (reportFilter === 'none' && count !== 0) return false;
        if (reportFilter === 'draft' && (count === 0 || hasFinal)) return false;
        if (reportFilter === 'final' && !hasFinal) return false;
      }
      return true;
    });
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
  }, [cases, search, sortKey, sortDir, typeFilter, statusFilter, reportFilter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'createdDate' || key === 'updatedDate' ? 'desc' : 'asc');
    }
  };

  // Inline SVG rather than the ↕/↑/↓ characters — those get picked up by the emoji font on
  // Windows/Android and render as coloured stickers instead of a typographic sort indicator.
  const sortIcon = (key: SortKey) => {
    const active = sortKey === key;
    if (!active) {
      return (
        <svg width="10" height="12" viewBox="0 0 10 12" className="text-gray-300 group-hover:text-gray-400 shrink-0" aria-hidden="true">
          <path d="M5 1L8 4.5H2L5 1z" fill="currentColor" />
          <path d="M5 11L2 7.5h6L5 11z" fill="currentColor" />
        </svg>
      );
    }
    return (
      <svg width="10" height="12" viewBox="0 0 10 12" className="text-blue-600 shrink-0" aria-hidden="true">
        {sortDir === 'asc'
          ? <path d="M5 2L9 7.5H1L5 2z" fill="currentColor" />
          : <path d="M5 10L1 4.5h8L5 10z" fill="currentColor" />}
      </svg>
    );
  };

  // Every sortable header shares the same shell so spacing/hover stay consistent.
  const SortableTh = ({ label, sortKey: key }: { label: string; sortKey: SortKey }) => (
    <th
      scope="col"
      onClick={() => toggleSort(key)}
      aria-sort={sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className="group px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors whitespace-nowrap"
    >
      <span className="inline-flex items-center gap-1.5">{label}{sortIcon(key)}</span>
    </th>
  );

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
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setShowFilters(s => !s)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filter
            {activeFilterCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="mb-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-end gap-4">
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Case Type</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="all">All types</option>
              {typeOptions.map(t => <option key={t} value={t}>{titleCase(t)}</option>)}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="all">All statuses</option>
              {statusOptions.map(s => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
          </div>
          <div className="min-w-[170px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Report State</label>
            <select value={reportFilter} onChange={e => setReportFilter(e.target.value as ReportFilter)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="all">Any</option>
              <option value="none">No report yet</option>
              <option value="draft">Draft only</option>
              <option value="final">Has final report</option>
            </select>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-gray-500">
              {visibleCases.length} of {cases.length} cases
            </span>
            <button onClick={clearFilters} disabled={activeFilterCount === 0}
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <SortableTh label="Case" sortKey="caseNumber" />
                <SortableTh label="Student" sortKey="studentName" />
                <SortableTh label="Type" sortKey="type" />
                <SortableTh label="Status" sortKey="status" />
                <SortableTh label="Case Date" sortKey="createdDate" />
                <SortableTh label="Updated" sortKey="updatedDate" />
                <th scope="col" className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Reports</th>
                <th scope="col" className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
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
            {search.trim()
              ? `No cases match "${search}"`
              : activeFilterCount > 0
                ? 'No cases match the selected filters'
                : 'No cases available'}
          </div>
        )}
      </div>
    </div>
  );
}
