import { Case, User, DashboardStats } from '../types';

export const users: User[] = [
  { id: '1', name: 'John Student', email: 'student@university.edu', role: 'student' },
  { id: '2', name: 'Sarah Coordinator', email: 'coordinator@university.edu', role: 'coordinator' },
  { id: '3', name: 'Dr. Michael Proctor', email: 'proctor@university.edu', role: 'proctor' },
  { id: '4', name: 'Prof. Emily Assistant', email: 'assistant@university.edu', role: 'assistant-proctor' },
  { id: '5', name: 'Dr. Robert Deputy', email: 'deputy@university.edu', role: 'deputy-proctor' },
  { id: '6', name: 'Ms. Lisa Registrar', email: 'registrar@university.edu', role: 'registrar' },
  { id: '7', name: 'Committee Head', email: 'dc@university.edu', role: 'disciplinary-committee' },
  { id: '8', name: 'Dr. Rachel Female Coord', email: 'fcoord@university.edu', role: 'female-coordinator' },
  { id: '9', name: 'Committee SH', email: 'shc@university.edu', role: 'sexual-harassment-committee' },
  { id: '10', name: 'Vice Chancellor', email: 'vc@university.edu', role: 'vc' },
  { id: '11', name: 'System Administrator', email: 'admin@university.edu', role: 'super-admin' },
];

