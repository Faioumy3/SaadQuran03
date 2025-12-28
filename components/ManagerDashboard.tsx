import React, { useState, useEffect } from 'react';
import { View, Student, Teacher, DailyLog, Message } from '../types';
import { storageService } from '../services/storageService';
import { LogOut, Users, GraduationCap, FileText, MessageSquare, Plus, Save, Download, UserCircle, Send, ArrowRight, BookOpen, Trash2, Settings, Lock, Loader2 } from 'lucide-react';

interface ManagerDashboardProps {
  changeView: (view: View) => void;
  logout: () => void;
}

const BROADCAST_CHANNEL_ID = 'BROADCAST_CHANNEL';
const BROADCAST_TEACHERS_ID = 'BROADCAST_TEACHERS';

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ changeView, logout }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'reports' | 'messages' | 'settings'>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection States
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Inputs
  const [newTeacher, setNewTeacher] = useState({ name: '', username: '', password: '' });
  const [msgContent, setMsgContent] = useState('');
  const [activeChatStudentId, setActiveChatStudentId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // Manager Password Change
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  // Filter States for Reports
  const [reportFilter, setReportFilter] = useState({
      dateFrom: '',
      dateTo: '',
      studentId: '',
      teacherId: ''
  });

  useEffect(() => {
    // Sync all students data on mount
    const init = async () => {
        setLoading(true);
        await storageService.syncAllStudentsMissedDays();
        await loadData();
        setLoading(false);
    };
    init();
  }, []);

  const loadData = async () => {
    const s = await storageService.getStudents();
    const t = await storageService.getTeachers();
    const l = await storageService.getLogs();
    const m = await storageService.getMessages('ADMIN');
    setStudents(s);
    setTeachers(t);
    setLogs(l);
    setMessages(m);
  };

  const handleDeleteStudent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟ سيتم حذف سجلاته أيضاً.')) {
      await storageService.deleteStudent(id);
      if (selectedStudent?.id === id) setSelectedStudent(null);
      loadData();
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المعلم؟ سيتم إلغاء ربطه بطلابه.')) {
      await storageService.deleteTeacher(id);
      loadData();
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeacher.name && newTeacher.username && newTeacher.password) {
        await storageService.addTeacher(newTeacher);
        setNewTeacher({ name: '', username: '', password: '' });
        loadData();
        alert('تم إضافة المعلم بنجاح');
    }
  };

  const assignTeacher = async (studentId: string, teacherId: string) => {
      const student = students.find(s => s.id === studentId);
      if (student) {
          const updated = { ...student, teacherId };
          await storageService.updateStudent(updated);
          loadData();
          // Update selected student ref if needed
          if (selectedStudent && selectedStudent.id === studentId) {
             setSelectedStudent(updated);
          }
      }
  };

  const handleReplySubmit = async (logId: string) => {
      const content = replyInputs[logId];
      if (!content || !content.trim()) return;
      
      await storageService.addLogReply(logId, content, 'MANAGER');
      setReplyInputs(prev => ({ ...prev, [logId]: '' }));
      loadData();
  };

  const handleReplyChange = (logId: string, value: string) => {
    setReplyInputs(prev => ({ ...prev, [logId]: value }));
  };

  const handleSendMessage = async () => {
      if (!msgContent.trim()) return;

      let recipientId = activeChatStudentId;
      if (activeChatStudentId === BROADCAST_CHANNEL_ID) recipientId = 'ALL_STUDENTS';
      if (activeChatStudentId === BROADCAST_TEACHERS_ID) recipientId = 'ALL_TEACHERS';

      if (!recipientId) return;

      await storageService.sendMessage({
          senderId: 'ADMIN',
          receiverId: recipientId,
          senderName: 'الإدارة',
          content: msgContent
      });

      setMsgContent('');
      loadData();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentStored = await storageService.getManagerPassword();
    
    if (passwordData.current !== currentStored) {
      setPasswordMsg('كلمة المرور الحالية غير صحيحة');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setPasswordMsg('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    if (passwordData.new.length < 4) {
      setPasswordMsg('كلمة المرور قصيرة جداً');
      return;
    }

    await storageService.setManagerPassword(passwordData.new);
    setPasswordMsg('تم تغيير كلمة المرور بنجاح');
    setPasswordData({ current: '', new: '', confirm: '' });
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  // Report Generation
  const getFilteredLogs = () => {
      return logs.filter(log => {
          const logDate = new Date(log.date);
          const from = reportFilter.dateFrom ? new Date(reportFilter.dateFrom) : null;
          const to = reportFilter.dateTo ? new Date(reportFilter.dateTo) : null;
          
          if (from && logDate < from) return false;
          if (to && logDate > to) return false;
          if (reportFilter.studentId && log.studentId !== reportFilter.studentId) return false;
          
          if (reportFilter.teacherId) {
              const student = students.find(s => s.id === log.studentId);
              if (student?.teacherId !== reportFilter.teacherId) return false;
          }

          return true;
      });
  };

  const downloadReport = () => {
      const filtered = getFilteredLogs();
      const headers = ['التاريخ', 'اسم الطالب', 'المعلم', 'الحالة', 'الحفظ الجديد', 'المراجعة', 'الواجب القادم', 'الملاحظات'];
      
      const csvContent = [
          headers.join(','),
          ...filtered.map(log => {
              const student = students.find(s => s.id === log.studentId);
              const teacher = teachers.find(t => t.id === student?.teacherId);
              return [
                  log.date,
                  student?.name || 'غير معروف',
                  teacher?.name || 'غير معين',
                  log.isSystemGenerated ? 'غائب/لم يسجل' : 'حاضر',
                  `"${log.newMemorization.replace(/"/g, '""')}"`, // Escape quotes
                  `"${log.revision.replace(/"/g, '""')}"`,
                  `"${log.nextGoal.replace(/"/g, '""')}"`,
                  `"${log.notes.replace(/"/g, '""')}"`
              ].join(',');
          })
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
  };

  // Chat Helpers
  const getCurrentChatMessages = () => {
      if (activeChatStudentId === BROADCAST_CHANNEL_ID) {
          return messages.filter(m => m.receiverId === 'ALL_STUDENTS');
      }
      if (activeChatStudentId === BROADCAST_TEACHERS_ID) {
          return messages.filter(m => m.receiverId === 'ALL_TEACHERS');
      }
      if (activeChatStudentId) {
        return messages.filter(m => 
            (m.senderId === activeChatStudentId && m.receiverId === 'ADMIN') || 
            (m.senderId === 'ADMIN' && m.receiverId === activeChatStudentId)
        );
      }
      return [];
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <Loader2 className="animate-spin text-gray-600" size={40} />
          </div>
      );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 w-full max-w-[100vw] overflow-x-hidden">
      {/* Header */}
      <div className="bg-gray-800 text-white p-3 md:p-4 shadow-md flex justify-between items-center sticky top-0 z-20">
         <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
             <div className="bg-white/10 p-2 rounded-full hidden md:block shrink-0"><Users size={24} /></div>
             <div className="min-w-0">
                 <h1 className="font-bold text-base md:text-xl text-yellow-400 truncate">أهلا يا شيخ سعد يا محترم</h1>
                 <p className="text-[10px] md:text-xs text-gray-400">لوحة تحكم المدير العام</p>
             </div>
         </div>
         <button onClick={logout} className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs md:text-sm transition shrink-0">
             <LogOut size={16}/>
             <span className="hidden md:inline">خروج</span>
         </button>
      </div>

      {/* Scrollable Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[60px] md:top-[68px] z-10 w-full">
        <div className="flex overflow-x-auto w-full no-scrollbar">
            {[
                { id: 'students', label: 'الطلاب', icon: GraduationCap },
                { id: 'teachers', label: 'المعلمون', icon: Users },
                { id: 'reports', label: 'التقارير', icon: FileText },
                { id: 'messages', label: 'الرسائل', icon: MessageSquare },
                { id: 'settings', label: 'الإعدادات', icon: Settings },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-b-2 transition-all font-bold whitespace-nowrap text-sm md:text-base ${activeTab === tab.id ? 'border-gray-800 text-gray-800 bg-gray-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                >
                    <tab.icon size={16} className="md:w-[18px] md:h-[18px]" />
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Content */}
      <div className={`w-full max-w-full flex-grow overflow-x-hidden ${activeTab === 'messages' ? 'p-0' : 'p-2 md:p-6'}`}>
          
          {/* --- STUDENTS TAB --- */}
          {activeTab === 'students' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Students List */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[50vh] md:h-[70vh] flex flex-col w-full">
                      <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-gray-700 sticky top-0">قائمة الطلاب</div>
                      <div className="overflow-y-auto flex-grow p-2">
                          {students.map(student => (
                              <div 
                                key={student.id}
                                onClick={() => setSelectedStudent(student)}
                                className={`p-3 rounded-lg cursor-pointer mb-2 border transition-all flex justify-between items-center ${selectedStudent?.id === student.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-gray-50 border-transparent'}`}
                              >
                                  <div>
                                      <div className="font-bold text-gray-800">{student.name}</div>
                                      <div className="text-xs text-gray-500 mt-1">
                                          <span>{student.level || 'غير محدد'} - {teachers.find(t => t.id === student.teacherId)?.name || 'بدون معلم'}</span>
                                      </div>
                                  </div>
                                  <button 
                                    onClick={(e) => handleDeleteStudent(e, student.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                                    title="حذف الطالب"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Details & Logs */}
                  <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 h-[70vh] flex flex-col overflow-hidden w-full">
                      {selectedStudent ? (
                          <>
                             <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                 <div>
                                     <h3 className="font-bold text-lg">{selectedStudent.name}</h3>
                                     <p className="text-sm text-gray-500">اسم المستخدم: {selectedStudent.username}</p>
                                 </div>
                                 <div className="flex items-center gap-2 w-full md:w-auto">
                                     <span className="text-sm font-bold text-gray-600 whitespace-nowrap">المعلم:</span>
                                     <select 
                                        className="border rounded px-2 py-1 text-sm bg-white flex-grow md:flex-grow-0 max-w-[200px]"
                                        value={selectedStudent.teacherId || ''}
                                        onChange={(e) => assignTeacher(selectedStudent.id, e.target.value)}
                                     >
                                         <option value="">-- اختر معلم --</option>
                                         {teachers.map(t => (
                                             <option key={t.id} value={t.id}>{t.name}</option>
                                         ))}
                                     </select>
                                 </div>
                             </div>

                             <div className="flex-grow overflow-y-auto p-3 md:p-4 bg-gray-50/50 w-full">
                                 {logs.filter(l => l.studentId === selectedStudent.id).length === 0 ? (
                                     <div className="text-center py-10 text-gray-400">لا توجد يوميات لهذا الطالب</div>
                                 ) : (
                                     logs.filter(l => l.studentId === selectedStudent.id).map(log => (
                                         <div key={log.id} className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 mb-4 w-full">
                                              <div className="flex justify-between items-center border-b pb-2 mb-2">
                                                  <span className="font-bold text-blue-600">{new Date(log.date).toLocaleDateString('ar-EG')}</span>
                                                  {log.isSystemGenerated ? 
                                                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-bold">غائب</span> : 
                                                    <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded font-bold">حاضر</span>
                                                  }
                                              </div>
                                              {!log.isSystemGenerated && (
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                                                      <div><span className="text-gray-500 font-bold">الجديد:</span> {log.newMemorization}</div>
                                                      <div><span className="text-gray-500 font-bold">المراجعة:</span> {log.revision}</div>
                                                      <div className="md:col-span-2 bg-yellow-50 p-2 rounded border border-yellow-100">
                                                          <span className="text-orange-600 font-bold">الهدف القادم:</span> {log.nextGoal}
                                                      </div>
                                                      <div className="md:col-span-2"><span className="text-gray-500 font-bold">ملاحظات:</span> {log.notes}</div>
                                                  </div>
                                              )}
                                              
                                              {/* Replies Section */}
                                              <div className="bg-gray-50 p-3 rounded text-sm mt-2">
                                                  <div className="font-bold text-gray-600 mb-2 text-xs">المناقشات:</div>
                                                  {log.replies?.map(r => (
                                                      <div key={r.id} className={`mb-1 p-1 rounded ${r.sender === 'MANAGER' ? 'bg-blue-100' : 'bg-white border'}`}>
                                                          <span className="font-bold text-xs">{r.sender === 'MANAGER' ? 'أنت' : 'الطالب'}:</span> {r.content}
                                                      </div>
                                                  ))}
                                                  <div className="flex gap-2 mt-2">
                                                      <input 
                                                        type="text" 
                                                        placeholder="أضف رداً..."
                                                        className="flex-grow border rounded px-2 py-1 text-sm w-full min-w-0"
                                                        value={replyInputs[log.id] || ''}
                                                        onChange={(e) => handleReplyChange(log.id, e.target.value)}
                                                      />
                                                      <button 
                                                        onClick={() => handleReplySubmit(log.id)}
                                                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs shrink-0"
                                                      >
                                                          إرسال
                                                      </button>
                                                  </div>
                                              </div>
                                         </div>
                                     ))
                                 )}
                             </div>
                          </>
                      ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 p-4 text-center">اختر طالباً من القائمة لعرض تفاصيله</div>
                      )}
                  </div>
              </div>
          )}

          {/* --- TEACHERS TAB --- */}
          {activeTab === 'teachers' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Add Teacher Form */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
                      <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                          <Plus size={20} className="text-green-600"/>
                          إضافة معلم جديد
                      </h3>
                      <form onSubmit={handleAddTeacher} className="space-y-4">
                          <div>
                              <label className="block text-sm font-bold text-gray-600 mb-1">الاسم</label>
                              <input 
                                  type="text" 
                                  required
                                  className="w-full border rounded p-2 text-sm"
                                  value={newTeacher.name}
                                  onChange={e => setNewTeacher({...newTeacher, name: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-gray-600 mb-1">اسم المستخدم</label>
                              <input 
                                  type="text" 
                                  required
                                  className="w-full border rounded p-2 text-sm"
                                  value={newTeacher.username}
                                  onChange={e => setNewTeacher({...newTeacher, username: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-gray-600 mb-1">كلمة المرور</label>
                              <input 
                                  type="text" 
                                  required
                                  className="w-full border rounded p-2 text-sm"
                                  value={newTeacher.password}
                                  onChange={e => setNewTeacher({...newTeacher, password: e.target.value})}
                              />
                          </div>
                          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">
                              إضافة
                          </button>
                      </form>
                  </div>

                  {/* Teachers List */}
                  <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b bg-gray-50 font-bold text-gray-700">قائمة المعلمين</div>
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {teachers.map(t => (
                              <div key={t.id} className="border rounded-lg p-4 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-green-100 p-3 rounded-full text-green-700"><UserCircle size={24}/></div>
                                      <div>
                                          <div className="font-bold">{t.name}</div>
                                          <div className="text-sm text-gray-500">@{t.username}</div>
                                          <div className="text-xs text-gray-400 mt-1">كلمة المرور: {t.password}</div>
                                      </div>
                                  </div>
                                  <button 
                                      onClick={() => handleDeleteTeacher(t.id)}
                                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                                      title="حذف المعلم"
                                  >
                                      <Trash2 size={20} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* --- REPORTS TAB --- */}
          {activeTab === 'reports' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[80vh]">
                  <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                      <div className="flex flex-wrap gap-4 w-full">
                          <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-gray-500">من تاريخ</label>
                              <input type="date" className="border rounded px-2 py-1 text-sm" value={reportFilter.dateFrom} onChange={e => setReportFilter({...reportFilter, dateFrom: e.target.value})} />
                          </div>
                          <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-gray-500">إلى تاريخ</label>
                              <input type="date" className="border rounded px-2 py-1 text-sm" value={reportFilter.dateTo} onChange={e => setReportFilter({...reportFilter, dateTo: e.target.value})} />
                          </div>
                          <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-gray-500">الطالب</label>
                              <select className="border rounded px-2 py-1 text-sm min-w-[150px]" value={reportFilter.studentId} onChange={e => setReportFilter({...reportFilter, studentId: e.target.value})}>
                                  <option value="">الكل</option>
                                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                          </div>
                          <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-gray-500">المعلم</label>
                              <select className="border rounded px-2 py-1 text-sm min-w-[150px]" value={reportFilter.teacherId} onChange={e => setReportFilter({...reportFilter, teacherId: e.target.value})}>
                                  <option value="">الكل</option>
                                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                          </div>
                      </div>
                      <button onClick={downloadReport} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition shrink-0">
                          <Download size={16} />
                          <span>تصدير CSV</span>
                      </button>
                  </div>

                  <div className="flex-grow overflow-auto p-0">
                      <table className="w-full text-right text-sm">
                          <thead className="bg-gray-100 text-gray-700 sticky top-0 font-bold whitespace-nowrap">
                              <tr>
                                  <th className="p-3 border-b">التاريخ</th>
                                  <th className="p-3 border-b">الطالب</th>
                                  <th className="p-3 border-b">المعلم</th>
                                  <th className="p-3 border-b">الحالة</th>
                                  <th className="p-3 border-b">الحفظ الجديد</th>
                                  <th className="p-3 border-b">المراجعة</th>
                                  <th className="p-3 border-b">الواجب القادم</th>
                                  <th className="p-3 border-b">الملاحظات</th>
                              </tr>
                          </thead>
                          <tbody>
                              {getFilteredLogs().map(log => {
                                  const st = students.find(s => s.id === log.studentId);
                                  const te = teachers.find(t => t.id === st?.teacherId);
                                  return (
                                      <tr key={log.id} className="border-b hover:bg-gray-50">
                                          <td className="p-3 whitespace-nowrap">{log.date}</td>
                                          <td className="p-3 font-bold whitespace-nowrap">{st?.name}</td>
                                          <td className="p-3 whitespace-nowrap">{te?.name || '-'}</td>
                                          <td className="p-3 whitespace-nowrap">
                                              {log.isSystemGenerated ? 
                                                  <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold">غائب</span> : 
                                                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">حاضر</span>
                                              }
                                          </td>
                                          <td className="p-3 min-w-[150px]">{log.newMemorization || '-'}</td>
                                          <td className="p-3 min-w-[150px]">{log.revision || '-'}</td>
                                          <td className="p-3 min-w-[150px]">{log.nextGoal || '-'}</td>
                                          <td className="p-3 min-w-[150px]">{log.notes || '-'}</td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* --- MESSAGES TAB --- */}
          {activeTab === 'messages' && (
              <div className="bg-white md:rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-140px)] flex overflow-hidden w-full">
                  {/* Sidebar (List of Chats) */}
                  <div className={`w-full md:w-1/3 border-l border-gray-200 bg-gray-50 flex flex-col ${activeChatStudentId ? 'hidden md:flex' : 'flex'}`}>
                      <div className="p-4 border-b font-bold text-gray-700 bg-white">المحادثات</div>
                      <div className="flex-grow overflow-y-auto">
                          <button 
                            onClick={() => setActiveChatStudentId(BROADCAST_CHANNEL_ID)}
                            className={`w-full text-right p-4 border-b hover:bg-gray-100 transition flex items-center gap-4 ${activeChatStudentId === BROADCAST_CHANNEL_ID ? 'bg-blue-50 border-blue-200' : 'border-gray-100'}`}
                          >
                              <div className="bg-orange-100 p-3 rounded-full text-orange-600 shrink-0"><Users size={24}/></div>
                              <div>
                                  <div className="font-bold text-base">رسالة جماعية (كل الطلاب)</div>
                                  <div className="text-sm text-gray-500">إرسال لجميع الطلاب</div>
                              </div>
                          </button>
                          
                          <button 
                            onClick={() => setActiveChatStudentId(BROADCAST_TEACHERS_ID)}
                            className={`w-full text-right p-4 border-b hover:bg-gray-100 transition flex items-center gap-4 ${activeChatStudentId === BROADCAST_TEACHERS_ID ? 'bg-blue-50 border-blue-200' : 'border-gray-100'}`}
                          >
                              <div className="bg-green-100 p-3 rounded-full text-green-600 shrink-0"><BookOpen size={24}/></div>
                              <div>
                                  <div className="font-bold text-base">رسالة جماعية (كل المعلمين)</div>
                                  <div className="text-sm text-gray-500">إرسال لجميع المعلمين</div>
                              </div>
                          </button>

                          <div className="p-2 bg-gray-100 text-xs font-bold text-gray-500">كل الطلاب</div>
                          {students.map(student => (
                              <button 
                                key={student.id}
                                onClick={() => setActiveChatStudentId(student.id)}
                                className={`w-full text-right p-4 border-b hover:bg-gray-100 transition flex items-center gap-4 ${activeChatStudentId === student.id ? 'bg-blue-50 border-blue-200' : 'border-gray-100'}`}
                              >
                                  <div className="bg-blue-100 p-3 rounded-full text-blue-600 shrink-0"><UserCircle size={24}/></div>
                                  <div>
                                      <div className="font-bold text-gray-800 text-base">{student.name}</div>
                                      <div className="text-sm text-gray-500">اضغط للمراسلة</div>
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Chat Area (Active Chat) */}
                  <div className={`w-full md:w-2/3 flex flex-col bg-[#e5ddd5] ${!activeChatStudentId ? 'hidden md:flex' : 'flex'}`}>
                      {/* Chat Header */}
                      <div className="p-3 md:p-4 border-b bg-white shadow-sm flex items-center gap-3 sticky top-0 z-10">
                          <button onClick={() => setActiveChatStudentId(null)} className="md:hidden p-2 hover:bg-gray-100 rounded-full">
                              <ArrowRight size={20} className="text-gray-600"/>
                          </button>

                          {activeChatStudentId === BROADCAST_CHANNEL_ID ? (
                              <div className="flex items-center gap-3">
                                <div className="bg-orange-100 p-2 rounded-full text-orange-600"><Users size={20}/></div>
                                <span className="font-bold text-gray-800">إرسال للجميع (Broadcast)</span>
                              </div>
                          ) : activeChatStudentId === BROADCAST_TEACHERS_ID ? (
                              <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-full text-green-600"><BookOpen size={20}/></div>
                                <span className="font-bold text-gray-800">إرسال لجميع المعلمين</span>
                              </div>
                          ) : activeChatStudentId ? (
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full text-blue-600"><UserCircle size={20}/></div>
                                <span className="font-bold text-gray-800">{students.find(s => s.id === activeChatStudentId)?.name}</span>
                              </div>
                          ) : null}
                      </div>
                      
                      {/* Messages List */}
                      <div className="flex-grow p-4 overflow-y-auto space-y-4 w-full bg-[#efeae2]">
                          {getCurrentChatMessages().length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                  <MessageSquare size={48} className="mb-2"/>
                                  <p>لا توجد رسائل سابقة</p>
                              </div>
                          ) : (
                              getCurrentChatMessages().map(msg => (
                                  <div key={msg.id} className={`flex w-full ${msg.senderId === 'ADMIN' ? 'justify-start' : 'justify-end'}`}>
                                      <div className={`relative max-w-[85%] md:max-w-[70%] px-4 py-2 rounded-lg shadow-sm text-sm md:text-base ${
                                          msg.senderId === 'ADMIN' 
                                            ? 'bg-white text-gray-800 rounded-tr-none' 
                                            : 'bg-[#d9fdd3] text-gray-900 rounded-tl-none'
                                      }`}>
                                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                          <span className="text-[10px] text-gray-400 block text-left mt-1">
                                              {new Date(msg.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                          </span>
                                      </div>
                                  </div>
                              ))
                          )}
                      </div>

                      {/* Input Area */}
                      <div className="p-3 bg-white border-t flex gap-2 w-full shrink-0 items-end">
                          <input 
                            type="text" 
                            className="flex-grow border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:border-[#107c57] focus:ring-1 focus:ring-[#107c57] w-full min-w-0 bg-gray-50"
                            placeholder="اكتب رسالة..."
                            value={msgContent}
                            onChange={(e) => setMsgContent(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            dir="auto"
                          />
                          <button 
                            onClick={handleSendMessage} 
                            className="bg-[#107c57] hover:bg-[#0d6949] text-white p-3 rounded-full shadow-md shrink-0 transition-transform active:scale-95 flex items-center justify-center"
                          >
                              <Send size={20} className="rotate-180 ml-1" />
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {/* --- SETTINGS TAB --- */}
          {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                   <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2 text-xl">
                      <Settings size={24} className="text-gray-600"/>
                      إعدادات المدير
                   </h3>

                   <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                       <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                           <Lock size={18} />
                           تغيير كلمة المرور
                       </h4>
                       
                       {passwordMsg && (
                           <div className={`text-center p-2 rounded mb-4 text-sm font-bold ${passwordMsg.includes('بنجاح') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                               {passwordMsg}
                           </div>
                       )}

                       <form onSubmit={handleChangePassword} className="space-y-4">
                           <div>
                               <label className="block text-sm font-bold text-gray-600 mb-1">كلمة المرور الحالية</label>
                               <input 
                                   type="password" 
                                   required
                                   className="w-full border rounded p-2 text-sm"
                                   value={passwordData.current}
                                   onChange={e => setPasswordData({...passwordData, current: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-gray-600 mb-1">كلمة المرور الجديدة</label>
                               <input 
                                   type="password" 
                                   required
                                   className="w-full border rounded p-2 text-sm"
                                   value={passwordData.new}
                                   onChange={e => setPasswordData({...passwordData, new: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-bold text-gray-600 mb-1">تأكيد كلمة المرور الجديدة</label>
                               <input 
                                   type="password" 
                                   required
                                   className="w-full border rounded p-2 text-sm"
                                   value={passwordData.confirm}
                                   onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
                               />
                           </div>
                           <button type="submit" className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-900 transition w-full md:w-auto">
                               حفظ التغييرات
                           </button>
                       </form>
                   </div>
              </div>
          )}
      </div>
    </div>
  );
};