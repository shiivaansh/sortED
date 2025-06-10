export interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
}

export interface Assignment {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'overdue';
  description?: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  description: string;
  location?: string;
  isRegistered?: boolean;
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
  subject?: string;
}

export interface GradeSubject {
  name: string;
  marks: number;
  maxMarks: number;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  groupId: string;
}

export interface MessageGroup {
  id: string;
  name: string;
  description: string;
  members: string[];
  lastMessage?: string;
  lastMessageTime?: Date;
}

export interface LearningResource {
  id: string;
  title: string;
  type: 'video' | 'document' | 'article' | 'quiz';
  subject: string;
  url: string;
  description?: string;
  uploadDate: string;
}