export const mockCases: Case[] = [
  // Case 1: Type-1 (Instant Incident) - Under Review by Assistant Proctor
  {
    id: '1',
    caseNumber: 'CASE-2026-001',
    studentName: 'Alex Johnson',
    studentId: 'STU-2023-001',
    type: 'type-1',
    status: 'hearing-scheduled',
    priority: 'high',
    assignedTo: 'Prof. Emily Assistant',
    createdDate: '2026-03-15T10:30:00Z',
    updatedDate: '2026-04-01T14:20:00Z',
    description: 'Student involved in classroom disruption incident. Multiple witnesses reported unauthorized behavior during examination.',
    documents: [
      {
        id: 'd1',
        name: 'incident-photo-1.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400',
        uploadedBy: 'John Student',
        uploadedDate: '2026-03-15T10:35:00Z'
      },
      {
        id: 'd2',
        name: 'witness-statement.pdf',
        type: 'pdf',
        url: '#',
        uploadedBy: 'Sarah Coordinator',
        uploadedDate: '2026-03-16T09:00:00Z'
      }
    ],
    notes: [
      {
        id: 'n1',
        content: 'Initial review completed. Evidence appears substantial. Recommend proceeding with hearing.',
        author: 'Dr. Michael Proctor',
        createdDate: '2026-03-20T11:00:00Z'
      },
      {
        id: 'n2',
        content: 'Student contacted for statement. Response pending.',
        author: 'Prof. Emily Assistant',
        createdDate: '2026-03-25T15:30:00Z'
      }
    ],
    hearings: [
      {
        id: 'h1',
        caseId: '1',
        date: '2026-04-10',
        time: '10:00 AM',
        location: 'Proctor Office, Room 201',
        participants: ['Alex Johnson', 'Dr. Michael Proctor', 'Prof. Emily Assistant'],
        status: 'scheduled',
      }
    ],
    timeline: [
      { id: 't1', action: 'Case Submitted', description: 'Instant incident submitted by student with photo evidence', user: 'Alex Johnson', timestamp: '2026-03-15T10:30:00Z' },
      { id: 't2', action: 'Documents Verified', description: 'All documents verified by coordinator', user: 'Sarah Coordinator', timestamp: '2026-03-16T09:00:00Z' },
      { id: 't3', action: 'Case Accepted', description: 'Case accepted and moved to priority queue', user: 'Sarah Coordinator', timestamp: '2026-03-17T10:00:00Z' },
      { id: 't4', action: 'Case Assigned', description: 'Assigned to Assistant Proctor for hearing', user: 'Dr. Michael Proctor', timestamp: '2026-03-20T11:00:00Z' },
      { id: 't5', action: 'Hearing Scheduled', description: 'Hearing scheduled for April 10, 2026', user: 'Prof. Emily Assistant', timestamp: '2026-04-01T14:20:00Z' }
    ]
  },

  // Case 2: Type-2 (Formal) - Pending Coordinator Review
  {
    id: '2',
    caseNumber: 'CASE-2026-002',
    studentName: 'Maria Garcia',
    studentId: 'STU-2023-045',
    type: 'type-2',
    status: 'submitted',
    priority: 'medium',
    assignedTo: 'Sarah Coordinator',
    createdDate: '2026-03-28T09:15:00Z',
    updatedDate: '2026-03-28T09:15:00Z',
    description: 'Academic misconduct allegation - plagiarism in research paper. Turnitin report shows 78% similarity.',
    documents: [
      {
        id: 'd3',
        name: 'original-paper.pdf',
        type: 'pdf',
        url: '#',
        uploadedBy: 'Maria Garcia',
        uploadedDate: '2026-03-28T09:20:00Z'
      },
      {
        id: 'd3b',
        name: 'turnitin-report.pdf',
        type: 'pdf',
        url: '#',
        uploadedBy: 'Maria Garcia',
        uploadedDate: '2026-03-28T09:22:00Z'
      }
    ],
    notes: [],
    hearings: [],
    timeline: [
      { id: 't6', action: 'Case Submitted', description: 'Formal case filed for plagiarism', user: 'Maria Garcia', timestamp: '2026-03-28T09:15:00Z' }
    ]
  },

  // Case 3: Confidential (Sexual Harassment) - Under SH Committee Review
  {
    id: '3',
    caseNumber: 'CASE-2026-003',
    studentName: 'Confidential Student',
    studentId: 'CONF-XXX-XXX',
    type: 'confidential',
    status: 'under-review',
    priority: 'urgent',
    assignedTo: 'Committee SH',
    createdDate: '2026-03-20T16:00:00Z',
    updatedDate: '2026-04-02T10:00:00Z',
    description: '[CONFIDENTIAL] Sensitive case handled by Sexual Harassment Committee. Access restricted.',
    documents: [
      {
        id: 'd4',
        name: '[REDACTED].pdf',
        type: 'pdf',
        url: '#',
        uploadedBy: '[CONFIDENTIAL]',
        uploadedDate: '2026-03-20T16:05:00Z'
      }
    ],
    notes: [
      {
        id: 'n3',
        content: '[CONFIDENTIAL] Initial consultation completed. Investigation underway.',
        author: 'Dr. Rachel Female Coord',
        createdDate: '2026-03-22T14:00:00Z'
      }
    ],
    hearings: [],
    timeline: [
      { id: 't7', action: 'Confidential Case Filed', description: 'Case routed to Female Coordinator', user: 'System', timestamp: '2026-03-20T16:00:00Z' },
      { id: 't8', action: 'Forwarded to SH Committee', description: 'Case forwarded for investigation', user: 'Dr. Rachel Female Coord', timestamp: '2026-03-22T14:00:00Z' }
    ]
  },

  // Case 4: Type-1 - Resolved
  {
    id: '4',
    caseNumber: 'CASE-2026-004',
    studentName: 'David Lee',
    studentId: 'STU-2024-112',
    type: 'type-1',
    status: 'closed',
    priority: 'low',
    assignedTo: 'Dr. Michael Proctor',
    createdDate: '2026-02-10T11:00:00Z',
    updatedDate: '2026-03-15T16:45:00Z',
    description: 'Minor disciplinary issue - late assignment submission without valid reason.',
    documents: [
      {
        id: 'd4b',
        name: 'incident-screenshot.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400',
        uploadedBy: 'Faculty Member',
        uploadedDate: '2026-02-10T11:05:00Z'
      }
    ],
    notes: [
      {
        id: 'n4',
        content: 'Student provided valid explanation. Case resolved with warning.',
        author: 'Dr. Michael Proctor',
        createdDate: '2026-03-15T16:45:00Z'
      }
    ],
    hearings: [],
    timeline: [
      { id: 't9', action: 'Case Submitted', description: 'Instant incident reported', user: 'Faculty Member', timestamp: '2026-02-10T11:00:00Z' },
      { id: 't10', action: 'Forwarded to Proctor', description: 'Type-1 incident sent to proctor', user: 'System', timestamp: '2026-02-10T11:05:00Z' },
      { id: 't11', action: 'Case Resolved', description: 'Resolved with official warning', user: 'Dr. Michael Proctor', timestamp: '2026-03-15T16:45:00Z' },
      { id: 't12', action: 'Case Closed', description: 'Case closed after resolution', user: 'Dr. Michael Proctor', timestamp: '2026-03-15T17:00:00Z' }
    ]
  },

  // Case 5: Type-2 - Hearing Scheduled (at Assistant Proctor)
  {
    id: '5',
    caseNumber: 'CASE-2026-005',
    studentName: 'Emma Wilson',
    studentId: 'STU-2023-078',
    type: 'type-2',
    status: 'hearing-scheduled',
    priority: 'high',
    assignedTo: 'Prof. Emily Assistant',
    createdDate: '2026-03-25T14:00:00Z',
    updatedDate: '2026-04-03T09:00:00Z',
    description: 'Cheating allegation during final examination. Proctor observed suspicious behavior and CCTV footage confirms.',
    documents: [
      {
        id: 'd5',
        name: 'exam-cctv-footage.mp4',
        type: 'video',
        url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400',
        uploadedBy: 'Sarah Coordinator',
        uploadedDate: '2026-03-25T14:30:00Z'
      },
      {
        id: 'd5b',
        name: 'exam-hall-photo.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=400',
        uploadedBy: 'Sarah Coordinator',
        uploadedDate: '2026-03-25T14:35:00Z'
      }
    ],
    notes: [
      {
        id: 'n5',
        content: 'CCTV footage reviewed. Clear evidence of misconduct. Hearing recommended.',
        author: 'Prof. Emily Assistant',
        createdDate: '2026-03-30T11:00:00Z'
      }
    ],
    hearings: [
      {
        id: 'h2',
        caseId: '5',
        date: '2026-04-12',
        time: '02:00 PM',
        location: 'Disciplinary Committee Room',
        participants: ['Emma Wilson', 'Committee Head', 'Prof. Emily Assistant'],
        status: 'scheduled',
      }
    ],
    timeline: [
      { id: 't13', action: 'Case Submitted', description: 'Exam misconduct reported', user: 'Exam Proctor', timestamp: '2026-03-25T14:00:00Z' },
      { id: 't14', action: 'Documents Verified', description: 'Coordinator verified all evidence', user: 'Sarah Coordinator', timestamp: '2026-03-26T09:00:00Z' },
      { id: 't15', action: 'Case Accepted', description: 'Case accepted into priority queue', user: 'Sarah Coordinator', timestamp: '2026-03-26T09:30:00Z' },
      { id: 't16', action: 'Assigned to Proctor', description: 'Forwarded to proctor office', user: 'Sarah Coordinator', timestamp: '2026-03-27T10:00:00Z' },
      { id: 't17', action: 'Assigned to Assistant Proctor', description: 'Proctor assigned to assistant for hearing', user: 'Dr. Michael Proctor', timestamp: '2026-03-28T11:00:00Z' },
      { id: 't18', action: 'Hearing Scheduled', description: 'Disciplinary hearing set for April 12', user: 'Prof. Emily Assistant', timestamp: '2026-04-03T09:00:00Z' }
    ]
  },

  // Case 6: Type-1 - On Hold at Deputy Proctor
  {
    id: '6',
    caseNumber: 'CASE-2026-006',
    studentName: 'James Brown',
    studentId: 'STU-2024-203',
    type: 'type-1',
    status: 'on-hold',
    priority: 'medium',
    assignedTo: 'Dr. Robert Deputy',
    createdDate: '2026-03-30T10:00:00Z',
    updatedDate: '2026-04-02T15:00:00Z',
    description: 'Hostel disciplinary issue - unauthorized gathering reported by warden. Investigation ongoing.',
    documents: [
      {
        id: 'd6',
        name: 'hostel-cctv.mp4',
        type: 'video',
        url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400',
        uploadedBy: 'Hostel Warden',
        uploadedDate: '2026-03-30T10:10:00Z'
      }
    ],
    notes: [
      {
        id: 'n6',
        content: 'Awaiting additional witness statements before proceeding. Sent back to Assistant Proctor for more evidence.',
        author: 'Dr. Robert Deputy',
        createdDate: '2026-04-02T15:00:00Z'
      }
    ],
    hearings: [
      {
        id: 'h3',
        caseId: '6',
        date: '2026-04-05',
        time: '11:00 AM',
        location: 'Proctor Office, Room 201',
        participants: ['James Brown', 'Dr. Robert Deputy', 'Hostel Warden'],
        status: 'completed',
        notes: 'Student acknowledged the incident. Additional witnesses needed.'
      }
    ],
    timeline: [
      { id: 't19', action: 'Case Submitted', description: 'Incident reported by hostel warden', user: 'Hostel Warden', timestamp: '2026-03-30T10:00:00Z' },
      { id: 't20', action: 'Forwarded to Proctor', description: 'Type-1 incident sent to proctor', user: 'System', timestamp: '2026-03-30T10:05:00Z' },
      { id: 't21', action: 'Assigned to Deputy Proctor', description: 'Proctor assigned to deputy for review', user: 'Dr. Michael Proctor', timestamp: '2026-03-31T09:00:00Z' },
      { id: 't22', action: 'Hearing Completed', description: 'Initial hearing held', user: 'Dr. Robert Deputy', timestamp: '2026-04-05T12:00:00Z' },
      { id: 't23', action: 'Case On Hold', description: 'Additional evidence required', user: 'Dr. Robert Deputy', timestamp: '2026-04-02T15:00:00Z' }
    ]
  },

  // Case 7: Type-2 - Verified, at Proctor decision stage
  {
    id: '7',
    caseNumber: 'CASE-2026-007',
    studentName: 'Sarah Ahmed',
    studentId: 'STU-2024-089',
    type: 'type-2',
    status: 'verified',
    priority: 'high',
    assignedTo: 'Dr. Michael Proctor',
    createdDate: '2026-04-01T08:00:00Z',
    updatedDate: '2026-04-03T10:00:00Z',
    description: 'Student caught using unauthorized electronic device during midterm examination. Faculty witness report attached.',
    documents: [
      {
        id: 'd7',
        name: 'faculty-report.pdf',
        type: 'pdf',
        url: '#',
        uploadedBy: 'Sarah Coordinator',
        uploadedDate: '2026-04-01T08:30:00Z'
      },
      {
        id: 'd7b',
        name: 'device-photo.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400',
        uploadedBy: 'Sarah Coordinator',
        uploadedDate: '2026-04-01T08:35:00Z'
      }
    ],
    notes: [
      {
        id: 'n7',
        content: 'All documents verified. Evidence is strong. Recommend immediate action.',
        author: 'Sarah Coordinator',
        createdDate: '2026-04-02T09:00:00Z'
      }
    ],
    hearings: [],
    timeline: [
      { id: 't24', action: 'Case Submitted', description: 'Formal case submitted', user: 'Faculty Member', timestamp: '2026-04-01T08:00:00Z' },
      { id: 't25', action: 'Documents Verified', description: 'All documents and evidence verified', user: 'Sarah Coordinator', timestamp: '2026-04-02T09:00:00Z' },
      { id: 't26', action: 'Case Accepted', description: 'Moved to priority queue', user: 'Sarah Coordinator', timestamp: '2026-04-02T09:30:00Z' },
      { id: 't27', action: 'Forwarded to Proctor', description: 'Awaiting proctor decision', user: 'Sarah Coordinator', timestamp: '2026-04-03T10:00:00Z' }
    ]
  },

  // Case 8: Type-2 - At Deputy Proctor review stage (report from Assistant)
  {
    id: '8',
    caseNumber: 'CASE-2026-008',
    studentName: 'Michael Chen',
    studentId: 'STU-2023-156',
    type: 'type-2',
    status: 'under-review',
    priority: 'high',
    assignedTo: 'Dr. Robert Deputy',
    createdDate: '2026-03-10T09:00:00Z',
    updatedDate: '2026-04-03T14:00:00Z',
    description: 'Repeated academic misconduct - third offense of plagiarism. Previous warnings were issued.',
    documents: [
      {
        id: 'd8',
        name: 'plagiarism-report-1.pdf',
        type: 'pdf',
        url: '#',
        uploadedBy: 'Prof. Emily Assistant',
        uploadedDate: '2026-03-20T10:00:00Z'
      },
      {
        id: 'd8b',
        name: 'hearing-draft-report.pdf',
        type: 'pdf',
        url: '#',
        uploadedBy: 'Prof. Emily Assistant',
        uploadedDate: '2026-04-01T15:00:00Z'
      }
    ],
    notes: [
      {
        id: 'n8',
        content: 'Third offense. Hearing conducted. Student admitted to plagiarism. Draft report attached.',
        author: 'Prof. Emily Assistant',
        createdDate: '2026-04-01T15:00:00Z'
      },
      {
        id: 'n8b',
        content: 'Reviewing draft report. Considering escalation to registrar office due to repeated offenses.',
        author: 'Dr. Robert Deputy',
        createdDate: '2026-04-03T14:00:00Z'
      }
    ],
    hearings: [
      {
        id: 'h4',
        caseId: '8',
        date: '2026-03-28',
        time: '03:00 PM',
        location: 'Proctor Office, Room 201',
        participants: ['Michael Chen', 'Prof. Emily Assistant', 'Department Head'],
        status: 'completed',
        notes: 'Student admitted to plagiarism. Expressed remorse but this is third offense.'
      }
    ],
    timeline: [
      { id: 't28', action: 'Case Submitted', description: 'Third plagiarism offense reported', user: 'Department Head', timestamp: '2026-03-10T09:00:00Z' },
      { id: 't29', action: 'Documents Verified', description: 'Previous offense records verified', user: 'Sarah Coordinator', timestamp: '2026-03-12T10:00:00Z' },
      { id: 't30', action: 'Case Accepted', description: 'High priority - repeat offender', user: 'Sarah Coordinator', timestamp: '2026-03-12T10:30:00Z' },
      { id: 't31', action: 'Assigned to Assistant Proctor', description: 'For hearing and investigation', user: 'Dr. Michael Proctor', timestamp: '2026-03-15T09:00:00Z' },
      { id: 't32', action: 'Hearing Completed', description: 'Student admitted to plagiarism', user: 'Prof. Emily Assistant', timestamp: '2026-03-28T16:00:00Z' },
      { id: 't33', action: 'Draft Report Created', description: 'Report forwarded to Deputy Proctor', user: 'Prof. Emily Assistant', timestamp: '2026-04-01T15:00:00Z' },
      { id: 't34', action: 'Under Deputy Review', description: 'Deputy Proctor reviewing report', user: 'Dr. Robert Deputy', timestamp: '2026-04-03T14:00:00Z' }
    ]
  },

  // Case 9: Type-2 - At Registrar Office
  {
    id: '9',
    caseNumber: 'CASE-2026-009',
    studentName: 'Linda Park',
    studentId: 'STU-2022-034',
    type: 'type-2',
    status: 'under-review',
    priority: 'urgent',
    assignedTo: 'Ms. Lisa Registrar',
    createdDate: '2026-02-20T10:00:00Z',
    updatedDate: '2026-04-02T11:00:00Z',
    description: 'Serious academic fraud - forged transcripts submitted for graduate admission. Multiple departments involved.',
    documents: [
      {
        id: 'd9',
        name: 'forged-transcript.pdf',
        type: 'pdf',
        url: '#',
        uploadedBy: 'Dr. Robert Deputy',
        uploadedDate: '2026-03-20T10:00:00Z'
      },
      {
        id: 'd9b',
        name: 'investigation-report.pdf',
        type: 'pdf',
        url: '#',
        uploadedBy: 'Dr. Robert Deputy',
        uploadedDate: '2026-03-25T14:00:00Z'
      }
    ],
    notes: [
      {
        id: 'n9',
        content: 'Case escalated to Registrar Office due to severity. Transcript forgery confirmed by verification department.',
        author: 'Dr. Robert Deputy',
        createdDate: '2026-03-25T14:00:00Z'
      },
      {
        id: 'n9b',
        content: 'Reviewing case. May need to forward to Disciplinary Committee for final verdict.',
        author: 'Ms. Lisa Registrar',
        createdDate: '2026-04-02T11:00:00Z'
      }
    ],
    hearings: [
      {
        id: 'h5',
        caseId: '9',
        date: '2026-03-18',
        time: '10:00 AM',
        location: 'Proctor Office, Room 201',
        participants: ['Linda Park', 'Prof. Emily Assistant', 'Department Head'],
        status: 'completed',
        notes: 'Student denied allegations initially. Evidence presented was conclusive.'
      }
    ],
    timeline: [
      { id: 't35', action: 'Case Submitted', description: 'Transcript forgery reported', user: 'Admissions Office', timestamp: '2026-02-20T10:00:00Z' },
      { id: 't36', action: 'Documents Verified', description: 'Forgery confirmed', user: 'Sarah Coordinator', timestamp: '2026-02-22T09:00:00Z' },
      { id: 't37', action: 'Case Accepted', description: 'Urgent priority assigned', user: 'Sarah Coordinator', timestamp: '2026-02-22T09:30:00Z' },
      { id: 't38', action: 'Hearing Conducted', description: 'Student denied allegations', user: 'Prof. Emily Assistant', timestamp: '2026-03-18T12:00:00Z' },
      { id: 't39', action: 'Report Reviewed by Deputy', description: 'Recommended escalation', user: 'Dr. Robert Deputy', timestamp: '2026-03-25T14:00:00Z' },
      { id: 't40', action: 'Escalated to Registrar', description: 'Case forwarded for recommendation', user: 'Dr. Robert Deputy', timestamp: '2026-03-26T09:00:00Z' }
    ]
  },

  // Case 10: Type-2 - At Disciplinary Committee
  {
    id: '10',
    caseNumber: 'CASE-2026-010',
    studentName: 'Robert Kim',
    studentId: 'STU-2023-201',
    type: 'type-2',
    status: 'under-review',
    priority: 'urgent',
    assignedTo: 'Committee Head',
    createdDate: '2026-01-15T08:00:00Z',
    updatedDate: '2026-04-01T16:00:00Z',
    description: 'Severe academic fraud and threatening behavior toward faculty. Multiple incidents documented over the semester.',
    documents: [
      {
        id: 'd10',
        name: 'incident-compilation.pdf',
        type: 'pdf',
        url: '#',
        uploadedBy: 'Ms. Lisa Registrar',
        uploadedDate: '2026-03-15T10:00:00Z'
      },
      {
        id: 'd10b',
        name: 'threat-evidence.jpg',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1450101499163-c8848e968786?w=400',
        uploadedBy: 'Prof. Emily Assistant',
        uploadedDate: '2026-02-10T14:00:00Z'
      }
    ],
    notes: [
      {
        id: 'n10',
        content: 'Registrar recommendation: Suspension for minimum 1 year. Forward to Disciplinary Committee for final verdict.',
        author: 'Ms. Lisa Registrar',
        createdDate: '2026-03-20T10:00:00Z'
      },
      {
        id: 'n10b',
        content: 'Committee reviewing all evidence. Final hearing to be scheduled.',
        author: 'Committee Head',
        createdDate: '2026-04-01T16:00:00Z'
      }
    ],
    hearings: [
      {
        id: 'h6',
        caseId: '10',
        date: '2026-02-15',
        time: '09:00 AM',
        location: 'Proctor Office, Room 201',
        participants: ['Robert Kim', 'Prof. Emily Assistant', 'Faculty Witnesses'],
        status: 'completed',
        notes: 'Multiple incidents discussed. Student showed no remorse.'
      },
      {
        id: 'h7',
        caseId: '10',
        date: '2026-04-15',
        time: '10:00 AM',
        location: 'Disciplinary Committee Hall',
        participants: ['Robert Kim', 'Committee Head', 'Legal Advisor', 'Dr. Michael Proctor'],
        status: 'scheduled',
      }
    ],
    timeline: [
      { id: 't41', action: 'Case Submitted', description: 'Multiple incidents reported', user: 'Faculty Members', timestamp: '2026-01-15T08:00:00Z' },
      { id: 't42', action: 'Case Verified & Accepted', description: 'Urgent priority', user: 'Sarah Coordinator', timestamp: '2026-01-17T09:00:00Z' },
      { id: 't43', action: 'Hearing Conducted', description: 'Multiple witnesses testified', user: 'Prof. Emily Assistant', timestamp: '2026-02-15T12:00:00Z' },
      { id: 't44', action: 'Report to Deputy', description: 'Draft report submitted', user: 'Prof. Emily Assistant', timestamp: '2026-02-20T10:00:00Z' },
      { id: 't45', action: 'Escalated to Registrar', description: 'Case severity requires registrar input', user: 'Dr. Robert Deputy', timestamp: '2026-03-01T09:00:00Z' },
      { id: 't46', action: 'Registrar Recommendation', description: 'Recommended minimum 1 year suspension', user: 'Ms. Lisa Registrar', timestamp: '2026-03-20T10:00:00Z' },
      { id: 't47', action: 'Forwarded to Disciplinary Committee', description: 'For final verdict', user: 'Ms. Lisa Registrar', timestamp: '2026-03-25T09:00:00Z' }
    ]
  },

  // Case 11: Type-1 - New instant incident (just submitted)
  {
    id: '11',
    caseNumber: 'CASE-2026-011',
    studentName: 'Tom Richards',
    studentId: 'STU-2024-301',
    type: 'type-1',
    status: 'submitted',
    priority: 'medium',
    assignedTo: undefined,
    createdDate: '2026-04-04T08:00:00Z',
    updatedDate: '2026-04-04T08:00:00Z',
    description: 'Student captured on phone camera causing disturbance in library. Video evidence uploaded.',
    documents: [
      {
        id: 'd11',
        name: 'library-incident.mp4',
        type: 'video',
        url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400',
        uploadedBy: 'Library Staff',
        uploadedDate: '2026-04-04T08:05:00Z'
      }
    ],
    notes: [],
    hearings: [],
    timeline: [
      { id: 't48', action: 'Incident Submitted', description: 'Instant incident with video evidence', user: 'Library Staff', timestamp: '2026-04-04T08:00:00Z' }
    ]
  },

  // Case 12: Type-2 - Rejected by Coordinator
  {
    id: '12',
    caseNumber: 'CASE-2026-012',
    studentName: 'Amy Foster',
    studentId: 'STU-2024-178',
    type: 'type-2',
    status: 'rejected',
    priority: 'low',
    assignedTo: 'Sarah Coordinator',
    createdDate: '2026-03-25T15:00:00Z',
    updatedDate: '2026-03-27T10:00:00Z',
    description: 'Complaint about grading dispute. Not within proctor jurisdiction.',
    documents: [
      {
        id: 'd12',
        name: 'grade-complaint.pdf',
        type: 'pdf',
        url: '#',
        uploadedBy: 'Amy Foster',
        uploadedDate: '2026-03-25T15:05:00Z'
      }
    ],
    notes: [
      {
        id: 'n12',
        content: 'This is a grading dispute and falls outside proctor office jurisdiction. Advised student to contact department head.',
        author: 'Sarah Coordinator',
        createdDate: '2026-03-27T10:00:00Z'
      }
    ],
    hearings: [],
    timeline: [
      { id: 't49', action: 'Case Submitted', description: 'Grading dispute filed', user: 'Amy Foster', timestamp: '2026-03-25T15:00:00Z' },
      { id: 't50', action: 'Case Rejected', description: 'Outside proctor jurisdiction', user: 'Sarah Coordinator', timestamp: '2026-03-27T10:00:00Z' }
    ]
  },

  // Case 13: Confidential - Under investigation by SH Committee
  {
    id: '13',
    caseNumber: 'CASE-2026-013',
    studentName: 'Confidential Student B',
    studentId: 'CONF-XXX-YYY',
    type: 'confidential',
    status: 'assigned',
    priority: 'urgent',
    assignedTo: 'Committee SH',
    createdDate: '2026-03-28T11:00:00Z',
    updatedDate: '2026-04-03T16:00:00Z',
    description: '[CONFIDENTIAL] Second confidential case under SH Committee investigation.',
    documents: [
      {
        id: 'd13',
        name: '[REDACTED]-statement.pdf',
        type: 'pdf',
        url: '#',
        uploadedBy: '[CONFIDENTIAL]',
        uploadedDate: '2026-03-28T11:10:00Z'
      }
    ],
    notes: [
      {
        id: 'n13',
        content: '[CONFIDENTIAL] Investigation phase initiated. Witnesses being contacted.',
        author: 'Committee SH',
        createdDate: '2026-04-03T16:00:00Z'
      }
    ],
    hearings: [],
    timeline: [
      { id: 't51', action: 'Confidential Case Filed', description: 'Case routed to Female Coordinator', user: 'System', timestamp: '2026-03-28T11:00:00Z' },
      { id: 't52', action: 'Reviewed by Female Coordinator', description: 'Initial assessment completed', user: 'Dr. Rachel Female Coord', timestamp: '2026-03-30T10:00:00Z' },
      { id: 't53', action: 'Forwarded to SH Committee', description: 'Under investigation', user: 'Dr. Rachel Female Coord', timestamp: '2026-04-01T09:00:00Z' }
    ]
  }
];

