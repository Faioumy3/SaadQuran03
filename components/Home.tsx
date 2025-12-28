import React from 'react';
import { BookOpen, GraduationCap, UserPlus, ShieldCheck } from 'lucide-react';
import { View } from '../types';

interface HomeProps {
  changeView: (view: View) => void;
}

export const Home: React.FC<HomeProps> = ({ changeView }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 w-full max-w-lg mx-auto animate-in fade-in duration-500">
      
      {/* Greeting / Poem Box */}
      <div className="w-full bg-gradient-to-br from-[#ffffff] via-[#f0fdf4] to-[#dcfce7] border-4 border-double border-[#107c57] rounded-3xl p-6 mb-8 text-center shadow-xl relative overflow-hidden">
        
        {/* Content Container */}
        <div className="flex flex-col items-center justify-center gap-4 font-amiri text-[#064e3b]">
             {/* Line 1 */}
            <h3 className="font-bold text-lg md:text-xl flex items-center justify-center gap-2 mb-1">
              السلام عليكم ورحمة الله وبركاته <span className="text-xl">😊</span>
            </h3>
            
            {/* Line 2 */}
            <p className="text-base md:text-xl whitespace-nowrap leading-relaxed">
              لَعَلَّ إِلَهَ العَرْشِ يَا إِخْوَتِي يَقِي ... جَمَاعَتَنَا كُلَّ المَكَارِهِ هَوْلَا
            </p>

            {/* Line 3 */}
            <p className="text-base md:text-xl whitespace-nowrap leading-relaxed">
              وَيَجْعَلُنَا مِمَّنْ يَكُونُ كِتَابُهُ ... شَفِيعاً لَهُمْ إِذْ مَا نَسُوهُ فَيُمْحَلَا
            </p>
        </div>
      </div>

      {/* Description Text */}
      <div className="text-center mb-8 w-full px-2">
        <h2 className="text-[#064e3b] font-bold text-sm md:text-base leading-relaxed">
          متابعة حضور وغياب الطلاب والمعلمين وإدارة شؤون المكتب بشكل رقمي لتسهيل الإدارة اليومية
        </h2>
      </div>

      <div className="w-full space-y-3 flex flex-col items-center">
        
        {/* Teacher Button */}
        <button 
          onClick={() => changeView(View.TEACHER_LOGIN)}
          className="w-full bg-[#107c57] hover:bg-[#0d6949] text-white py-3 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 group"
        >
          <span className="text-lg font-bold">دخول المعلمين</span>
          <BookOpen className="w-5 h-5" />
        </button>

        {/* Student Button */}
        <button 
          onClick={() => changeView(View.STUDENT_LOGIN)}
          className="w-full bg-[#ec4899] hover:bg-[#db2777] text-white py-3 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 group"
        >
          <span className="text-lg font-bold">دخول الطالب</span>
          <GraduationCap className="w-5 h-5" />
        </button>

        {/* Register Button */}
        <button 
          onClick={() => changeView(View.REGISTER_STUDENT)}
          className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white py-3 rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 group"
        >
          <span className="text-lg font-bold">تسجيل طالب جديد</span>
          <UserPlus className="w-5 h-5" />
        </button>

        <div className="h-2"></div>

        {/* Manager Button */}
        <button 
          onClick={() => changeView(View.MANAGER_LOGIN)}
           className="px-6 py-2 border-2 border-gray-300 text-gray-500 hover:border-[#107c57] hover:text-[#107c57] rounded-full bg-white shadow-sm flex items-center gap-2 transition-colors text-xs font-semibold"
        >
          <span>دخول المدير</span>
          <ShieldCheck className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};