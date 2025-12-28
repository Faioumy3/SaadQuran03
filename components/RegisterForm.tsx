import React, { useState } from 'react';
import { View } from '../types';
import { ArrowRight, Save, UserPlus, Loader2 } from 'lucide-react';
import { storageService } from '../services/storageService';

interface RegisterFormProps {
  changeView: (view: View) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ changeView }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور غير متطابقة');
      return;
    }

    if (formData.name && formData.username && formData.password) {
      setLoading(true);
      
      // Check if username exists
      const existing = await storageService.findStudent(formData.username);
      if (existing) {
          setError('اسم المستخدم مسجل مسبقاً');
          setLoading(false);
          return;
      }

      const res = await storageService.addStudent({
        name: formData.name,
        username: formData.username,
        // In real app, password should be stored here or separate auth. 
        // For this model we assume custom field or extended type, 
        // but current Student interface doesn't strictly have password.
        // We will store it for now as part of the student object despite strict typing warning,
        // or assumes the type allows it. Casting to any to fix TS for this migration.
        password: formData.password
      } as any);
      
      setLoading(false);
      
      if (res) {
          setSuccess(true);
          setTimeout(() => {
            changeView(View.STUDENT_LOGIN);
          }, 2000);
      } else {
          setError('حدث خطأ أثناء التسجيل');
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => changeView(View.HOME)} className="text-gray-400 hover:text-gray-600">
            <ArrowRight size={24} />
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-[#f59e0b] flex items-center gap-2">
            <UserPlus size={24} />
            تسجيل طالب جديد
          </h2>
          <div className="w-6"></div>
        </div>

        {success ? (
          <div className="text-center py-10 text-green-600">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold">تم التسجيل بنجاح!</h3>
            <p className="text-gray-500 mt-2">جاري تحويلك لصفحة تسجيل الدخول...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-bold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-bold mb-2 text-sm">الاسم رباعي</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 outline-none transition-all"
                placeholder="الاسم كاملاً"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 text-sm">اسم المستخدم</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 outline-none transition-all"
                placeholder="اسم المستخدم للدخول"
                dir="ltr"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 text-sm">كلمة السر</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 outline-none transition-all"
                placeholder="********"
                dir="ltr"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2 text-sm">تكرار كلمة السر</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 outline-none transition-all"
                placeholder="********"
                dir="ltr"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#f59e0b] hover:bg-[#d97706] disabled:bg-gray-400 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors mt-4"
            >
              {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>جاري المعالجة...</span>
                  </>
              ) : (
                  <>
                    <span>حفظ البيانات</span>
                    <Save size={20} />
                  </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};