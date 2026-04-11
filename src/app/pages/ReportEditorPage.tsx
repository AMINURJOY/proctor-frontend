import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Image } from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { casesApi, articlesApi } from '../services/api';
import { Case, Article } from '../types';
import { toast } from 'sonner';

function generateReportHTML(caseItem: Case): string {
  const cr = (caseItem.complainants || []).map(c =>
    `<tr><td>${c.name}</td><td>${c.studentId}</td><td>${c.department || '-'}</td></tr>`
  ).join('') || '<tr><td colspan="3">-</td></tr>';
  const ar = (caseItem.accusedPersons || []).map(a =>
    `<tr><td>${a.name}</td><td>${a.accusedStudentId}</td><td>${a.department || '-'}</td></tr>`
  ).join('') || '<tr><td colspan="3">-</td></tr>';
  const seen = new Set<string>();
  const pr = (caseItem.timeline || [])
    .filter(e => { if (seen.has(e.user)) return false; seen.add(e.user); return e.user !== 'System'; })
    .map(p => `<tr><td>${p.user}</td><td>${p.action}</td></tr>`)
    .join('') || '<tr><td colspan="2">[তদন্তকারীর নাম যোগ করুন]</td></tr>';
  const docs = caseItem.documents.map((d, i) => `<li>পরিশিষ্ট ${i + 1}ঃ ${d.name} (${d.type})</li>`).join('') || '<li>কোনো সংযুক্তি নেই</li>';

  return `
<p style="text-align: center"><img src="/report_logo.png" alt="Logo"></p>
<h2 style="text-align: center"><u>তদন্ত প্রতিবেদন</u></h2>
<p style="text-align: center">Daffodil International University - Proctor Office</p>
<p></p>
<p><strong>মামলা নম্বর:</strong> ${caseItem.caseNumber}</p>
<p><strong>রিপোর্টের তারিখ:</strong> ${new Date().toLocaleDateString('bn-BD')}</p>
<p><strong>বিষয়:</strong> ${caseItem.description?.substring(0, 150) || '[বিষয় লিখুন]'}</p>
<p></p>
<h3>১। অভিযোগকারীদের তথ্য:</h3>
<table><thead><tr><th>নাম</th><th>আইডি</th><th>বিভাগ</th></tr></thead><tbody>${cr}</tbody></table>
<h3>২। অভিযুক্তের তথ্য:</h3>
<table><thead><tr><th>নাম</th><th>আইডি</th><th>বিভাগ</th></tr></thead><tbody>${ar}</tbody></table>
<h3>৩। তদন্ত পদ্ধতি এবং অংশগ্রহণকারী:</h3>
<ul><li><strong>তদন্ত কমিটির সভা:</strong> [তারিখ, স্থান এখানে লিখুন]</li><li><strong>তদন্ত পদ্ধতি:</strong> সরাসরি সাক্ষাৎকার, লিখিত অভিযোগ পর্যালোচনা এবং প্রমাণাদি বিশ্লেষণ</li></ul>
<h3>৪। তদন্তকারী:</h3>
<table><thead><tr><th>নাম</th><th>পদবী</th></tr></thead><tbody>${pr}</tbody></table>
<h3>৪.১। প্রতিবেদন প্রস্তুতকারী:</h3>
<table><thead><tr><th>নাম</th><th>পদবী</th></tr></thead><tbody><tr><td>[নাম]</td><td>[পদবী]</td></tr></tbody></table>
<h3>৫। ঘটনার পটভূমি ও অভিযোগসমূহ:</h3>
<p>${caseItem.description || '[ঘটনার বিস্তারিত বিবরণ এখানে লিখুন]'}</p>
<p></p>
<h3>৯। বিশ্ববিদ্যালয়ের কোড অফ কন্ডাক্ট (ফলাফল):</h3>
<table><thead><tr><th>অনুচ্ছেদ নং</th><th>অনুচ্ছেদের নাম ও ব্যখ্যা</th></tr></thead><tbody><tr><td colspan="2"><em>[আর্টিকেল সিলেক্টর থেকে নির্বাচন করুন]</em></td></tr></tbody></table>
<h3>১০। সুপারিশ:</h3>
<p>[তদন্ত কমিটি নিম্নলিখিত সুপারিশ প্রদান করছে:]</p>
<ul><li>[সুপারিশ ১]</li><li>[সুপারিশ ২]</li><li>[সুপারিশ ৩]</li></ul>
<p></p>
<h3>প্রক্টোরিয়াল সদস্য:</h3>
<table><thead><tr><th>নাম</th><th>পদবী</th><th>স্বাক্ষর</th></tr></thead><tbody><tr><td>[নাম]</td><td>[অধ্যাপক ও প্রক্টর]</td><td></td></tr><tr><td>[নাম]</td><td>[সহকারী প্রক্টর]</td><td></td></tr></tbody></table>
<h3>সংযুক্তি:</h3>
<ol>${docs}</ol>
<p></p>
<p style="text-align: center"><strong>ধন্যবাদ</strong></p>
<p style="text-align: center"><strong>[নাম]</strong></p>
<p style="text-align: center">অধ্যাপক ও প্রক্টর</p>
<p style="text-align: center">ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটি</p>
`.trim();
}

