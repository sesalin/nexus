import React from 'react';
import { ZonesPanel } from '../components/dashboard/zones/ZonesPanel';

export const Zones: React.FC = () => {
  return (
    <div className="flex-1 min-h-full relative">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-nexdom-lime/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="w-full py-6 px-4 lg:px-8 lg:pl-32 relative z-10">
        <ZonesPanel />
      </div>
    </div>
  );
};
