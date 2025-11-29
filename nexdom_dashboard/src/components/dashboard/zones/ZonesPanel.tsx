import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GadgetCard, GadgetProps } from '../templates/GadgetCard';
import { ChevronDown } from 'lucide-react';
import { useHomeAssistant } from '../HomeAssistant';

// Helper to get Icon filename based on domain/type
const getIconName = (type: string): string => {
  const map: Record<string, string> = {
    'light': 'light',
    'switch': 'Smart-plug',
    'sensor': 'Sensor-movimiento',
    'binary_sensor': 'Sensor-puerta',
    'climate': 'Temperatura',
    'camera': 'Camara',
    'lock': 'Smartlock',
    'cover': 'Persiana',
    'media_player': 'IR',
    'fan': 'AC',
    'vacuum': 'Vibracion', // Fallback
    'update': 'Nivel-agua' // Fallback
  };
  return map[type] || 'Smart-plug'; // Default icon
};

import { DeviceDetailsModal } from '../modals/DeviceDetailsModal';

export const ZonesPanel: React.FC = () => {
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const { zones, isConnected, error, toggleEntity } = useHomeAssistant();

  const zonesWithGadgets = useMemo(() => {
    return zones.map((zone) => {
      const gadgets = zone.entities.map((entity) => {
        const domain = entity.entity_id.split('.')[0];

        // Mapear dominio a tipo de gadget
        const typeMap: Record<string, any> = {
          'light': 'light',
          'switch': 'switch',
          'sensor': 'sensor',
          'binary_sensor': 'sensor',
          'climate': 'thermostat',
          'camera': 'camera',
          'lock': 'lock',
          'cover': 'cover',
          'media_player': 'remote',
        };

        const gadgetType = typeMap[domain] || 'sensor';

        // Formatear valor según tipo
        let value = entity.state;
        if (entity.attributes.unit_of_measurement) {
          value = `${entity.state} ${entity.attributes.unit_of_measurement}`;
        } else if (domain === 'light' && entity.attributes.brightness) {
          value = `${Math.round((entity.attributes.brightness / 255) * 100)}%`;
        } else if (domain === 'climate' && entity.attributes.temperature) {
          value = `${entity.attributes.temperature}°C`;
        }

        return {
          id: entity.entity_id,
          name: entity.attributes.friendly_name || entity.entity_id,
          model: domain,
          type: gadgetType,
          status: entity.state,
          value: value,
          iconPath: getIconName(domain), // Passing SVG filename
          isActive: entity.state !== 'off' && entity.state !== 'unavailable' && entity.state !== 'unknown' && entity.state !== 'closed' && entity.state !== 'locked',
          onPrimaryAction: ['light', 'switch', 'lock', 'cover', 'fan', 'input_boolean', 'automation', 'script'].includes(domain) ? () => {
            console.log('[ZonesPanel] Toggling entity:', entity.entity_id);
            toggleEntity(entity.entity_id).catch(err => {
              console.error('[ZonesPanel] Error toggling entity:', err);
            });
          } : undefined,
          onSecondaryAction: () => {
            console.log('[ZonesPanel] Opening settings for:', entity.entity_id);
            setSelectedDeviceId(entity.entity_id);
          },
        } as GadgetProps;
      });

      return {
        id: zone.id,
        name: zone.name,
        gadgets,
      };
    });
  }, [zones, toggleEntity]);

  const toggleZone = (id: string) => {
    setExpandedZone(expandedZone === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="w-2 h-8 bg-nexdom-lime rounded-full shadow-[0_0_10px_#00FF88]"></span>
        Zonas
        {!isConnected && (
          <span className="text-xs font-normal text-yellow-400 ml-auto">
            ⚠ Descone ctado
          </span>
        )}
      </h2>

      {error && (
        <div className="glass-panel rounded-[2rem] p-4 border border-red-500/30 bg-red-500/10">
          <p className="text-red-300 text-sm">
            ⚠ Error de conexión: {error}
          </p>
        </div>
      )}

      {zonesWithGadgets.length === 0 && (
        <div className="glass-panel rounded-[2rem] p-6 text-gray-300 border border-white/10">
          {isConnected
            ? 'No hay áreas configuradas en Home Assistant o aún no se sincronizan dispositivos.'
            : 'Conectando con Home Assistant...'
          }
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {zonesWithGadgets.map((zone) => (
          <motion.div
            key={zone.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel rounded-[2rem] overflow-hidden border border-white/5 transition-all duration-500 ${expandedZone === zone.id ? 'ring-1 ring-nexdom-lime/30 bg-white/5' : 'hover:bg-white/5'
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
                          {...gadget}
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


      {/* Device Details Modal */}
      <DeviceDetailsModal
        entityId={selectedDeviceId}
        onClose={() => setSelectedDeviceId(null)}
      />
    </div >
  );
};
