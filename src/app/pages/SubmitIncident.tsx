import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { UploadIcon, ArrowRightIcon, ImageIcon, VideoIcon, FileIcon } from '../components/Icons';

type SubmissionType = null | 'type-1' | 'type-2';

export default function SubmitIncident() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<SubmissionType>(null);
  const [submitted, setSubmitted] = useState(false);

  // Type-1 form state
  const [t1Description, setT1Description] = useState('');
  const [t1Files, setT1Files] = useState<string[]>([]);

  // Type-2 form state
  const [t2Subject, setT2Subject] = useState('');
  const [t2Description, setT2Description] = useState('');
  const [t2Category, setT2Category] = useState('');
  const [t2Files, setT2Files] = useState<string[]>([]);
  const [t2IsConfidential, setT2IsConfidential] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
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
          <p className="text-sm text-gray-500 mb-6">
            Case Number: <span className="font-mono font-medium">CASE-2026-014</span>
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/cases')}
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: '#0b2652' }}
            >
              View My Cases
            </button>
            <button
              onClick={() => { setSubmitted(false); setSelectedType(null); }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>Submit Incident</h1>
        <p className="text-gray-600">Report an incident or file a formal case</p>
      </div>

      {/* Type Selection */}
      {selectedType === null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Type-1 Card */}
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

          {/* Type-2 Card */}
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

            {/* Flow indicator */}
            <div className="bg-blue-50 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm text-blue-700">
              <ArrowRightIcon />
              <span>This will be sent directly to: <strong>Proctor / Deputy Proctor</strong></span>
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

              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Evidence (Image/Video) *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <div className="flex justify-center mb-3">
                    <UploadIcon />
                  </div>
                  <p className="text-gray-600 mb-1">Drag & drop files here or click to browse</p>
                  <p className="text-xs text-gray-400">Supports: JPG, PNG, MP4, MOV (max 50MB)</p>
                </div>
              </div>

              {/* Mock uploaded files */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <ImageIcon />
                  <div className="flex-1">
                    <p className="text-sm font-medium">incident-photo.jpg</p>
                    <p className="text-xs text-gray-500">2.4 MB</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Uploaded</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="low">Low</option>
                  <option value="medium" selected>Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full py-3 rounded-lg text-white font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: '#0b2652' }}
              >
                Submit Instant Incident
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

            {/* Flow indicator */}
            <div className="bg-purple-50 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm text-purple-700">
              <ArrowRightIcon />
              <span>
                {t2IsConfidential
                  ? 'This will be routed to: Female Coordinator → Sexual Harassment Committee'
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

              {/* Confidential toggle */}
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

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supporting Documents</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                  <div className="flex justify-center mb-3">
                    <UploadIcon />
                  </div>
                  <p className="text-gray-600 mb-1">Drag & drop files here or click to browse</p>
                  <p className="text-xs text-gray-400">Supports: PDF, JPG, PNG, MP4, DOCX (max 50MB each)</p>
                </div>
              </div>

              {/* Mock uploaded files */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileIcon />
                  <div className="flex-1">
                    <p className="text-sm font-medium">evidence-document.pdf</p>
                    <p className="text-xs text-gray-500">1.8 MB</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Uploaded</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <ImageIcon />
                  <div className="flex-1">
                    <p className="text-sm font-medium">screenshot-proof.png</p>
                    <p className="text-xs text-gray-500">3.1 MB</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Uploaded</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                className={`w-full py-3 rounded-lg text-white font-medium transition-colors hover:opacity-90 ${
                  t2IsConfidential ? 'bg-red-600' : ''
                }`}
                style={t2IsConfidential ? {} : { backgroundColor: '#0b2652' }}
              >
                {t2IsConfidential ? 'Submit Confidential Case' : 'Submit Formal Case'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
