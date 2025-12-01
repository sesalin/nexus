import React, { useMemo } from 'react';
import { useHomeAssistant } from './HomeAssistant';
import { AlertTriangle, Info, X, CheckCircle, BatteryWarning, Lock, DoorOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Alerts: React.FC = () => {
  const { states } = useHomeAssistant();

  const alerts = useMemo(() => {
    if (!states) return [];
    const activeAlerts: any[] = [];

    states.forEach(entity => {
      const domain = entity.entity_id.split('.')[0];
      const attributes = entity.attributes || {};
      const deviceClass = attributes.device_class;

      // 1. Low Battery Alerts
      // Check battery_level attribute or battery device_class
      if (attributes.battery_level !== undefined && typeof attributes.battery_level === 'number') {
        if (attributes.battery_level < 20) {
          activeAlerts.push({
            id: `batt-${entity.entity_id}`,
            type: 'warning',
            title: 'Low Battery',
            message: `${attributes.friendly_name || entity.entity_id} is at ${attributes.battery_level}%`,
            timestamp: entity.last_updated,
            icon: <BatteryWarning className="w-5 h-5" />
          });
        }
      } else if (deviceClass === 'battery' && domain === 'binary_sensor' && entity.state === 'on') {
        activeAlerts.push({
          id: `batt-bin-${entity.entity_id}`,
          type: 'warning',
          title: 'Low Battery',
          message: `${attributes.friendly_name || entity.entity_id} battery is low`,
          timestamp: entity.last_updated,
          icon: <BatteryWarning className="w-5 h-5" />
        });
      }

      // 2. Security Alerts (Doors, Windows, Garage, Locks)
      if (domain === 'binary_sensor' || domain === 'cover') {
        if (['door', 'window', 'garage_door', 'garage'].includes(deviceClass) || domain === 'cover') {
          if (entity.state === 'on' || entity.state === 'open') {
            activeAlerts.push({
              id: `sec-${entity.entity_id}`,
              type: 'info', // Info for open doors, maybe warning if armed?
              title: `${deviceClass === 'window' ? 'Window' : 'Door'} Open`,
              message: `${attributes.friendly_name || entity.entity_id} is open`,
              timestamp: entity.last_changed, // Use last_changed for open/close duration
              icon: <DoorOpen className="w-5 h-5" />
            });
          }
        }
      }

      if (domain === 'lock' && entity.state === 'unlocked') {
        activeAlerts.push({
          id: `lock-${entity.entity_id}`,
          type: 'warning',
          title: 'Unlocked',
          message: `${attributes.friendly_name || entity.entity_id} is unlocked`,
          timestamp: entity.last_changed,
          icon: <Lock className="w-5 h-5" />
        });
      }

      // 3. Safety Alerts (Smoke, Gas, Moisture, Tamper)
      if (domain === 'binary_sensor') {
        if (['smoke', 'gas', 'moisture', 'safety', 'tamper', 'problem'].includes(deviceClass)) {
          if (entity.state === 'on' || entity.state === 'unsafe') {
            activeAlerts.push({
              id: `safe-${entity.entity_id}`,
              type: 'critical',
              title: `${deviceClass ? deviceClass.toUpperCase() : 'Safety'} Alert`,
              message: `${attributes.friendly_name || entity.entity_id} detected issue!`,
              timestamp: entity.last_changed,
              icon: <AlertTriangle className="w-5 h-5" />
            });
          }
        }
      }
    });

    return activeAlerts;
  }, [states]);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-8">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className={`mb-4 p-4 rounded-2xl border backdrop-blur-md relative overflow-hidden group ${alert.type === 'critical'
                ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                : alert.type === 'warning'
                  ? 'bg-nexdom-gold/10 border-nexdom-gold/30 shadow-[0_0_20px_rgba(230,195,106,0.2)]'
                  : 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
              }`}
          >
            {/* Holographic Scanline Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-20 animate-scan pointer-events-none"></div>

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${alert.type === 'critical' ? 'bg-red-500/20 text-red-400' :
                    alert.type === 'warning' ? 'bg-nexdom-gold/20 text-nexdom-gold' :
                      'bg-blue-500/20 text-blue-400'
                  }`}>
                  {alert.icon || (
                    alert.type === 'critical' || alert.type === 'warning' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )
                  )}
                </div>
                <div>
                  <h4 className={`font-bold text-sm tracking-wide uppercase ${alert.type === 'critical' ? 'text-red-400' :
                      alert.type === 'warning' ? 'text-nexdom-gold' :
                        'text-blue-400'
                    }`}>
                    {alert.title}
                  </h4>
                  <p className="text-white/90 text-sm mt-1 font-light">{alert.message}</p>
                  <p className="text-xs text-white/40 mt-2 font-mono">
                    Since: {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
