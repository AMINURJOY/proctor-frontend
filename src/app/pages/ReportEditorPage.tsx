import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Image } from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { casesApi, articlesApi, aiApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Case, Article } from '../types';
import { toast } from 'sonner';
import { exportReportToPdf, inlineImagesAsBase64, BANGLA_FONT_STACK, generateReportHTML } from '../utils/pdfExport';
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
  const [searchParams] = useSearchParams();
  const targetReportId = searchParams.get('reportId') || '';
  const { currentUser } = useAuth();
  // A report may only be edited by its author. `false` puts the editor in read-only mode.
  const [canEditReport, setCanEditReport] = useState(true);
  const [reportAuthor, setReportAuthor] = useState('');
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticleIds, setSelectedArticleIds] = useState<Set<string>>(new Set());
  const [existingReportId, setExistingReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCaseInfo, setShowCaseInfo] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  // "Create report with AI" modal
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLanguage, setAiLanguage] = useState<'bangla' | 'english'>('bangla');
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
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
        if (c.type !== 'type-2' && c.type !== 'confidential') {
          toast.error('Only Type-2 cases can have investigation reports.');
          navigate('/reports', { replace: true });
          return;
        }
        setCaseItem(c); setArticles(arts);
        const reportsRes = await casesApi.getReports(caseId!);
        const reports = reportsRes.data.data || [];
        // Open the report named in ?reportId= (from the Draft Reports list); otherwise fall
        // back to the most recent one, which is what the plain /edit link has always shown.
        const target = (targetReportId && reports.find((r: any) => r.id === targetReportId))
          || (reports.length > 0 ? reports[reports.length - 1] : null);
        if (target) {
          setExistingReportId(target.id);
          // Only the author may edit. Legacy reports carry no author id, so they stay editable.
          const mine = target.createdById
            ? target.createdById === currentUser?.id
            : target.createdByName === currentUser?.name;
          setCanEditReport(mine);
          setReportAuthor(target.createdByName || '');
          editor?.commands.setContent(target.content || generateReportHTML(c));
        } else {
          setCanEditReport(true);
          editor?.commands.setContent(generateReportHTML(c));
        }
      } catch { toast.error('Failed to load case data'); } finally { setLoading(false); }
    };
    if (caseId && editor) fetchData();
  }, [caseId, editor, targetReportId, currentUser?.id, currentUser?.name, navigate]);

  // Someone else's report is shown but not editable.
  useEffect(() => {
    editor?.setEditable(canEditReport);
  }, [editor, canEditReport]);

  const handleSave = useCallback(async (isDraft: boolean, isFinal: boolean) => {
    if (!editor || !caseId) return;
    if (!canEditReport) {
      toast.error(`Only ${reportAuthor || 'the author'} can edit this report.`);
      return;
    }
    setSaving(true);
    try {
      const data = { content: editor.getHTML(), isDraft, isFinal };
      if (existingReportId) { await casesApi.updateReport(caseId, existingReportId, data); }
      else { const res = await casesApi.createReport(caseId, data); setExistingReportId(res.data.data?.id || null); }
      toast.success(isDraft ? 'Draft saved' : 'Report finalized');
      if (isFinal) navigate('/completed-reports');
    } catch (err: any) { toast.error('Save failed', { description: err?.response?.data?.message || 'Error' }); }
    finally { setSaving(false); }
  }, [editor, caseId, existingReportId, canEditReport, reportAuthor, navigate]);

  // Ask Gemini to draft the report from the case record, then drop the HTML into the editor.
  // Nothing is saved automatically — the officer reviews and edits before hitting Save Draft.
  const handleGenerateWithAi = useCallback(async () => {
    if (!editor || !caseId) return;
    setAiBusy(true);
    try {
      const res = await aiApi.generateReport(caseId, {
        language: aiLanguage,
        instructions: aiInstructions.trim() || undefined,
      });
      const html = res.data.data?.html || '';
      if (!html) { toast.error('The AI returned an empty report'); return; }
      editor.commands.setContent(html);

      // If the report on screen belonged to someone else, the generated text becomes a brand new
      // report owned by the current user — dropping existingReportId makes Save create rather
      // than update, so the other author's report is left untouched.
      const startedNewReport = !canEditReport;
      if (startedNewReport) {
        setExistingReportId(null);
        setCanEditReport(true);
      }

      setAiOpen(false);
      setAiInstructions('');
      toast.success('Draft generated', {
        description: startedNewReport
          ? 'Saved as a new report of your own. Review it carefully before saving.'
          : 'Review the content carefully before saving.',
      });
    } catch (err: any) {
      toast.error('AI generation failed', { description: err?.response?.data?.message || 'Check Settings → AI Integration.' });
    } finally { setAiBusy(false); }
  }, [editor, caseId, aiLanguage, aiInstructions, canEditReport]);



  const handleExportDocx = useCallback(async () => {
    if (!editor) return;
    try {
      const inlined = await inlineImagesAsBase64(editor.getHTML());
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><style>body{font-family:'July','Noto Sans Bengali',Arial;font-size:14px;max-width:850px;margin:0 auto}table{border-collapse:collapse;width:100%;margin-bottom:16px}th,td{border:1px solid #000;padding:8px}th{background:#f2f2f2}h3{font-size:16px;border-bottom:1px solid #000;padding-bottom:4px;margin-top:20px}img{width:80px;height:auto;display:block;margin:0 auto}ul{list-style:disc outside;padding-left:28px;margin:8px 0}ol{list-style:decimal outside;padding-left:28px;margin:8px 0}li{margin:2px 0}</style></head><body>${inlined}</body></html>`;
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
    let html = editor.getHTML();
    if (caseItem?.verdict) {
      if (html.includes('[ডিসিপ্লিনারি কমিটি চূড়ান্ত সিদ্ধান্ত প্রদান করবে]')) {
        html = html.replace('[ডিসিপ্লিনারি কমিটি চূড়ান্ত সিদ্ধান্ত প্রদান করবে]', caseItem.verdict.replace(/\n/g, '<br>'));
      } else {
        html += `
          <div style="margin-top: 48px; border-top: 2px solid #ccc; padding-top: 24px;">
            <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 12px; color: #0b2652;">চূড়ান্ত সিদ্ধান্ত (Final Punishment):</h3>
            <p style="white-space: pre-wrap; color: #1f2937; line-height: 1.6; font-size: 16px;">${caseItem.verdict}</p>
          </div>`;
      }
    }
    await exportReportToPdf(html, caseItem?.caseNumber || 'case');
  }, [editor, caseItem]);

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
        .report-tiptap-editor { font-family: ${BANGLA_FONT_STACK}; font-size: 14px; line-height: 1.6; color: #000; }
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
          {/* Drafting with AI is always available — it writes a NEW report of your own, so it is
              never blocked by someone else owning the report currently on screen, nor by the
              case being closed. Only editing an existing report is ownership-restricted. */}
          <button onClick={() => setAiOpen(true)}
            title="Draft this report automatically from the case record"
            className="px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
              <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
            </svg>
            Create with AI
          </button>
          {canEditReport ? (
            <>
              <button disabled={saving} onClick={() => handleSave(true, false)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">{saving ? '...' : 'Save Draft'}</button>
              <button disabled={saving} onClick={() => handleSave(false, true)} className="px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">Finalize</button>
            </>
          ) : (
            <span className="px-3 py-1.5 text-sm rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
              Read-only — {reportAuthor || 'the author'}'s report. Use “Create with AI” to start your own.
            </span>
          )}
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

      {/* Create-with-AI Modal */}
      {aiOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => !aiBusy && setAiOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold mb-1" style={{ color: '#0b2652' }}>Create Report with AI</h3>
              <p className="text-xs text-gray-500 mb-4">
                The case record — complainants, accused, hearings, notes and evidence — is sent to the
                configured AI model, which returns a full report in the standard Proctor Office format.
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-1.5">Report language</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {([
                  { id: 'bangla', label: 'বাংলা', sub: 'Bangla' },
                  { id: 'english', label: 'English', sub: 'English' },
                ] as const).map(opt => (
                  <button key={opt.id} type="button" onClick={() => setAiLanguage(opt.id)}
                    className={`px-4 py-3 rounded-lg border text-left transition-colors ${
                      aiLanguage === opt.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.sub}</div>
                  </button>
                ))}
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extra instructions <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea value={aiInstructions} onChange={e => setAiInstructions(e.target.value)} rows={3}
                placeholder="e.g. emphasise the CCTV evidence; recommend suspension rather than expulsion"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3" />

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-800">
                  The generated draft replaces the current editor content and is <strong>not</strong> saved
                  automatically. Verify every name, date and finding before saving — AI output can be wrong.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button disabled={aiBusy} onClick={() => setAiOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button disabled={aiBusy} onClick={handleGenerateWithAi}
                  className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {aiBusy && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {aiBusy ? 'Generating…' : 'Generate Report'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Preview Modal */}
      {showPreview && editor && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowPreview(false)} />
          <div className="fixed inset-4 z-50 flex items-start justify-center overflow-auto py-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-[900px] w-full relative">
              <div className="sticky top-0 bg-white border-b px-6 py-3 flex justify-between items-center rounded-t-xl z-10">
                <span className="font-semibold" style={{ color: '#0b2652' }}>Preview</span>
                <div className="flex gap-2">
                  <button onClick={() => {
                    let html = editor.getHTML();
                    if (caseItem?.verdict) {
                      if (html.includes('[ডিসিপ্লিনারি কমিটি চূড়ান্ত সিদ্ধান্ত প্রদান করবে]')) {
                        html = html.replace('[ডিসিপ্লিনারি কমিটি চূড়ান্ত সিদ্ধান্ত প্রদান করবে]', caseItem.verdict.replace(/\n/g, '<br>'));
                      } else {
                        html += `
                          <div style="margin-top: 48px; border-top: 2px solid #ccc; padding-top: 24px;">
                            <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 12px; color: #0b2652;">চূড়ান্ত সিদ্ধান্ত (Final Punishment):</h3>
                            <p style="white-space: pre-wrap; color: #1f2937; line-height: 1.6; font-size: 16px;">${caseItem.verdict}</p>
                          </div>`;
                      }
                    }
                    exportReportToPdf(html, caseItem?.caseNumber || 'case');
                  }} className="px-3 py-1.5 text-sm rounded-lg text-white" style={{ backgroundColor: '#0b2652' }}>Print</button>
                  <button onClick={() => setShowPreview(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">&times;</button>
                </div>
              </div>
              <style>{`
                .rp table{border-collapse:collapse;width:100%;margin:12px 0} .rp th,.rp td{border:1px solid #000;padding:8px;text-align:left;font-size:14px} .rp th{background:#f2f2f2}
                .rp h2{font-size:22px;margin:8px 0} .rp h3{font-size:16px;font-weight:bold;border-bottom:1px solid #000;padding-bottom:4px;margin:20px 0 10px}
                .rp img{max-width:80px;display:block;margin:0 auto} .rp p{margin:4px 0;line-height:1.6} .rp ul,.rp ol{padding-left:24px}
              `}</style>
              <div className="rp p-8 pb-0" style={{ fontFamily: BANGLA_FONT_STACK, color: '#000', maxWidth: 850, margin: '0 auto' }}
                dangerouslySetInnerHTML={{
                  __html: caseItem?.verdict
                    ? (editor.getHTML().includes('[ডিসিপ্লিনারি কমিটি চূড়ান্ত সিদ্ধান্ত প্রদান করবে]')
                        ? editor.getHTML().replace('[ডিসিপ্লিনারি কমিটি চূড়ান্ত সিদ্ধান্ত প্রদান করবে]', caseItem.verdict.replace(/\n/g, '<br>'))
                        : editor.getHTML() + `
                          <div style="margin-top: 24px; border-top: 2px solid #ccc; padding-top: 16px;">
                            <h3 style="font-weight: bold; font-size: 18px; margin-bottom: 12px; color: #0b2652;">চূড়ান্ত সিদ্ধান্ত (Final Punishment):</h3>
                            <p style="white-space: pre-wrap; color: #1f2937; line-height: 1.6; font-size: 16px;">${caseItem.verdict}</p>
                          </div>`)
                    : editor.getHTML()
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
