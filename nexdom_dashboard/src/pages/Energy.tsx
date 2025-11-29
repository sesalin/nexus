import React, { useMemo } from 'react';
import { useHomeAssistant } from '../components/dashboard/HomeAssistant';
import { Zap, Activity, TrendingUp } from 'lucide-react';

export const Energy: React.FC = () => {
  console.log('[Energy Debug] Component rendering');
  const { zones } = useHomeAssistant();

  // Filter devices from "Consumos" area
  const consumptionDevices = useMemo(() => {
    const consumosZone = zones.find(zone =>
      zone.name.toLowerCase().includes('consumo') ||
      zone.id.toLowerCase().includes('consumo')
    );

    if (!consumosZone) {
      console.log('[Energy Debug] Consumos zone not found. Available zones:', zones.map(z => z.name));
      return [];
    }

    console.log('[Energy Debug] Consumos zone found:', consumosZone.name, 'Entities:', consumosZone.entities.length);
    consumosZone.entities.forEach(e => console.log('[Energy Debug]  -', e.entity_id, e.state, e.attributes.unit_of_measurement));

    return consumosZone.entities.map(entity => {
      const domain = entity.entity_id.split('.')[0];
      const state = parseFloat(entity.state) || 0;
      const unit = entity.attributes.unit_of_measurement || 'W';

      return {
        id: entity.entity_id,
        name: entity.attributes.friendly_name || entity.entity_id,
        value: state,
        unit: unit,
        domain: domain,
        state_class: entity.attributes.state_class,
        device_class: entity.attributes.device_class,
      };
    });
  }, [zones]);

  // Calculate total consumption
  const totalConsumption = useMemo(() => {
    return consumptionDevices.reduce((sum, device) => {
      if (device.unit === 'W' || device.unit === 'kW') {
        const watts = device.unit === 'kW' ? device.value * 1000 : device.value;
        return sum + watts;
      }
      return sum;
    }, 0);
  }, [consumptionDevices]);

  const formatValue = (value: number, unit: string) => {
    if (unit === 'W' && value >= 1000) {
      return `${(value / 1000).toFixed(2)} kW`;
    }
    return `${value.toFixed(2)} ${unit}`;
  };

  const getGaugePercentage = (value: number, unit: string) => {
    // Assume max 3000W per device for gauge calculation
    const watts = unit === 'kW' ? value * 1000 : value;
    return Math.min((watts / 3000) * 100, 100);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto lg:pl-32 lg:pr-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
          <Zap className="w-6 h-6 text-yellow-400" />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-wide">Energy Monitor</h2>
      </div>

      {/* Total Consumption Summary */}
      <div className="glass-panel p-8 rounded-[2rem] relative overflow-hidden mb-8 border border-yellow-500/20">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-yellow-500/10 blur-[80px] rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-yellow-500/20 rounded-xl">
                <Activity className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-gray-400 text-sm">Total Consumption</h3>
                <p className="text-5xl font-bold text-yellow-400">
                  {(totalConsumption / 1000).toFixed(2)} <span className="text-2xl text-gray-500">kW</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm mb-1">Active Devices</p>
              <p className="text-3xl font-bold text-white">{consumptionDevices.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Consumption Devices Grid */}
      {consumptionDevices.length === 0 ? (
        <div className="glass-panel rounded-[2rem] p-8 text-center border border-white/5">
          <p className="text-gray-400">No devices found in Consumos area</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {consumptionDevices.map(device => {
            const gaugePercent = getGaugePercentage(device.value, device.unit);
            const gaugeColor = gaugePercent > 80 ? 'red' : gaugePercent > 50 ? 'yellow' : 'green';

            return (
              <div
                key={device.id}
                className="glass-panel rounded-[2rem] p-6 border border-yellow-500/20 hover:bg-yellow-500/5 transition-all relative overflow-hidden group"
              >
                {/* Background glow */}
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-500/10 blur-[50px] rounded-full group-hover:bg-yellow-500/20 transition-colors" />

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-yellow-500/20 rounded-xl">
                      <Zap className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">{device.domain}</span>
                    </div>
                  </div>

                  {/* Device Name */}
                  <h3 className="text-white font-medium mb-3 truncate" title={device.name}>
                    {device.name}
                  </h3>

                  {/* Current Value */}
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-yellow-400">
                      {formatValue(device.value, device.unit)}
                    </p>
                  </div>

                  {/* Gauge Visualization */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Usage Level</span>
                      <span>{gaugePercent.toFixed(0)}%</span>
                    </div>
                    <div className="relative h-3 bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${gaugeColor === 'red'
                          ? 'bg-red-500 shadow-[0_0_10px_#ef4444]'
                          : gaugeColor === 'yellow'
                            ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]'
                            : 'bg-green-500 shadow-[0_0_10px_#22c55e]'
                          }`}
                        style={{ width: `${gaugePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Mini Trend Graph Placeholder */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <TrendingUp className="w-3 h-3" />
                      <span>Live monitoring</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
