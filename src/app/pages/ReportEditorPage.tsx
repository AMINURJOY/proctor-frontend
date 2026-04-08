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

  const handleExportDocx = useCallback(() => {
    if (!editor) return;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><style>body{font-family:'Noto Sans Bengali',Arial;font-size:14px;max-width:850px;margin:0 auto}table{border-collapse:collapse;width:100%;margin-bottom:16px}th,td{border:1px solid #000;padding:8px}th{background:#f2f2f2}h3{font-size:16px;border-bottom:1px solid #000;padding-bottom:4px;margin-top:20px}img{max-width:80px;display:block;margin:0 auto}</style></head><body>${editor.getHTML()}</body></html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `report-${caseItem?.caseNumber || 'case'}.doc`; a.click();
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
    <div>
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
        .report-tiptap-editor ul, .report-tiptap-editor ol { padding-left: 24px; }
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
        @media print { .no-print { display: none !important; } .report-tiptap-editor { padding: 0 !important; } }
      `}</style>

      {/* Header buttons */}
      <div className="flex items-center justify-between mb-3 no-print">
        <div>
          <button onClick={() => navigate('/reports')} className="text-blue-600 hover:text-blue-800 text-sm">&larr; Back</button>
          <h1 className="text-lg font-bold" style={{ color: '#0b2652' }}>Report: {caseItem?.caseNumber}</h1>
        </div>
        <div className="flex gap-2">
          <button disabled={saving} onClick={() => handleSave(true, false)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50">{saving ? '...' : 'Save Draft'}</button>
          <button disabled={saving} onClick={() => handleSave(false, true)} className="px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">Finalize</button>
          <button onClick={() => window.print()} className="px-3 py-1.5 text-sm rounded-lg text-white" style={{ backgroundColor: '#0b2652' }}>Print</button>
          <button onClick={handleExportDocx} className="px-3 py-1.5 text-sm rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50">DOCX</button>
          <button onClick={() => setShowPreview(true)} className="px-3 py-1.5 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700">Preview</button>
        </div>
      </div>

      {/* Article selector */}
      {articles.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 mb-3 no-print">
          <details>
            <summary className="text-sm font-semibold text-gray-700 cursor-pointer">প্রযোজ্য অনুচ্ছেদ নির্বাচন করুন (Articles) — {selectedArticleIds.size} selected</summary>
            <div className="space-y-1 max-h-36 overflow-y-auto mt-2">
              {articles.filter(a => a.isActive).map(a => (
                <label key={a.id} className="flex items-start gap-2 cursor-pointer hover:bg-blue-50 rounded p-1 text-sm">
                  <input type="checkbox" checked={selectedArticleIds.has(a.id)} onChange={() => { setSelectedArticleIds(prev => { const n = new Set(prev); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n; }); }} className="w-4 h-4 mt-0.5" />
                  <span><strong>অনুচ্ছেদ {a.articleNo}:</strong> {a.title} - {a.description}</span>
                </label>
              ))}
            </div>
            <button onClick={insertArticles} disabled={selectedArticleIds.size === 0} className="mt-2 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Insert ({selectedArticleIds.size})</button>
          </details>
        </div>
      )}

      {/* Toolbar */}
      {editor && (
        <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 px-2 py-1.5 flex flex-wrap gap-0.5 items-center sticky top-0 z-20 no-print">
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
          <Btn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">Table+</Btn>
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

      {/* Editor */}
      <div className="bg-white rounded-b-xl shadow-md border border-gray-200">
        <EditorContent editor={editor} />
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
