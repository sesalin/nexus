import React from 'react';
import { X } from 'lucide-react';

export const IOSInstructions: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-[#1A1F1D] border border-[#00C26F]/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
                <h3 className="text-white font-bold text-lg">Instalar en iPhone/iPad</h3>
                <button onClick={onClose} className="text-[#B7C0BC] hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-3 text-[#B7C0BC] text-sm">
                <p>iOS no permite instalación automática. Sigue estos pasos:</p>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                    <li>Toca el botón <span className="text-white font-bold">Compartir</span> <span className="inline-block align-middle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg></span> en la barra inferior.</li>
                    <li>Desliza hacia abajo y selecciona <span className="text-white font-bold">"Agregar al Inicio"</span> (Add to Home Screen).</li>
                    <li>Confirma tocando <span className="text-white font-bold">Agregar</span>.</li>
                </ol>
            </div>

            <button
                onClick={onClose}
                className="w-full bg-[#00C26F] hover:bg-[#22D98C] text-[#0B0F0D] font-bold py-3 rounded-xl transition-colors"
            >
                Entendido
            </button>
        </div>
    </div>
);
