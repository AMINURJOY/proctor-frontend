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
  | 'vc';

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
  | 'on-hold';

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
  documents: Document[];
  notes: Note[];
  hearings: Hearing[];
  timeline: TimelineEvent[];
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

export interface DashboardStats {
  totalCases: number;
  pendingCases: number;
  underReview: number;
  resolvedCases: number;
}
