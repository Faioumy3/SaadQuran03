import React, { useState, useEffect } from 'react';
import { View, Teacher, Student } from '../types';
import { storageService } from '../services/storageService';
import { LogOut, User, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface TeacherDashboardProps {
  changeView: (view: View) => void;
  currentUser: Teacher;
  logout: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ changeView, currentUser, logout }) => {
  const [myStudents, setMyStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const init = async () => {
        setLoading(true);
        const allStudents = await storageService.getStudents();
        const filtered = allStudents.filter(s => s.teacherId === currentUser.id);
        setMyStudents(filtered);
        setLoading(false);
    }
    init();
  }, [currentUser.id]);

  const handleAttendance = async (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isAbsent = status === 'ABSENT';
    
    // Check if already logged today (Needs to fetch logs for this student)
    // Optimization: In real app, we might query just today's logs.
    const existingLogs = await storageService.getLogs(studentId);
    const alreadyLogged = existingLogs.some(l => l.date === todayStr);

    if (alreadyLogged) {
        alert('تم تسجيل هذا الطالب اليوم بالفعل');
        return;
    }

    await storageService.addLog({
        studentId: studentId,
        date: todayStr,
        newMemorization: '',
        revision: '',
        nextGoal: '',
        notes: isAbsent ? 'غائب' : 'حاضر', 
        isSystemGenerated: isAbsent
    });

    alert(isAbsent ? 'تم تسجيل الغياب' : 'تم تسجيل الحضور');
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <Loader2 className="animate-spin text-green-600" size={40} />
          </div>
      );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 w-full">
      {/* Mobile Header */}
      <div className="bg-[#107c57] text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <User size={20} />
                </div>
                <div>
                    <h1 className="font-bold text-lg">لوحة المعلم</h1>
                    <p className="text-xs opacity-80">أ. {currentUser.name}</p>
                </div>
            </div>
            <button 
                onClick={logout}
                className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition"
            >
                <LogOut size={20} />
            </button>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto w-full space-y-4">
        <h2 className="font-bold text-gray-700 mb-2">قائمة طلابي ({myStudents.length})</h2>
        {myStudents.length === 0 ? (
            <div className="text-center text-gray-400 py-10 bg-white rounded-xl shadow-sm">
                لا يوجد طلاب مسندين إليك حالياً
            </div>
        ) : (
            myStudents.map(student => (
                <div key={student.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800">{student.name}</h3>
                        <p className="text-xs text-gray-500">المستوى: {student.level || 'غير محدد'}</p>
                    </div>
                    
                    <div className="flex gap-2">
                         <button 
                            onClick={() => handleAttendance(student.id, 'PRESENT')}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition min-w-[60px]"
                         >
                             <CheckCircle size={24} />
                             <span className="text-[10px] font-bold">حضور</span>
                         </button>

                         <button 
                            onClick={() => handleAttendance(student.id, 'ABSENT')}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition min-w-[60px]"
                         >
                             <XCircle size={24} />
                             <span className="text-[10px] font-bold">غياب</span>
                         </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};