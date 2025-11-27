import React from 'react';
import { useNexdomStore } from '../../store/nexdomStore';
import { AlertTriangle, Info, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Alerts: React.FC = () => {
  const { alerts, markAlertRead } = useNexdomStore();
  const activeAlerts = alerts.filter(a => !a.read);

  if (activeAlerts.length === 0) return null;

  return (
    <div className="mb-8">
      <AnimatePresence>
        {activeAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className={`mb-4 p-4 rounded-2xl border backdrop-blur-md relative overflow-hidden group ${
              alert.type === 'critical' 
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
                <div className={`p-2 rounded-full ${
                  alert.type === 'critical' ? 'bg-red-500/20 text-red-400' :
                  alert.type === 'warning' ? 'bg-nexdom-gold/20 text-nexdom-gold' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {alert.type === 'critical' || alert.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className={`font-bold text-sm tracking-wide uppercase ${
                    alert.type === 'critical' ? 'text-red-400' :
                    alert.type === 'warning' ? 'text-nexdom-gold' :
                    'text-blue-400'
                  }`}>
                    {alert.type} Alert
                  </h4>
                  <p className="text-white/90 text-sm mt-1 font-light">{alert.message}</p>
                  <p className="text-xs text-white/40 mt-2 font-mono">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => markAlertRead(alert.id)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
