import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { usePWA } from './PWAUtils';

interface PWAInstallPromptProps {
  className?: string;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  className = ""
}) => {
  const {
    hasInstallPrompt,
    install,
    isInstalled,
    isOnline,
    registerInteraction
  } = usePWA();

  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  useEffect(() => {
    // Registrar interacción del usuario
    const handleUserInteraction = () => {
      registerInteraction();
      // Solo escuchar una vez
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [registerInteraction]);

  useEffect(() => {
    // Mostrar prompt si hay instalación disponible y la app no está instalada
    if (hasInstallPrompt && !isInstalled) {
      // Esperar un poco antes de mostrar el prompt
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 15000); // 15 segundos después de cargar

      return () => clearTimeout(timer);
    }
  }, [hasInstallPrompt, isInstalled]);

  const handleInstall = async () => {
    if (isInstalling) return;

    setIsInstalling(true);
    try {
      const success = await install();
      if (success) {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // No mostrar de nuevo en esta sesión
    sessionStorage.setItem('nexdom-pwa-dismissed', 'true');
  };

  // No mostrar si ya se ha descartado en esta sesión
  if (sessionStorage.getItem('nexdom-pwa-dismissed') === 'true') {
    return null;
  }

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
                🚀 Abrir App Independiente
              </h3>
              <p className="text-black/80 text-xs mb-3">
                Para instalar Nexdom OS, necesitas abrirlo fuera de Home Assistant.
              </p>

              <button
                onClick={() => window.open(window.location.href, '_blank')}
                className="bg-black/90 hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 w-full justify-center"
              >
                <ExternalLink className="w-3 h-3" />
                Abrir en Nueva Pestaña
              </button>
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

  if (!showPrompt) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
      <div className="bg-[#0F1412] border-t-2 border-[#00C26F] py-4 px-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Texto */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base mb-0.5">
              Descarga Nexdom OS
            </h3>
            <p className="text-[#B7C0BC] text-xs">
              Tu casa inteligente, siempre disponible. Instálalo como app en 1 minuto.
            </p>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="bg-[#00C26F] hover:bg-[#22D98C] text-[#0B0F0D] font-bold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isInstalling ? 'Instalando...' : 'Descargar Nexdom OS'}
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
    </div>
  );
};

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

// Componente para mostrar estado PWA
export const PWAStatus: React.FC = () => {
  const { isInstalled, isOnline, supportsPWA } = usePWA();
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Solo mostrar en desarrollo o cuando sea útil
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => setShowStatus(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showStatus || !supportsPWA) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-40 bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isInstalled ? 'bg-green-400' : 'bg-gray-400'}`} />
          <span>{isInstalled ? 'PWA Instalada' : 'PWA No Instalada'}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{isOnline ? 'En Línea' : 'Sin Conexión'}</span>
        </div>

        <div className="flex items-center gap-2">
          <Wifi className="w-3 h-3" />
          <span>PWA Soportado</span>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
