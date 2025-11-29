import React, { useMemo } from 'react';
import { useHomeAssistant } from '../components/dashboard/HomeAssistant';
import { Shield, Lock, Unlock, AlertTriangle, Camera, Eye, ToggleLeft, ToggleRight, Lightbulb } from 'lucide-react';

export const Security: React.FC = () => {
  const { zones, toggleEntity } = useHomeAssistant();

  // Filter devices from "Security" area
  const securityDevices = useMemo(() => {
    const securityZone = zones.find(zone =>
      zone.name.toLowerCase().includes('security') ||
      zone.id.toLowerCase().includes('security')
    );

    if (!securityZone) return { cameras: [], locks: [], sensors: [], controls: [] };

    const cameras: any[] = [];
    const locks: any[] = [];
    const sensors: any[] = [];
    const controls: any[] = [];

    securityZone.entities.forEach(entity => {
      const domain = entity.entity_id.split('.')[0];
      const device = {
        id: entity.entity_id,
        name: entity.attributes.friendly_name || entity.entity_id,
        state: entity.state,
        attributes: entity.attributes,
        domain: domain,
      };

      if (domain === 'camera') {
        cameras.push(device);
      } else if (domain === 'lock') {
        locks.push(device);
      } else if (domain === 'binary_sensor' || domain === 'sensor') {
        sensors.push(device);
      } else if (domain === 'switch' || domain === 'light' || domain === 'input_boolean') {
        controls.push(device);
      }
    });

    return { cameras, locks, sensors, controls };
  }, [zones]);

  const handleToggle = async (entityId: string) => {
    await toggleEntity(entityId);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto lg:pl-32 lg:pr-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/30">
          <Shield className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-wide">Security Center</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cameras */}
        <div className="space-y-6">
          <h3 className="font-semibold text-gray-400 uppercase tracking-wider text-sm">Live Feeds</h3>
          <div className="grid grid-cols-1 gap-6">
            {securityDevices.cameras.length === 0 ? (
              <div className="glass-panel rounded-[2rem] p-6 text-center border border-white/5">
                <p className="text-gray-400">No cameras found in Security area</p>
              </div>
            ) : (
              securityDevices.cameras.map(camera => (
                <div key={camera.id} className="bg-black rounded-[2rem] overflow-hidden aspect-video relative group border border-white/10 shadow-2xl">
                  {/* Camera stream placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center text-white/30 bg-gray-900">
                    <div className="text-center">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <span className="flex items-center gap-2 text-sm">
                        <Eye className="w-4 h-4" />
                        Stream: {camera.attributes.entity_picture ? 'Available' : 'Configuring...'}
                      </span>
                    </div>
                  </div>

                  {/* Camera UI Overlay */}
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-white">REC</span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white flex justify-between items-end">
                    <div>
                      <span className="font-medium text-lg block">{camera.name}</span>
                      <span className="text-xs text-gray-400">
                        {camera.state === 'idle' ? 'Idle' : camera.state === 'recording' ? 'Recording' : 'Live'}
                      </span>
                    </div>
                    <span className="text-xs bg-nexdom-lime/20 text-nexdom-lime border border-nexdom-lime/30 px-3 py-1 rounded-full backdrop-blur-md">
                      {camera.state.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Controls Column */}
        <div className="space-y-8">

          {/* Locks */}
          <div>
            <h3 className="font-semibold text-gray-400 uppercase tracking-wider text-sm mb-4">Access Control</h3>
            <div className="space-y-4">
              {securityDevices.locks.length === 0 ? (
                <div className="glass-panel rounded-[1.5rem] p-6 text-center border border-white/5">
                  <p className="text-gray-400 text-sm">No locks found</p>
                </div>
              ) : (
                securityDevices.locks.map(lock => (
                  <div key={lock.id} className="glass-panel p-5 rounded-[1.5rem] flex items-center justify-between group hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${lock.state === 'locked'
                          ? 'bg-nexdom-lime/10 text-nexdom-lime'
                          : 'bg-red-500/10 text-red-500'
                        }`}>
                        {lock.state === 'locked' ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-lg">{lock.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{lock.state}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(lock.id)}
                      className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${lock.state === 'locked'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                          : 'bg-nexdom-lime/10 text-nexdom-lime border border-nexdom-lime/30 hover:bg-nexdom-lime/20'
                        }`}
                    >
                      {lock.state === 'locked' ? 'Unlock' : 'Lock'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Security Controls (Switches/Lights) */}
          {securityDevices.controls.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-400 uppercase tracking-wider text-sm mb-4">Security Controls</h3>
              <div className="space-y-4">
                {securityDevices.controls.map(device => (
                  <div key={device.id} className="glass-panel p-5 rounded-[1.5rem] flex items-center justify-between group hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${device.state === 'on'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-white/5 text-gray-400'
                        }`}>
                        {device.domain === 'light' ? <Lightbulb className="w-6 h-6" /> : <ToggleRight className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-lg">{device.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{device.domain}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggle(device.id)}
                      className={`transition-all duration-300 transform hover:scale-110 ${device.state === 'on'
                          ? 'text-nexdom-lime drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]'
                          : 'text-gray-600'
                        }`}
                    >
                      {device.state === 'on' ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sensors */}
          <div>
            <h3 className="font-semibold text-gray-400 uppercase tracking-wider text-sm mb-4">Sensors Status</h3>
            <div className="grid grid-cols-2 gap-4">
              {securityDevices.sensors.length === 0 ? (
                <div className="col-span-2 glass-panel rounded-[1.5rem] p-6 text-center border border-white/5">
                  <p className="text-gray-400 text-sm">No sensors found</p>
                </div>
              ) : (
                securityDevices.sensors.map(sensor => (
                  <div key={sensor.id} className="glass-panel p-4 rounded-[1.5rem] flex items-center gap-4">
                    <div className={`p-2 rounded-full ${sensor.state === 'on' || sensor.state === 'detected' || sensor.state === 'open'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-purple-500/10 text-purple-400'
                      }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{sensor.name}</h4>
                      <p className="text-xs text-gray-400 capitalize">
                        {sensor.attributes.unit_of_measurement
                          ? `${sensor.state} ${sensor.attributes.unit_of_measurement}`
                          : sensor.state
                        }
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
