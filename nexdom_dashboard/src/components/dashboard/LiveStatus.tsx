import React from 'react';
import { useNexdomStore } from '../../store/nexdomStore';
import { DeviceCard } from './DeviceCard';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export const LiveStatus: React.FC = () => {
  const { rooms, devices } = useNexdomStore();

  return (
    <div className="relative z-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-nexdom-lime rounded-full shadow-[0_0_10px_#00FF88]"></div>
          <h2 className="text-xl font-bold text-white tracking-wide">Live Status</h2>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-nexdom-lime/10 border border-nexdom-lime/20 rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-nexdom-lime rounded-full animate-pulse shadow-[0_0_5px_#00FF88]"></span>
            <span className="text-xs font-medium text-nexdom-lime tracking-wider uppercase">System Online</span>
          </div>
        </div>
      </div>

      {/* Devices Grid - Asymmetric Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {devices.map((device, index) => (
          <motion.div
            key={device.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={index === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}
          >
            <DeviceCard device={device} />
          </motion.div>
        ))}
      </div>

      {/* Rooms Section - Futuristic Chips */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-lg font-semibold text-white/80">Active Zones</h3>
          <button className="text-xs text-nexdom-gold hover:text-white transition-colors flex items-center gap-1">
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-2">
          {rooms.map((room, index) => (
            <motion.div 
              key={room.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
              className="min-w-[160px] p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-[1.5rem] cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-white">{room.name}</h4>
                <div className="w-2 h-2 rounded-full bg-nexdom-lime shadow-[0_0_5px_#00FF88]"></div>
              </div>
              
              <div className="flex items-end justify-between">
                <div className="text-xs text-gray-400">
                  <p>{room.activeDevices} Devices</p>
                </div>
                {room.temperature && (
                  <p className="text-lg font-light text-white">{room.temperature}°</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
