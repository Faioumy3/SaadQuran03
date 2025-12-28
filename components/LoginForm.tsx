import React, { useState } from 'react';
import { View, Student, Teacher } from '../types';
import { ArrowRight, LogIn, Loader2 } from 'lucide-react';
import { storageService } from '../services/storageService';

interface LoginFormProps {
  changeView: (view: View) => void;
  type: 'TEACHER' | 'STUDENT' | 'MANAGER';
  setCurrentUser?: (user: Student | Teacher) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ changeView, type, setCurrentUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  let config = {
    title: 'دخول المعلمين',
    color: 'bg-[#107c57]',
    textColor: 'text-[#107c57]',
    placeholderUser: 'اسم المستخدم',
  };

  if (type === 'STUDENT') {
    config = {
      title: 'دخول الطالب',
      color: 'bg-[#ec4899]',
      textColor: 'text-[#ec4899]',
      placeholderUser: 'اسم المستخدم',
    };
  } else if (type === 'MANAGER') {
    config = {
      title: 'دخول المدير',
      color: 'bg-gray-800',
      textColor: 'text-gray-800',
      placeholderUser: '',
    };
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        if (type === 'MANAGER') {
            const storedPass = await storageService.getManagerPassword();
            if (password === storedPass) {
                changeView(View.MANAGER_DASHBOARD);
            } else {
                setError('كلمة المرور غير صحيحة');
            }
            setLoading(false);
            return;
        }

        if (type === 'TEACHER') {
            const teacher = await storageService.findTeacher(username);
            
            if (teacher && teacher.password === password) {
                if (setCurrentUser) setCurrentUser(teacher);
                changeView(View.TEACHER_DASHBOARD);
            } else {
                setError('بيانات المعلم غير صحيحة');
            }
            setLoading(false);
            return;
        }

        if (type === 'STUDENT') {
            const student = await storageService.findStudent(username);
            
            // Casting to any because password isn't on the interface strictly but stored
            if (student && (student as any).password === password) {
                if (setCurrentUser) setCurrentUser(student);
                changeView(View.STUDENT_DASHBOARD);
            } else if (!student) {
                setError('اسم المستخدم غير موجود');
            } else {
                setError('بيانات الدخول غير صحيحة');
            }
            setLoading(false);
            return;
        }
    } catch (e) {
        setError('خطأ في الاتصال بالخادم');
        setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => changeView(View.HOME)} className="text-gray-400 hover:text-gray-600">
            <ArrowRight size={24} />
          </button>
          <h2 className={`text-xl md:text-2xl font-bold ${config.textColor}`}>
            {config.title}
          </h2>
          <div className="w-6"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 md:w-20 md:h-20 mx-auto ${config.color} bg-opacity-10 rounded-full flex items-center justify-center mb-4`}>
                <LogIn className={`w-8 h-8 md:w-10 md:h-10 ${config.textColor}`} />
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-center font-bold text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {type !== 'MANAGER' && (
            <div>
              <label className="block text-gray-700 font-bold mb-2 text-sm">اسم المستخدم</label>
              <input 
                type="text"
                required
                className={`w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-20 outline-none transition-all text-left ${type === 'STUDENT' ? 'focus:ring-pink-500 focus:border-pink-500' : 'focus:ring-green-700 focus:border-green-700'}`}
                placeholder={config.placeholderUser}
                dir="ltr"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-bold mb-2 text-sm">كلمة السر</label>
            <input 
              type="password"
              required
              className={`w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-opacity-20 outline-none transition-all text-left ${type === 'MANAGER' ? 'focus:ring-gray-500 focus:border-gray-500' : type === 'STUDENT' ? 'focus:ring-pink-500 focus:border-pink-500' : 'focus:ring-green-700 focus:border-green-700'}`}
              placeholder="********"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full ${config.color} disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <span>تسجيل الدخول</span>}
          </button>
        </form>
      </div>
    </div>
  );
};