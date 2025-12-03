import React, { useMemo, useState } from 'react';
import { useHomeAssistant } from './HomeAssistant';
import { AlertTriangle, Info, X, BatteryWarning, Lock, DoorOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Alerts: React.FC = () => {
  const { states } = useHomeAssistant();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const alerts = useMemo(() => {
    if (!states) return [];
    const activeAlerts: any[] = [];

    states.forEach(entity => {
      const domain = entity.entity_id.split('.')[0];
      const attributes = entity.attributes || {};
      const deviceClass = attributes.device_class;

      // 1. Low Battery Alerts
      if (attributes.battery_level !== undefined && typeof attributes.battery_level === 'number') {
        if (attributes.battery_level < 20) {
          activeAlerts.push({
            id: `batt-${entity.entity_id}`,
            type: 'warning',
            title: 'Low Battery',
            message: `${attributes.friendly_name || entity.entity_id} is at ${attributes.battery_level}%`,
            timestamp: entity.last_updated,
            icon: <BatteryWarning className="w-4 h-4" />
          });
        }
      } else if (deviceClass === 'battery' && domain === 'binary_sensor' && entity.state === 'on') {
        activeAlerts.push({
          id: `batt-bin-${entity.entity_id}`,
          type: 'warning',
          title: 'Low Battery',
          message: `${attributes.friendly_name || entity.entity_id} battery is low`,
          timestamp: entity.last_updated,
          icon: <BatteryWarning className="w-4 h-4" />
        });
      }

      // 2. Security Alerts (Doors, Windows, Garage, Locks)
      if (domain === 'binary_sensor' || domain === 'cover') {
        if (['door', 'window', 'garage_door', 'garage'].includes(deviceClass) || domain === 'cover') {
          if (entity.state === 'on' || entity.state === 'open') {
            activeAlerts.push({
              id: `sec-${entity.entity_id}`,
              type: 'info',
              title: `${deviceClass === 'window' ? 'Window' : 'Door'} Open`,
              message: `${attributes.friendly_name || entity.entity_id} is open`,
              timestamp: entity.last_changed,
              icon: <DoorOpen className="w-4 h-4" />
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
          icon: <Lock className="w-4 h-4" />
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
              icon: <AlertTriangle className="w-4 h-4" />
            });
          }
        }
      }
    });

    // Filter out dismissed alerts
    return activeAlerts.filter(alert => !dismissedAlerts.has(alert.id));
  }, [states, dismissedAlerts]);

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };

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
            className={`mb-3 px-4 py-3 rounded-xl border backdrop-blur-md relative overflow-hidden group ${alert.type === 'critical'
              ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
              : alert.type === 'warning'
                ? 'bg-nexdom-gold/10 border-nexdom-gold/30 shadow-[0_0_15px_rgba(230,195,106,0.15)]'
                : 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
              }`}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-1.5 rounded-lg ${alert.type === 'critical' ? 'bg-red-500/20 text-red-400' :
                  alert.type === 'warning' ? 'bg-nexdom-gold/20 text-nexdom-gold' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                  {alert.icon || (
                    alert.type === 'critical' || alert.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Info className="w-4 h-4" />
                    )
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold text-xs tracking-wide uppercase ${alert.type === 'critical' ? 'text-red-400' :
                    alert.type === 'warning' ? 'text-nexdom-gold' :
                      'text-blue-400'
                    }`}>
                    {alert.title}
                  </h4>
                  <p className="text-white/80 text-xs mt-0.5">{alert.message}</p>
                </div>
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors group/close"
                >
                  <X className="w-4 h-4 text-gray-400 group-hover/close:text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Export Alert type for use in modal
export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  icon?: React.ReactNode;
}

// Export hook for use in Header notification count and modal
export const useAlerts = (): Alert[] => {
  const { states } = useHomeAssistant();

  return useMemo(() => {
    if (!states) return [];
    const activeAlerts: Alert[] = [];

    states.forEach(entity => {
      const domain = entity.entity_id.split('.')[0];
      const attributes = entity.attributes || {};
      const deviceClass = attributes.device_class;

      // 1. Low Battery Alerts
      if (attributes.battery_level !== undefined && typeof attributes.battery_level === 'number') {
        if (attributes.battery_level < 20) {
          activeAlerts.push({
            id: `batt-${entity.entity_id}`,
            type: 'warning',
            title: 'Low Battery',
            message: `${attributes.friendly_name || entity.entity_id} is at ${attributes.battery_level}%`,
            timestamp: entity.last_updated,
            icon: <BatteryWarning className="w-4 h-4" />
          });
        }
      } else if (deviceClass === 'battery' && domain === 'binary_sensor' && entity.state === 'on') {
        activeAlerts.push({
          id: `batt-bin-${entity.entity_id}`,
          type: 'warning',
          title: 'Low Battery',
          message: `${attributes.friendly_name || entity.entity_id} battery is low`,
          timestamp: entity.last_updated,
          icon: <BatteryWarning className="w-4 h-4" />
        });
      }

      // 2. Security Alerts (Doors, Windows, Garage, Locks)
      if (domain === 'binary_sensor' || domain === 'cover') {
        if (['door', 'window', 'garage_door', 'garage'].includes(deviceClass) || domain === 'cover') {
          if (entity.state === 'on' || entity.state === 'open') {
            activeAlerts.push({
              id: `sec-${entity.entity_id}`,
              type: 'info',
              title: `${deviceClass === 'window' ? 'Window' : 'Door'} Open`,
              message: `${attributes.friendly_name || entity.entity_id} is open`,
              timestamp: entity.last_changed,
              icon: <DoorOpen className="w-4 h-4" />
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
          icon: <Lock className="w-4 h-4" />
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
              icon: <AlertTriangle className="w-4 h-4" />
            });
          }
        }
      }
    });

    return activeAlerts;
  }, [states]);
};
