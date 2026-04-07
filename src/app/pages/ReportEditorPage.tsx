import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { casesApi, articlesApi } from '../services/api';
import { Case, Article } from '../types';
import { toast } from 'sonner';

const ts = 'width:100%;border-collapse:collapse;margin-bottom:20px;';
const ths = 'border:1px solid #000;padding:8px;text-align:left;font-size:14px;background-color:#f2f2f2;';
const tds = 'border:1px solid #000;padding:8px;text-align:left;font-size:14px;';
const st = 'font-size:18px;font-weight:bold;border-bottom:1px solid #000;margin-top:25px;margin-bottom:10px;display:block;';

function generateReportTemplate(caseItem: Case): string {
  const complainantsRows = (caseItem.complainants || []).map(c =>
    `<tr><td style="${tds}">${c.name}</td><td style="${tds}">${c.studentId}</td><td style="${tds}">${c.department || '-'}</td></tr>`
  ).join('') || `<tr><td style="${tds}" colspan="3">-</td></tr>`;

  const accusedRows = (caseItem.accusedPersons || []).map(a =>
    `<tr><td style="${tds}">${a.name}</td><td style="${tds}">${a.accusedStudentId}</td><td style="${tds}">${a.department || '-'}</td></tr>`
  ).join('') || `<tr><td style="${tds}" colspan="3">-</td></tr>`;

  // Extract unique participants from timeline
  const seen = new Set<string>();
  const participantRows = (caseItem.timeline || [])
    .filter(evt => { if (seen.has(evt.user)) return false; seen.add(evt.user); return evt.user !== 'System'; })
    .map(p => `<tr><td style="${tds}">${p.user}</td><td style="${tds}">${p.action}</td></tr>`)
    .join('') || `<tr><td style="${tds}" colspan="2">[তদন্তকারীর নাম যোগ করুন]</td></tr>`;

  const docsRows = caseItem.documents.map((d, i) =>
    `${i + 1}ঃ ${d.name} (${d.type})<br>`
  ).join('') || 'কোনো সংযুক্তি নেই';

  return `
<div style="padding:20px;border:1px solid #ccc;max-width:850px;margin:0 auto;font-family:Arial,sans-serif;line-height:1.6;color:#000;">

  <div style="display:flex;align-items:center;justify-content:center;gap:20px;border-bottom:2px solid #000;padding-bottom:15px;margin-bottom:20px;">
    <div style="width:70px;height:70px;border:1px solid #000;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;">LOGO</div>
    <h1 style="font-size:26px;margin:0;color:#000;text-decoration:underline;">তদন্ত প্রতিবেদন</h1>
  </div>

  <div style="margin-bottom:25px;">
    <p style="margin:5px 0;font-weight:bold;">মামলা নম্বর: ${caseItem.caseNumber}</p>
    <p style="margin:5px 0;font-weight:bold;">রিপোর্টের তারিখ: ${new Date().toLocaleDateString('bn-BD')}</p>
    <p style="margin:5px 0;font-weight:bold;">বিষয়: ${caseItem.description?.substring(0, 100) || '[বিষয় লিখুন]'}</p>
  </div>

  <span style="${st}">১। অভিযোগকারীদের তথ্য</span>
  <table style="${ts}">
    <thead><tr><th style="${ths}">নাম</th><th style="${ths}">আইডি</th><th style="${ths}">বিভাগ</th></tr></thead>
    <tbody>${complainantsRows}</tbody>
  </table>

  <span style="${st}">২। অভিযুক্তের তথ্য</span>
  <table style="${ts}">
    <thead><tr><th style="${ths}">নাম</th><th style="${ths}">আইডি</th><th style="${ths}">বিভাগ</th></tr></thead>
    <tbody>${accusedRows}</tbody>
  </table>

  <span style="${st}">৩। তদন্ত পদ্ধতি ও অংশগ্রহণকারী</span>
  <div style="padding:10px 0;margin-bottom:15px;">
    <p><strong>তদন্ত কমিটির সভা:</strong> [তারিখ, স্থান এখানে লিখুন]</p>
    <p><strong>তদন্ত পদ্ধতি:</strong> সরাসরি সাক্ষাৎকার, লিখিত অভিযোগ পর্যালোচনা এবং প্রমাণাদি বিশ্লেষণ</p>
  </div>

  <span style="${st}">৪। তদন্তকারী ও প্রতিবেদন প্রস্তুতকারী</span>
  <table style="${ts}">
    <thead><tr><th style="${ths}">নাম</th><th style="${ths}">পদবী / ভূমিকা</th></tr></thead>
    <tbody>${participantRows}</tbody>
  </table>

  <span style="${st}">৫। ঘটনার পটভূমি ও অভিযোগসমূহ</span>
  <div style="padding:10px 0;margin-bottom:15px;">
    <p>${caseItem.description || '[ঘটনার বিস্তারিত বিবরণ এখানে লিখুন]'}</p>
  </div>

  <span style="${st}">৯। বিশ্ববিদ্যালয়ের কোড অফ কন্ডাক্ট (ফলাফল)</span>
  <table style="${ts}">
    <thead><tr><th style="${ths}">অনুচ্ছেদ নং</th><th style="${ths}">অনুচ্ছেদের নাম ও ব্যখ্যা</th></tr></thead>
    <tbody><tr><td style="${tds}" colspan="2"><em>[নিচের আর্টিকেল সিলেক্টর থেকে প্রযোজ্য অনুচ্ছেদ নির্বাচন করুন]</em></td></tr></tbody>
  </table>

  <span style="${st}">১০। সুপারিশ</span>
  <div style="padding:10px 0;margin-bottom:15px;">
    <p>১. [সুপারিশ লিখুন]</p>
    <p>২. [ক্ষতিপূরণ ও জরিমানা]</p>
    <p>৩. [অন্যান্য সুপারিশ]</p>
  </div>

  <div style="margin-top:60px;display:flex;justify-content:space-between;">
    <div style="text-align:center;width:40%;">
      <strong>[নাম]</strong><br>[পদবী]
      <div style="border-top:1px solid #000;margin-top:10px;padding-top:5px;">স্বাক্ষর ও তারিখ</div>
    </div>
    <div style="text-align:center;width:40%;">
      <strong>[নাম]</strong><br>[পদবী]
      <div style="border-top:1px solid #000;margin-top:10px;padding-top:5px;">স্বাক্ষর ও তারিখ</div>
    </div>
  </div>

  <div style="margin-top:30px;font-size:13px;border-top:1px dashed #000;padding-top:10px;">
    <strong>সংযুক্তি:</strong><br>${docsRows}
  </div>

</div>`.trim();
}

