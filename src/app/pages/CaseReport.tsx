import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { casesApi } from '../services/api';
import { Case } from '../types';
import { arrangeReportImagesAtEnd } from '../utils/pdfExport';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character] || character));

export default function CaseReport() {
  const { id } = useParams();
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const response = await casesApi.getById(id!);
        setCaseItem(response.data.data || response.data);
      } catch {
        setCaseItem(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCase();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!caseItem) {
    return <div className="text-center py-12"><p className="text-gray-500">Case not found</p></div>;
  }

  const finalReport = caseItem.reports?.find(r => r.isFinal);
  let reportHtml = finalReport?.content || '';
  if (finalReport && caseItem.verdict && !reportHtml.includes('চূড়ান্ত সিদ্ধান্ত')) {
    const verdict = escapeHtml(caseItem.verdict).replace(/\n/g, '<br>');
    reportHtml += `
      <div style="margin-top: 48px; border-top: 2px solid #ccc; padding-top: 24px;">
        <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 12px; color: #0b2652;">১১। চূড়ান্ত সিদ্ধান্ত (Final Punishment):</h3>
        <p style="white-space: pre-wrap; color: #1f2937; line-height: 1.6; font-size: 16px;">${verdict}</p>
      </div>`;
  }
  reportHtml = arrangeReportImagesAtEnd(reportHtml, caseItem.documents || []);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-bold" style={{ color: '#0b2652' }}>Case Report</h1>
        <div className="flex gap-2">
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: '#0b2652' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12 print:shadow-none print:border-none print:p-0 report-content-wrapper prose max-w-none">
        {finalReport ? (
          <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
        ) : (
          <div className="text-center py-12 text-gray-500">
            No final report available for this case.
          </div>
        )}
        
      </div>
    </div>
  );
}
