import React, { useState, useMemo } from 'react';
import { GadgetCard, GadgetProps } from './GadgetCard';
import { useHomeAssistant } from '../HomeAssistant';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { DeviceDetailsModal } from '../modals/DeviceDetailsModal';

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
    'vacuum': 'Vibracion',
    'update': 'Nivel-agua'
  };
  return map[type] || 'Smart-plug';
};

export const GadgetGrid: React.FC = () => {
  const { zones, toggleEntity, callService } = useHomeAssistant();
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null); // All closed by default
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Flatten all entities from zones and group by domain
  const groupedGadgets = useMemo(() => {
    const allGadgets: GadgetProps[] = [];
    const processedIds = new Set<string>();

    zones.forEach(zone => {
      zone.entities.forEach(entity => {
        if (processedIds.has(entity.entity_id)) return;
        processedIds.add(entity.entity_id);

        const domain = entity.entity_id.split('.')[0];

        // Determine status string
        let status = entity.state;
        if (domain === 'light' || domain === 'switch') status = entity.state === 'on' ? 'On' : 'Off';
        else if (domain === 'lock') status = entity.state === 'locked' ? 'Locked' : 'Unlocked';
        else if (domain === 'cover') status = entity.state === 'open' ? 'Open' : 'Closed';
        else if (domain === 'camera') status = entity.state === 'idle' ? 'Idle' : 'Live';
        else if (entity.attributes.unit_of_measurement) status = `${entity.state} ${entity.attributes.unit_of_measurement}`;

        // Determine value string
        let value = undefined;
        if (domain === 'light' && entity.attributes.brightness) {
          value = `${Math.round((entity.attributes.brightness / 255) * 100)}%`;
        } else if (domain === 'climate' && entity.attributes.temperature) {
          value = `${entity.attributes.temperature}°C`;
        }

        allGadgets.push({
          id: entity.entity_id,
          name: entity.attributes.friendly_name || entity.entity_id,
          model: domain,
          type: domain as any,
          category: domain, // Use domain as category for grouping
          iconPath: getIconName(domain),
          status: status,
          value: value,
          rgbColor: domain === 'light' ? entity.attributes.rgb_color : undefined,
          isActive: entity.state !== 'off' && entity.state !== 'unavailable' && entity.state !== 'unknown' && entity.state !== 'closed' && entity.state !== 'locked',
          onPrimaryAction: ['light', 'switch', 'lock', 'cover', 'fan', 'input_boolean', 'automation', 'script'].includes(domain) ? () => {
            toggleEntity(entity.entity_id);
          } : undefined,
          onSecondaryAction: () => {
            setSelectedDeviceId(entity.entity_id);
          },
          onColorChange: domain === 'light' ? (rgb: number[]) => {
            callService('light', 'turn_on', { entity_id: entity.entity_id, rgb_color: rgb });
          } : undefined,
        });
      });
    });

    // Group by domain
    return allGadgets.reduce((acc, gadget) => {
      const domain = gadget.type;
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(gadget);
      return acc;
    }, {} as Record<string, GadgetProps[]>);
  }, [zones, toggleEntity, callService]);

  const toggleDomain = (domain: string) => {
    setExpandedDomain(expandedDomain === domain ? null : domain);
  };

  const domainTitles: Record<string, string> = {
    'light': 'Lights',
    'switch': 'Switches',
    'sensor': 'Sensors',
    'binary_sensor': 'Binary Sensors',
    'camera': 'Cameras',
    'lock': 'Locks',
    'cover': 'Covers',
    'climate': 'Climate',
    'media_player': 'Media',
    'fan': 'Fans',
    'vacuum': 'Vacuums',
    'automation': 'Automations',
    'script': 'Scripts',
    'input_boolean': 'Helpers'
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedGadgets).map(([domain, gadgets]) => (
        <motion.div
          key={domain}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`glass-panel rounded-[2rem] overflow-hidden border border-white/5 transition-all duration-500 ${expandedDomain === domain ? 'ring-1 ring-nexdom-lime/30 bg-white/5' : 'hover:bg-white/5'
            }`}
        >
          {/* Domain Header / Card */}
          <div
            className="relative h-48 cursor-pointer group overflow-hidden bg-gradient-to-r from-white/5 via-white/0 to-white/5"
            onClick={() => toggleDomain(domain)}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-nexdom-lime transition-colors">
                    {domainTitles[domain] || domain.charAt(0).toUpperCase() + domain.slice(1)}
                  </h3>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    {gadgets.length} Dispositivos
                    <span className="w-1 h-1 rounded-full bg-gray-500" />
                    {gadgets.filter(g => g.isActive).length} Activos
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: expandedDomain === domain ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white group-hover:bg-nexdom-lime group-hover:text-black transition-colors"
                >
                  <ChevronDown className="w-6 h-6" />
                </motion.div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {expandedDomain === domain && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 border-t border-white/5">
                  {gadgets.map((gadget) => (
                    <GadgetCard
                      key={gadget.id}
                      {...gadget}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {/* Device Details Modal */}
      <AnimatePresence>
        {selectedDeviceId && (
          <DeviceDetailsModal
            deviceId={selectedDeviceId}
            isOpen={!!selectedDeviceId}
            onClose={() => setSelectedDeviceId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
