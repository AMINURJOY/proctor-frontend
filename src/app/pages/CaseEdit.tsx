import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { casesApi, caseCategoriesApi } from '../services/api';
import { Case, CaseCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const emptyComplainant = { name: '', studentId: '', department: '', contact: '', advisorName: '', fatherName: '', fatherContact: '' };
const emptyAccused = { name: '', accusedStudentId: '', department: '', contact: '', guardianContact: '' };

export default function CaseEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<CaseCategory[]>([]);

  // Editable state
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [categoryId, setCategoryId] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationDescription, setLocationDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [complainants, setComplainants] = useState<any[]>([{ ...emptyComplainant }]);
  const [accusedPersons, setAccusedPersons] = useState<any[]>([{ ...emptyAccused }]);

  useEffect(() => {
    const load = async () => {
      try {
        const [caseRes, catRes] = await Promise.all([
          casesApi.getById(id!),
          caseCategoriesApi.getAll(),
        ]);
        const c: Case = caseRes.data?.data || caseRes.data;
        setCaseItem(c);
        setDescription(c.description || '');
        setPriority(c.priority || 'medium');
        setCategoryId(c.categoryId || '');
        setLatitude(c.incidentLatitude ?? null);
        setLongitude(c.incidentLongitude ?? null);
        setLocationDescription(c.incidentLocationDescription || '');
        setIncidentDate(c.incidentDate ? c.incidentDate.slice(0, 10) : '');
        setVideoLink(c.videoLink || '');
        setComplainants((c.complainants && c.complainants.length > 0)
          ? c.complainants.map(x => ({
              name: x.name || '', studentId: x.studentId || '', department: x.department || '',
              contact: x.contact || '', advisorName: x.advisorName || '', fatherName: x.fatherName || '',
              fatherContact: x.fatherContact || '',
            }))
          : [{ ...emptyComplainant }]);
        setAccusedPersons((c.accusedPersons && c.accusedPersons.length > 0)
          ? c.accusedPersons.map(x => ({
              name: x.name || '', accusedStudentId: x.accusedStudentId || '', department: x.department || '',
              contact: x.contact || '', guardianContact: x.guardianContact || '',
            }))
          : [{ ...emptyAccused }]);
        setCategories(catRes.data?.data || []);
      } catch (err: any) {
        toast.error('Failed to load case', { description: err?.response?.data?.message || '' });
        setCaseItem(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl mb-4" style={{ color: '#0b2652' }}>Case Not Found</h2>
        <button onClick={() => navigate('/my-cases')} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#0b2652' }}>
          Back
        </button>
      </div>
    );
  }

  const isOwner = caseItem.submittedByUserId === currentUser?.id || caseItem.studentId === currentUser?.id;
  if (!isOwner) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl mb-4 text-red-600">You can only edit cases you submitted.</h2>
        <button onClick={() => navigate(`/cases/${caseItem.id}`)} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#0b2652' }}>
          Back to Case
        </button>
      </div>
    );
  }

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        toast.success('Location captured');
      },
      (err) => toast.error('Could not get location', { description: err.message }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        description,
        priority,
        categoryId: categoryId || undefined,
        videoLink: videoLink || undefined,
      };
      if (caseItem.type === 'type-1') {
        if (latitude !== null) payload.incidentLatitude = latitude;
        if (longitude !== null) payload.incidentLongitude = longitude;
        if (locationDescription) payload.incidentLocationDescription = locationDescription;
      }
      if (caseItem.type === 'type-2') {
        if (incidentDate) payload.incidentDate = incidentDate;
        payload.complainants = complainants.filter(c => c.name && c.name.trim()).map(c => ({
          name: c.name, studentId: c.studentId, department: c.department || undefined,
          contact: c.contact || undefined, advisorName: c.advisorName || undefined,
          fatherName: c.fatherName || undefined, fatherContact: c.fatherContact || undefined
        }));
        payload.accusedPersons = accusedPersons.filter(a => a.name && a.name.trim()).map(a => ({
          name: a.name, accusedStudentId: a.accusedStudentId, department: a.department || undefined,
          contact: a.contact || undefined, guardianContact: a.guardianContact || undefined
        }));
      }
      await casesApi.update(caseItem.id, payload);
      toast.success('Case updated');
      navigate(`/cases/${caseItem.id}`);
    } catch (err: any) {
      toast.error('Update failed', { description: err?.response?.data?.message || '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button onClick={() => navigate(`/cases/${caseItem.id}`)} className="text-blue-600 hover:text-blue-800 mb-4">
        &larr; Back to case
      </button>

      <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>Edit Case {caseItem.caseNumber}</h1>
      <p className="text-gray-600 mb-6">You can update your case details below.</p>

      <div className="space-y-6 max-w-4xl">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 space-y-4">
          <h3 className="text-lg font-medium" style={{ color: '#0b2652' }}>Basic Details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— None —</option>
                {categories
                  .filter(c => c.isActive && (
                    c.appliesToType === 'both' ||
                    (caseItem.type === 'type-1' && c.appliesToType === 'type-1') ||
                    (caseItem.type !== 'type-1' && c.appliesToType === 'type-2')
                  ))
                  .map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video Evidence Link</label>
            <input type="url" value={videoLink} onChange={(e) => setVideoLink(e.target.value)}
              placeholder="https://drive.google.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {caseItem.type === 'type-1' && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 space-y-3">
            <h3 className="text-lg font-medium" style={{ color: '#0b2652' }}>Incident Location</h3>
            <div className="flex gap-2 items-center">
              <button type="button" onClick={captureLocation}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
                {latitude !== null ? 'Recapture current location' : 'Use my current location'}
              </button>
              {latitude !== null && longitude !== null && (
                <a href={`https://maps.google.com/?q=${latitude},${longitude}`} target="_blank" rel="noreferrer"
                  className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm hover:bg-blue-100">
                  View on Google Maps
                </a>
              )}
              {latitude !== null && longitude !== null && (
                <span className="text-xs text-gray-500">{latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
              )}
            </div>
            <input type="text" value={locationDescription} onChange={(e) => setLocationDescription(e.target.value)}
              placeholder="Location description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}

        {caseItem.type === 'type-2' && (
          <>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">Incident Date</label>
              <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium" style={{ color: '#0b2652' }}>Complainants</h3>
                <button type="button" onClick={() => setComplainants(prev => [...prev, { ...emptyComplainant }])}
                  className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100">+ Add</button>
              </div>
              <div className="space-y-3">
                {complainants.map((c, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg relative">
                    {complainants.length > 1 && (
                      <button type="button" onClick={() => setComplainants(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xs">&times;</button>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Name" value={c.name} onChange={e => { const u = [...complainants]; u[i] = { ...u[i], name: e.target.value }; setComplainants(u); }} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      <input placeholder="Student ID" value={c.studentId} onChange={e => { const u = [...complainants]; u[i] = { ...u[i], studentId: e.target.value }; setComplainants(u); }} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      <input placeholder="Department" value={c.department} onChange={e => { const u = [...complainants]; u[i] = { ...u[i], department: e.target.value }; setComplainants(u); }} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      <input placeholder="Contact" value={c.contact} onChange={e => { const u = [...complainants]; u[i] = { ...u[i], contact: e.target.value }; setComplainants(u); }} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      <input placeholder="Advisor Name" value={c.advisorName} onChange={e => { const u = [...complainants]; u[i] = { ...u[i], advisorName: e.target.value }; setComplainants(u); }} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      <input placeholder="Father's Name" value={c.fatherName} onChange={e => { const u = [...complainants]; u[i] = { ...u[i], fatherName: e.target.value }; setComplainants(u); }} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium" style={{ color: '#0b2652' }}>Accused</h3>
                <button type="button" onClick={() => setAccusedPersons(prev => [...prev, { ...emptyAccused }])}
                  className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-600 hover:bg-orange-100">+ Add</button>
              </div>
              <div className="space-y-3">
                {accusedPersons.map((a, i) => (
                  <div key={i} className="p-3 bg-orange-50/50 rounded-lg relative">
                    {accusedPersons.length > 1 && (
                      <button type="button" onClick={() => setAccusedPersons(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xs">&times;</button>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Name" value={a.name} onChange={e => { const u = [...accusedPersons]; u[i] = { ...u[i], name: e.target.value }; setAccusedPersons(u); }} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      <input placeholder="Student ID" value={a.accusedStudentId} onChange={e => { const u = [...accusedPersons]; u[i] = { ...u[i], accusedStudentId: e.target.value }; setAccusedPersons(u); }} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      <input placeholder="Department" value={a.department} onChange={e => { const u = [...accusedPersons]; u[i] = { ...u[i], department: e.target.value }; setAccusedPersons(u); }} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      <input placeholder="Contact" value={a.contact} onChange={e => { const u = [...accusedPersons]; u[i] = { ...u[i], contact: e.target.value }; setAccusedPersons(u); }} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                      <input placeholder="Guardian Contact" value={a.guardianContact} onChange={e => { const u = [...accusedPersons]; u[i] = { ...u[i], guardianContact: e.target.value }; setAccusedPersons(u); }} className="col-span-2 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3 justify-end">
          <button onClick={() => navigate(`/cases/${caseItem.id}`)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !description.trim()}
            className="px-4 py-2 rounded-lg text-white hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#0b2652' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
