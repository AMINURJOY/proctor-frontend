import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { UploadIcon, ArrowRightIcon, ImageIcon, VideoIcon, FileIcon } from '../components/Icons';
import { casesApi, settingsApi, caseCategoriesApi, studentsApi, caseSubjectsApi } from '../services/api';
import { CaseCategory } from '../types';
import { toast } from 'sonner';

type SubmissionType = null | 'type-1' | 'type-2';

interface UploadedFile {
  file: File;
  preview?: string;
}

function getFileIcon(file: File) {
  if (file.type.startsWith('image/')) return <ImageIcon />;
  if (file.type.startsWith('video/')) return <VideoIcon />;
  return <FileIcon />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function SubmitIncident() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<SubmissionType>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [caseNumber, setCaseNumber] = useState('');

  // Type-1 form state
  const [t1Description, setT1Description] = useState('');
  const [t1Phone, setT1Phone] = useState('');
  const [t1Priority, setT1Priority] = useState('medium');
  const [t1Files, setT1Files] = useState<UploadedFile[]>([]);
  const [t1VideoLink, setT1VideoLink] = useState('');
  const [t1Latitude, setT1Latitude] = useState<number | null>(null);
  const [t1Longitude, setT1Longitude] = useState<number | null>(null);
  const [t1LocationDescription, setT1LocationDescription] = useState('');
  const [t1LocationLoading, setT1LocationLoading] = useState(false);
  const [t1CategoryId, setT1CategoryId] = useState('');
  const t1FileRef = useRef<HTMLInputElement>(null);

  // Type-2 form state
  const [t2Subject, setT2Subject] = useState('');
  const [t2SubjectId, setT2SubjectId] = useState('');
  const [subjects, setSubjects] = useState<{ id: string; subject: string }[]>([]);
  const [t2Gender, setT2Gender] = useState<'male' | 'female'>('male');
  const [t2Description, setT2Description] = useState('');
  const [t2CategoryId, setT2CategoryId] = useState('');
  const [t2Priority, setT2Priority] = useState('medium');
  const [t2Files, setT2Files] = useState<UploadedFile[]>([]);
  const [t2IncidentDate, setT2IncidentDate] = useState('');
  const [t2VideoLink, setT2VideoLink] = useState('');

  // Categories (admin-managed)
  const [categories, setCategories] = useState<CaseCategory[]>([]);
  // Multiple complainants (student details)
  const emptyComplainant = { name: '', studentId: '', department: '', contact: '', advisorName: '', fatherName: '', fatherContact: '' };
  const [complainants, setComplainants] = useState([{ ...emptyComplainant, name: currentUser?.name || '' }]);
  // Multiple accused
  const emptyAccused = { name: '', accusedStudentId: '', department: '', contact: '', guardianContact: '' };
  const [accusedPersons, setAccusedPersons] = useState([{ ...emptyAccused }]);
  const [showPreview, setShowPreview] = useState(false);
  // When true the preview modal acts as the confirm-before-submit step (shows "Confirm Submit").
  const [confirmMode, setConfirmMode] = useState(false);
  const [nextCaseNumber, setNextCaseNumber] = useState<string>('');

  // Open the Bangla report as a confirm-before-submit step, peeking the next case number.
  const openConfirmSubmit = async () => {
    try {
      const res = await casesApi.getNextNumber();
      setNextCaseNumber(res.data?.data || '');
    } catch { setNextCaseNumber(''); }
    setConfirmMode(true);
    setShowPreview(true);
  };

  // Auto-fill a complainant/accused row from the Students directory when an ID is entered.
  const autofillComplainant = async (index: number, studentId: string) => {
    const id = studentId.trim();
    if (!id) return;
    try {
      const res = await studentsApi.getByStudentId(id);
      const s = res.data.data;
      if (!s) return;
      setComplainants(prev => prev.map((c, i) => i !== index ? c : {
        ...c,
        name: s.name || c.name,
        department: s.department || c.department,
        contact: s.contact || c.contact,
        advisorName: s.advisorName || c.advisorName,
        fatherName: s.fatherName || c.fatherName,
        fatherContact: s.fatherContact || c.fatherContact,
      }));
      toast.success(`Loaded details for ${s.name}`);
    } catch {
      /* no matching student — leave fields as typed */
    }
  };

  // When a student is logged in, pre-fill the first Complainant row with their own directory
  // info so they don't have to re-type it. Falls back to just the name if the student record
  // isn't in the directory. Runs only when the user changes (or on first load) so manual edits
  // are preserved.
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student') return;

    let cancelled = false;
    studentsApi
      .getByStudentId(currentUser.id)
      .then((res) => {
        if (cancelled) return;
        const s = res?.data?.data;
        if (s) {
          setComplainants([
            {
              name: s.name || currentUser.name || '',
              studentId: s.studentId || currentUser.id || '',
              department: s.department || '',
              contact: s.contact || '',
              advisorName: s.advisorName || '',
              fatherName: s.fatherName || '',
              fatherContact: s.fatherContact || '',
            },
          ]);
        } else {
          setComplainants([{ ...emptyComplainant, name: currentUser.name || '' }]);
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Student not in directory — keep the name-only default so the student can type the rest.
        setComplainants([{ ...emptyComplainant, name: currentUser.name || '' }]);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const autofillAccused = async (index: number, studentId: string) => {
    const id = studentId.trim();
    if (!id) return;
    try {
      const res = await studentsApi.getByStudentId(id);
      const s = res.data.data;
      if (!s) return;
      setAccusedPersons(prev => prev.map((a, i) => i !== index ? a : {
        ...a,
        name: s.name || a.name,
        department: s.department || a.department,
        contact: s.contact || a.contact,
        guardianContact: s.guardianContact || a.guardianContact,
      }));
      toast.success(`Loaded details for ${s.name}`);
    } catch {
      /* no matching student — leave fields as typed */
    }
  };

  // Legacy single-field aliases for backward compat in preview
  const t2StudentDepartment = complainants[0]?.department || '';
  const t2StudentContact = complainants[0]?.contact || '';
  const t2AdvisorName = complainants[0]?.advisorName || '';
  const t2FatherName = complainants[0]?.fatherName || '';
  const t2FatherContact = complainants[0]?.fatherContact || '';
  const t2AccusedName = accusedPersons[0]?.name || '';
  const t2AccusedId = accusedPersons[0]?.accusedStudentId || '';
  const t2AccusedDepartment = accusedPersons[0]?.department || '';
  const t2AccusedContact = accusedPersons[0]?.contact || '';
  const t2GuardianContact = accusedPersons[0]?.guardianContact || '';


  // Configurable forwarding
  const [forwardingLabel, setForwardingLabel] = useState('Proctor / Deputy Proctor');

  useEffect(() => {
    settingsApi.getByKey('type1_forwarding_roles').then(res => {
      const setting = res.data.data || res.data;
      if (setting?.value) {
        const roles = setting.value.split(',').map((s: string) => s.trim()).filter(Boolean);
        const label = roles.map((r: string) =>
          r.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        ).join(' / ');
        if (label) setForwardingLabel(label);
      }
    }).catch(() => {});

    caseCategoriesApi.getAll().then(res => {
      const items: CaseCategory[] = res.data?.data || [];
      setCategories(items);
    }).catch(() => {});

    caseSubjectsApi.getAll().then(res => {
      const items = (res.data?.data || [])
        .filter((s: any) => s?.id && s?.subject)
        .map((s: any) => ({ id: String(s.id), subject: String(s.subject) }));
      setSubjects(items);
    }).catch(() => {});
  }, []);

  // Categories mapped to the chosen subject (superadmin maps each category to a subject).
  const subjectCategories = categories.filter(c =>
    c.isActive
    && (c.appliesToType === 'type-2' || c.appliesToType === 'both')
    && (t2SubjectId ? c.subjectId === t2SubjectId : false));

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setT1LocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setT1Latitude(pos.coords.latitude);
        setT1Longitude(pos.coords.longitude);
        setT1LocationLoading(false);
        toast.success('Location captured');
      },
      (err) => {
        setT1LocationLoading(false);
        const insecure = typeof window !== 'undefined' && !window.isSecureContext;
        const description = insecure
          ? 'Location requires a secure connection (https:// or localhost). Open the app over HTTPS and allow the location permission.'
          : err.message;
        toast.error('Could not get location', { description });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  const t2FileRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);

  const addFiles = (files: FileList | File[], target: 'type-1' | 'type-2') => {
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    if (target === 'type-1') {
      setT1Files(prev => [...prev, ...newFiles]);
    } else {
      setT2Files(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number, target: 'type-1' | 'type-2') => {
    if (target === 'type-1') {
      setT1Files(prev => {
        const removed = prev[index];
        if (removed.preview) URL.revokeObjectURL(removed.preview);
        return prev.filter((_, i) => i !== index);
      });
    } else {
      setT2Files(prev => {
        const removed = prev[index];
        if (removed.preview) URL.revokeObjectURL(removed.preview);
        return prev.filter((_, i) => i !== index);
      });
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent, target: 'type-1' | 'type-2') => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files, target);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>, target: 'type-1' | 'type-2') => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files, target);
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const data: any = {
        studentName: currentUser?.name || '',
        // Student ID is the numeric roll the student enters — never the internal account GUID.
        studentId: '',
        type: selectedType,
        description: selectedType === 'type-1' ? t1Description : t2Description,
        priority: selectedType === 'type-1' ? t1Priority : t2Priority,
      };
      if (selectedType === 'type-1') {
        data.videoLink = t1VideoLink || undefined;
        data.categoryId = t1CategoryId || undefined;
        if (t1Latitude !== null) data.incidentLatitude = t1Latitude;
        if (t1Longitude !== null) data.incidentLongitude = t1Longitude;
        if (t1LocationDescription.trim()) data.incidentLocationDescription = t1LocationDescription.trim();
        if (t1Phone.trim()) data.studentContact = t1Phone.trim();
      }
      if (selectedType === 'type-2') {
        data.subject = t2Subject;
        data.gender = t2Gender;
        // Use the first complainant's typed (numeric) ID as the case student ID.
        data.studentId = complainants[0]?.studentId?.trim() || '';
        data.categoryId = t2CategoryId || undefined;
        // Legacy single fields from first complainant/accused
        data.studentDepartment = t2StudentDepartment || undefined;
        data.studentContact = t2StudentContact || undefined;
        data.studentAdvisorName = t2AdvisorName || undefined;
        data.studentFatherName = t2FatherName || undefined;
        data.studentFatherContact = t2FatherContact || undefined;
        data.accusedName = t2AccusedName || undefined;
        data.accusedId = t2AccusedId || undefined;
        data.accusedDepartment = t2AccusedDepartment || undefined;
        data.accusedContact = t2AccusedContact || undefined;
        data.accusedGuardianContact = t2GuardianContact || undefined;
        data.videoLink = t2VideoLink || undefined;
        data.incidentDate = t2IncidentDate || undefined;
        // Multiple complainants and accused
        data.complainants = complainants.filter(c => c.name.trim()).map(c => ({
          name: c.name, studentId: c.studentId, department: c.department || undefined,
          contact: c.contact || undefined, advisorName: c.advisorName || undefined,
          fatherName: c.fatherName || undefined, fatherContact: c.fatherContact || undefined
        }));
        data.accusedPersons = accusedPersons.filter(a => a.name.trim()).map(a => ({
          name: a.name, accusedStudentId: a.accusedStudentId, department: a.department || undefined,
          contact: a.contact || undefined, guardianContact: a.guardianContact || undefined
        }));
      }

      const response = await casesApi.create(data);
      const created = response.data.data || response.data;
      const createdCaseId = created?.id;

      if (created?.caseNumber) {
        setCaseNumber(created.caseNumber);
      }

      // Upload files as documents if case was created
      const files = selectedType === 'type-1' ? t1Files : t2Files;
      if (createdCaseId && files.length > 0) {
        for (const f of files) {
          await casesApi.addDocument(createdCaseId, f.file);
        }
      }

      toast.success('Case submitted successfully!', { description: `Case number: ${created?.caseNumber || 'N/A'}` });
      setSubmitted(true);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to submit case';
      toast.error('Submission failed', { description: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white rounded-xl shadow-md p-10 border border-gray-100 max-w-md">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-green-100">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: '#0b2652' }}>
            {selectedType === 'type-1' ? 'Incident Submitted' : 'Case Submitted'}
          </h2>
          <p className="text-gray-600 mb-2">
            {selectedType === 'type-1'
              ? 'Your instant incident has been submitted and forwarded to the Proctor Office.'
              : 'Your formal case has been submitted and sent to the Coordinator for review.'
            }
          </p>
          {caseNumber && (
            <p className="text-sm text-gray-500 mb-6">
              Case Number: <span className="font-mono font-medium">{caseNumber}</span>
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/my-cases')}
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: '#0b2652' }}
            >
              View My Cases
            </button>
            <button
              onClick={() => {
                setSubmitted(false);
                setSelectedType(null);
                setT1Description('');
                setT1Files([]);
                setT1VideoLink('');
                setT1Latitude(null);
                setT1Longitude(null);
                setT1LocationDescription('');
                setT1CategoryId('');
                setT2Subject('');
                setT2Description('');
                setT2CategoryId('');
                setT2Files([]);
                setT2IncidentDate('');
                setT2VideoLink('');
                setComplainants([{ ...emptyComplainant, name: currentUser?.name || '' }]);
                setAccusedPersons([{ ...emptyAccused }]);
                setCaseNumber('');
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderFileUploadArea = (target: 'type-1' | 'type-2') => {
    const fileRef = target === 'type-1' ? t1FileRef : t2FileRef;
    const files = target === 'type-1' ? t1Files : t2Files;
    const acceptTypes = target === 'type-1'
      ? 'image/jpeg,image/png,image/gif,video/mp4,video/quicktime'
      : 'image/jpeg,image/png,image/gif,video/mp4,video/quicktime,application/pdf,.docx';
    const borderColor = target === 'type-1' ? 'hover:border-blue-400' : 'hover:border-purple-400';
    const activeBorder = target === 'type-1' ? 'border-blue-400 bg-blue-50' : 'border-purple-400 bg-purple-50';

    return (
      <>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={acceptTypes}
          onChange={(e) => handleFileSelect(e, target)}
          className="hidden"
        />
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, target)}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragOver ? activeBorder : `border-gray-300 ${borderColor}`
          }`}
        >
          <div className="flex justify-center mb-3">
            <UploadIcon />
          </div>
          <p className="text-gray-600 mb-1">
            {dragOver ? 'Drop files here...' : 'Drag & drop files here or click to browse'}
          </p>
          <p className="text-xs text-gray-400">
            {target === 'type-1'
              ? 'Supports: JPG, PNG, MP4, MOV (max 50MB)'
              : 'Supports: PDF, JPG, PNG, MP4, DOCX (max 50MB each)'}
          </p>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {f.preview ? (
                  <img src={f.preview} alt="" className="w-10 h-10 object-cover rounded" />
                ) : (
                  getFileIcon(f.file)
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.file.name}</p>
                  <p className="text-xs text-gray-500">{formatSize(f.file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i, target); }}
                  className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>Submit Incident</h1>
        <p className="text-gray-600">Report an incident or file a formal case</p>
      </div>

      {/* Type Selection */}
      {selectedType === null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <button
            onClick={() => setSelectedType('type-1')}
            className="bg-white rounded-xl shadow-md p-8 border-2 border-transparent hover:border-blue-500 hover:shadow-lg transition-all text-left group"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#0b2652' }}>
              Type-1: Instant Incident
            </h3>
            <p className="text-gray-600 mb-4">
              Quick submission with image/video evidence. Goes directly to the Proctor or Deputy Proctor for immediate action.
            </p>
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <span>Upload & Submit</span>
              <ArrowRightIcon />
            </div>
          </button>

          <button
            onClick={() => setSelectedType('type-2')}
            className="bg-white rounded-xl shadow-md p-8 border-2 border-transparent hover:border-purple-500 hover:shadow-lg transition-all text-left group"
          >
            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#0b2652' }}>
              Type-2: Formal Case
            </h3>
            <p className="text-gray-600 mb-4">
              Detailed formal case submission with documents. Goes through Coordinator verification before being forwarded.
            </p>
            <div className="flex items-center gap-2 text-purple-600 font-medium">
              <span>File Formal Case</span>
              <ArrowRightIcon />
            </div>
          </button>
        </div>
      )}

      {/* Type-1 Form */}
      {selectedType === 'type-1' && (
        <div className="max-w-2xl">
          <button
            onClick={() => setSelectedType(null)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            &larr; Back to type selection
          </button>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: '#0b2652' }}>Type-1: Instant Incident</h2>
                <p className="text-sm text-gray-500">Upload evidence and submit quickly</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm text-blue-700">
              <ArrowRightIcon />
              <span>This will be sent directly to: <strong>{forwardingLabel}</strong></span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incident Description *</label>
                <textarea
                  value={t1Description}
                  onChange={(e) => setT1Description(e.target.value)}
                  placeholder="Briefly describe what happened..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Evidence (Image/Video) *</label>
                {renderFileUploadArea('type-1')}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video Evidence (Google Drive Link)</label>
                <input
                  type="url"
                  value={t1VideoLink}
                  onChange={(e) => setT1VideoLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs mt-1 text-amber-700">
                  <span className="font-semibold">Caution:</span> Please make the Google Drive folder publicly accessible so that we can view your evidence.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={t1CategoryId}
                  onChange={(e) => setT1CategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category (optional)...</option>
                  {categories.filter(c => c.isActive && (c.appliesToType === 'type-1' || c.appliesToType === 'both')).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Incident Location</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={captureLocation}
                    disabled={t1LocationLoading}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-60"
                  >
                    {t1LocationLoading ? 'Getting location…' : (t1Latitude !== null ? 'Recapture' : 'Use my current location')}
                  </button>
                  {t1Latitude !== null && t1Longitude !== null && (
                    <a
                      href={`https://maps.google.com/?q=${t1Latitude},${t1Longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm hover:bg-blue-100"
                    >
                      View on Google Maps
                    </a>
                  )}
                </div>
                {t1Latitude !== null && t1Longitude !== null && (
                  <p className="text-xs text-gray-500 mt-1">
                    Lat: {t1Latitude.toFixed(6)}, Lng: {t1Longitude.toFixed(6)}
                  </p>
                )}
                <input
                  type="text"
                  value={t1LocationDescription}
                  onChange={(e) => setT1LocationDescription(e.target.value)}
                  placeholder="Describe the location (e.g. AB-4 Building, 3rd floor lobby)"
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={t1Phone}
                  onChange={(e) => setT1Phone(e.target.value)}
                  placeholder="Your contact phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !t1Description.trim()}
                className="w-full py-3 rounded-lg text-white font-medium transition-colors hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#0b2652' }}
              >
                {submitting ? 'Submitting...' : 'Submit Instant Incident'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Type-2 Form */}
      {selectedType === 'type-2' && (
        <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSelectedType(null)} className="text-blue-600 hover:text-blue-800">
              &larr; Back to type selection
            </button>
            <button
              type="button"
              disabled={!t2Description.trim() || !t2Subject.trim()}
              onClick={() => { setConfirmMode(false); setShowPreview(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Preview as PDF
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN - Main form (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: '#0b2652' }}>Type-2: Formal Case</h2>
                    <p className="text-sm text-gray-500">Detailed case submission with documentation</p>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-purple-700" style={{ display: 'none' }}>
                  <ArrowRightIcon />
                  <span>Sent to: Coordinator for verification. Confidential cases are determined by the selected category.</span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Case Subject *</label>
                      <select value={t2SubjectId}
                        onChange={e => {
                          const sid = e.target.value;
                          setT2SubjectId(sid);
                          setT2Subject(subjects.find(s => s.id === sid)?.subject || '');
                          setT2CategoryId(''); // reset category when subject changes
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                        <option value="">Select subject...</option>
                        {subjects.map(s => (<option key={s.id} value={s.id}>{s.subject}</option>))}
                      </select>
                      {subjects.length === 0 && (
                        <p className="text-xs text-gray-400 mt-1">No subjects configured yet. Ask an admin to add some in Settings → Case Subjects.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select value={t2CategoryId} onChange={e => setT2CategoryId(e.target.value)}
                        disabled={!t2SubjectId}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-400">
                        <option value="">{t2SubjectId ? 'Select category...' : 'Select a subject first'}</option>
                        {subjectCategories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                      {t2SubjectId && subjectCategories.length === 0 && (
                        <p className="text-xs text-gray-400 mt-1">No categories mapped to this subject. Ask an admin to map some in Settings → Case Categories.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <div className="flex items-center gap-6 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="t2Gender" value="male" checked={t2Gender === 'male'}
                          onChange={() => setT2Gender('male')}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700">Male</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="t2Gender" value="female" checked={t2Gender === 'female'}
                          onChange={() => setT2Gender('female')}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700">Female</span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-400 mt-1" style={{ display: 'none' }}>Female complainants are routed to the Female Coordinator; male to the Coordinator.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description *</label>
                    <textarea value={t2Description} onChange={e => setT2Description(e.target.value)}
                      placeholder="Provide a detailed description of the incident..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" rows={4} />
                  </div>
                </div>
              </div>

              {/* Student & Accused Details - Multiple entries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Complainants (Student Details) */}
                <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold" style={{ color: '#0b2652' }}>Complainants (অভিযোগকারী)</p>
                    <button type="button" onClick={() => setComplainants(prev => [...prev, { ...emptyComplainant }])}
                      className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100">+ Add Another</button>
                  </div>
                  <div className="space-y-4">
                    {complainants.map((c, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg relative">
                        {complainants.length > 1 && (
                          <button type="button" onClick={() => setComplainants(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xs">&times;</button>
                        )}
                        <p className="text-xs text-gray-500 mb-2">Person {i + 1}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input placeholder="Name (নাম)" value={c.name} onChange={e => { const u = [...complainants]; u[i] = { ...u[i], name: e.target.value }; setComplainants(u); }}
                            className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                          <input placeholder="ID (আইডি)" value={c.studentId}
                            onChange={e => { const u = [...complainants]; u[i] = { ...u[i], studentId: e.target.value }; setComplainants(u); }}
                            onBlur={e => autofillComplainant(i, e.target.value)}
                            className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                          <input placeholder="Department" value={c.department} onChange={e => { const u = [...complainants]; u[i] = { ...u[i], department: e.target.value }; setComplainants(u); }}
                            className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                          <input placeholder="Contact" value={c.contact} onChange={e => { const u = [...complainants]; u[i] = { ...u[i], contact: e.target.value }; setComplainants(u); }}
                            className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                          <input placeholder="Advisor Name" value={c.advisorName} onChange={e => { const u = [...complainants]; u[i] = { ...u[i], advisorName: e.target.value }; setComplainants(u); }}
                            className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                          <input placeholder="Father's Name" value={c.fatherName} onChange={e => { const u = [...complainants]; u[i] = { ...u[i], fatherName: e.target.value }; setComplainants(u); }}
                            className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accused Persons */}
                <div className="bg-white rounded-xl shadow-md p-5 border border-orange-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold" style={{ color: '#0b2652' }}>Accused (অভিযুক্ত)</p>
                    <button type="button" onClick={() => setAccusedPersons(prev => [...prev, { ...emptyAccused }])}
                      className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-600 hover:bg-orange-100">+ Add Another</button>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">যা যা তথ্য জানা আছে তা দিয়ে সাহায্য করুন</p>
                  <div className="space-y-4">
                    {accusedPersons.map((a, i) => (
                      <div key={i} className="p-3 bg-orange-50/50 rounded-lg relative">
                        {accusedPersons.length > 1 && (
                          <button type="button" onClick={() => setAccusedPersons(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xs">&times;</button>
                        )}
                        <p className="text-xs text-gray-500 mb-2">Person {i + 1}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input placeholder="Name (নাম)" value={a.name} onChange={e => { const u = [...accusedPersons]; u[i] = { ...u[i], name: e.target.value }; setAccusedPersons(u); }}
                            className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                          <input placeholder="ID (আইডি)" value={a.accusedStudentId}
                            onChange={e => { const u = [...accusedPersons]; u[i] = { ...u[i], accusedStudentId: e.target.value }; setAccusedPersons(u); }}
                            onBlur={e => autofillAccused(i, e.target.value)}
                            className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                          <input placeholder="Department" value={a.department} onChange={e => { const u = [...accusedPersons]; u[i] = { ...u[i], department: e.target.value }; setAccusedPersons(u); }}
                            className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                          <input placeholder="Contact" value={a.contact} onChange={e => { const u = [...accusedPersons]; u[i] = { ...u[i], contact: e.target.value }; setAccusedPersons(u); }}
                            className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                          <input placeholder="Guardian Contact" value={a.guardianContact} onChange={e => { const u = [...accusedPersons]; u[i] = { ...u[i], guardianContact: e.target.value }; setAccusedPersons(u); }}
                            className="col-span-2 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Documents, Video, Priority, Confidential (1/3 width) */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Documents (Photos & PDF)</label>
                {renderFileUploadArea('type-2')}
              </div>

              <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-1">Video Evidence (Google Drive Link)</label>
                <input type="url" value={t2VideoLink} onChange={e => setT2VideoLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                <p className="text-xs mt-1 text-amber-700">
                  <span className="font-semibold">Caution:</span> Please make the Google Drive folder publicly accessible so that we can view your evidence.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incident Date &amp; Time</label>
                  <input type="datetime-local" value={t2IncidentDate} onChange={e => setT2IncidentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>

              <button onClick={openConfirmSubmit} disabled={submitting || !t2Description.trim() || !t2Subject.trim() || !t2CategoryId}
                className="w-full py-3 rounded-lg text-white font-medium transition-colors hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#0b2652' }}>
                {submitting ? 'Submitting...' : 'Submit Formal Case'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowPreview(false)} />
          <div className="fixed inset-4 z-50 flex items-start justify-center overflow-auto py-8">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-10 relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold" style={{ color: '#0b2652' }}>রিপোর্ট প্রিভিউ</h3>
                <div className="flex gap-2">
                  <button onClick={() => { window.print(); }} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    প্রিন্ট / PDF সেভ করুন
                  </button>
                  <button onClick={() => setShowPreview(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>

              {/* Report Header */}
              <div className="text-center pb-4 mb-4 border-b-2 border-gray-300">
                <h2 className="text-xl font-bold" style={{ color: '#0b2652' }}>প্রক্টর অফিস ইনসিডেন্ট রিপোর্ট ফর্ম</h2>
                <p className="text-sm text-gray-500">ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটি, ড্যাফোডিল স্মার্ট সিটি</p>
              </div>

              <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>তারিখ: {new Date().toLocaleDateString()}</span>
                <span>কেস নম্বর: {nextCaseNumber || '—'}</span>
              </div>

              <div className="text-sm mb-3">
                <p><span className="text-gray-500">বরাবর,</span> <strong>প্রক্টর</strong>, ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটি</p>
                <p className="mt-1"><span className="text-gray-500">বিষয়: </span><strong>{t2Subject || '—'}</strong></p>
              </div>

              <div className="bg-gray-50 rounded p-4 mb-4 text-sm">
                <p className="text-gray-500 mb-1">জনাব,</p>
                <p className="text-gray-700 whitespace-pre-wrap">{t2Description || '—'}</p>
              </div>

              <p className="text-sm text-gray-500 mb-3">বিনীত,</p>

              {/* Complainants & Accused side by side — every person entered on the form is
                  listed, not just the first one. */}
              {(() => {
                const namedComplainants = complainants.filter(c => c.name.trim() || c.studentId.trim());
                const namedAccused = accusedPersons.filter(a => a.name.trim() || a.accusedStudentId.trim());
                const shownComplainants = namedComplainants.length > 0 ? namedComplainants : [complainants[0]];
                const shownAccused = namedAccused.length > 0 ? namedAccused : [accusedPersons[0]];
                const heading = (base: string, count: number) => count > 1 ? `${base} (${count} জন)` : base;

                return (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="border rounded p-4">
                      <p className="text-sm font-bold mb-3" style={{ color: '#0b2652' }}>
                        {heading('অভিযোগকারীর তথ্য', namedComplainants.length)}
                      </p>
                      <div className="space-y-4">
                        {shownComplainants.map((c, idx) => (
                          <div key={idx}>
                            {shownComplainants.length > 1 && (
                              <p className="text-xs font-semibold text-gray-400 mb-1">অভিযোগকারী {idx + 1}</p>
                            )}
                            {[
                              ['নাম', c?.name || (idx === 0 ? currentUser?.name : '')],
                              ['আইডি', c?.studentId],
                              ['ডিপার্টমেন্ট', c?.department],
                              ['কন্টাক্ট নাম্বার', c?.contact],
                              ['এডভাইজারের নাম', c?.advisorName],
                              ['বাবার নাম', c?.fatherName],
                              ['বাবার কন্টাক্ট নাম্বার', c?.fatherContact],
                            ].map(([label, val]) => (
                              <div key={label as string} className="flex justify-between py-0.5 border-b border-gray-100 text-sm">
                                <span className="text-gray-500">{label}:</span>
                                <span className="font-medium text-gray-700">{(val as string) || '—'}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border border-orange-200 rounded p-4 bg-orange-50/30">
                      <p className="text-sm font-bold mb-3" style={{ color: '#0b2652' }}>
                        {heading('অভিযুক্তের তথ্য', namedAccused.length)}
                      </p>
                      <div className="space-y-4">
                        {shownAccused.map((a, idx) => (
                          <div key={idx}>
                            {shownAccused.length > 1 && (
                              <p className="text-xs font-semibold text-gray-400 mb-1">অভিযুক্ত {idx + 1}</p>
                            )}
                            {[
                              ['নাম', a?.name],
                              ['আইডি', a?.accusedStudentId],
                              ['ডিপার্টমেন্ট', a?.department],
                              ['কন্টাক্ট নাম্বার', a?.contact],
                              ['অভিভাবকের নাম্বার', a?.guardianContact],
                            ].map(([label, val]) => (
                              <div key={label as string} className="flex justify-between py-0.5 border-b border-orange-100 text-sm">
                                <span className="text-gray-500">{label}:</span>
                                <span className="font-medium text-gray-700">{(val as string) || '—'}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Extra info */}
              <div className="grid grid-cols-2 gap-3 text-sm mb-4 p-3 bg-gray-50 rounded">
                <div><span className="text-gray-500">ক্যাটাগরি: </span><span className="font-medium">{categories.find(c => c.id === t2CategoryId)?.name || '—'}</span></div>
                <div><span className="text-gray-500">ঘটনার তারিখ: </span><span className="font-medium">{t2IncidentDate ? new Date(t2IncidentDate).toLocaleString() : '—'}</span></div>
              </div>

              {t2VideoLink && (
                <div className="text-sm mb-4 p-3 bg-blue-50 rounded">
                  <span className="text-gray-500">ভিডিও প্রমাণ: </span>
                  <span className="text-blue-600 break-all">{t2VideoLink}</span>
                </div>
              )}

              {t2Files.length > 0 && (
                <div className="text-sm mb-4">
                  <p className="text-gray-500 mb-1">সংযুক্ত ফাইল ({t2Files.length}):</p>
                  {t2Files.map((f, i) => <p key={i} className="text-gray-700">{f.file.name}</p>)}
                </div>
              )}

              {confirmMode ? (
                <div className="pt-4 border-t">
                  <p className="text-center text-xs text-gray-500 mb-3">জমা দেওয়ার আগে অনুগ্রহ করে রিপোর্টটি ভালোভাবে যাচাই করুন। নিশ্চিত হলে নিচের বাটনে ক্লিক করুন।</p>
                  <div className="flex justify-center gap-3">
                    <button onClick={() => setShowPreview(false)}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">
                      সম্পাদনা করুন
                    </button>
                    <button onClick={handleSubmit} disabled={submitting}
                      className="px-6 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: '#0b2652' }}>
                      {submitting ? 'জমা হচ্ছে...' : 'নিশ্চিত করে জমা দিন'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center pt-4 border-t text-xs text-gray-400">
                  এটি একটি প্রিভিউ। সংরক্ষণ করতে "প্রিন্ট / PDF সেভ করুন" ব্যবহার করুন।
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
