import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GadgetCard, GadgetProps } from '../templates/GadgetCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Mock data for zones - in a real app this would come from a store or API
const MOCK_ZONES = [
  {
    id: 'kitchen',
    name: 'Cocina',
    image: '/src/assets/images/kitchen.jpg',
    gadgets: [
      { id: 'light-kitchen-1', name: 'Luz Principal', model: 'Philips Hue', type: 'light', status: 'On', value: '100%', iconPath: '', isActive: true },
      { id: 'sensor-kitchen-1', name: 'Sensor Movimiento', model: 'Aqara', type: 'sensor', status: 'Clear', value: 'No Motion', iconPath: '', isActive: false },
      { id: 'plug-kitchen-1', name: 'Cafetera', model: 'TP-Link', type: 'switch', status: 'Off', iconPath: '', isActive: false },
    ]
  },
  {
    id: 'living',
    name: 'Sala de Estar',
    image: '/src/assets/images/living.jpg',
    gadgets: [
      { id: 'light-living-1', name: 'Lámpara Pie', model: 'Yeelight', type: 'light', status: 'Off', value: '0%', iconPath: '', isActive: false },
      { id: 'ac-living', name: 'Aire Acondicionado', model: 'Daikin', type: 'thermostat', status: '24°C', value: 'Cooling', iconPath: '', isActive: true },
      { id: 'tv-living', name: 'TV Samsung', model: 'QLED', type: 'remote', status: 'On', iconPath: '', isActive: true },
      { id: 'blind-living', name: 'Persiana', model: 'Somfy', type: 'cover', status: 'Open', iconPath: '', isActive: true },
    ]
  },
  {
    id: 'bedroom',
    name: 'Dormitorio Principal',
    image: '/src/assets/images/bedroom.jpg',
    gadgets: [
      { id: 'light-bed-1', name: 'Luz Techo', model: 'Philips Hue', type: 'light', status: 'Off', value: '0%', iconPath: '', isActive: false },
      { id: 'sensor-bed-1', name: 'Sensor Ventana', model: 'Aqara', type: 'sensor', status: 'Closed', value: 'Secure', iconPath: '', isActive: true },
    ]
  },
  {
    id: 'office',
    name: 'Oficina',
    image: '/src/assets/images/office.jpg',
    gadgets: [
      { id: 'light-office-1', name: 'Escritorio', model: 'Xiaomi', type: 'light', status: 'On', value: '80%', iconPath: '', isActive: true },
      { id: 'plug-office-1', name: 'PC', model: 'Smart Plug', type: 'switch', status: 'On', iconPath: '', isActive: true },
    ]
  }
];

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
  return iconModules[key] || '';
};

export const ZonesPanel: React.FC = () => {
  const [expandedZone, setExpandedZone] = useState<string | null>(null);

  const toggleZone = (id: string) => {
    setExpandedZone(expandedZone === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="w-2 h-8 bg-nexdom-lime rounded-full shadow-[0_0_10px_#00FF88]"></span>
        Zonas
      </h2>
      
      <div className="grid grid-cols-1 gap-6">
        {MOCK_ZONES.map((zone) => (
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
              className="relative h-48 cursor-pointer group"
              onClick={() => toggleZone(zone.id)}
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0">
                <img 
                  src={zone.image} 
                  alt={zone.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              </div>

              {/* Content */}
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
