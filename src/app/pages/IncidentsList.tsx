import { useState } from 'react';
import { useNavigate } from 'react-router';
import { mockCases } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, ImageIcon, VideoIcon, ArrowRightIcon, XIcon } from '../components/Icons';
import { CaseStatus, Priority } from '../types';

export default function IncidentsList() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showConvertModal, setShowConvertModal] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState<string | null>(null);

  const type1Cases = mockCases.filter(c => c.type === 'type-1');

  const statusColors: Record<CaseStatus, string> = {
    'submitted': 'bg-blue-100 text-blue-700',
    'pending': 'bg-yellow-100 text-yellow-700',
    'under-review': 'bg-indigo-100 text-indigo-700',
    'verified': 'bg-cyan-100 text-cyan-700',
    'assigned': 'bg-purple-100 text-purple-700',
    'hearing-scheduled': 'bg-orange-100 text-orange-700',
    'hearing-completed': 'bg-teal-100 text-teal-700',
    'resolved': 'bg-green-100 text-green-700',
    'closed': 'bg-gray-100 text-gray-700',
    'rejected': 'bg-red-100 text-red-700',
    'on-hold': 'bg-amber-100 text-amber-700'
  };

  const priorityColors: Record<Priority, string> = {
    'low': 'bg-slate-100 text-slate-700',
    'medium': 'bg-blue-100 text-blue-700',
    'high': 'bg-orange-100 text-orange-700',
    'urgent': 'bg-red-100 text-red-700'
  };

  const canTakeAction = currentUser?.role === 'proctor' || currentUser?.role === 'deputy-proctor';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>Incidents (Type-1)</h1>
        <p className="text-gray-600">Instant incidents with image/video evidence</p>
      </div>

      {/* Incident Cards */}
      <div className="space-y-4">
        {type1Cases.map((incident) => (
          <div key={incident.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold" style={{ color: '#0b2652' }}>
                      {incident.caseNumber}
                    </h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[incident.status]}`}>
                      {incident.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${priorityColors[incident.priority]}`}>
                      {incident.priority.charAt(0).toUpperCase() + incident.priority.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">{incident.studentName}</span> ({incident.studentId})
                  </p>
                  <p className="text-sm text-gray-500 mb-3">{incident.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span>Submitted: {new Date(incident.createdDate).toLocaleDateString()}</span>
                    {incident.assignedTo && <span>Assigned: {incident.assignedTo}</span>}
                  </div>
                </div>

                {/* Right: Media Preview */}
                <div className="flex gap-3 flex-shrink-0">
                  {incident.documents.filter(d => d.type === 'image' || d.type === 'video').slice(0, 2).map(doc => (
                    <div key={doc.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      {doc.type === 'image' && doc.url.startsWith('http') ? (
                        <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                      ) : doc.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                          <VideoIcon />
                          <span className="absolute bottom-1 right-1 text-[10px] text-white bg-black/50 px-1 rounded">MP4</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon />
                        </div>
                      )}
                    </div>
                  ))}
                  {incident.documents.length === 0 && (
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                      <span className="text-xs">No media</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(`/cases/${incident.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <EyeIcon />
                  View Details
                </button>
                {canTakeAction && incident.status !== 'closed' && incident.status !== 'resolved' && (
                  <>
                    <button
                      onClick={() => setShowConvertModal(incident.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                    >
                      <ArrowRightIcon />
                      Convert to Type-2
                    </button>
                    <button
                      onClick={() => setShowCloseModal(incident.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                    >
                      <XIcon />
                      Close Case
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {type1Cases.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <p className="text-gray-500">No Type-1 incidents found</p>
        </div>
      )}

      {/* Convert to Type-2 Modal */}
      {showConvertModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowConvertModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#0b2652' }}>Convert to Type-2 Case</h3>
              <p className="text-sm text-gray-600 mb-4">
                This will convert the instant incident into a formal case and route it through the Coordinator for verification.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for conversion</label>
                <textarea
                  placeholder="Explain why this incident needs formal processing..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConvertModal(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowConvertModal(null)}
                  className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                >
                  Convert to Type-2
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Close Case Modal */}
      {showCloseModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCloseModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#0b2652' }}>Close Case</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to close this incident? This action can be reversed later if needed.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution note</label>
                <textarea
                  placeholder="Add a closing note..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCloseModal(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCloseModal(null)}
                  className="px-4 py-2 text-sm rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                >
                  Close Case
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
