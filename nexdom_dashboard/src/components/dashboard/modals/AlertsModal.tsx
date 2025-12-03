import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Info, BatteryWarning, Lock, DoorOpen } from 'lucide-react';

interface Alert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: string;
    icon?: React.ReactNode;
}

interface AlertsModalProps {
    isOpen: boolean;
    onClose: () => void;
    alerts: Alert[];
}

export const AlertsModal: React.FC<AlertsModalProps> = ({ isOpen, onClose, alerts }) => {
    if (!isOpen) return null;

    const getAlertIcon = (alert: Alert) => {
        if (alert.icon) return alert.icon;

        if (alert.type === 'critical' || alert.type === 'warning') {
            return <AlertTriangle className="w-4 h-4" />;
        }
        return <Info className="w-4 h-4" />;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-[70] pointer-events-none p-4"
                    >
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-[2rem] p-6 w-full max-w-lg shadow-2xl pointer-events-auto relative overflow-hidden">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-6 bg-nexdom-lime rounded-full shadow-[0_0_10px_#00FF88]"></div>
                                    <h2 className="text-2xl font-bold text-white">Alertas del Sistema</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Alerts List */}
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {alerts.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-nexdom-lime/10 mb-4">
                                            <Info className="w-8 h-8 text-nexdom-lime" />
                                        </div>
                                        <p className="text-gray-400">No hay alertas activas</p>
                                        <p className="text-xs text-gray-600 mt-2">Tu sistema está funcionando correctamente</p>
                                    </div>
                                ) : (
                                    alerts.map((alert) => (
                                        <motion.div
                                            key={alert.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`px-4 py-3 rounded-xl border backdrop-blur-md relative overflow-hidden ${alert.type === 'critical'
                                                    ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                                                    : alert.type === 'warning'
                                                        ? 'bg-nexdom-gold/10 border-nexdom-gold/30 shadow-[0_0_15px_rgba(230,195,106,0.15)]'
                                                        : 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`p-1.5 rounded-lg ${alert.type === 'critical'
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : alert.type === 'warning'
                                                                ? 'bg-nexdom-gold/20 text-nexdom-gold'
                                                                : 'bg-blue-500/20 text-blue-400'
                                                        }`}
                                                >
                                                    {getAlertIcon(alert)}
                                                </div>
                                                <div className="flex-1">
                                                    <h4
                                                        className={`font-semibold text-xs tracking-wide uppercase ${alert.type === 'critical'
                                                                ? 'text-red-400'
                                                                : alert.type === 'warning'
                                                                    ? 'text-nexdom-gold'
                                                                    : 'text-blue-400'
                                                            }`}
                                                    >
                                                        {alert.title}
                                                    </h4>
                                                    <p className="text-white/80 text-xs mt-0.5">{alert.message}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Footer Info */}
                            {alerts.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-white/10">
                                    <p className="text-xs text-gray-500 text-center">
                                        {alerts.length} {alerts.length === 1 ? 'alerta activa' : 'alertas activas'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
