import React, { useState, useEffect } from 'react';
import { X, Check, Bell, BellOff, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { PWAUtils } from './PWAUtils';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionChange?: (granted: boolean) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  isOpen,
  onClose,
  onPermissionChange
}) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    Notification.permission
  );
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setPermission(Notification.permission);
  }, [isOpen]);

  const handlePermissionRequest = async () => {
    setIsUpdating(true);
    try {
      const granted = await PWAUtils.requestNotificationPermission();
      setPermission(granted ? 'granted' : 'denied');
      onPermissionChange?.(granted);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const testNotification = () => {
    PWAUtils.showNotification('Prueba de notificación', {
      body: 'Las notificaciones están funcionando correctamente',
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">Notificaciones</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Estado de conexión */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {navigator.onLine ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className="text-sm text-gray-300">
              {navigator.onLine ? 'En línea' : 'Sin conexión'}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Las notificaciones requieren conexión a Internet para funcionar
          </p>
        </div>

        {/* Permisos de notificación */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Permisos</h3>
            <div className={`px-2 py-1 rounded-full text-xs ${
              permission === 'granted' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {permission === 'granted' ? 'Permitido' : 'Bloqueado'}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                permission === 'granted' ? 'bg-green-400' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-300">
                Notificaciones del sistema
              </span>
            </div>

            {permission !== 'granted' && (
              <button
                onClick={handlePermissionRequest}
                disabled={isUpdating}
                className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border border-white/50 border-t-white rounded-full animate-spin" />
                    Solicitando...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Permitir notificaciones
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tipos de notificación */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-white mb-3">Tipos de notificación</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-300">Dispositivos encendidos/apagados</span>
                <p className="text-xs text-gray-400">Notificar cuando los dispositivos cambien de estado</p>
              </div>
              <div className="w-10 h-6 bg-cyan-600 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-300">Alertas de seguridad</span>
                <p className="text-xs text-gray-400">Notificaciones importantes de seguridad</p>
              </div>
              <div className="w-10 h-6 bg-cyan-600 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-300">Sensores activados</span>
                <p className="text-xs text-gray-400">Cuando los sensores detecten movimiento o cambios</p>
              </div>
              <div className="w-10 h-6 bg-gray-600 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={testNotification}
            disabled={permission !== 'granted' || isUpdating}
            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
          >
            Probar
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
          >
            Listo
          </button>
        </div>

        {/* Estado PWA */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Smartphone className="w-3 h-3" />
            <span>
              {window.matchMedia('(display-mode: standalone)').matches ? 
                'Ejecutándose como PWA instalada' : 
                'Ejecutándose en navegador'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
