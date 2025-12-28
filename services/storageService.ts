import { Student, DailyLog, Message, LogReply, Teacher } from '../types';
import { db } from '../firebaseConfig';
import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, 
  query, where, orderBy, setDoc, getDoc 
} from 'firebase/firestore';

const STUDENTS_COLLECTION = 'students';
const TEACHERS_COLLECTION = 'teachers';
const LOGS_COLLECTION = 'logs';
const MESSAGES_COLLECTION = 'messages';
const SETTINGS_COLLECTION = 'settings';

export const storageService = {
  // --- MANAGER AUTH ---
  getManagerPassword: async (): Promise<string> => {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, 'manager_auth');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().password || '123456';
      } else {
        // Initialize default password if not exists
        await setDoc(docRef, { password: '123456' });
        return '123456';
      }
    } catch (e) {
      console.error("Error fetching password", e);
      return '123456';
    }
  },

  setManagerPassword: async (password: string): Promise<void> => {
    const docRef = doc(db, SETTINGS_COLLECTION, 'manager_auth');
    await setDoc(docRef, { password }, { merge: true });
  },

  // --- STUDENTS ---
  getStudents: async (): Promise<Student[]> => {
    try {
      const q = query(collection(db, STUDENTS_COLLECTION));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Student));
    } catch (e) {
      console.error("Error getting students", e);
      return [];
    }
  },

  addStudent: async (student: Omit<Student, 'id' | 'registeredAt'>): Promise<boolean> => {
    try {
      await addDoc(collection(db, STUDENTS_COLLECTION), {
        ...student,
        registeredAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error("Error adding student", e);
      return false;
    }
  },

  updateStudent: async (updatedStudent: Student): Promise<void> => {
    try {
      const studentRef = doc(db, STUDENTS_COLLECTION, updatedStudent.id);
      const { id, ...data } = updatedStudent; // Exclude ID from data
      await updateDoc(studentRef, data);
    } catch (e) {
      console.error("Error updating student", e);
    }
  },

  deleteStudent: async (studentId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, STUDENTS_COLLECTION, studentId));
      
      // Optionally delete logs (Clean up)
      // Note: In a real app, use a Cloud Function for recursive delete
      // Here we just delete the user record primarily
    } catch (e) {
      console.error("Error deleting student", e);
    }
  },

  findStudent: async (username: string): Promise<Student | undefined> => {
    try {
      const q = query(collection(db, STUDENTS_COLLECTION), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0];
        return { id: docData.id, ...docData.data() as any } as Student;
      }
      return undefined;
    } catch (e) {
      console.error("Error finding student", e);
      return undefined;
    }
  },

  // --- TEACHERS ---
  getTeachers: async (): Promise<Teacher[]> => {
    try {
      const q = query(collection(db, TEACHERS_COLLECTION));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Teacher));
    } catch (e) {
      console.error("Error getting teachers", e);
      return [];
    }
  },

  addTeacher: async (teacher: Omit<Teacher, 'id' | 'registeredAt'>): Promise<boolean> => {
    try {
      await addDoc(collection(db, TEACHERS_COLLECTION), {
        ...teacher,
        registeredAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error("Error adding teacher", e);
      return false;
    }
  },

  deleteTeacher: async (teacherId: string): Promise<void> => {
    try {
      // 1. Delete Teacher
      await deleteDoc(doc(db, TEACHERS_COLLECTION, teacherId));

      // 2. Unassign students (Fetch all, check, update)
      // Efficient Way: Query students with this teacherId
      const q = query(collection(db, STUDENTS_COLLECTION), where("teacherId", "==", teacherId));
      const snapshot = await getDocs(q);
      const updates = snapshot.docs.map(studentDoc => 
         updateDoc(doc(db, STUDENTS_COLLECTION, studentDoc.id), { teacherId: null })
      );
      await Promise.all(updates);

    } catch (e) {
      console.error("Error deleting teacher", e);
    }
  },

  findTeacher: async (username: string): Promise<Teacher | undefined> => {
    try {
      const q = query(collection(db, TEACHERS_COLLECTION), where("username", "==", username));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() as any } as Teacher;
      }
      return undefined;
    } catch (e) {
      return undefined;
    }
  },

  // --- LOGS ---
  getLogs: async (studentId?: string): Promise<DailyLog[]> => {
    try {
      let q;
      if (studentId) {
        q = query(collection(db, LOGS_COLLECTION), where("studentId", "==", studentId));
      } else {
        q = query(collection(db, LOGS_COLLECTION));
      }
      
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as DailyLog));
      // Client-side sort because Firestore requires composite index for where+orderBy
      return logs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
      console.error("Error getting logs", e);
      return [];
    }
  },

  addLog: async (log: Omit<DailyLog, 'id' | 'timestamp'>): Promise<DailyLog | null> => {
    try {
      const newLogData = {
        ...log,
        timestamp: Date.now(),
        replies: []
      };
      const docRef = await addDoc(collection(db, LOGS_COLLECTION), newLogData);
      return { id: docRef.id, ...newLogData } as DailyLog;
    } catch (e) {
      console.error("Error adding log", e);
      return null;
    }
  },

  addLogReply: async (logId: string, replyContent: string, sender: 'STUDENT' | 'MANAGER'): Promise<boolean> => {
    try {
      const logRef = doc(db, LOGS_COLLECTION, logId);
      const logSnap = await getDoc(logRef);
      
      if (logSnap.exists()) {
        const logData = logSnap.data() as DailyLog;
        const newReply: LogReply = {
          id: Math.random().toString(36).substr(2, 9),
          sender,
          content: replyContent,
          timestamp: Date.now()
        };
        const updatedReplies = logData.replies ? [...logData.replies, newReply] : [newReply];
        await updateDoc(logRef, { replies: updatedReplies });
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error adding reply", e);
      return false;
    }
  },

  // Check for missed days and auto-fill for ONE student
  syncMissedDays: async (studentId: string): Promise<void> => {
    try {
        const q = query(collection(db, LOGS_COLLECTION), where("studentId", "==", studentId));
        const snapshot = await getDocs(q);
        const logs = snapshot.docs.map(d => d.data() as DailyLog).sort((a,b) => b.timestamp - a.timestamp);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (logs.length === 0) return;

        const lastLogDateStr = logs[0].date; 
        const lastLogDate = new Date(lastLogDateStr);
        lastLogDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(lastLogDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const missedLogsToAdd = [];
        let safetyCounter = 0;
        
        while (nextDay < today && safetyCounter < 30) { // Limit to 30 days to prevent explosion
          const dateStr = nextDay.toISOString().split('T')[0];
          missedLogsToAdd.push({
            studentId,
            date: dateStr,
            timestamp: nextDay.getTime(),
            newMemorization: '',
            revision: '',
            nextGoal: '',
            notes: 'لم يتم تسجيل أي يومية لهذا اليوم',
            isSystemGenerated: true,
            replies: []
          });
          nextDay.setDate(nextDay.getDate() + 1);
          safetyCounter++;
        }

        // Batch write or simple loop
        for (const log of missedLogsToAdd) {
            await addDoc(collection(db, LOGS_COLLECTION), log);
        }
    } catch (e) {
        console.error("Sync missed days error", e);
    }
  },

  syncAllStudentsMissedDays: async (): Promise<void> => {
      // In cloud, this should be a scheduled function. 
      // For client-side, we iterate carefully.
      try {
        const students = await storageService.getStudents();
        for (const s of students) {
            await storageService.syncMissedDays(s.id);
        }
      } catch (e) {
          console.error(e);
      }
  },

  // --- MESSAGES ---
  
  getMessages: async (userId: string): Promise<Message[]> => {
    try {
      const q = query(collection(db, MESSAGES_COLLECTION));
      const snapshot = await getDocs(q);
      const allMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any } as Message));

      if (userId === 'ADMIN') {
        return allMessages.sort((a, b) => a.timestamp - b.timestamp);
      }

      return allMessages
        .filter(m => m.senderId === userId || m.receiverId === userId || m.receiverId === 'ALL_STUDENTS' || m.receiverId === 'ALL_TEACHERS')
        .sort((a, b) => a.timestamp - b.timestamp);
    } catch (e) {
      console.error("Error getting messages", e);
      return [];
    }
  },

  sendMessage: async (msg: Omit<Message, 'id' | 'timestamp' | 'isRead'>): Promise<void> => {
    try {
        await addDoc(collection(db, MESSAGES_COLLECTION), {
          ...msg,
          timestamp: Date.now(),
          isRead: false
        });
    } catch (e) {
        console.error("Error sending message", e);
    }
  }
};