import React from 'react';
import { useNexdomStore } from '../store/nexdomStore';
import { Play, Plus } from 'lucide-react';
import * as Icons from 'lucide-react';

export const Scenes: React.FC = () => {
  const { scenes, activateScene } = useNexdomStore();

  return (
    <div className="p-6 max-w-[1600px] mx-auto lg:pl-32 lg:pr-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-white tracking-wide">Scenes</h2>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-nexdom-lime/10 text-nexdom-lime border border-nexdom-lime/30 rounded-full hover:bg-nexdom-lime/20 transition-all shadow-[0_0_15px_rgba(0,255,136,0.1)]">
          <Plus className="w-4 h-4" />
          <span className="font-medium">Create Scene</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenes.map((scene) => {
          const IconComponent = (Icons as any)[scene.icon] || Icons.Layers;

          return (
            <div
              key={scene.id}
              className={`p-8 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden ${scene.isActive
                  ? 'bg-white/10 border-nexdom-lime/50 shadow-[0_0_30px_rgba(0,255,136,0.15)]'
                  : 'glass-panel border-white/5 hover:border-white/20'
                }`}
              onClick={() => activateScene(scene.id)}
            >
              {/* Ambient Background Glow */}
              <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[60px] transition-colors duration-500 ${scene.isActive ? 'bg-nexdom-lime/20' : 'bg-white/5 group-hover:bg-white/10'
                }`}></div>

              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${scene.isActive ? 'bg-nexdom-lime text-black' : 'bg-white/10 text-white'
                  }`}>
                  <IconComponent className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{scene.name}</h3>
                <p className="text-sm text-gray-400 mb-6">{scene.isActive ? 'Currently Active' : 'Tap to Activate'}</p>

                <button className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${scene.isActive
                    ? 'bg-nexdom-lime text-black shadow-[0_0_15px_rgba(0,255,136,0.4)]'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}>
                  <Play className="w-4 h-4 fill-current" />
                  {scene.isActive ? 'Active' : 'Activate Scene'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
