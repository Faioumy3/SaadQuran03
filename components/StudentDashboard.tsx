import React, { useState, useEffect } from 'react';
import { View, Student, DailyLog, Message } from '../types';
import { storageService } from '../services/storageService';
import { LogOut, Send, Calendar, MessageSquare, Settings, User, UserCircle, Loader2 } from 'lucide-react';

interface StudentDashboardProps {
  changeView: (view: View) => void;
  currentUser: Student;
  logout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ changeView, currentUser, logout }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'messages'>('logs');
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [newMemo, setNewMemo] = useState('');
  const [revision, setRevision] = useState('');
  const [nextGoal, setNextGoal] = useState('');
  const [notes, setNotes] = useState('');
  
  // Messages State
  const [msgInput, setMsgInput] = useState('');

  // Reply Inputs State (Map logId to input value)
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        // 1. Sync missed days
        await storageService.syncMissedDays(currentUser.id);
        // 2. Load data
        await loadData();
        setLoading(false);
    };
    init();
  }, [currentUser.id]);

  const loadData = async () => {
    const l = await storageService.getLogs(currentUser.id);
    const m = await storageService.getMessages(currentUser.id);
    setLogs(l);
    setMessages(m);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemo && !revision) return;

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if already logged today
    const alreadyLogged = logs.some(l => l.date === todayStr && !l.isSystemGenerated);
    if (alreadyLogged) {
      alert('تم تسجيل يومية لهذا اليوم بالفعل');
      return;
    }

    await storageService.addLog({
      studentId: currentUser.id,
      date: todayStr,
      newMemorization: newMemo,
      revision: revision,
      nextGoal: nextGoal,
      notes: notes,
      isSystemGenerated: false
    });

    setNewMemo('');
    setRevision('');
    setNextGoal('');
    setNotes('');
    loadData();
  };

  const handleSendMessage = async () => {
    if (!msgInput.trim()) return;
    await storageService.sendMessage({
      senderId: currentUser.id,
      receiverId: 'ADMIN',
      senderName: currentUser.name,
      content: msgInput
    });
    setMsgInput('');
    loadData();
  };

  const handleReplyChange = (logId: string, value: string) => {
    setReplyInputs(prev => ({
        ...prev,
        [logId]: value
    }));
  };

  const handleReplySubmit = async (logId: string) => {
      const content = replyInputs[logId];
      if (!content || !content.trim()) return;

      await storageService.addLogReply(logId, content, 'STUDENT');
      
      // Clear input
      setReplyInputs(prev => ({
          ...prev,
          [logId]: ''
      }));
      
      // Reload logs to show new reply
      loadData();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
      {/* Dashboard Header */}
      <div className="bg-[#0b5139] text-white p-4 shadow-md sticky top-0 z-20">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 shrink-0">
                 <img src="/sheikh.jpg" alt="Student" className="w-full h-full object-cover"/>
               </div>
               <div>
                  <h1 className="text-xl font-bold font-amiri">مكتب الشيخ سعد بن محمود أبو نوارج</h1>
                  <p className="text-sm opacity-90 text-green-100 flex items-center gap-1">
                    <User size={14}/>
                    مرحباً، {currentUser.name} (طالب)
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
               <button 
                onClick={() => changeView(View.HOME)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm">
                  <span className="hidden md:inline">الرئيسية</span>
               </button>
               <button 
                onClick={() => changeView(View.CHANGE_PASSWORD)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm">
                  <Settings size={16} />
               </button>
               <button 
                onClick={logout}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 transition text-sm font-bold">
                  <LogOut size={16} />
                  <span>خروج</span>
               </button>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[80px] z-10">
        <div className="container mx-auto flex items-center justify-center md:justify-end gap-2 px-4">
             <button 
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${activeTab === 'logs' ? 'border-[#0b5139] text-[#0b5139] bg-green-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
             >
                <Calendar size={20} />
                <span className="font-bold">اليوميات</span>
             </button>

             <button 
                onClick={() => setActiveTab('messages')}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${activeTab === 'messages' ? 'border-[#0b5139] text-[#0b5139] bg-green-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
             >
                <MessageSquare size={20} />
                <span className="font-bold">الرسائل</span>
             </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-4 md:p-6 flex-grow">
        
        {activeTab === 'logs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* New Entry Form */}
            <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden h-fit">
              <div className="bg-green-50/50 p-4 border-b border-green-100 flex items-center gap-2">
                <Calendar className="text-[#107c57]" size={20} />
                <h3 className="font-bold text-[#107c57]">تسجيل يوميات جديدة</h3>
              </div>
              
              <form onSubmit={handleLogSubmit} className="p-6 space-y-5">
                 
                 <div>
                    <label className="block text-gray-600 font-semibold mb-2 text-sm">الجديد (الحفظ الحالي)</label>
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#107c57] focus:ring-2 focus:ring-[#107c57]/10 outline-none transition"
                      placeholder="مثال: سورة الرحمن من آية 1 إلى 10"
                      value={newMemo}
                      onChange={e => setNewMemo(e.target.value)}
                    />
                 </div>

                 <div>
                    <label className="block text-gray-600 font-semibold mb-2 text-sm">الماضي (المراجعة)</label>
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#107c57] focus:ring-2 focus:ring-[#107c57]/10 outline-none transition"
                      placeholder="مثال: سورة الملك كاملة"
                      value={revision}
                      onChange={e => setRevision(e.target.value)}
                    />
                 </div>

                 <div>
                    <label className="block text-gray-600 font-semibold mb-2 text-sm">الهدف القادم</label>
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#107c57] focus:ring-2 focus:ring-[#107c57]/10 outline-none transition"
                      placeholder="ما المطلوب للحصة القادمة؟"
                      value={nextGoal}
                      onChange={e => setNextGoal(e.target.value)}
                    />
                 </div>

                 <div>
                    <label className="block text-gray-600 font-semibold mb-2 text-sm">ملاحظات / استفسارات</label>
                    <textarea 
                      className="w-full p-3 rounded-lg border border-gray-200 focus:border-[#107c57] focus:ring-2 focus:ring-[#107c57]/10 outline-none transition h-24 resize-none"
                      placeholder="أي صعوبات واجهتك؟"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                 </div>

                 <button 
                  type="submit"
                  className="w-full bg-[#107c57] hover:bg-[#0d6949] text-white font-bold py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                 >
                    <span>حفظ اليومية</span>
                    <Send size={18} className="rotate-180" />
                 </button>

              </form>
            </div>

            {/* History */}
            <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden h-fit">
               <div className="bg-green-50/50 p-4 border-b border-green-100 flex items-center gap-2">
                <div className="text-[#107c57]"><Settings className="animate-spin-slow" size={20}/></div>
                <h3 className="font-bold text-[#107c57]">سجل اليوميات والمناقشات</h3>
              </div>
              
              <div className="p-4 space-y-4 h-[65vh] overflow-y-auto">
                {logs.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        لا توجد يوميات مسجلة بعد
                    </div>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className="relative flex flex-col gap-2 p-4 bg-gray-50 rounded-lg border-r-4 border-[#107c57]">
                            <div className="flex justify-between items-center text-xs text-gray-400 mb-2 border-b border-gray-200 pb-2">
                                <span>{formatDate(log.date)}</span>
                                {log.isSystemGenerated && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">غائب / لم يسجل</span>}
                            </div>

                            {log.isSystemGenerated ? (
                                <p className="text-red-500 font-bold text-center py-2">{log.notes}</p>
                            ) : (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-[#107c57] font-bold text-sm">الجديد:</span>
                                        <span className="text-gray-700 text-sm font-medium">{log.newMemorization || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-bold text-sm">الماضي:</span>
                                        <span className="text-gray-700 text-sm">{log.revision || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-orange-600 font-bold text-sm">الهدف القادم:</span>
                                        <span className="text-gray-700 text-sm">{log.nextGoal || '-'}</span>
                                    </div>
                                    {log.notes && (
                                        <div className="bg-yellow-50 p-2 rounded text-xs text-gray-600 mt-1">
                                            <span className="font-bold">ملاحظاتك:</span> {log.notes}
                                        </div>
                                    )}
                                </>
                            )}
                            
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <h4 className="text-xs font-bold text-gray-500 flex items-center gap-1 mb-2">
                                    <MessageSquare size={12}/>
                                    الردود والمناقشات
                                </h4>
                                
                                <div className="space-y-2 mb-2">
                                    {log.adminFeedback && (
                                         <div className="bg-blue-50 p-2 rounded-lg text-xs">
                                            <div className="flex items-center gap-1 font-bold text-blue-700 mb-1">
                                                <UserCircle size={10} />
                                                <span>الإدارة</span>
                                            </div>
                                            <p className="text-gray-700">{log.adminFeedback}</p>
                                         </div>
                                    )}
                                    
                                    {log.replies && log.replies.map(reply => (
                                        <div key={reply.id} className={`p-2 rounded-lg text-xs ${reply.sender === 'MANAGER' ? 'bg-blue-50 mr-2' : 'bg-green-50 ml-2'}`}>
                                            <div className={`flex items-center gap-1 font-bold mb-1 ${reply.sender === 'MANAGER' ? 'text-blue-700' : 'text-green-700'}`}>
                                                <UserCircle size={10} />
                                                <span>{reply.sender === 'MANAGER' ? 'الإدارة' : 'أنت'}</span>
                                                <span className="text-[9px] font-normal text-gray-400 mr-auto">
                                                    {new Date(reply.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                            <p className="text-gray-700">{reply.content}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-2 flex gap-2">
                                     <input 
                                        type="text" 
                                        placeholder="اكتب رداً..." 
                                        className="flex-grow bg-white border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-green-500"
                                        value={replyInputs[log.id] || ''}
                                        onChange={(e) => handleReplyChange(log.id, e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleReplySubmit(log.id)}
                                     />
                                     <button 
                                        onClick={() => handleReplySubmit(log.id)}
                                        className="bg-[#107c57] text-white p-1 rounded hover:bg-[#0d6949] disabled:opacity-50"
                                        disabled={!replyInputs[log.id]?.trim()}
                                     >
                                        <Send size={12} className="rotate-180" />
                                     </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'messages' && (
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[65vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 font-bold text-gray-700">
                    الرسائل مع الإدارة
                </div>
                
                <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-gray-50">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            لا توجد رسائل سابقة
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl ${msg.senderId === currentUser.id ? 'bg-[#107c57] text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                                    <p className="text-sm">{msg.content}</p>
                                    <span className={`text-[10px] block mt-1 ${msg.senderId === currentUser.id ? 'text-green-200' : 'text-gray-400'}`}>
                                        {new Date(msg.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                    <input 
                        type="text" 
                        className="flex-grow p-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#107c57] focus:ring-1 focus:ring-[#107c57]"
                        placeholder="اكتب رسالتك هنا..."
                        value={msgInput}
                        onChange={(e) => setMsgInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button 
                        onClick={handleSendMessage}
                        className="bg-[#107c57] hover:bg-[#0d6949] text-white p-3 rounded-lg transition-colors"
                    >
                        <Send size={20} className="rotate-180" />
                    </button>
                </div>
             </div>
        )}

      </div>
    </div>
  );
};