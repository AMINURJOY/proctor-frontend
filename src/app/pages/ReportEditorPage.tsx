import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { casesApi, articlesApi } from '../services/api';
import { Case, Article } from '../types';
import { toast } from 'sonner';

function generateReportTemplate(caseItem: Case, articles: Article[]): string {
  const complainantsRows = (caseItem.complainants || []).map(c =>
    `<li><strong>${c.name}</strong> (${c.studentId}) - ${c.department || '-'}</li>`
  ).join('') || '<li>-</li>';

  const accusedRows = (caseItem.accusedPersons || []).map(a =>
    `<li><strong>${a.name}</strong> (${a.accusedStudentId}) - ${a.department || '-'}</li>`
  ).join('') || '<li>-</li>';

  const docsRows = caseItem.documents.map(d =>
    `<li>${d.name} (${d.type}) - uploaded by ${d.uploadedBy}</li>`
  ).join('') || '<li>No attachments</li>';

  const articleItems = articles.filter(a => a.isActive).map(a =>
    `<li><strong>অনুচ্ছেদ ${a.articleNo} - ${a.title}:</strong> ${a.description}</li>`
  ).join('');

  return `
<h1 style="text-align:center">তদন্ত প্রতিবেদন</h1>
<p><strong>মামলা নম্বর:</strong> ${caseItem.caseNumber}</p>
<p><strong>রিপোর্টের তারিখ:</strong> ${new Date().toLocaleDateString('bn-BD')}</p>
<hr>
<h3>১। অভিযোগকারীদের তথ্য:</h3>
<p><em>(সিস্টেম থেকে অটো-পপুলেটেড)</em></p>
<ul>${complainantsRows}</ul>

<h3>২। অভিযুক্তের তথ্য:</h3>
<p><em>(সিস্টেম থেকে অটো-পপুলেটেড)</em></p>
<ul>${accusedRows}</ul>

<hr>
<h3>৩। তদন্ত পদ্ধতি এবং অংশগ্রহণকারী:</h3>
<ul>
<li><strong>তদন্ত কমিটির সভা:</strong> [তারিখ, স্থান এখানে লিখুন]</li>
<li><strong>তদন্ত পদ্ধতি:</strong> সরাসরি সাক্ষাৎকার, লিখিত অভিযোগ পর্যালোচনা এবং প্রমাণাদি বিশ্লেষণ</li>
</ul>

<h3>৪। তদন্তকারী:</h3>
<ul>
<li><strong>[নাম]</strong> - [পদবী]</li>
</ul>

<h4>৪.১। প্রতিবেদন প্রস্তুতকারী:</h4>
<ul>
<li><strong>নাম:</strong> [নাম]</li>
<li><strong>পদবী:</strong> [পদবী]</li>
</ul>

<hr>
<h3>৫। ঘটনার পটভূমি ও অভিযোগসমূহ:</h3>
<p>[ঘটনার বিস্তারিত বিবরণ এখানে লিখুন]</p>
<p>${caseItem.description}</p>

<hr>
<h3>৯। বিশ্ববিদ্যালয়ের কোড অফ কন্ডাক্ট (ফলাফল):</h3>
${articleItems ? `<ul>${articleItems}</ul>` : '<p>[জেনারেল সেটিংস থেকে অনুচ্ছেদ যোগ করুন]</p>'}

<hr>
<h3>১০। সুপারিশ:</h3>
<ul>
<li><strong>বহিষ্কার:</strong> [সুপারিশ লিখুন]</li>
<li><strong>ক্ষতিপূরণ ও জরিমানা:</strong> [বিবরণ লিখুন]</li>
<li><strong>অন্যান্য:</strong> [অন্যান্য সুপারিশ]</li>
</ul>

<hr>
<h3>প্রক্টোরিয়াল সদস্য:</h3>
<ul>
<li>[নাম] ([পদবী])</li>
</ul>

<h3>সংযুক্তি:</h3>
<ol>${docsRows}</ol>

<hr>
<p style="text-align:center"><strong>ধন্যবাদ,</strong><br>[নাম]<br>[পদবী]<br>ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটি</p>
  `.trim();
}

export default function ReportEditorPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [existingReportId, setExistingReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
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

        // Check for existing report
        const reportsRes = await casesApi.getReports(caseId!);
        const reports = reportsRes.data.data || [];
        if (reports.length > 0) {
          const latest = reports[reports.length - 1];
          setExistingReportId(latest.id);
          editor?.commands.setContent(latest.content || generateReportTemplate(c, arts));
        } else {
          editor?.commands.setContent(generateReportTemplate(c, arts));
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
