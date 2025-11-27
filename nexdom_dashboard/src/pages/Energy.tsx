import React from 'react';
import { useNexdomStore } from '../store/nexdomStore';
import { Zap, Sun, Battery } from 'lucide-react';

export const Energy: React.FC = () => {
  const energy = useNexdomStore((state) => state.energy);

  return (
    <div className="flex-1 min-h-full relative">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-nexdom-lime/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-[1600px] mx-auto py-6 px-4 lg:px-8 lg:pl-32 relative z-10">
        <h2 className="text-3xl font-bold text-white mb-8 tracking-wide">Energy Monitor</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel p-6 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-500/10 blur-[50px] rounded-full group-hover:bg-yellow-500/20 transition-colors"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-gray-300">Current Usage</h3>
            </div>
            <p className="text-4xl font-bold text-white relative z-10">{energy.currentUsage} <span className="text-lg font-normal text-gray-500">kW</span></p>
          </div>

          <div className="glass-panel p-6 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full group-hover:bg-orange-500/20 transition-colors"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400">
                <Sun className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-gray-300">Solar Generation</h3>
            </div>
            <p className="text-4xl font-bold text-white relative z-10">{energy.solarGeneration} <span className="text-lg font-normal text-gray-500">kW</span></p>
          </div>

          <div className="glass-panel p-6 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-500/10 blur-[50px] rounded-full group-hover:bg-green-500/20 transition-colors"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                <Battery className="w-6 h-6" />
              </div>
              <h3 className="font-medium text-gray-300">Battery Level</h3>
            </div>
            <p className="text-4xl font-bold text-white relative z-10">{energy.batteryLevel}%</p>
            <div className="w-full bg-gray-700/50 rounded-full h-2 mt-4 overflow-hidden">
              <div className="bg-green-500 h-full rounded-full shadow-[0_0_10px_#22c55e]" style={{ width: `${energy.batteryLevel}%` }}></div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[2rem] h-96 flex items-center justify-center text-gray-500 border border-white/5">
          <div className="text-center">
            <p className="text-lg mb-2">Energy Flow Visualization</p>
            <p className="text-sm opacity-50">Interactive Graph Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
};
