import React from 'react';
import { Smartphone, Bell, Settings, Download } from 'lucide-react';

interface PWAHeaderProps {
  onInstallClick?: () => void;
  onNotificationClick?: () => void;
  isInstalled?: boolean;
  canNotify?: boolean;
}

export const PWAHeader: React.FC<PWAHeaderProps> = ({
  onInstallClick,
  onNotificationClick,
  isInstalled = false,
  canNotify = false
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Botón de instalación */}
      {!isInstalled && onInstallClick && (
        <button
          onClick={onInstallClick}
          className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
          title="Instalar App"
        >
          <Download className="w-5 h-5" />
        </button>
      )}

      {/* Indicador PWA */}
      {isInstalled && (
        <div 
          className="p-2 text-cyan-400 transition-colors"
          title="PWA Instalada"
        >
          <Smartphone className="w-5 h-5" />
        </div>
      )}

      {/* Botón de notificaciones */}
      {canNotify && onNotificationClick && (
        <button
          onClick={onNotificationClick}
          className="p-2 text-gray-400 hover:text-cyan-400 transition-colors relative"
          title="Notificaciones"
        >
          <Bell className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default PWAHeader;
