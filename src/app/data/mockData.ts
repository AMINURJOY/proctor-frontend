import { Case, User, Hearing, DashboardStats } from '../types';

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
];

export const mockCases: Case[] = [
  {
    id: '1',
    caseNumber: 'CASE-2026-001',
    studentName: 'Alex Johnson',
    studentId: 'STU-2023-001',
    type: 'type-1',
    status: 'under-review',
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
        url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173',
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
      {
        id: 't1',
        action: 'Case Submitted',
        description: 'Case submitted by student',
        user: 'Alex Johnson',
        timestamp: '2026-03-15T10:30:00Z'
      },
      {
        id: 't2',
        action: 'Documents Verified',
        description: 'All documents verified by coordinator',
        user: 'Sarah Coordinator',
        timestamp: '2026-03-16T09:00:00Z'
      },
      {
        id: 't3',
        action: 'Case Assigned',
        description: 'Assigned to Assistant Proctor for review',
        user: 'Dr. Michael Proctor',
        timestamp: '2026-03-20T11:00:00Z'
      },
      {
        id: 't4',
        action: 'Hearing Scheduled',
        description: 'Hearing scheduled for April 10, 2026',
        user: 'Prof. Emily Assistant',
        timestamp: '2026-04-01T14:20:00Z'
      }
    ]
  },
  {
    id: '2',
    caseNumber: 'CASE-2026-002',
    studentName: 'Maria Garcia',
    studentId: 'STU-2023-045',
    type: 'type-2',
    status: 'pending',
    priority: 'medium',
    assignedTo: 'Sarah Coordinator',
    createdDate: '2026-03-28T09:15:00Z',
    updatedDate: '2026-03-28T09:15:00Z',
    description: 'Academic misconduct allegation - plagiarism in research paper.',
    documents: [
      {
        id: 'd3',
        name: 'original-paper.pdf',
        type: 'pdf',
        url: '#',
        uploadedBy: 'Maria Garcia',
        uploadedDate: '2026-03-28T09:20:00Z'
      }
    ],
    notes: [],
    hearings: [],
    timeline: [
      {
        id: 't5',
        action: 'Case Submitted',
        description: 'Case filed by department head',
        user: 'Department Head',
        timestamp: '2026-03-28T09:15:00Z'
      }
    ]
  },
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
        content: '[CONFIDENTIAL] Initial consultation completed.',
        author: 'Dr. Rachel Female Coord',
        createdDate: '2026-03-22T14:00:00Z'
      }
    ],
    hearings: [],
    timeline: [
      {
        id: 't6',
        action: 'Confidential Case Filed',
        description: 'Case under Sexual Harassment Committee review',
        user: 'System',
        timestamp: '2026-03-20T16:00:00Z'
      }
    ]
  },
  {
    id: '4',
    caseNumber: 'CASE-2026-004',
    studentName: 'David Lee',
    studentId: 'STU-2024-112',
    type: 'type-1',
    status: 'resolved',
    priority: 'low',
    assignedTo: 'Dr. Michael Proctor',
    createdDate: '2026-02-10T11:00:00Z',
    updatedDate: '2026-03-15T16:45:00Z',
    description: 'Minor disciplinary issue - late assignment submission without valid reason.',
    documents: [],
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
      {
        id: 't7',
        action: 'Case Submitted',
        description: 'Case filed',
        user: 'Faculty Member',
        timestamp: '2026-02-10T11:00:00Z'
      },
      {
        id: 't8',
        action: 'Case Resolved',
        description: 'Resolved with official warning',
        user: 'Dr. Michael Proctor',
        timestamp: '2026-03-15T16:45:00Z'
      }
    ]
  },
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
    description: 'Cheating allegation during final examination. Proctor observed suspicious behavior.',
    documents: [
      {
        id: 'd5',
        name: 'exam-cctv-footage.mp4',
        type: 'video',
        url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45',
        uploadedBy: 'Sarah Coordinator',
        uploadedDate: '2026-03-25T14:30:00Z'
      }
    ],
    notes: [
      {
        id: 'n5',
        content: 'CCTV footage reviewed. Clear evidence of misconduct.',
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
      {
        id: 't9',
        action: 'Case Submitted',
        description: 'Exam misconduct reported',
        user: 'Exam Proctor',
        timestamp: '2026-03-25T14:00:00Z'
      },
      {
        id: 't10',
        action: 'Evidence Collected',
        description: 'CCTV footage and witness statements collected',
        user: 'Sarah Coordinator',
        timestamp: '2026-03-25T14:30:00Z'
      },
      {
        id: 't11',
        action: 'Hearing Scheduled',
        description: 'Disciplinary hearing set for April 12',
        user: 'Prof. Emily Assistant',
        timestamp: '2026-04-03T09:00:00Z'
      }
    ]
  },
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
    description: 'Hostel disciplinary issue. Investigation ongoing.',
    documents: [],
    notes: [
      {
        id: 'n6',
        content: 'Awaiting additional witness statements before proceeding.',
        author: 'Dr. Robert Deputy',
        createdDate: '2026-04-02T15:00:00Z'
      }
    ],
    hearings: [],
    timeline: [
      {
        id: 't12',
        action: 'Case Submitted',
        description: 'Incident reported by hostel warden',
        user: 'Hostel Warden',
        timestamp: '2026-03-30T10:00:00Z'
      },
      {
        id: 't13',
        action: 'Case On Hold',
        description: 'Additional evidence required',
        user: 'Dr. Robert Deputy',
        timestamp: '2026-04-02T15:00:00Z'
      }
    ]
  }
];

export const dashboardStats: DashboardStats = {
  totalCases: 6,
  pendingCases: 2,
  underReview: 2,
  resolvedCases: 1
};

export const recentActivity = [
  {
    id: 'a1',
    action: 'Hearing Scheduled',
    caseNumber: 'CASE-2026-005',
    user: 'Prof. Emily Assistant',
    timestamp: '2026-04-03T09:00:00Z'
  },
  {
    id: 'a2',
    action: 'Case On Hold',
    caseNumber: 'CASE-2026-006',
    user: 'Dr. Robert Deputy',
    timestamp: '2026-04-02T15:00:00Z'
  },
  {
    id: 'a3',
    action: 'Confidential Case Updated',
    caseNumber: 'CASE-2026-003',
    user: '[CONFIDENTIAL]',
    timestamp: '2026-04-02T10:00:00Z'
  },
  {
    id: 'a4',
    action: 'Hearing Scheduled',
    caseNumber: 'CASE-2026-001',
    user: 'Prof. Emily Assistant',
    timestamp: '2026-04-01T14:20:00Z'
  },
  {
    id: 'a5',
    action: 'Case Submitted',
    caseNumber: 'CASE-2026-002',
    user: 'Maria Garcia',
    timestamp: '2026-03-28T09:15:00Z'
  }
];
