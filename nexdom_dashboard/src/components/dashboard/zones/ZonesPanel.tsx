import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GadgetCard, GadgetProps } from '../templates/GadgetCard';
import { ChevronDown } from 'lucide-react';
import { useNexdomStore } from '../../../store/nexdomStore';

// Helper to get icon path (reusing logic from GadgetGrid)
const iconModules = import.meta.glob('../../../assets/icons/*.svg', { eager: true, as: 'url' });
const getIconPath = (type: string): string => {
  // Simple mapping for mock data
  const map: Record<string, string> = {
    'light': 'light',
    'sensor': 'Sensor-movimiento',
    'switch': 'Smart-plug',
    'thermostat': 'Temperatura',
    'remote': 'IR',
    'cover': 'Persiana'
  };
  const name = map[type] || 'Smart-plug';
  const key = `../../../assets/icons/${name}.svg`;
  const resolved = iconModules[key] as string | undefined;
  if (resolved) return resolved;
  
  // Fallback al path estático del build
  try {
    return new URL(`../../../assets/icons/${name}.svg`, import.meta.url).href;
  } catch {
    return '';
  }
};

export const ZonesPanel: React.FC = () => {
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const { rooms, devices } = useNexdomStore();

  const zones = useMemo(() => {
    if (!rooms || rooms.length === 0) return [];

    return rooms.map((room) => {
      const gadgets = devices
        .filter((d) => d.room === room.id || d.room === room.name)
        .map((d) => {
          const domain = d.id.split('.')[0];
          return {
            id: d.id,
            name: d.name,
            model: d.type || domain,
            type: d.type,
            status: d.status === 'offline' ? 'Offline' : d.status,
            value: d.lastUpdate ? new Date(d.lastUpdate).toLocaleTimeString() : '',
            iconPath: getIconPath(d.type),
            isActive: d.status !== 'offline',
          } as GadgetProps;
        });

      return {
        id: room.id,
        name: room.name,
        gadgets,
      };
    });
  }, [rooms, devices]);

  const toggleZone = (id: string) => {
    setExpandedZone(expandedZone === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="w-2 h-8 bg-nexdom-lime rounded-full shadow-[0_0_10px_#00FF88]"></span>
        Zonas
      </h2>

      {zones.length === 0 && (
        <div className="glass-panel rounded-[2rem] p-6 text-gray-300 border border-white/10">
          No hay áreas configuradas en Home Assistant o aún no se sincronizan dispositivos.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {zones.map((zone) => (
          <motion.div
            key={zone.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel rounded-[2rem] overflow-hidden border border-white/5 transition-all duration-500 ${
              expandedZone === zone.id ? 'ring-1 ring-nexdom-lime/30 bg-white/5' : 'hover:bg-white/5'
            }`}
          >
            {/* Zone Header / Card */}
            <div 
              className="relative h-48 cursor-pointer group overflow-hidden bg-gradient-to-r from-white/5 via-white/0 to-white/5"
              onClick={() => toggleZone(zone.id)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-nexdom-lime transition-colors">
                      {zone.name}
                    </h3>
                    <p className="text-gray-400 text-sm flex items-center gap-2">
                      {zone.gadgets.length} Dispositivos
                      <span className="w-1 h-1 rounded-full bg-gray-500" />
                      {zone.gadgets.filter(g => g.isActive).length} Activos
                    </p>
                  </div>
                  
                  <motion.div 
                    animate={{ rotate: expandedZone === zone.id ? 180 : 0 }}
                    className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white group-hover:bg-nexdom-lime group-hover:text-black transition-colors"
                  >
                    <ChevronDown className="w-6 h-6" />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Expanded Gadgets Grid */}
            <AnimatePresence>
              {expandedZone === zone.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-6 border-t border-white/5 bg-black/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {zone.gadgets.map((gadget) => (
                        <GadgetCard
                          key={gadget.id}
                          {...gadget as any}
                          iconPath={getIconPath(gadget.type)}
                          onPrimaryAction={() => console.log('Toggle', gadget.id)}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
