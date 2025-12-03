import React from 'react';
import { Device } from '../../types/nexdom';
import { Lightbulb, Thermometer, Lock, Camera, Activity, Power, Battery, Wifi } from 'lucide-react';
import { useNexdomStore } from '../../store/nexdomStore';
import { motion } from 'framer-motion';
import { useOffline } from '../../hooks/useOffline';

interface DeviceCardProps {
  device: Device;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  const toggleDevice = useNexdomStore((state) => state.toggleDevice);
  const { isOffline } = useOffline();

  const getIcon = () => {
    switch (device.type) {
      case 'light': return <Lightbulb className={`w-5 h-5 ${device.status === 'on' ? 'text-nexdom-gold drop-shadow-[0_0_8px_rgba(230,195,106,0.8)]' : 'text-gray-500'}`} />;
      case 'thermostat': return <Thermometer className="w-5 h-5 text-orange-400" />;
      case 'lock': return <Lock className={`w-5 h-5 ${device.status === 'locked' ? 'text-nexdom-lime drop-shadow-[0_0_8px_rgba(0,255,136,0.8)]' : 'text-red-400'}`} />;
      case 'camera': return <Camera className="w-5 h-5 text-blue-400" />;
      case 'sensor': return <Activity className="w-5 h-5 text-purple-400" />;
      default: return <Power className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (device.type === 'thermostat') return `${device.value}°C`;
    if (device.type === 'sensor') return device.value;
    return device.status.charAt(0).toUpperCase() + device.status.slice(1);
  };

  const isActive = device.status === 'on' || device.status === 'locked';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative overflow-hidden rounded-[2rem] p-5 cursor-pointer transition-all duration-300
        ${isActive
          ? 'bg-gradient-to-br from-white/10 to-white/5 border border-nexdom-lime/30 shadow-[0_0_15px_rgba(0,255,136,0.1)]'
          : 'bg-nexdom-glass border border-white/5 hover:border-white/20'
        }
        ${isOffline ? 'opacity-50 cursor-not-allowed grayscale' : ''}
      `}
      onClick={() => !isOffline && toggleDevice(device.id)}
    >
      {/* Background Glow for Active State */}
      {isActive && (
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-nexdom-lime/20 blur-[50px] rounded-full pointer-events-none"></div>
      )}

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-white/10' : 'bg-black/20'
          }`}>
          {getIcon()}
        </div>

        {device.battery && (
          <div className="flex items-center gap-1">
            <div className="w-8 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${device.battery > 20 ? 'bg-nexdom-lime' : 'bg-red-500'}`}
                style={{ width: `${device.battery}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h3 className="font-medium text-white text-sm mb-1 tracking-wide">{device.name}</h3>
        <p className="text-xs text-gray-400 mb-3">{device.room}</p>

        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold ${isActive ? 'text-nexdom-lime text-glow-lime' : 'text-gray-500'
            }`}>
            {getStatusText()}
          </span>

          {device.status !== 'offline' && (
            <Wifi className="w-3 h-3 text-gray-600" />
          )}
        </div>
      </div>
    </motion.div>
  );
};
