import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-[#107c57] text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex items-center justify-start gap-4">
        
        {/* Logo on the Right (Start in RTL) */}
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white overflow-hidden bg-white/10 shrink-0 relative">
            <img 
              src="/sheikh.jpg" 
              alt="Logo" 
              className="w-full h-full object-cover"
            />
        </div>

        {/* Title next to it */}
        <h1 className="text-xl md:text-3xl font-bold font-amiri tracking-wide whitespace-nowrap">
          مكتب الشيخ سعد بن محمود أبو نوارج
        </h1>
        
      </div>
    </header>
  );
};