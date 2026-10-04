import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { casesApi } from '../services/api';
import { Case } from '../types';
import { generateReportHTML } from '../utils/pdfExport';

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

  const reportContent = finalReport ? finalReport.content : generateReportHTML(caseItem);

  return (
    <div className="max-w-4xl mx-auto">
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

      <div className="bg-white rounded-xl shadow-md border border-gray-100 print:shadow-none print:border-none">
        <div className="p-8 tiptap-report-wrapper" style={{ fontFamily: `'July', 'Noto Sans Bengali', Arial, sans-serif` }}>
          <style>{`
            .tiptap-content table { border-collapse: collapse; width: 100%; margin: 16px 0; }
            .tiptap-content th, .tiptap-content td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            .tiptap-content th { background: #f8f9fa; font-weight: bold; }
            .tiptap-content p { margin-bottom: 8px; }
            .tiptap-content h2, .tiptap-content h3 { margin-top: 16px; margin-bottom: 8px; }
            .tiptap-content ul, .tiptap-content ol { padding-left: 24px; margin-bottom: 16px; }
            .tiptap-content li { margin-bottom: 4px; }
            .tiptap-content img { max-width: 100px; display: block; margin: 0 auto; height: auto; }
          `}</style>
          <div className="tiptap-content" dangerouslySetInnerHTML={{ __html: reportContent }} />
          {caseItem.verdict && (
            <div className="mt-12 border-t-2 border-gray-300 pt-6">
              <h3 className="font-bold text-lg mb-3" style={{ color: '#0b2652' }}>চূড়ান্ত সিদ্ধান্ত (Final Punishment):</h3>
              <p className="whitespace-pre-wrap text-gray-800 leading-relaxed text-base">{caseItem.verdict}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