export default function ReportEditorPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticleIds, setSelectedArticleIds] = useState<Set<string>>(new Set());
  const [existingReportId, setExistingReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '<p>Loading...</p>',
    editorProps: {
      attributes: { class: 'prose prose-sm max-w-none p-6 min-h-[600px] focus:outline-none' },
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [caseRes, articlesRes] = await Promise.all([
          casesApi.getById(caseId!),
          articlesApi.getAll(),
        ]);
        const c = caseRes.data.data || caseRes.data;
        const arts = articlesRes.data.data || [];
        setCaseItem(c);
        setArticles(arts);

        const reportsRes = await casesApi.getReports(caseId!);
        const reports = reportsRes.data.data || [];
        if (reports.length > 0) {
          const latest = reports[reports.length - 1];
          setExistingReportId(latest.id);
          editor?.commands.setContent(latest.content || generateReportTemplate(c));
        } else {
          editor?.commands.setContent(generateReportTemplate(c));
        }
      } catch {
        toast.error('Failed to load case data');
      } finally {
        setLoading(false);
      }
    };
    if (caseId && editor) fetchData();
  }, [caseId, editor]);

  const handleSave = useCallback(async (isDraft: boolean, isFinal: boolean) => {
    if (!editor || !caseId) return;
    setSaving(true);
    try {
      const content = editor.getHTML();
      const data = { content, isDraft, isFinal };
      if (existingReportId) {
        await casesApi.updateReport(caseId, existingReportId, data);
      } else {
        const res = await casesApi.createReport(caseId, data);
        setExistingReportId(res.data.data?.id || null);
      }
      toast.success(isDraft ? 'Draft saved' : 'Report finalized');
    } catch (err: any) {
      toast.error('Save failed', { description: err?.response?.data?.message || 'Error saving report' });
    } finally {
      setSaving(false);
    }
  }, [editor, caseId, existingReportId]);

  const handleExportDocx = useCallback(() => {
    if (!editor) return;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Report</title>
<style>body{font-family:'Noto Sans Bengali',Arial,sans-serif;font-size:14px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}th{background:#f0f0f0}</style>
</head><body>${editor.getHTML()}</body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${caseItem?.caseNumber || 'case'}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }, [editor, caseItem]);

  const insertArticles = () => {
    if (!editor || selectedArticleIds.size === 0) return;
    const selected = articles.filter(a => selectedArticleIds.has(a.id));
    const rows = selected.map(a =>
      `<tr><td style="${tds}">অনুচ্ছেদ নং ${a.articleNo}</td><td style="${tds}"><strong>${a.title}:</strong> ${a.description}</td></tr>`
    ).join('');
    const tableHtml = `<table style="${ts}"><thead><tr><th style="${ths}">অনুচ্ছেদ নং</th><th style="${ths}">অনুচ্ছেদের নাম ও ব্যখ্যা</th></tr></thead><tbody>${rows}</tbody></table>`;
    editor.chain().focus().insertContent(tableHtml).run();
    toast.success(`${selected.length} article(s) inserted`);
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <button onClick={() => navigate('/reports')} className="text-blue-600 hover:text-blue-800 text-sm mb-1">&larr; Back to Reports</button>
          <h1 className="text-xl font-bold" style={{ color: '#0b2652' }}>
            Report Editor - {caseItem?.caseNumber}
          </h1>
        </div>
        <div className="flex gap-2">
          <button disabled={saving} onClick={() => handleSave(true, false)}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button disabled={saving} onClick={() => handleSave(false, true)}
            className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
            Finalize Report
          </button>
          <button onClick={() => window.print()}
            className="px-4 py-2 text-sm rounded-lg text-white" style={{ backgroundColor: '#0b2652' }}>
            Print PDF
          </button>
          <button onClick={handleExportDocx}
            className="px-4 py-2 text-sm rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50">
            Export DOCX
          </button>
        </div>
      </div>

      {/* Article Selector */}
      {articles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 print:hidden">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">প্রযোজ্য অনুচ্ছেদ নির্বাচন করুন (Select Applicable Articles)</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {articles.filter(a => a.isActive).map(article => (
              <label key={article.id} className="flex items-start gap-2 cursor-pointer hover:bg-blue-50 rounded p-1">
                <input
                  type="checkbox"
                  checked={selectedArticleIds.has(article.id)}
                  onChange={() => {
                    setSelectedArticleIds(prev => {
                      const next = new Set(prev);
                      if (next.has(article.id)) next.delete(article.id); else next.add(article.id);
                      return next;
                    });
                  }}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">
                  <strong>অনুচ্ছেদ {article.articleNo} - {article.title}:</strong> {article.description}
                </span>
              </label>
            ))}
          </div>
          <button onClick={insertArticles} disabled={selectedArticleIds.size === 0}
            className="mt-3 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            Insert Selected Articles ({selectedArticleIds.size})
          </button>
        </div>
      )}

      {/* Toolbar */}
      {editor && (
        <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 px-3 py-2 flex flex-wrap gap-1 print:hidden">
          <button onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 text-xs rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
            <strong>B</strong>
          </button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 text-xs rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
            <em>I</em>
          </button>
          <span className="w-px bg-gray-300 mx-1" />
          {[1, 2, 3].map(level => (
            <button key={level} onClick={() => editor.chain().focus().toggleHeading({ level: level as 1|2|3 }).run()}
              className={`px-2 py-1 text-xs rounded ${editor.isActive('heading', { level }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
              H{level}
            </button>
          ))}
          <span className="w-px bg-gray-300 mx-1" />
          <button onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2 py-1 text-xs rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
            List
          </button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-2 py-1 text-xs rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
            1.2.3
          </button>
          <span className="w-px bg-gray-300 mx-1" />
          <button onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-2 py-1 text-xs rounded ${editor.isActive('blockquote') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
            Quote
          </button>
          <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="px-2 py-1 text-xs rounded hover:bg-gray-100">
            Table
          </button>
          <button onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="px-2 py-1 text-xs rounded hover:bg-gray-100">
            HR
          </button>
          <span className="w-px bg-gray-300 mx-1" />
          <button onClick={() => editor.chain().focus().undo().run()} className="px-2 py-1 text-xs rounded hover:bg-gray-100">Undo</button>
          <button onClick={() => editor.chain().focus().redo().run()} className="px-2 py-1 text-xs rounded hover:bg-gray-100">Redo</button>
        </div>
      )}

      {/* Editor */}
      <div className="bg-white rounded-b-xl shadow-md border border-gray-200 print:shadow-none print:border-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
