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

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
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
  documents: Document[];
  notes: Note[];
  hearings: Hearing[];
  timeline: TimelineEvent[];
  reports?: Report[];
}

export interface Report {
  id: string;
  caseId: string;
  content: string;
  createdByName: string;
  isDraft: boolean;
  createdDate: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'other';
  url: string;
  uploadedBy: string;
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
  date: string;
  time: string;
  location: string;
  participants: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
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
