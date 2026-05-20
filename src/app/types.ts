export type UserRole =
  | 'student'
  | 'coordinator'
  | 'proctor'
  | 'assistant-proctor'
  | 'deputy-proctor'
  | 'registrar'
  | 'disciplinary-committee'
  | 'female-coordinator'
  | 'sexual-harassment-committee'
  | 'vc'
  | 'super-admin';

export type CaseType = 'type-1' | 'type-2' | 'confidential';

export type CaseStatus =
  | 'submitted'
  | 'pending'
  | 'under-review'
  | 'verified'
  | 'assigned'
  | 'hearing-scheduled'
  | 'hearing-completed'
  | 'resolved'
  | 'closed'
  | 'rejected'
  | 'on-hold'
  | 'suggested-type-2'
  | 'police-case'
  | 'forwarded-to-registrar'
  | 'forwarded-to-committee'
  | 'resubmission-requested';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type Gender = 'unspecified' | 'male' | 'female' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gender?: Gender;
  avatar?: string;
  rank?: string;
}

export interface CaseCategory {
  id: string;
  name: string;
  description?: string;
  isConfidential: boolean;
  isActive: boolean;
  appliesToType: 'type-1' | 'type-2' | 'both';
  sortOrder: number;
}

export interface CaseAssignment {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  assignedAt: string;
  isPrimary: boolean;
  isActive: boolean;
}

export interface Rank {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
}

export interface Article {
  id: string;
  articleNo: string;
  title: string;
  description: string;
  isActive: boolean;
  order: number;
}

export interface ForwardingRule {
  id: string;
  fromRole: string;
  toRole: string;
  resultStatus?: string;
  isActive: boolean;
}

export interface CaseComplainant {
  id: string;
  name: string;
  studentId: string;
  department?: string;
  contact?: string;
  advisorName?: string;
  fatherName?: string;
  fatherContact?: string;
}

export interface CaseAccused {
  id: string;
  name: string;
  accusedStudentId: string;
  department?: string;
  contact?: string;
  guardianContact?: string;
}

export interface Case {
  id: string;
  caseNumber: string;
  studentName: string;
  studentId: string;
  type: CaseType;
  status: CaseStatus;
  priority: Priority;
  assignedTo?: string;
  createdDate: string;
  updatedDate: string;
  description: string;
  verdict?: string;
  recommendation?: string;
  forwardedToRole?: string;
  submittedByUserId?: string;
  // Type-2 form fields
  studentDepartment?: string;
  studentContact?: string;
  studentAdvisorName?: string;
  studentFatherName?: string;
  studentFatherContact?: string;
  accusedName?: string;
  accusedId?: string;
  accusedDepartment?: string;
  accusedContact?: string;
  accusedGuardianContact?: string;
  videoLink?: string;
  incidentDate?: string;
  complainants?: CaseComplainant[];
  accusedPersons?: CaseAccused[];
  documents: Document[];
  notes: Note[];
  hearings: Hearing[];
  timeline: TimelineEvent[];
  reports?: Report[];

  // Category
  categoryId?: string;
  categoryName?: string;
  categoryIsConfidential?: boolean;

  // Acknowledgment (Type-1)
  isAcknowledged?: boolean;
  acknowledgedAt?: string;
  acknowledgedById?: string;
  acknowledgedByName?: string;
  acknowledgmentComment?: string;

  // Location (Type-1)
  incidentLatitude?: number;
  incidentLongitude?: number;
  incidentLocationDescription?: string;

  // Multi-assignment
  assignedToId?: string;
  assignments?: CaseAssignment[];
}

export interface UpcomingHearings {
  today: Hearing[];
  tomorrow: Hearing[];
  thisWeek: Hearing[];
  later: Hearing[];
}

export interface Report {
  id: string;
  caseId: string;
  content: string;
  createdByName: string;
  isDraft: boolean;
  isFinal: boolean;
  createdDate: string;
  sectionsJson?: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'other';
  url: string;
  uploadedBy: string;
  uploadedByRole?: string;
  uploadedDate: string;
}

export interface Note {
  id: string;
  content: string;
  author: string;
  createdDate: string;
}

export interface Hearing {
  id: string;
  caseId: string;
  caseNumber?: string;
  studentName?: string;
  date: string;
  time: string;
  location: string;
  participants: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  remarks?: string;
}

export interface TimelineEvent {
  id: string;
  action: string;
  description: string;
  user: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  caseId?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalCases: number;
  pendingCases: number;
  underReview: number;
  resolvedCases: number;
}
