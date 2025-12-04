// Integración de Notificaciones de Home Assistant con PWA
import { PWAUtils } from './PWAUtils';
import { useHomeAssistant } from '../components/dashboard/HomeAssistant';

interface HAPushNotification {
  entity_id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  icon?: string;
  sound?: string;
  data?: any;
}

interface HAAlert {
  entity_id: string;
  title: string;
  message: string;
  alert_type: 'device' | 'security' | 'energy' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export class HomeAssistantNotifications {
  private static notificationQueue: Array<{
    entity: any;
    event: 'on' | 'off' | 'alert' | 'trigger';
    timestamp: number;
  }> = [];

  private static alertSettings = {
    device: true,
    security: true,
    energy: true,
    system: true
  };

  // Inicializar sistema de notificaciones HA
  static async init() {
    console.log('[HA Notifications] Inicializando sistema de notificaciones');

    // Configurar listeners para eventos de HA
    this.setupHomeAssistantListeners();

    // Configurar Service Worker para notificaciones push
    this.setupServiceWorkerListeners();

    // Cargar configuración guardada
    this.loadNotificationSettings();
  }

  // Configurar listeners de Home Assistant
  private static setupHomeAssistantListeners() {
    // Escuchar eventos de estado de entidades
    window.addEventListener('homeassistant:state_changed', (event: any) => {
      const { entity, old_state, new_state } = event.detail;
      this.handleEntityStateChange(entity, old_state, new_state);
    });

    // Escuchar alertas de seguridad
    window.addEventListener('homeassistant:security_alert', (event: any) => {
      const { entity, message } = event.detail;
      this.showSecurityAlert(entity, message);
    });

    // Escuchar alertas del sistema
    window.addEventListener('homeassistant:system_alert', (event: any) => {
      const { title, message, severity } = event.detail;
      this.showSystemAlert(title, message, severity);
    });
  }

  // Configurar listeners del Service Worker
  private static setupServiceWorkerListeners() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data;

        switch (type) {
          case 'HA_NOTIFICATION_CLICK':
            this.handleNotificationClick(data);
            break;
        }
      });
    }
  }

  // Manejar cambios de estado de entidades
  private static handleEntityStateChange(entity: any, oldState: any, newState: any) {
    if (Notification.permission !== 'granted') return;

    const domain = entity.entity_id.split('.')[0];
    const deviceName = entity.attributes.friendly_name || entity.entity_id;

    // Solo notificar cambios relevantes
    if (this.shouldNotifyStateChange(domain, oldState?.state, newState?.state)) {
      const event = newState?.state === 'on' ? 'on' : 'off';

      // Mostrar notificación inmediata
      PWAUtils.showHomeAssistantNotification(entity, event);

      // Encolar para logging
      this.notificationQueue.push({
        entity,
        event,
        timestamp: Date.now()
      });

      // Limpiar cola si es muy grande
      if (this.notificationQueue.length > 100) {
        this.notificationQueue = this.notificationQueue.slice(-50);
      }
    }
  }

  // Determinar si se debe notificar un cambio de estado
  private static shouldNotifyStateChange(domain: string, oldState: string, newState: string): boolean {
    // No notificar si el estado no cambió realmente
    if (oldState === newState) return false;

    // Notificar estos tipos de dispositivos
    const notifyDomains = ['light', 'switch', 'fan', 'lock', 'binary_sensor', 'sensor'];
    if (!notifyDomains.includes(domain)) return false;

    // Para sensores, solo notificar cambios importantes (no 'unknown', 'unavailable')
    if (domain === 'sensor' && (newState === 'unknown' || newState === 'unavailable')) {
      return false;
    }

    // Para sensores binarios, solo cambios relevantes
    if (domain === 'binary_sensor' && !['on', 'off'].includes(newState)) {
      return false;
    }

    return true;
  }

  // Mostrar alerta de seguridad
  private static showSecurityAlert(entity: any, message: string) {
    if (!this.alertSettings.security) return;

    PWAUtils.showNotification('🚨 Alerta de Seguridad', {
      body: `${entity.attributes.friendly_name}: ${message}`,
      icon: '/icon-security.png',
      badge: '/icon-security.png',
      vibrate: [300, 100, 300],
      requireInteraction: true,
      actions: [
        {
          action: 'view_security',
          title: 'Ver Seguridad',
          icon: '/icon-view.png'
        },
        {
          action: 'dismiss',
          title: 'Descartar',
          icon: '/icon-dismiss.png'
        }
      ],
      data: {
        url: '/security',
        entity_id: entity.entity_id,
        type: 'security_alert'
      }
    });
  }

  // Mostrar alerta del sistema
  private static showSystemAlert(title: string, message: string, severity: string = 'info') {
    if (!this.alertSettings.system) return;

    const icons = {
      info: '/icon-info.png',
      warning: '/icon-warning.png',
      error: '/icon-error.png',
      critical: '/icon-critical.png'
    };

    PWAUtils.showNotification(`⚙️ ${title}`, {
      body: message,
      icon: icons[severity] || icons.info,
      badge: icons[severity] || icons.info,
      vibrate: severity === 'critical' ? [500, 200, 500] : [200, 100, 200],
      requireInteraction: severity === 'critical' || severity === 'error',
      data: {
        type: 'system_alert',
        severity
      }
    });
  }

  // Manejar clicks en notificaciones
  private static handleNotificationClick(data: any) {
    if (data.type === 'security_alert') {
      // Navegar a la página de seguridad
      window.location.href = '/security';
    } else if (data.type === 'system_alert') {
      // Mostrar más detalles del sistema
      console.log('[HA Notifications] Click en alerta del sistema:', data);
    } else if (data.entity_id) {
      // Navegar a la entidad específica
      const url = `/zones?entity=${data.entity_id}`;
      window.location.href = url;
    }
  }

  // Enviar notificación personalizada
  static sendCustomNotification(notification: HAPushNotification) {
    const options: NotificationOptions = {
      body: notification.message,
      icon: notification.icon || '/icon-192.png',
      badge: notification.icon || '/icon-192.png',
      vibrate: this.getVibrationPattern(notification.priority),
      requireInteraction: notification.priority === 'critical',
      data: notification.data || {}
    } as any;

    PWAUtils.showNotification(notification.title, options);
  }

  // Obtener patrón de vibración según prioridad
  private static getVibrationPattern(priority: string): number[] {
    switch (priority) {
      case 'critical':
        return [500, 200, 500, 200, 500];
      case 'high':
        return [300, 100, 300];
      case 'normal':
        return [200, 100, 200];
      case 'low':
      default:
        return [100];
    }
  }

  // Configurar tipos de alertas
  static setAlertSettings(settings: typeof this.alertSettings) {
    this.alertSettings = { ...this.alertSettings, ...settings };
    localStorage.setItem('nexdom-alert-settings', JSON.stringify(this.alertSettings));
  }

  // Obtener configuración de alertas
  static getAlertSettings() {
    return { ...this.alertSettings };
  }

  // Cargar configuración guardada
  private static loadNotificationSettings() {
    try {
      const saved = localStorage.getItem('nexdom-alert-settings');
      if (saved) {
        this.alertSettings = { ...this.alertSettings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('[HA Notifications] Error cargando configuración:', error);
    }
  }

  // Obtener historial de notificaciones
  static getNotificationHistory() {
    return [...this.notificationQueue].sort((a, b) => b.timestamp - a.timestamp);
  }

  // Limpiar historial
  static clearNotificationHistory() {
    this.notificationQueue = [];
  }

  // Simular evento de prueba
  static async sendTestNotification() {
    const testEntity = {
      entity_id: 'light.living_room',
      name: 'Luz Sala de Estar',
      attributes: { friendly_name: 'Luz Sala de Estar' }
    };

    PWAUtils.showHomeAssistantNotification(testEntity, 'on');

    setTimeout(() => {
      PWAUtils.showHomeAssistantNotification(testEntity, 'off');
    }, 3000);
  }
}

// Hook React para usar notificaciones HA
import { useState, useEffect } from 'react';

export const useHomeAssistantNotifications = () => {
  const [settings, setSettings] = useState(HomeAssistantNotifications.getAlertSettings());

  useEffect(() => {
    HomeAssistantNotifications.init();
  }, []);

  const updateSettings = (newSettings: Partial<typeof settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    HomeAssistantNotifications.setAlertSettings(updated);
  };

  return {
    settings,
    updateSettings,
    sendCustomNotification: HomeAssistantNotifications.sendCustomNotification.bind(HomeAssistantNotifications),
    sendTestNotification: HomeAssistantNotifications.sendTestNotification.bind(HomeAssistantNotifications),
    getHistory: HomeAssistantNotifications.getNotificationHistory.bind(HomeAssistantNotifications),
    clearHistory: HomeAssistantNotifications.clearNotificationHistory.bind(HomeAssistantNotifications)
  };
};

export default HomeAssistantNotifications;
