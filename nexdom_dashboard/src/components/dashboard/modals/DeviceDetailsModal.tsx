import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Thermometer, Lock, Power } from 'lucide-react';
import { useHomeAssistant } from '../HomeAssistant';

interface DeviceDetailsModalProps {
    entityId: string | null;
    onClose: () => void;
}

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({ entityId, onClose }) => {
    const { entities, callService } = useHomeAssistant();
    const entity = entities.find(e => e.entity_id === entityId);

    if (!entity) return null;

    const domain = entity.entity_id.split('.')[0];
    const name = entity.attributes.friendly_name || entity.entity_id;
    const state = entity.state;

    // Handlers
    const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const brightness = parseInt(e.target.value);
        callService('light', 'turn_on', { entity_id: entityId, brightness });
    };

    const handleColorTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const temp = parseInt(e.target.value);
        callService('light', 'turn_on', { entity_id: entityId, color_temp: temp });
    };

    const handleThermostatChange = (temp: number) => {
        callService('climate', 'set_temperature', { entity_id: entityId, temperature: temp });
    };

    return (
        <AnimatePresence>
            {entityId && (
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
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-[2rem] p-6 w-full max-w-md shadow-2xl pointer-events-auto relative overflow-hidden">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{name}</h2>
                                    <p className="text-gray-400 text-sm font-mono">{entityId}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Content based on domain */}
                            <div className="space-y-6">

                                {/* Status Indicator */}
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                    <span className="text-gray-300">Estado</span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${state === 'on' || state === 'unlocked' || state === 'open'
                                            ? 'bg-nexdom-lime/20 text-nexdom-lime'
                                            : 'bg-white/10 text-gray-400'
                                        }`}>
                                        {state}
                                    </span>
                                </div>

                                {/* Light Controls */}
                                {domain === 'light' && (
                                    <>
                                        {/* Brightness */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm text-gray-400">
                                                <span className="flex items-center gap-2"><Sun className="w-4 h-4" /> Brillo</span>
                                                <span>{Math.round((entity.attributes.brightness || 0) / 2.55)}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="255"
                                                defaultValue={entity.attributes.brightness || 0}
                                                onChange={handleBrightnessChange}
                                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-nexdom-lime"
                                            />
                                        </div>

                                        {/* Color Temp (if supported) */}
                                        {entity.attributes.min_mireds && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm text-gray-400">
                                                    <span>Temperatura</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={entity.attributes.min_mireds}
                                                    max={entity.attributes.max_mireds}
                                                    defaultValue={entity.attributes.color_temp || 370}
                                                    onChange={handleColorTempChange}
                                                    className="w-full h-2 bg-gradient-to-r from-blue-200 to-orange-400 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Climate Controls */}
                                {domain === 'climate' && (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="text-6xl font-thin text-white">
                                            {entity.attributes.temperature}°
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleThermostatChange((entity.attributes.temperature || 20) - 0.5)}
                                                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-2xl"
                                            >
                                                -
                                            </button>
                                            <button
                                                onClick={() => handleThermostatChange((entity.attributes.temperature || 20) + 0.5)}
                                                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-2xl"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Generic JSON Dump for other types (Debug) */}
                                {!['light', 'climate'].includes(domain) && (
                                    <div className="p-4 rounded-xl bg-black/30 font-mono text-xs text-gray-500 overflow-auto max-h-40">
                                        <pre>{JSON.stringify(entity.attributes, null, 2)}</pre>
                                    </div>
                                )}

                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
