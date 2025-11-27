import React from 'react';
import { useNexdomStore } from '../store/nexdomStore';
import { Shield, Lock, Unlock, AlertTriangle } from 'lucide-react';

export const Security: React.FC = () => {
  const { devices, toggleDevice } = useNexdomStore();
  const locks = devices.filter(d => d.type === 'lock');
  const cameras = devices.filter(d => d.type === 'camera');
  const sensors = devices.filter(d => d.type === 'sensor');

  return (
    <div className="p-6 max-w-7xl mx-auto lg:pl-32">
      <h2 className="text-3xl font-bold text-white mb-8 tracking-wide">Security Center</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cameras */}
        <div className="space-y-6">
          <h3 className="font-semibold text-gray-400 uppercase tracking-wider text-sm">Live Feeds</h3>
          <div className="grid grid-cols-1 gap-6">
            {cameras.map(camera => (
              <div key={camera.id} className="bg-black rounded-[2rem] overflow-hidden aspect-video relative group border border-white/10 shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center text-white/30 bg-gray-900">
                  <span className="flex items-center gap-2"><Shield className="w-5 h-5" /> Signal Lost</span>
                </div>
                
                {/* Camera UI Overlay */}
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-white">REC</span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white flex justify-between items-end">
                  <div>
                    <span className="font-medium text-lg block">{camera.name}</span>
                    <span className="text-xs text-gray-400">{camera.room} • 1080p HEVC</span>
                  </div>
                  <span className="text-xs bg-nexdom-lime/20 text-nexdom-lime border border-nexdom-lime/30 px-3 py-1 rounded-full backdrop-blur-md">LIVE</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-8">
          <div>
            <h3 className="font-semibold text-gray-400 uppercase tracking-wider text-sm mb-4">Access Control</h3>
            <div className="space-y-4">
              {locks.map(lock => (
                <div key={lock.id} className="glass-panel p-5 rounded-[1.5rem] flex items-center justify-between group hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${lock.status === 'locked' ? 'bg-nexdom-lime/10 text-nexdom-lime' : 'bg-red-500/10 text-red-500'}`}>
                      {lock.status === 'locked' ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-white text-lg">{lock.name}</h4>
                      <p className="text-sm text-gray-500">{lock.room}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleDevice(lock.id)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      lock.status === 'locked' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' 
                        : 'bg-nexdom-lime/10 text-nexdom-lime border border-nexdom-lime/30 hover:bg-nexdom-lime/20'
                    }`}
                  >
                    {lock.status === 'locked' ? 'Unlock' : 'Lock'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-400 uppercase tracking-wider text-sm mb-4">Sensors Status</h3>
            <div className="grid grid-cols-2 gap-4">
              {sensors.map(sensor => (
                <div key={sensor.id} className="glass-panel p-4 rounded-[1.5rem] flex items-center gap-4">
                  <div className="p-2 bg-purple-500/10 rounded-full text-purple-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{sensor.name}</h4>
                    <p className="text-xs text-gray-400">{sensor.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
