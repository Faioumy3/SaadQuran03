export enum View {
  HOME = 'HOME',
  TEACHER_LOGIN = 'TEACHER_LOGIN',
  STUDENT_LOGIN = 'STUDENT_LOGIN',
  REGISTER_STUDENT = 'REGISTER_STUDENT',
  MANAGER_LOGIN = 'MANAGER_LOGIN',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
  STUDENT_DASHBOARD = 'STUDENT_DASHBOARD',
  MANAGER_DASHBOARD = 'MANAGER_DASHBOARD',
  TEACHER_DASHBOARD = 'TEACHER_DASHBOARD'
}

export interface Student {
  id: string;
  name: string;
  username: string;
  phone?: string; 
  level?: string;
  registeredAt: string;
  teacherId?: string; // Link to a teacher
}

export interface Teacher {
  id: string;
  name: string;
  username: string;
  password?: string; // stored for simulation
  phone?: string;
  registeredAt: string;
}

export interface LogReply {
  id: string;
  sender: 'STUDENT' | 'MANAGER';
  content: string;
  timestamp: number;
}

export interface DailyLog {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  newMemorization: string;
  revision: string;
  nextGoal: string;
  notes: string;
  isSystemGenerated?: boolean; // For missed days
  replies?: LogReply[];
  adminFeedback?: string; // Legacy field
}

export interface Message {
  id: string;
  senderId: string; // 'ADMIN' or studentId or teacherId
  receiverId: string; // 'ADMIN', studentId, or 'ALL_STUDENTS'
  senderName: string;
  content: string;
  timestamp: number;
  isRead: boolean;
}