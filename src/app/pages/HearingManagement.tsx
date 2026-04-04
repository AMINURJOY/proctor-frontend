import { useState } from 'react';
import { useNavigate } from 'react-router';
import { mockCases } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { MailIcon, PhoneIcon, CheckIcon, ClockIcon, EyeIcon } from '../components/Icons';

export default function HearingManagement() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'schedule'>('upcoming');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const allHearings = mockCases.flatMap(c =>
    c.hearings.map(h => ({ ...h, caseNumber: c.caseNumber, studentName: c.studentName, caseId: c.id }))
  );

  const upcoming = allHearings.filter(h => h.status === 'scheduled');
  const completed = allHearings.filter(h => h.status === 'completed');

  const canSchedule = ['assistant-proctor', 'proctor', 'deputy-proctor', 'disciplinary-committee'].includes(currentUser?.role || '');

  const tabs = [
    { id: 'upcoming' as const, label: 'Upcoming', count: upcoming.length },
    { id: 'completed' as const, label: 'Completed', count: completed.length },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>Hearing Management</h1>
          <p className="text-gray-600">Schedule and manage case hearings</p>
        </div>
        {canSchedule && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: '#0b2652' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Schedule New Hearing
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-6">
        <div className="border-b border-gray-200 flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#0b2652' }} />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Upcoming Hearings */}
          {activeTab === 'upcoming' && (
            <div className="space-y-4">
              {upcoming.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming hearings</p>
              ) : (
                upcoming.map(hearing => (
                  <div key={hearing.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold" style={{ color: '#0b2652' }}>{hearing.caseNumber}</h3>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">Scheduled</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Student: <span className="font-medium">{hearing.studentName}</span></p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {hearing.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon />
                            {hearing.time}
                          </div>
                          <span>{hearing.location}</span>
                        </div>
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Participants:</p>
                          <div className="flex flex-wrap gap-1">
                            {hearing.participants.map((p, i) => (
                              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => navigate(`/cases/${hearing.caseId}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <EyeIcon />
                          View Case
                        </button>
                        {canSchedule && (
                          <>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700">
                              <MailIcon />
                              Send Email
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                              <PhoneIcon />
                              Send SMS
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Notification Status */}
                    {canSchedule && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-2">Notification Status:</p>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-1.5 text-xs">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-gray-600">Email sent to student</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-gray-600">SMS sent to student</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span className="text-gray-600">Email pending to committee</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Completed Hearings */}
          {activeTab === 'completed' && (
            <div className="space-y-4">
              {completed.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No completed hearings</p>
              ) : (
                completed.map(hearing => (
                  <div key={hearing.id} className="border border-gray-200 rounded-lg p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold" style={{ color: '#0b2652' }}>{hearing.caseNumber}</h3>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Completed</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Student: <span className="font-medium">{hearing.studentName}</span></p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
                          <span>{hearing.date} at {hearing.time}</span>
                          <span>{hearing.location}</span>
                        </div>
                        {hearing.notes && (
                          <div className="bg-gray-50 rounded-lg p-3 mt-2">
                            <p className="text-xs text-gray-500 mb-1">Hearing Notes:</p>
                            <p className="text-sm text-gray-700">{hearing.notes}</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/cases/${hearing.caseId}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <EyeIcon />
                        View Case
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Hearing Modal */}
      {showScheduleModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowScheduleModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#0b2652' }}>Schedule New Hearing</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Case *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select a case...</option>
                    {mockCases.filter(c => c.status !== 'closed' && c.status !== 'resolved' && c.status !== 'rejected').map(c => (
                      <option key={c.id} value={c.id}>{c.caseNumber} - {c.studentName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    placeholder="e.g., Proctor Office, Room 201"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
                  <div className="space-y-2">
                    {['Student (Auto-added)', 'Dr. Michael Proctor', 'Prof. Emily Assistant', 'Dr. Robert Deputy'].map(p => (
                      <label key={p} className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked={p.includes('Auto')} className="w-4 h-4 rounded border-gray-300" />
                        <span className="text-sm text-gray-700">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    placeholder="Add any notes for this hearing..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                {/* Notification options */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-700 mb-2">Send Notifications:</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Send Email notification to all participants</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Send SMS notification to student</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-sm rounded-lg text-white"
                    style={{ backgroundColor: '#0b2652' }}
                  >
                    Schedule Hearing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