export const dashboardStats: DashboardStats = {
  totalCases: 13,
  pendingCases: 3,
  underReview: 5,
  resolvedCases: 2
};

export const recentActivity = [
  { id: 'a1', action: 'New Incident Submitted', caseNumber: 'CASE-2026-011', user: 'Library Staff', timestamp: '2026-04-04T08:00:00Z' },
  { id: 'a2', action: 'Hearing Scheduled', caseNumber: 'CASE-2026-005', user: 'Prof. Emily Assistant', timestamp: '2026-04-03T09:00:00Z' },
  { id: 'a3', action: 'Deputy Review Started', caseNumber: 'CASE-2026-008', user: 'Dr. Robert Deputy', timestamp: '2026-04-03T14:00:00Z' },
  { id: 'a4', action: 'Confidential Case Updated', caseNumber: 'CASE-2026-013', user: '[CONFIDENTIAL]', timestamp: '2026-04-03T16:00:00Z' },
  { id: 'a5', action: 'Case On Hold', caseNumber: 'CASE-2026-006', user: 'Dr. Robert Deputy', timestamp: '2026-04-02T15:00:00Z' },
  { id: 'a6', action: 'Registrar Reviewing', caseNumber: 'CASE-2026-009', user: 'Ms. Lisa Registrar', timestamp: '2026-04-02T11:00:00Z' },
  { id: 'a7', action: 'Committee Review', caseNumber: 'CASE-2026-010', user: 'Committee Head', timestamp: '2026-04-01T16:00:00Z' },
  { id: 'a8', action: 'Case Submitted', caseNumber: 'CASE-2026-002', user: 'Maria Garcia', timestamp: '2026-03-28T09:15:00Z' },
];
