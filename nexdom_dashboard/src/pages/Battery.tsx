import React, { useMemo } from 'react';
import { useHomeAssistant } from '../components/dashboard/HomeAssistant';
import { Battery as BatteryIcon, BatteryCharging, BatteryLow, BatteryWarning } from 'lucide-react';

export const Battery: React.FC = () => {
    console.log('[Battery Debug] Component rendering');
    const { zones } = useHomeAssistant();

    // Extract all devices with battery attribute
    const batteryDevices = useMemo(() => {
        const devices: Array<{
            id: string;
            name: string;
            battery: number;
            isCharging?: boolean;
            domain: string;
        }> = [];

        zones.forEach(zone => {
            zone.entities.forEach(entity => {
                // Try multiple battery attribute names
                let battery =
                    entity.attributes.battery_level ||
                    entity.attributes.battery ||
                    entity.attributes['Battery Level'] ||
                    entity.attributes['Battery'] ||
                    (entity.entity_id.includes('battery') && entity.state && !isNaN(Number(entity.state)) ? Number(entity.state) : undefined);

                // Debug log for entities with 'battery' in name but no battery found
                if (entity.entity_id.includes('battery') && battery === undefined) {
                    console.log('[Battery Debug] Entity with battery in name but no value:', entity.entity_id, 'state:', entity.state, 'attrs:', Object.keys(entity.attributes));
                }

                if (battery !== undefined) {
                    const batteryValue = Number(battery);
                    if (!isNaN(batteryValue) && batteryValue >= 0 && batteryValue <= 100) {
                        console.log('[Battery Debug] Found battery device:', entity.entity_id, '=', batteryValue + '%');
                        devices.push({
                            id: entity.entity_id,
                            name: entity.attributes.friendly_name || entity.entity_id,
                            battery: batteryValue,
                            isCharging: entity.attributes.battery_charging === true || entity.attributes.charging === true,
                            domain: entity.entity_id.split('.')[0],
                        });
                    }
                }
            });
        });

        // Sort by battery level (lowest first)
        return devices.sort((a, b) => a.battery - b.battery);
    }, [zones]);

    const getBatteryIcon = (level: number, isCharging?: boolean) => {
        if (isCharging) return BatteryCharging;
        if (level <= 10) return BatteryWarning;
        if (level <= 20) return BatteryLow;
        return BatteryIcon;
    };

    const getBatteryColor = (level: number) => {
        if (level <= 10) return 'text-red-500';
        if (level <= 20) return 'text-orange-500';
        if (level <= 50) return 'text-yellow-500';
        return 'text-green-500';
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto lg:pl-32 lg:pr-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <BatteryIcon className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold text-white tracking-wide">Battery Status</h2>
            </div>

            {batteryDevices.length === 0 ? (
                <div className="glass-panel rounded-[2rem] p-8 text-center border border-white/5">
                    <p className="text-gray-400">No devices with battery found</p>
                    <p className="text-sm text-gray-500 mt-2">
                        Searching for entities with: battery_level, battery attributes, or battery in entity_id
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {batteryDevices.map(device => {
                        const IconComponent = getBatteryIcon(device.battery, device.isCharging);
                        const colorClass = getBatteryColor(device.battery);

                        return (
                            <div
                                key={device.id}
                                className="glass-panel rounded-[2rem] p-6 border border-white/5 hover:bg-white/5 transition-all relative overflow-hidden group"
                            >
                                {/* Background glow based on battery level */}
                                <div className={`absolute -right-10 -top-10 w-32 h-32 ${device.battery <= 20 ? 'bg-red-500/10' : 'bg-green-500/10'
                                    } blur-[50px] rounded-full transition-colors`} />

                                <div className="relative z-10">
                                    {/* Icon and Battery Percentage */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-xl ${device.battery <= 20 ? 'bg-red-500/20' : 'bg-green-500/20'
                                            }`}>
                                            <IconComponent className={`w-6 h-6 ${colorClass}`} />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-3xl font-bold ${colorClass}`}>
                                                {device.battery}%
                                            </span>
                                            {device.isCharging && (
                                                <span className="text-xs text-blue-400 flex items-center gap-1 mt-1">
                                                    <BatteryCharging className="w-3 h-3" />
                                                    Charging
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Device Name */}
                                    <h3 className="text-white font-medium mb-2 truncate" title={device.name}>
                                        {device.name}
                                    </h3>

                                    {/* Battery Bar */}
                                    <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${device.battery <= 10
                                                ? 'bg-red-500 shadow-[0_0_10px_#ef4444]'
                                                : device.battery <= 20
                                                    ? 'bg-orange-500 shadow-[0_0_10px_#f97316]'
                                                    : device.battery <= 50
                                                        ? 'bg-yellow-500 shadow-[0_0_10px_#eab308]'
                                                        : 'bg-green-500 shadow-[0_0_10px_#22c55e]'
                                                }`}
                                            style={{ width: `${device.battery}%` }}
                                        />
                                    </div>

                                    {/* Domain Tag */}
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                                            {device.domain}
                                        </span>
                                        {device.battery <= 20 && (
                                            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                                                Low
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Summary Stats */}
            {batteryDevices.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="glass-panel rounded-[2rem] p-6 border border-white/5">
                        <h4 className="text-gray-400 text-sm mb-2">Total Devices</h4>
                        <p className="text-3xl font-bold text-white">{batteryDevices.length}</p>
                    </div>
                    <div className="glass-panel rounded-[2rem] p-6 border border-white/5">
                        <h4 className="text-gray-400 text-sm mb-2">Low Battery (&lt;20%)</h4>
                        <p className="text-3xl font-bold text-orange-500">
                            {batteryDevices.filter(d => d.battery <= 20).length}
                        </p>
                    </div>
                    <div className="glass-panel rounded-[2rem] p-6 border border-white/5">
                        <h4 className="text-gray-400 text-sm mb-2">Average Level</h4>
                        <p className="text-3xl font-bold text-green-500">
                            {Math.round(batteryDevices.reduce((sum, d) => sum + d.battery, 0) / batteryDevices.length)}%
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
