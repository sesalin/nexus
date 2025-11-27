import React from 'react';
import { LiveStatus } from '../components/dashboard/LiveStatus';
import { Alerts } from '../components/dashboard/Alerts';

export const Dashboard: React.FC = () => {
  return (
    <div className="flex-1 min-h-full relative">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-nexdom-lime/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-[1600px] mx-auto py-6 px-4 lg:px-8 lg:pl-32 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-8">
            <Alerts />
            <LiveStatus />
          </div>

          {/* Right Side Widgets (Future Expansion) */}
          <div className="hidden xl:block space-y-6">
            {/* Weather Widget Placeholder */}
            <div className="glass-panel rounded-[2rem] p-6 h-64 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
               <h3 className="text-white font-medium relative z-10">Weather</h3>
               <div className="absolute bottom-4 right-4 text-6xl font-thin text-white/80">24°</div>
               <div className="absolute top-4 right-4 text-nexdom-gold">Sunny</div>
            </div>

            {/* Energy Quick View Placeholder */}
            <div className="glass-panel rounded-[2rem] p-6 h-48 relative overflow-hidden">
               <h3 className="text-white font-medium mb-4">Energy Flow</h3>
               <div className="flex items-end justify-between h-24 gap-2">
                  {[40, 65, 30, 80, 55, 90, 45].map((h, i) => (
                    <div key={i} className="w-full bg-nexdom-lime/20 rounded-t-lg relative overflow-hidden group">
                      <div 
                        className="absolute bottom-0 left-0 w-full bg-nexdom-lime shadow-[0_0_10px_#00FF88] transition-all duration-1000"
                        style={{ height: `${h}%` }}
                      ></div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
