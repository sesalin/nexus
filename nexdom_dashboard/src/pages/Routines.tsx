import React from 'react';
import { useNexdomStore } from '../store/nexdomStore';
import { Clock, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

export const Routines: React.FC = () => {
  const { routines, toggleRoutine } = useNexdomStore();

  return (
    <div className="flex-1 min-h-full relative">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-nexdom-lime/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="max-w-[1600px] mx-auto py-6 px-4 lg:px-8 lg:pl-32 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white tracking-wide">Automations</h2>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full hover:bg-blue-500/20 transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Plus className="w-4 h-4" />
            <span className="font-medium hidden sm:inline">New Routine</span>
          </button>
        </div>

        <div className="space-y-4">
          {routines.map((routine) => (
            <div key={routine.id} className="glass-panel p-6 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:bg-white/5 transition-all border border-white/5 hover:border-white/10 gap-4 min-h-[120px]">
              <div className="flex items-start sm:items-center gap-6 flex-1">
                <div className={`p-4 rounded-full shrink-0 ${routine.enabled ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 text-gray-500'}`}>
                  <Clock className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white mb-2 break-words">{routine.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <p className="text-sm text-gray-400 flex items-center gap-2 flex-wrap">
                      Trigger: <span className="font-medium text-white/80 bg-white/5 px-2 py-0.5 rounded-md whitespace-normal">{routine.trigger}</span>
                    </p>
                    {routine.nextRun && (
                      <span className="text-xs text-nexdom-gold bg-nexdom-gold/10 px-2 py-0.5 rounded-full border border-nexdom-gold/20 whitespace-nowrap">
                        Next: {routine.nextRun}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => toggleRoutine(routine.id)}
                className={`transition-all duration-300 transform hover:scale-110 self-end sm:self-center ${routine.enabled ? 'text-nexdom-lime drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]' : 'text-gray-600'}`}
              >
                {routine.enabled ? <ToggleRight className="w-12 h-12" /> : <ToggleLeft className="w-12 h-12" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
