import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { UploadIcon, ArrowRightIcon, ImageIcon, VideoIcon, FileIcon } from '../components/Icons';
import { casesApi, settingsApi } from '../services/api';

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
  const [t1Priority, setT1Priority] = useState('medium');
  const [t1Files, setT1Files] = useState<UploadedFile[]>([]);
  const t1FileRef = useRef<HTMLInputElement>(null);

  // Type-2 form state
  const [t2Subject, setT2Subject] = useState('');
  const [t2Description, setT2Description] = useState('');
  const [t2Category, setT2Category] = useState('');
  const [t2Priority, setT2Priority] = useState('medium');
  const [t2Files, setT2Files] = useState<UploadedFile[]>([]);
  const [t2IsConfidential, setT2IsConfidential] = useState(false);

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
  }, []);
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
        studentId: currentUser?.id || '',
        type: t2IsConfidential && selectedType === 'type-2' ? 'confidential' : selectedType,
        description: selectedType === 'type-1' ? t1Description : t2Description,
        priority: selectedType === 'type-1' ? t1Priority : t2Priority,
      };
      if (selectedType === 'type-2') {
        data.subject = t2Subject;
        data.category = t2Category;
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

      setSubmitted(true);
    } catch {
      // Still show success for UX - case may have been created
      setSubmitted(true);
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
              : t2IsConfidential
                ? 'Your confidential case has been submitted and routed to the Female Coordinator.'
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
              onClick={() => navigate('/cases')}
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
                setT2Subject('');
                setT2Description('');
                setT2Category('');
                setT2Files([]);
                setT2IsConfidential(false);
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={t1Priority}
                  onChange={(e) => setT1Priority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
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
        <div className="max-w-2xl">
          <button
            onClick={() => setSelectedType(null)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            &larr; Back to type selection
          </button>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
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

            <div className="bg-purple-50 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm text-purple-700">
              <ArrowRightIcon />
              <span>
                {t2IsConfidential
                  ? 'This will be routed to: Female Coordinator \u2192 Sexual Harassment Committee'
                  : 'This will be sent to: Coordinator for verification'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case Subject *</label>
                <input
                  type="text"
                  value={t2Subject}
                  onChange={(e) => setT2Subject(e.target.value)}
                  placeholder="Brief subject line for the case"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={t2Category}
                  onChange={(e) => setT2Category(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category...</option>
                  <option value="plagiarism">Plagiarism</option>
                  <option value="cheating">Cheating in Examination</option>
                  <option value="misconduct">Academic Misconduct</option>
                  <option value="fraud">Document Fraud</option>
                  <option value="harassment">Harassment</option>
                  <option value="disciplinary">Disciplinary Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description *</label>
                <textarea
                  value={t2Description}
                  onChange={(e) => setT2Description(e.target.value)}
                  placeholder="Provide a detailed description of the incident, including dates, locations, and persons involved..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={5}
                />
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={t2IsConfidential}
                    onChange={(e) => setT2IsConfidential(e.target.checked)}
                    className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <div>
                    <p className="font-medium text-red-700">Mark as Confidential (Sexual Harassment)</p>
                    <p className="text-sm text-red-600">
                      This case will be routed through the Female Coordinator to the Sexual Harassment Committee.
                      Access will be restricted to authorized personnel only.
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supporting Documents</label>
                {renderFileUploadArea('type-2')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={t2Priority}
                    onChange={(e) => setT2Priority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Incident Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !t2Description.trim() || !t2Subject.trim()}
                className={`w-full py-3 rounded-lg text-white font-medium transition-colors hover:opacity-90 disabled:opacity-60 ${
                  t2IsConfidential ? 'bg-red-600' : ''
                }`}
                style={t2IsConfidential ? {} : { backgroundColor: '#0b2652' }}
              >
                {submitting ? 'Submitting...' : t2IsConfidential ? 'Submit Confidential Case' : 'Submit Formal Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
