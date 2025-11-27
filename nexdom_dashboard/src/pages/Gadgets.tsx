import React from 'react';
import { GadgetGrid } from '../components/dashboard/templates/GadgetGrid';
import { Cpu } from 'lucide-react';

export const Gadgets: React.FC = () => {
  return (
    <div className="flex-1 min-h-full relative">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-nexdom-lime/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-[1600px] mx-auto py-6 px-4 lg:px-8 lg:pl-32 relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-nexdom-lime/10 rounded-lg border border-nexdom-lime/30">
            <Cpu className="w-6 h-6 text-nexdom-lime" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-wide">Connected Gadgets</h2>
        </div>

        <GadgetGrid />
      </div>
    </div>
  );
};
