import React from 'react';
import { Phone, Send } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0b5139] text-white py-4 px-4 mt-auto">
      <div className="container mx-auto flex flex-col sm:flex-row justify-center items-center gap-4 text-sm md:text-base">
        
        <div className="font-bold whitespace-nowrap">
          تواصل معنا:
        </div>

        <div className="flex items-center gap-6">
          <a href="tel:01060936428" className="flex items-center gap-2 hover:text-green-200 transition-colors">
            <span dir="ltr" className="font-mono">01060936428</span>
            <div className="bg-[#25D366] p-1 rounded-full">
               <Phone size={14} fill="white" className="text-white" />
            </div>
          </a>

          <a href="https://t.me/Saad2961" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-green-200 transition-colors">
            <span dir="ltr" className="font-mono">@Saad2961</span>
            <div className="bg-[#229ED9] p-1 rounded-full">
               <Send size={14} fill="white" className="text-white" />
            </div>
          </a>
        </div>
      </div>
    </footer>
  );
};