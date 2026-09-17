import { useEffect, useState } from 'react';
import { articlesApi } from '../../services/api';
import { toast } from 'sonner';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [newNo, setNewNo] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editNo, setEditNo] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => { fetchArticles(); }, []);
  const fetchArticles = async () => {
    try { const res = await articlesApi.getAll(); setArticles(res.data.data || []); } catch {}
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Manage Articles (অনুচ্ছেদ / Code of Conduct)</h3>
      <div className="space-y-2 mb-4">
        {articles.map((a: any) => (
          <div key={a.id} className="p-3 bg-gray-50 rounded-lg">
            {editId === a.id ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={editNo} onChange={e => setEditNo(e.target.value)} placeholder="No." className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" />
                </div>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" className="w-full px-2 py-1 border border-gray-300 rounded text-sm" rows={2} />
                <div className="flex gap-2">
                  <button onClick={async () => { await articlesApi.update(a.id, { articleNo: editNo, title: editTitle, description: editDesc }); setEditId(null); fetchArticles(); toast.success('Updated'); }}
                    className="px-3 py-1 text-xs rounded bg-green-600 text-white">Save</button>
                  <button onClick={() => setEditId(null)} className="px-3 py-1 text-xs rounded border border-gray-300">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-mono">{a.articleNo}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.description}</p>
                </div>
                <button onClick={() => { setEditId(a.id); setEditNo(a.articleNo); setEditTitle(a.title); setEditDesc(a.description); }} className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100">Edit</button>
                <button onClick={async () => { await articlesApi.delete(a.id); fetchArticles(); toast.success('Deleted'); }}
                  className="px-2 py-1 text-xs rounded text-red-600 hover:bg-red-50">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="bg-blue-50 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium text-blue-700">Add New Article</p>
        <div className="flex gap-2">
          <input value={newNo} onChange={e => setNewNo(e.target.value)} placeholder="Article No." className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm" />
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm" />
        </div>
        <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description..." className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" rows={2} />
        <button disabled={!newNo.trim() || !newTitle.trim()} onClick={() => {
          articlesApi.create({ articleNo: newNo, title: newTitle, description: newDesc }).then(() => {
            setNewNo(''); setNewTitle(''); setNewDesc(''); fetchArticles(); toast.success('Article added');
          });
        }} className="px-4 py-2 rounded-lg text-white text-sm disabled:opacity-50" style={{ backgroundColor: '#0b2652' }}>Add Article</button>
      </div>
    </div>
  );
}
