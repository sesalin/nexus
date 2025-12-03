import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall.ts';
import { usePWA } from './PWAUtils'; // Mantener para status de conexión

interface PWAInstallPromptProps {
  className?: string;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  className = ""
}) => {
  const { canInstall, installed, isInStandalone, install, isIOS } = usePWAInstall();
  const { isOnline } = usePWA(); // Solo para status online/offline

  const [visible, setVisible] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const EXTERNAL_HINT_URL = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  // Mostrar banner si es instalable (Android/PC) o es iOS (manual)
  useEffect(() => {
    if (!installed && !isInStandalone && !isInIframe) {
      if (canInstall || isIOS) {
        // Pequeño delay para no ser intrusivo
        const timer = setTimeout(() => setVisible(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [canInstall, installed, isInStandalone, isInIframe, isIOS]);

  const handleOpen = () => {
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = window.location.href;
        return;
      }
    } catch (e) {
      // ignore
    }
    window.open(window.location.href, '_blank');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EXTERNAL_HINT_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      alert('Copia el enlace manualmente.');
    }
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }

    setIsInstalling(true);
    const ok = await install();
    setIsInstalling(false);
    if (ok) {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('nexdom-pwa-dismissed', 'true');
  };

  if (sessionStorage.getItem('nexdom-pwa-dismissed') === 'true' && !isInIframe) {
    return null;
  }

  // 1. Banner de Ingress (Iframe Breakout)
  if (isInIframe) {
    return (
      <div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
        <div className="bg-gradient-to-r from-nexdom-lime to-green-500 rounded-2xl p-4 shadow-2xl border border-nexdom-lime/20 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <ExternalLink className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-black font-bold text-sm mb-1">
                🚀 Abrir NexdomOS fuera de Home Assistant
              </h3>

              <p className="text-black/80 text-xs mb-2">
                Para instalar NexdomOS como app, ábrelo en el navegador (Chrome/Safari), no dentro de Home Assistant.
              </p>

              <p className="text-black/70 text-[10px] break-all mb-2 bg-black/5 rounded-md px-2 py-1 font-mono">
                {EXTERNAL_HINT_URL}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleOpen}
                  className="bg-black/90 hover:bg-black text-white px-3 py-2 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 flex-1 justify-center"
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir en navegador
                </button>

                <button
                  onClick={handleCopy}
                  className="bg-white/90 hover:bg-white text-black px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors flex-1"
                >
                  {copied ? '✅ Copiado' : 'Copiar enlace'}
                </button>
              </div>

              <p className="text-black/60 text-[10px] mt-2">
                En el celular: pega el enlace en Chrome/Safari para que te aparezca la opción de instalar NexdomOS.
              </p>
            </div>

            <button
              onClick={() => setIsInIframe(false)}
              className="flex-shrink-0 text-black/70 hover:text-black p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Banner de Instalación (PWA)
  if (!visible) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
      <div className="bg-[#0F1412] border-t-2 border-[#00C26F] py-4 px-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base mb-0.5">
              {isIOS ? 'Instalar en iOS' : 'Descarga Nexdom OS'}
            </h3>
            <p className="text-[#B7C0BC] text-xs">
              {isIOS
                ? 'Añade NexdomOS a tu pantalla de inicio para la mejor experiencia.'
                : 'Tu casa inteligente, siempre disponible. Instálalo como app en 1 minuto.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="bg-[#00C26F] hover:bg-[#22D98C] text-[#0B0F0D] font-bold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isInstalling ? 'Instalando...' : (isIOS ? 'Ver Instrucciones' : 'Descargar Nexdom OS')}
            </button>

            <button
              onClick={handleDismiss}
              className="text-[#B7C0BC] hover:text-white p-2 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {showIOSHelp && <IOSInstructions onClose={() => setShowIOSHelp(false)} />}
    </div>
  );
};

// Componente de instrucciones para iOS
const IOSInstructions: React.FC<{ onClose: () => void }> = ({ onClose }) => (
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

// Componente para mostrar estado de conectividad
export const ConnectionStatus: React.FC = () => {
  const { isOnline } = usePWA();
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
    } else {
      setShowOfflineAlert(false);
    }
  }, [isOnline]);

  if (!showOfflineAlert) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white text-center py-2 text-sm">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>Sin conexión. Algunas funciones no estarán disponibles.</span>
      </div>
    </div>
  );
};

// Componente para mostrar estado PWA (Debug)
export const PWAStatus: React.FC = () => {
  const { installed, isInStandalone } = usePWAInstall();
  const { isOnline } = usePWA();
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => setShowStatus(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showStatus) return null;

  return (
    <div className="fixed top-4 right-4 z-40 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-xs pointer-events-none">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${installed || isInStandalone ? 'bg-green-400' : 'bg-gray-400'}`} />
          <span>{installed || isInStandalone ? 'PWA Instalada' : 'PWA No Instalada'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{isOnline ? 'En Línea' : 'Sin Conexión'}</span>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
