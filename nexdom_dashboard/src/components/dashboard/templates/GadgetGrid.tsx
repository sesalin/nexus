import React, { useState, useEffect } from 'react';
import { GadgetCard, GadgetProps } from './GadgetCard';

// Helper to get icon path by name
const getIconPath = (name: string): string => {
  return name; // Just return the filename, Icon component handles the path
};

const GADGET_IDS = [
  'AC', 'Asistente-voz', 'Calidad-aire', 'Camara', 'Dimmer', 'Energia', 'Gate',
  'Humedad', 'Interruptores-inteligentes-on', 'IR', 'Irrigation', 'Leds', 'light',
  'Nivel-agua', 'Persiana', 'PTZ', 'Sensor-co2', 'Sensor-humo', 'Sensor-movimiento',
  'Sensor-puerta', 'Sensor-ventana', 'Smartlock', 'Smart-plug', 'Temperatura',
  'Timbre', 'Vibracion'
];

const inferGadgetType = (id: string): Partial<GadgetProps> => {
  const lowerId = id.toLowerCase();

  if (lowerId.includes('ac') || lowerId.includes('temperatura')) return { type: 'thermostat', category: 'Climate', status: '24°C', value: 'Cooling' };
  if (lowerId.includes('voz')) return { type: 'voice', category: 'System', status: 'Listening' };
  if (lowerId.includes('calidad') || lowerId.includes('co2')) return { type: 'sensor', category: 'Climate', status: 'Good', value: '420ppm' };
  if (lowerId.includes('camara') || lowerId.includes('ptz')) return { type: 'camera', category: 'Security', status: 'Live' };
  if (lowerId.includes('dimmer')) return { type: 'dimmer', category: 'Lighting', status: '50%', value: 'Dimmed' };
  if (lowerId.includes('energia')) return { type: 'sensor', category: 'Energy', status: 'Monitoring', value: '1.2kW' };
  if (lowerId.includes('gate') || lowerId.includes('lock')) return { type: 'lock', category: 'Security', status: 'Locked' };
  if (lowerId.includes('humedad')) return { type: 'sensor', category: 'Climate', status: '45%', value: 'Humid' };
  if (lowerId.includes('interruptor') || lowerId.includes('plug')) return { type: 'switch', category: 'Lighting', status: 'Off' };
  if (lowerId.includes('ir')) return { type: 'remote', category: 'Media', status: 'Ready' };
  if (lowerId.includes('irrigation')) return { type: 'switch', category: 'Outdoor', status: 'Scheduled' };
  if (lowerId.includes('led') || lowerId.includes('light')) return { type: 'light', category: 'Lighting', status: 'On', value: '80%' };
  if (lowerId.includes('agua')) return { type: 'sensor', category: 'Utility', status: '80%', value: '800L' };
  if (lowerId.includes('persiana')) return { type: 'cover', category: 'Comfort', status: 'Closed' };
  if (lowerId.includes('humo') || lowerId.includes('movimiento') || lowerId.includes('puerta') || lowerId.includes('ventana') || lowerId.includes('vibracion')) return { type: 'sensor', category: 'Security', status: 'Secure', value: 'Clear' };
  if (lowerId.includes('timbre')) return { type: 'button', category: 'Security', status: 'Idle' };

  return { type: 'accessory', category: 'Other', status: 'Online' };
};

export const GadgetGrid: React.FC = () => {
  const [gadgets, setGadgets] = useState<GadgetProps[]>([]);

  useEffect(() => {
    const generatedGadgets: GadgetProps[] = GADGET_IDS.map(id => {
      const config = inferGadgetType(id);
      return {
        id,
        name: id.replace(/-/g, ' '),
        model: 'Nexdom Smart Device',
        type: config.type as any,
        category: config.category,
        iconPath: getIconPath(id),
        status: config.status || 'Online',
        isActive: ['light', 'switch', 'lock', 'camera'].includes(config.type || '') ? false : true,
        value: config.value,
      };
    });
    setGadgets(generatedGadgets);
  }, []);

  const handleToggle = (id: string) => {
    setGadgets(prev => prev.map(gadget => {
      if (gadget.id === id) {
        const newActive = !gadget.isActive;
        let newStatus = gadget.status;

        if (gadget.type === 'lock') newStatus = newActive ? 'Locked' : 'Unlocked';
        else if (gadget.type === 'camera') newStatus = newActive ? 'Live' : 'Standby';
        else if (gadget.type === 'cover') newStatus = newActive ? 'Open' : 'Closed';
        else if (gadget.type === 'switch' || gadget.type === 'light') newStatus = newActive ? 'On' : 'Off';

        return { ...gadget, isActive: newActive, status: newStatus };
      }
      return gadget;
    }));
  };

  // Group by category
  const groupedGadgets = gadgets.reduce((acc, gadget) => {
    const cat = gadget.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(gadget);
    return acc;
  }, {} as Record<string, GadgetProps[]>);

  const categories = ['Security', 'Climate', 'Lighting', 'Energy', 'System', 'Media', 'Outdoor', 'Utility', 'Comfort', 'Other'];

  return (
    <div className="space-y-12">
      {categories.map(category => {
        const categoryGadgets = groupedGadgets[category];
        if (!categoryGadgets?.length) return null;

        return (
          <div key={category}>
            <h3 className="text-xl font-bold text-white/50 uppercase tracking-widest mb-6 pl-2 border-l-4 border-nexdom-lime/20">
              {category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categoryGadgets.map((gadget) => (
                <GadgetCard
                  key={gadget.id}
                  {...gadget}
                  onPrimaryAction={() => handleToggle(gadget.id)}
                  onSecondaryAction={() => console.log(`Settings for ${gadget.name}`)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
