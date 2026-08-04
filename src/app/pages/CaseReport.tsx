import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { casesApi } from '../services/api';
import { Case } from '../types';

export default function CaseReport() {
  const { id } = useParams();
  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const response = await casesApi.getById(id!);
        setCaseItem(response.data.data || response.data);
      } catch {
        setCaseItem(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCase();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!caseItem) {
    return <div className="text-center py-12"><p className="text-gray-500">Case not found</p></div>;
  }

  const finalReport = caseItem.reports?.find(r => r.isFinal);

  const complainantList = (caseItem.complainants?.length ? caseItem.complainants : [{
    name: caseItem.studentName,
    studentId: caseItem.studentId,
    department: caseItem.studentDepartment,
    contact: caseItem.studentContact,
    advisorName: caseItem.studentAdvisorName,
    fatherName: caseItem.studentFatherName,
    fatherContact: caseItem.studentFatherContact,
  }]) as any[];

  const accusedList = (caseItem.accusedPersons?.length ? caseItem.accusedPersons : [{
    name: caseItem.accusedName,
    accusedStudentId: caseItem.accusedId,
    department: caseItem.accusedDepartment,
    contact: caseItem.accusedContact,
    guardianContact: caseItem.accusedGuardianContact,
  }]) as any[];

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="py-1.5 border-b border-gray-100">
      <span className="text-xs text-gray-500">{label}</span>
      <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-bold" style={{ color: '#0b2652' }}>Case Report</h1>
        <div className="flex gap-2">
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: '#0b2652' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 print:shadow-none print:border-none">
        {/* Header */}
        <div className="text-center py-6 px-8 border-b-2 border-gray-300">
          <h2 className="text-lg font-bold" style={{ color: '#0b2652' }}>প্রক্টর অফিস ইনসিডেন্ট রিপোর্ট ফর্ম</h2>
          <p className="text-sm text-gray-500 mt-1">ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটি, ড্যাফোডিল স্মার্ট সিটি</p>
        </div>

        <div className="p-8">
          {/* Case Meta - Date and Case Number */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <div className="text-sm">
              <span className="text-gray-500">তারিখ: </span>
              <span className="font-medium">{new Date(caseItem.createdDate).toLocaleDateString()}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">কেস নম্বর: </span>
              <span className="font-mono font-bold" style={{ color: '#0b2652' }}>{caseItem.caseNumber}</span>
            </div>
          </div>

          {/* To / Subject */}
          <div className="mb-6">
            <p className="text-sm text-gray-500">বরাবর, <strong>প্রক্টর</strong></p>
            <p className="text-sm text-gray-600 mb-3">ড্যাফোডিল ইন্টারন্যাশনাল ইউনিভার্সিটি, ড্যাফোডিল স্মার্ট সিটি।</p>
            <div className="mb-2">
              <span className="text-sm text-gray-500">বিষয়: </span>
              <span className="text-sm font-medium">{caseItem.description}</span>
            </div>
          </div>

          {/* Description body */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500 mb-1">জনাব,</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{caseItem.description}</p>
          </div>

          <p className="text-sm text-gray-500 mb-4">বিনীত,</p>

          {/* Complainants & Accused - Side by Side.
              The case's flat studentName/accusedName columns only ever hold the first person;
              the full lists live in the complainants/accusedPersons collections. Fall back to
              the flat columns for older cases saved before those collections existed. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Complainants */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-bold mb-3 pb-2 border-b border-gray-200" style={{ color: '#0b2652' }}>
                অভিযোগকারীর তথ্য{complainantList.length > 1 ? ` (${complainantList.length} জন)` : ''}
              </h4>
              <div className="space-y-4">
                {complainantList.map((c, i) => (
                  <div key={i} className="space-y-1">
                    {complainantList.length > 1 && (
                      <p className="text-xs font-semibold text-gray-400">অভিযোগকারী {i + 1}</p>
                    )}
                    <Field label="নাম" value={c.name} />
                    <Field label="আইডি" value={c.studentId} />
                    <Field label="ডিপার্টমেন্ট" value={c.department} />
                    <Field label="কন্টাক্ট নাম্বার" value={c.contact} />
                    <Field label="এডভাইজারের নাম" value={c.advisorName} />
                    <Field label="বাবার নাম" value={c.fatherName} />
                    <Field label="বাবার কন্টাক্ট নাম্বার" value={c.fatherContact} />
                  </div>
                ))}
              </div>
            </div>

            {/* Accused */}
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/30">
              <h4 className="text-sm font-bold mb-3 pb-2 border-b border-orange-200" style={{ color: '#0b2652' }}>
                অভিযুক্তের তথ্য{accusedList.length > 1 ? ` (${accusedList.length} জন)` : ''}
              </h4>
              <p className="text-xs text-gray-400 mb-2">যা যা তথ্য জানা আছে তা দিয়ে সাহায্য করুন</p>
              <div className="space-y-4">
                {accusedList.map((a, i) => (
                  <div key={i} className="space-y-1">
                    {accusedList.length > 1 && (
                      <p className="text-xs font-semibold text-gray-400">অভিযুক্ত {i + 1}</p>
                    )}
                    <Field label="নাম" value={a.name} />
                    <Field label="আইডি" value={a.accusedStudentId} />
                    <Field label="ডিপার্টমেন্ট" value={a.department} />
                    <Field label="কন্টাক্ট নাম্বার" value={a.contact} />
                    <Field label="অভিভাবকের নাম্বার" value={a.guardianContact} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Case Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <span className="text-xs text-gray-500">ধরন</span>
              <p className="text-sm font-medium capitalize">{caseItem.type.replace('-', ' ')}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">অবস্থা</span>
              <p className="text-sm font-medium capitalize">{caseItem.status.split('-').join(' ')}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">ঘটনার তারিখ</span>
              <p className="text-sm font-medium">{caseItem.incidentDate ? new Date(caseItem.incidentDate).toLocaleDateString() : '—'}</p>
            </div>
          </div>

          {/* Video Evidence */}
          {caseItem.videoLink && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-xs text-gray-500">Video Evidence (Google Drive Link)</span>
              <p className="text-sm"><a href={caseItem.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{caseItem.videoLink}</a></p>
            </div>
          )}

          {/* Recommendation */}
          {caseItem.recommendation && (
            <div className="mb-6">
              <h4 className="text-sm font-bold mb-2" style={{ color: '#0b2652' }}>Registrar Recommendation</h4>
              <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                <p className="text-sm text-gray-700">{caseItem.recommendation}</p>
              </div>
            </div>
          )}

          {/* Final Verdict */}
          {caseItem.verdict && (
            <div className="mb-6">
              <h4 className="text-sm font-bold mb-2" style={{ color: '#0b2652' }}>Final Verdict</h4>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-gray-700">{caseItem.verdict}</p>
              </div>
            </div>
          )}

          {/* Final Report */}
          {finalReport && (
            <div className="mb-6">
              <h4 className="text-sm font-bold mb-2" style={{ color: '#0b2652' }}>Final Report</h4>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700 mb-2">{finalReport.content}</p>
                <p className="text-xs text-gray-500">by {finalReport.createdByName} on {new Date(finalReport.createdDate).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="mb-6">
            <h4 className="text-sm font-bold mb-3" style={{ color: '#0b2652' }}>Activity Timeline</h4>
            <div className="space-y-1 text-xs">
              {[...caseItem.timeline].reverse().map(event => (
                <div key={event.id} className="flex gap-3 border-b border-gray-100 py-1.5">
                  <span className="text-gray-400 flex-shrink-0 w-32">{new Date(event.timestamp).toLocaleString()}</span>
                  <span className="font-medium text-gray-700 flex-shrink-0 w-32">{event.action}</span>
                  <span className="text-gray-600 flex-1">{event.description}</span>
                  <span className="text-gray-400">by {event.user}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="mb-6">
            <h4 className="text-sm font-bold mb-3" style={{ color: '#0b2652' }}>Attached Documents ({caseItem.documents.length})</h4>
            {caseItem.documents.length === 0 ? (
              <p className="text-xs text-gray-400">No documents attached</p>
            ) : (
              <div className="space-y-1">
                {caseItem.documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 text-xs py-1 border-b border-gray-100">
                    <span className="font-medium">{doc.name}</span>
                    <span className="text-gray-400">({doc.type})</span>
                    <span className="text-gray-500 ml-auto">by {doc.uploadedBy}{doc.uploadedByRole ? ` (${doc.uploadedByRole})` : ''} - {new Date(doc.uploadedDate).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200 text-xs text-gray-400 print:mt-8">
            Generated on {new Date().toLocaleString()} | Proctor Office Automation System
          </div>
        </div>
      </div>
    </div>
  );
}