// Toolbar button component
const Btn = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title?: string }) => (
  <button type="button" onClick={onClick} title={title}
    className={`px-1.5 py-1 text-xs rounded transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
    {children}
  </button>
);
const Sep = () => <span className="w-px h-5 bg-gray-300 mx-0.5" />;

// Case info sidebar helpers
const InfoSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{title}</h4>
    <div className="space-y-0.5">{children}</div>
  </div>
);

const InfoRow = ({ label, value, k, copiedKey, onCopy }: {
  label: string; value?: string | null; k: string;
  copiedKey: string | null; onCopy: (k: string, v: string) => void;
}) => {
  if (!value) return null;
  const isCopied = copiedKey === k;
  return (
    <button
      type="button"
      onClick={() => onCopy(k, value)}
      className="w-full text-left flex items-start gap-2 py-1 px-1.5 rounded hover:bg-blue-50 transition-colors group"
      title="Click to copy"
    >
      <span className="text-[11px] text-gray-500 w-16 flex-shrink-0 mt-0.5">{label}</span>
      <span className="text-xs text-gray-800 flex-1 break-words">{value}</span>
      <span className={`text-[10px] flex-shrink-0 mt-0.5 ${isCopied ? 'text-green-600' : 'text-transparent group-hover:text-blue-400'}`}>
        {isCopied ? '✓' : '⧉'}
      </span>
    </button>
  );
};

export default function ReportEditorPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticleIds, setSelectedArticleIds] = useState<Set<string>>(new Set());
  const [existingReportId, setExistingReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCaseInfo, setShowCaseInfo] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [tableHover, setTableHover] = useState<{ rows: number; cols: number }>({ rows: 0, cols: 0 });

  const copyToClipboard = (key: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1200);
    }).catch(() => toast.error('Copy failed'));
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ dropcursor: { color: '#3b82f6', width: 2 } }),
      Table.configure({ resizable: true, allowTableNodeSelection: true }),
      TableRow, TableHeader, TableCell,
      Image.configure({ inline: false, allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: '',
    editorProps: {
      attributes: { class: 'report-tiptap-editor focus:outline-none min-h-[700px] p-8', 'data-draggable': 'true' },
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [caseRes, articlesRes] = await Promise.all([casesApi.getById(caseId!), articlesApi.getAll()]);
        const c = caseRes.data.data || caseRes.data;
        const arts = articlesRes.data.data || [];
        setCaseItem(c); setArticles(arts);
        const reportsRes = await casesApi.getReports(caseId!);
        const reports = reportsRes.data.data || [];
        if (reports.length > 0) {
          const latest = reports[reports.length - 1];
          setExistingReportId(latest.id);
          editor?.commands.setContent(latest.content || generateReportHTML(c));
        } else {
          editor?.commands.setContent(generateReportHTML(c));
        }
      } catch { toast.error('Failed to load case data'); } finally { setLoading(false); }
    };
    if (caseId && editor) fetchData();
  }, [caseId, editor]);

  const handleSave = useCallback(async (isDraft: boolean, isFinal: boolean) => {
    if (!editor || !caseId) return;
    setSaving(true);
    try {
      const data = { content: editor.getHTML(), isDraft, isFinal };
      if (existingReportId) { await casesApi.updateReport(caseId, existingReportId, data); }
      else { const res = await casesApi.createReport(caseId, data); setExistingReportId(res.data.data?.id || null); }
      toast.success(isDraft ? 'Draft saved' : 'Report finalized');
    } catch (err: any) { toast.error('Save failed', { description: err?.response?.data?.message || 'Error' }); }
    finally { setSaving(false); }
  }, [editor, caseId, existingReportId]);

  const inlineImagesAsBase64 = useCallback(async (html: string, maxWidth = 80): Promise<string> => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const imgs = Array.from(doc.querySelectorAll('img'));
    await Promise.all(imgs.map(async (img) => {
      const src = img.getAttribute('src') || '';
      let dataUrl = src;
      if (src && !src.startsWith('data:')) {
        try {
          const absUrl = src.startsWith('http') ? src : new URL(src, window.location.origin).href;
          const res = await fetch(absUrl);
          const blob = await res.blob();
          dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          img.setAttribute('src', dataUrl);
        } catch { return; }
      }
      // Word/DOCX ignores CSS width for inline base64 images — set HTML attributes instead.
      // Load the image to get intrinsic dimensions, then scale proportionally to maxWidth.
      try {
        const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
          const probe = new window.Image();
          probe.onload = () => resolve({ w: probe.naturalWidth, h: probe.naturalHeight });
          probe.onerror = reject;
          probe.src = dataUrl;
        });
        if (dims.w > 0 && dims.h > 0) {
          const w = Math.min(maxWidth, dims.w);
          const h = Math.round((w / dims.w) * dims.h);
          img.setAttribute('width', String(w));
          img.setAttribute('height', String(h));
          img.setAttribute('style', 'display:block;margin:0 auto');
        }
      } catch { /* fall back to whatever sizing the doc had */ }
    }));
    return doc.body.innerHTML;
  }, []);

  const handleExportDocx = useCallback(async () => {
    if (!editor) return;
    try {
      const inlined = await inlineImagesAsBase64(editor.getHTML());
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><style>body{font-family:'Noto Sans Bengali',Arial;font-size:14px;max-width:850px;margin:0 auto}table{border-collapse:collapse;width:100%;margin-bottom:16px}th,td{border:1px solid #000;padding:8px}th{background:#f2f2f2}h3{font-size:16px;border-bottom:1px solid #000;padding-bottom:4px;margin-top:20px}img{width:80px;height:auto;display:block;margin:0 auto}ul{list-style:disc outside;padding-left:28px;margin:8px 0}ol{list-style:decimal outside;padding-left:28px;margin:8px 0}li{margin:2px 0}</style></head><body>${inlined}</body></html>`;
      const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `report-${caseItem?.caseNumber || 'case'}.doc`; a.click();
      toast.success('DOCX exported');
    } catch (err: any) {
      toast.error('DOCX export failed', { description: err?.message || 'Could not export' });
    }
  }, [editor, caseItem, inlineImagesAsBase64]);

  const handleExportPdf = useCallback(async () => {
    if (!editor) return;
    try {
      const inlined = await inlineImagesAsBase64(editor.getHTML());
      const win = window.open('', '_blank', 'width=900,height=1100');
      if (!win) {
        toast.error('Pop-up blocked', { description: 'Allow pop-ups to export PDF' });
        return;
      }
      const docHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>report-${caseItem?.caseNumber || 'case'}</title>
<style>
  @page { size: A4; margin: 0.75in; }
  body { font-family: 'Noto Sans Bengali', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #000; margin: 0; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; page-break-inside: avoid; }
  th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 14px; }
  th { background: #f2f2f2; font-weight: bold; }
  h2 { font-size: 22px; margin: 8px 0; }
  h3 { font-size: 16px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin: 20px 0 10px; page-break-after: avoid; }
  img { max-width: 120px; display: block; margin: 0 auto; }
  p { margin: 4px 0; }
  ul { list-style: disc outside; padding-left: 28px; margin: 8px 0; }
  ol { list-style: decimal outside; padding-left: 28px; margin: 8px 0; }
  ul ul { list-style: circle outside; }
  li { margin: 2px 0; padding-left: 4px; }
  blockquote { border-left: 3px solid #ddd; padding-left: 12px; color: #555; }
</style></head><body>${inlined}
<script>
  window.onload = function() {
    setTimeout(function() { window.focus(); window.print(); }, 300);
  };
  window.onafterprint = function() { window.close(); };
</script>
</body></html>`;
      win.document.open();
      win.document.write(docHtml);
      win.document.close();
      toast.success('PDF dialog opened — choose "Save as PDF"');
    } catch (err: any) {
      toast.error('PDF export failed', { description: err?.message || 'Could not export' });
    }
  }, [editor, caseItem, inlineImagesAsBase64]);

  const insertArticles = () => {
    if (!editor || selectedArticleIds.size === 0) return;
    const selected = articles.filter(a => selectedArticleIds.has(a.id));
    const rows = selected.map(a => `<tr><td>অনুচ্ছেদ নং ${a.articleNo}</td><td><strong>${a.title}:</strong> ${a.description}</td></tr>`).join('');
    const tableHtml = `<table><thead><tr><th>অনুচ্ছেদ নং</th><th>অনুচ্ছেদের নাম ও ব্যখ্যা</th></tr></thead><tbody>${rows}</tbody></table>`;

    // Move cursor to end of document to avoid inserting inside an existing table
    const endPos = editor.state.doc.content.size;
    editor.chain().focus().setTextSelection(endPos - 1).run();

    // Find the placeholder table for কোড অফ কন্ডাক্ট and replace it, or append at end
    const html = editor.getHTML();
    const placeholder = '[আর্টিকেল সিলেক্টর থেকে নির্বাচন করুন]';
    if (html.includes(placeholder)) {
      // Replace the placeholder table with the actual articles table
      const newHtml = html.replace(
        /<table>.*?আর্টিকেল সিলেক্টর থেকে নির্বাচন করুন.*?<\/table>/s,
        tableHtml
      );
      editor.commands.setContent(newHtml);
    } else {
      // Append after the document (outside any table)
      editor.chain().insertContentAt(endPos, tableHtml).run();
    }
    toast.success(`${selected.length} article(s) inserted`);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="-m-4 sm:-m-6 min-h-[calc(100vh-80px)] flex flex-col bg-[#f1f3f4]">
      {/* Global editor styles */}
      <style>{`
        .report-tiptap-editor { font-family: 'Noto Sans Bengali', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #000; }
        .report-tiptap-editor table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        .report-tiptap-editor th, .report-tiptap-editor td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 14px; min-width: 60px; }
        .report-tiptap-editor th { background-color: #f2f2f2; font-weight: bold; }
        .report-tiptap-editor h2 { font-size: 22px; margin: 8px 0; }
        .report-tiptap-editor h3 { font-size: 16px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin: 20px 0 10px; }
        .report-tiptap-editor img { max-width: 100px; cursor: grab; display: block; margin: 0 auto; }
        .report-tiptap-editor img:active { cursor: grabbing; }
        .report-tiptap-editor img.ProseMirror-selectednode { outline: 3px solid #3b82f6; border-radius: 4px; }
        .report-tiptap-editor .tableWrapper { overflow-x: auto; margin: 12px 0; position: relative; }
        .report-tiptap-editor .tableWrapper.ProseMirror-selectednode { outline: 3px solid #3b82f6; border-radius: 4px; }
        .report-tiptap-editor .selectedCell { background: #dbeafe !important; }
        .report-tiptap-editor p { margin: 4px 0; }
        .report-tiptap-editor ul { list-style: disc outside; padding-left: 28px; margin: 8px 0; }
        .report-tiptap-editor ol { list-style: decimal outside; padding-left: 28px; margin: 8px 0; }
        .report-tiptap-editor ul ul { list-style: circle outside; }
        .report-tiptap-editor ul ul ul { list-style: square outside; }
        .report-tiptap-editor li { margin: 2px 0; padding-left: 4px; }
        .report-tiptap-editor li > p { margin: 0; }
        .rp ul { list-style: disc outside; padding-left: 28px; margin: 8px 0; }
        .rp ol { list-style: decimal outside; padding-left: 28px; margin: 8px 0; }
        .rp li { margin: 2px 0; }
        .report-tiptap-editor blockquote { border-left: 3px solid #ddd; padding-left: 12px; color: #555; }
        /* Drag handle on hover for block elements */
        .report-tiptap-editor > *:not(p):not(ul):not(ol) { position: relative; }
        .report-tiptap-editor .tableWrapper:hover::before,
        .report-tiptap-editor img:hover::after {
          content: '⠿'; position: absolute; left: -20px; top: 4px;
          color: #9ca3af; font-size: 14px; cursor: grab; user-select: none;
        }
        /* Selection highlight for any node */
        .ProseMirror-selectednode { outline: 3px solid #3b82f6 !important; border-radius: 4px; }
        .ProseMirror-dropcursor { color: #3b82f6 !important; }
        /* Dragging indicator */
        .ProseMirror-hideselection *::selection { background: transparent; }
        /* Google Docs-style page surface */
        .gdocs-page {
          width: 8.5in;
          max-width: 100%;
          min-height: 11in;
          background: #fff;
          box-shadow: 0 1px 3px rgba(60,64,67,.15), 0 4px 8px 3px rgba(60,64,67,.1);
          margin: 24px auto;
          padding: 1in 1in;
        }
        .gdocs-page .report-tiptap-editor { min-height: 9in; padding: 0; }
        @media print {
          .no-print { display: none !important; }
          .gdocs-page { box-shadow: none; margin: 0; padding: 0; width: 100%; }
          .report-tiptap-editor { padding: 0 !important; }
        }
      `}</style>

      {/* Header bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between no-print sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/reports')} className="text-blue-600 hover:text-blue-800 text-sm flex-shrink-0">&larr; Back</button>
          <div className="min-w-0">
            <h1 className="text-base font-bold truncate" style={{ color: '#0b2652' }}>Investigation Report</h1>
            <p className="text-xs text-gray-500 truncate">{caseItem?.caseNumber} &middot; {caseItem?.studentName}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={() => setShowCaseInfo(s => !s)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-1.5" title="Toggle case info panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            {showCaseInfo ? 'Hide' : 'Show'} Case Info
          </button>
          <button disabled={saving} onClick={() => handleSave(true, false)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">{saving ? '...' : 'Save Draft'}</button>
          <button disabled={saving} onClick={() => handleSave(false, true)} className="px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">Finalize</button>
          <button onClick={() => window.print()} className="px-3 py-1.5 text-sm rounded-lg text-white" style={{ backgroundColor: '#0b2652' }}>Print</button>
          <button onClick={handleExportDocx} className="px-3 py-1.5 text-sm rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50">DOCX</button>
          <button onClick={handleExportPdf} className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50">PDF</button>
          <button onClick={() => setShowPreview(true)} className="px-3 py-1.5 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700">Preview</button>
        </div>
      </div>

      {/* Toolbar */}
      {editor && (
        <div className="bg-white border-b border-gray-200 px-2 py-1.5 flex flex-wrap gap-0.5 items-center sticky top-[49px] z-20 no-print">
          <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo">↩</Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo">↪</Btn>
          <Sep />
          {[1, 2, 3].map(l => <Btn key={l} active={editor.isActive('heading', { level: l })} onClick={() => editor.chain().focus().toggleHeading({ level: l as 1|2|3 }).run()}>H{l}</Btn>)}
          <Btn active={!editor.isActive('heading')} onClick={() => editor.chain().focus().setParagraph().run()}>P</Btn>
          <Sep />
          <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><strong>B</strong></Btn>
          <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><em>I</em></Btn>
          <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><u>U</u></Btn>
          <Btn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strike"><s>S</s></Btn>
          <Sep />
          <Btn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
          </Btn>
          <Btn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          </Btn>
          <Btn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Right">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
          </Btn>
          <Sep />
          <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</Btn>
          <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</Btn>
          <Btn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</Btn>
          <Sep />
          <div className="relative">
            <Btn onClick={() => { setTablePickerOpen(o => !o); setTableHover({ rows: 0, cols: 0 }); }} title="Insert Table">Table+</Btn>
            {tablePickerOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setTablePickerOpen(false)} />
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-40">
                  <div className="text-[11px] text-gray-500 mb-1.5 text-center font-medium">
                    {tableHover.rows > 0 ? `${tableHover.rows} × ${tableHover.cols}` : 'Pick size'}
                  </div>
                  <div
                    className="grid gap-0.5"
                    style={{ gridTemplateColumns: 'repeat(10, 18px)' }}
                    onMouseLeave={() => setTableHover({ rows: 0, cols: 0 })}
                  >
                    {Array.from({ length: 8 * 10 }).map((_, i) => {
                      const r = Math.floor(i / 10) + 1;
                      const c = (i % 10) + 1;
                      const isActive = r <= tableHover.rows && c <= tableHover.cols;
                      return (
                        <button
                          key={i}
                          type="button"
                          onMouseEnter={() => setTableHover({ rows: r, cols: c })}
                          onClick={() => {
                            editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
                            setTablePickerOpen(false);
                            setTableHover({ rows: 0, cols: 0 });
                          }}
                          className={`w-[18px] h-[18px] border ${isActive ? 'bg-blue-400 border-blue-600' : 'bg-white border-gray-300'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
          {editor.isActive('table') && (
            <>
              <Btn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column">Col+</Btn>
              <Btn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row">Row+</Btn>
              <Btn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column">Col-</Btn>
              <Btn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row">Row-</Btn>
              <Btn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
                <span className="text-red-600">Del Table</span>
              </Btn>
            </>
          )}
          <Sep />
          <Btn onClick={() => {
            const url = prompt('Image URL:', '/report_logo.png');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }} title="Insert Image">Img+</Btn>
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">HR</Btn>
          <Sep />
          {/* Move block up/down for reordering */}
          <Btn onClick={() => {
            const { state, dispatch } = editor.view;
            const { $from } = state.selection;
            const blockStart = $from.before($from.depth);
            if (blockStart <= 0) return;
            const $pos = state.doc.resolve(blockStart);
            const index = $pos.index($pos.depth);
            if (index === 0) return;
            const parentNode = $pos.parent;
            const prevNode = parentNode.child(index - 1);
            const currentNode = parentNode.child(index);
            const from = $pos.posAtIndex(index - 1, $pos.depth);
            const tr = state.tr;
            tr.delete(from, from + prevNode.nodeSize + currentNode.nodeSize);
            tr.insert(from, currentNode);
            tr.insert(from + currentNode.nodeSize, prevNode);
            dispatch(tr);
          }} title="Move Block Up">
            <span>↑ Up</span>
          </Btn>
          <Btn onClick={() => {
            const { state, dispatch } = editor.view;
            const { $from } = state.selection;
            const blockStart = $from.before($from.depth);
            const $pos = state.doc.resolve(blockStart);
            const index = $pos.index($pos.depth);
            const parentNode = $pos.parent;
            if (index >= parentNode.childCount - 1) return;
            const currentNode = parentNode.child(index);
            const nextNode = parentNode.child(index + 1);
            const from = $pos.posAtIndex(index, $pos.depth);
            const tr = state.tr;
            tr.delete(from, from + currentNode.nodeSize + nextNode.nodeSize);
            tr.insert(from, nextNode);
            tr.insert(from + nextNode.nodeSize, currentNode);
            dispatch(tr);
          }} title="Move Block Down">
            <span>↓ Down</span>
          </Btn>
          <Sep />
          {/* Delete selected node */}
          <Btn onClick={() => editor.chain().focus().deleteSelection().run()} title="Delete Selected">
            <span className="text-red-500">✕ Del</span>
          </Btn>
        </div>
      )}

      {/* Body: sidebar + centered page */}
      <div className="flex flex-1 min-h-0">
        {/* Case info sidebar */}
        {showCaseInfo && caseItem && (
          <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto no-print">
            <div className="px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: '#0b2652' }}>Case Information</h3>
              <span className="text-[10px] text-gray-400">Click any value to copy</span>
            </div>

            <div className="px-4 py-3 space-y-4 text-sm">
              <InfoSection title="Overview">
                <InfoRow label="Case #" value={caseItem.caseNumber} k="caseNumber" copiedKey={copiedKey} onCopy={copyToClipboard} />
                <InfoRow label="Type" value={caseItem.type} k="type" copiedKey={copiedKey} onCopy={copyToClipboard} />
                <InfoRow label="Status" value={caseItem.status} k="status" copiedKey={copiedKey} onCopy={copyToClipboard} />
                <InfoRow label="Priority" value={caseItem.priority} k="priority" copiedKey={copiedKey} onCopy={copyToClipboard} />
                <InfoRow label="Filed" value={caseItem.createdDate ? new Date(caseItem.createdDate).toLocaleDateString() : ''} k="createdDate" copiedKey={copiedKey} onCopy={copyToClipboard} />
                {caseItem.incidentDate && <InfoRow label="Incident" value={new Date(caseItem.incidentDate).toLocaleDateString()} k="incidentDate" copiedKey={copiedKey} onCopy={copyToClipboard} />}
                {caseItem.assignedTo && <InfoRow label="Assigned" value={caseItem.assignedTo} k="assignedTo" copiedKey={copiedKey} onCopy={copyToClipboard} />}
              </InfoSection>

              <InfoSection title="Student (Complainant)">
                <InfoRow label="Name" value={caseItem.studentName} k="studentName" copiedKey={copiedKey} onCopy={copyToClipboard} />
                <InfoRow label="ID" value={caseItem.studentId} k="studentId" copiedKey={copiedKey} onCopy={copyToClipboard} />
                {caseItem.studentDepartment && <InfoRow label="Dept" value={caseItem.studentDepartment} k="studentDepartment" copiedKey={copiedKey} onCopy={copyToClipboard} />}
                {caseItem.studentContact && <InfoRow label="Contact" value={caseItem.studentContact} k="studentContact" copiedKey={copiedKey} onCopy={copyToClipboard} />}
                {caseItem.studentAdvisorName && <InfoRow label="Advisor" value={caseItem.studentAdvisorName} k="studentAdvisorName" copiedKey={copiedKey} onCopy={copyToClipboard} />}
                {caseItem.studentFatherName && <InfoRow label="Father" value={caseItem.studentFatherName} k="studentFatherName" copiedKey={copiedKey} onCopy={copyToClipboard} />}
                {caseItem.studentFatherContact && <InfoRow label="Father Ph." value={caseItem.studentFatherContact} k="studentFatherContact" copiedKey={copiedKey} onCopy={copyToClipboard} />}
              </InfoSection>

              {(caseItem.complainants && caseItem.complainants.length > 0) && (
                <InfoSection title={`Additional Complainants (${caseItem.complainants.length})`}>
                  {caseItem.complainants.map((c, i) => (
                    <div key={c.id} className="border border-gray-100 rounded p-2 mb-2 last:mb-0">
                      <div className="text-[10px] text-gray-400 mb-1">#{i + 1}</div>
                      <InfoRow label="Name" value={c.name} k={`comp-n-${c.id}`} copiedKey={copiedKey} onCopy={copyToClipboard} />
                      <InfoRow label="ID" value={c.studentId} k={`comp-i-${c.id}`} copiedKey={copiedKey} onCopy={copyToClipboard} />
                      {c.department && <InfoRow label="Dept" value={c.department} k={`comp-d-${c.id}`} copiedKey={copiedKey} onCopy={copyToClipboard} />}
                      {c.contact && <InfoRow label="Contact" value={c.contact} k={`comp-c-${c.id}`} copiedKey={copiedKey} onCopy={copyToClipboard} />}
                    </div>
                  ))}
                </InfoSection>
              )}

              {(caseItem.accusedName || (caseItem.accusedPersons && caseItem.accusedPersons.length > 0)) && (
                <InfoSection title="Accused">
                  {caseItem.accusedName && (
                    <>
                      <InfoRow label="Name" value={caseItem.accusedName} k="accusedName" copiedKey={copiedKey} onCopy={copyToClipboard} />
                      {caseItem.accusedId && <InfoRow label="ID" value={caseItem.accusedId} k="accusedId" copiedKey={copiedKey} onCopy={copyToClipboard} />}
                      {caseItem.accusedDepartment && <InfoRow label="Dept" value={caseItem.accusedDepartment} k="accusedDepartment" copiedKey={copiedKey} onCopy={copyToClipboard} />}
                      {caseItem.accusedContact && <InfoRow label="Contact" value={caseItem.accusedContact} k="accusedContact" copiedKey={copiedKey} onCopy={copyToClipboard} />}
                      {caseItem.accusedGuardianContact && <InfoRow label="Guardian" value={caseItem.accusedGuardianContact} k="accusedGuardianContact" copiedKey={copiedKey} onCopy={copyToClipboard} />}
                    </>
                  )}
                  {caseItem.accusedPersons && caseItem.accusedPersons.map((a, i) => (
                    <div key={a.id} className="border border-gray-100 rounded p-2 mt-2">
                      <div className="text-[10px] text-gray-400 mb-1">#{i + 1}</div>
                      <InfoRow label="Name" value={a.name} k={`acc-n-${a.id}`} copiedKey={copiedKey} onCopy={copyToClipboard} />
                      <InfoRow label="ID" value={a.accusedStudentId} k={`acc-i-${a.id}`} copiedKey={copiedKey} onCopy={copyToClipboard} />
                      {a.department && <InfoRow label="Dept" value={a.department} k={`acc-d-${a.id}`} copiedKey={copiedKey} onCopy={copyToClipboard} />}
                      {a.contact && <InfoRow label="Contact" value={a.contact} k={`acc-c-${a.id}`} copiedKey={copiedKey} onCopy={copyToClipboard} />}
                    </div>
                  ))}
                </InfoSection>
              )}

              {caseItem.description && (
                <InfoSection title="Description">
                  <button
                    type="button"
                    onClick={() => copyToClipboard('description', caseItem.description)}
                    className="w-full text-left text-xs text-gray-700 bg-gray-50 hover:bg-blue-50 rounded p-2 whitespace-pre-wrap border border-gray-100"
                    title="Click to copy"
                  >
                    {caseItem.description}
                    <div className="text-[10px] text-blue-600 mt-1">{copiedKey === 'description' ? '✓ Copied' : 'Click to copy'}</div>
                  </button>
                </InfoSection>
              )}

              {caseItem.videoLink && (
                <InfoSection title="Video Evidence">
                  <InfoRow label="Link" value={caseItem.videoLink} k="videoLink" copiedKey={copiedKey} onCopy={copyToClipboard} />
                  <a href={caseItem.videoLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Open in new tab →</a>
                </InfoSection>
              )}

              {caseItem.documents && caseItem.documents.length > 0 && (
                <InfoSection title={`Documents (${caseItem.documents.length})`}>
                  <ul className="space-y-1">
                    {caseItem.documents.map((d, i) => (
                      <li key={d.id} className="text-xs text-gray-700 flex items-start gap-1.5">
                        <span className="text-gray-400">{i + 1}.</span>
                        <span className="flex-1 break-all">{d.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase flex-shrink-0">{d.type}</span>
                      </li>
                    ))}
                  </ul>
                </InfoSection>
              )}

              {caseItem.timeline && caseItem.timeline.length > 0 && (
                <InfoSection title={`Timeline (${caseItem.timeline.length})`}>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {caseItem.timeline.map(t => (
                      <div key={t.id} className="text-xs border-l-2 border-blue-200 pl-2">
                        <div className="font-medium text-gray-700">{t.action}</div>
                        <div className="text-gray-500">{t.description}</div>
                        <div className="text-[10px] text-gray-400">{t.user} &middot; {new Date(t.timestamp).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </InfoSection>
              )}

              {articles.length > 0 && (
                <InfoSection title={`Articles (${selectedArticleIds.size} selected)`}>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {articles.filter(a => a.isActive).map(a => (
                      <label key={a.id} className="flex items-start gap-1.5 cursor-pointer hover:bg-blue-50 rounded p-1 text-xs">
                        <input
                          type="checkbox"
                          checked={selectedArticleIds.has(a.id)}
                          onChange={() => {
                            setSelectedArticleIds(prev => {
                              const n = new Set(prev);
                              n.has(a.id) ? n.delete(a.id) : n.add(a.id);
                              return n;
                            });
                          }}
                          className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                        />
                        <span><strong>অনুচ্ছেদ {a.articleNo}:</strong> {a.title}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={insertArticles}
                    disabled={selectedArticleIds.size === 0}
                    className="mt-2 w-full px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Insert Selected ({selectedArticleIds.size})
                  </button>
                </InfoSection>
              )}
            </div>
          </aside>
        )}

        {/* Centered Google-Docs-style page surface */}
        <div className="flex-1 overflow-y-auto">
          <div className="gdocs-page">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && editor && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowPreview(false)} />
          <div className="fixed inset-4 z-50 flex items-start justify-center overflow-auto py-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-[900px] w-full relative">
              <div className="sticky top-0 bg-white border-b px-6 py-3 flex justify-between items-center rounded-t-xl z-10">
                <span className="font-semibold" style={{ color: '#0b2652' }}>Preview</span>
                <div className="flex gap-2">
                  <button onClick={() => { setShowPreview(false); window.print(); }} className="px-3 py-1.5 text-sm rounded-lg text-white" style={{ backgroundColor: '#0b2652' }}>Print</button>
                  <button onClick={() => setShowPreview(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">&times;</button>
                </div>
              </div>
              <style>{`
                .rp table{border-collapse:collapse;width:100%;margin:12px 0} .rp th,.rp td{border:1px solid #000;padding:8px;text-align:left;font-size:14px} .rp th{background:#f2f2f2}
                .rp h2{font-size:22px;margin:8px 0} .rp h3{font-size:16px;font-weight:bold;border-bottom:1px solid #000;padding-bottom:4px;margin:20px 0 10px}
                .rp img{max-width:80px;display:block;margin:0 auto} .rp p{margin:4px 0;line-height:1.6} .rp ul,.rp ol{padding-left:24px}
              `}</style>
              <div className="rp p-8" style={{ fontFamily: "'Noto Sans Bengali',Arial", color: '#000', maxWidth: 850, margin: '0 auto' }}
                dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
