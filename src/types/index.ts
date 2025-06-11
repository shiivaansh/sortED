export interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  joinedCommunities?: string[];
  eventRegistrations?: string[];
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
  endDate?: string;
  type: 'Intra-school' | 'Inter-school';
  hostedBy: string;
  communityId?: string;
  description: string;
  fullDescription?: string;
  location?: string;
  maxParticipants?: number;
  currentParticipants: number;
  registrations: string[];
  rules?: string[];
  schedule?: Array<{
    time: string;
    activity: string;
  }>;
  rounds?: Array<{
    name: string;
    description: string;
    date: string;
  }>;
  results?: Array<{
    position: number;
    participant: string;
    score?: number;
  }>;
  status: 'upcoming' | 'ongoing' | 'completed';
  registrationDeadline?: string;
  tags: string[];
}

export interface Community {
  id: string;
  name: string;
  description: string;
  logo?: string;
  tags: string[];
  memberCount: number;
  members: string[];
  createdAt: Date;
  upcomingEvents?: Event[];
  recentPosts?: Array<{
    id: string;
    content: string;
    author: string;
    timestamp: Date;
  }>;
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