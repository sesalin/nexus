// Utilidades PWA para Nexdom OS
export class PWAUtils {
  private static deferredPrompt: any = null;
  private static serviceWorker: ServiceWorker | null = null;
  private static isInstalled = false;
  private static _isOnline = navigator.onLine;

  // Inicializar PWA
  static async init() {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.serviceWorker = registration.serviceWorker;

        console.log('[PWA] Service Worker registrado:', registration.scope);

        // Escuchar eventos del Service Worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

        // Verificar si la app ya está instalada
        this.checkInstallState();

        // Escuchar eventos de instalación
        window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt.bind(this));
        window.addEventListener('appinstalled', this.handleAppInstalled.bind(this));

        // Escuchar cambios de conectividad
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));

      } catch (error) {
        console.error('[PWA] Error registrando Service Worker:', error);
      }
    } else {
      console.warn('[PWA] Service Worker no soportado');
    }

    // Inicializar sistema de notificaciones
    await this.initNotifications();

    // Mostrar prompt de instalación si es apropiado
    this.maybeShowInstallPrompt();
  }

  // Verificar estado de instalación
  private static checkInstallState() {
    // Verificar si está running standalone
    if (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true) {
      this.isInstalled = true;
      console.log('[PWA] App ejecutándose como PWA');
    }
  }

  // Manejar prompt de instalación
  private static handleBeforeInstallPrompt(event: BeforeInstallPromptEvent) {
    event.preventDefault();
    this.deferredPrompt = event;
    console.log('[PWA] Prompt de instalación disponible');
  }

  // Manejar instalación de la app
  private static handleAppInstalled() {
    this.isInstalled = true;
    this.deferredPrompt = null;
    console.log('[PWA] App instalada correctamente');

    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('pwa:installed'));
  }

  // Mostrar prompt de instalación si es apropiado
  private static maybeShowInstallPrompt() {
    if (this.deferredPrompt && !this.isInstalled) {
      // Esperar un poco antes de mostrar el prompt
      setTimeout(() => {
        if (this.shouldShowInstallPrompt()) {
          this.showInstallPrompt();
        }
      }, 10000); // 10 segundos después de cargar
    }
  }

  // Verificar si se debe mostrar el prompt de instalación
  private static shouldShowInstallPrompt(): boolean {
    // No mostrar si ya se ha mostrado antes
    const hasShownPrompt = localStorage.getItem('nexdom-pwa-prompt-shown');
    if (hasShownPrompt) return false;

    // Solo mostrar en móviles o tablets
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Solo mostrar si el usuario ha interactuado con la app
    const hasInteracted = sessionStorage.getItem('nexdom-user-interacted');

    return isMobile && hasInteracted;
  }

  // Mostrar prompt de instalación
  static async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('[PWA] No hay prompt de instalación disponible');
      return false;
    }

    try {
      const result = await this.deferredPrompt.prompt();
      console.log('[PWA] Resultado del prompt:', result.outcome);

      // Marcar que se mostró el prompt
      localStorage.setItem('nexdom-pwa-prompt-shown', 'true');

      return result.outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Error mostrando prompt:', error);
      return false;
    }
  }

  // Inicializar sistema de notificaciones
  private static async initNotifications() {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notificaciones no soportadas');
      return false;
    }

    // Verificar permisos
    const permission = Notification.permission;

    if (permission === 'default') {
      // Pedir permisos la primera vez
      console.log('[PWA] Solicitando permisos de notificación...');
      const result = await Notification.requestPermission();
      return result === 'granted';
    }

    return permission === 'granted';
  }

  // Solicitar permisos de notificación
  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Mostrar notificación local
  static showNotification(title: string, options: NotificationOptions = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.log('[PWA] No se pueden mostrar notificaciones');
      return false;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      vibrate: [100, 50, 100],
      ...options
    };

    const notification = new Notification(title, defaultOptions);

    // Auto-cerrar después de 5 segundos si no es importante
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }

    // Manejar click en notificación
    notification.onclick = () => {
      window.focus();
      notification.close();

      // Enviar mensaje al Service Worker
      if (this.serviceWorker) {
        this.serviceWorker.postMessage({
          type: 'NOTIFICATION_CLICK',
          data: options.data
        });
      }
    };

    return notification;
  }

  // Mostrar notificación de evento Home Assistant
  static showHomeAssistantNotification(entity: any, event: 'on' | 'off' | 'alert' | 'trigger') {
    const titles = {
      'on': `${entity.name || entity.attributes?.friendly_name || entity.entity_id} activado`,
      'off': `${entity.name || entity.attributes?.friendly_name || entity.entity_id} desactivado`,
      'alert': `Alerta: ${entity.name || entity.attributes?.friendly_name || entity.entity_id}`,
      'trigger': `Disparado: ${entity.name || entity.attributes?.friendly_name || entity.entity_id}`
    };

    const messages = {
      'on': `${entity.name || entity.attributes?.friendly_name || entity.entity_id} se ha activado correctamente`,
      'off': `${entity.name || entity.attributes?.friendly_name || entity.entity_id} se ha desactivado`,
      'alert': `${entity.name || entity.attributes?.friendly_name || entity.entity_id} ha detectado actividad`,
      'trigger': `${entity.name || entity.attributes?.friendly_name || entity.entity_id} se ha disparado`
    };

    const icons = {
      'on': '/icon-192.svg',
      'off': '/icon-192.svg',
      'alert': '/icon-192.svg',
      'trigger': '/icon-192.svg'
    };

    this.showNotification(titles[event], {
      body: messages[event],
      icon: icons[event],
      badge: icons[event],
      vibrate: [200, 100, 200],
      requireInteraction: event === 'alert',
      actions: [
        {
          action: 'view',
          title: 'Ver',
          icon: '/icon-192.svg'
        }
      ],
      data: {
        url: `/zones?entity=${entity.entity_id}`,
        entity_id: entity.entity_id,
        event_type: event
      }
    });
  }

  // Manejar cambios de conectividad
  private static handleOnline() {
    this._isOnline = true;
    console.log('[PWA] Conexión restaurada');
    window.dispatchEvent(new CustomEvent('pwa:online'));
  }

  private static handleOffline() {
    this._isOnline = false;
    console.log('[PWA] Sin conexión');
    window.dispatchEvent(new CustomEvent('pwa:offline'));
  }

  // Manejar mensajes del Service Worker
  private static handleServiceWorkerMessage(event: MessageEvent) {
    const { type, data } = event.data;

    switch (type) {
      case 'PWA_INSTALL_PROMPT':
        console.log('[PWA] Prompt de instalación disponible desde SW');
        break;

      case 'PWA_INSTALLED':
        console.log('[PWA] App instalada desde SW');
        this.isInstalled = true;
        break;

      case 'NOTIFICATION_CLICK':
        console.log('[PWA] Click en notificación:', data);
        // Disparar evento personalizado para que la app maneje la navegación
        window.dispatchEvent(new CustomEvent('pwa:notification-click', { detail: data }));
        break;
    }
  }

  // Sincronización en segundo plano
  static async registerBackgroundSync(tag: string) {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log('[PWA] Sincronización registrada:', tag);
      } catch (error) {
        console.error('[PWA] Error registrando sincronización:', error);
      }
    }
  }

  // Compartir datos
  static async shareData(title: string, text: string, url?: string) {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
        console.log('[PWA] Contenido compartido correctamente');
        return true;
      } catch (error) {
        console.log('[PWA] Error compartiendo:', error);
        return false;
      }
    } else {
      // Fallback para navegadores sin soporte de Web Share API
      if (url) {
        await navigator.clipboard.writeText(url);
        this.showNotification('Enlace copiado', {
          body: 'El enlace se ha copiado al portapapeles',
          icon: '/icon-192.svg'
        });
      }
      return false;
    }
  }

  // Verificar si la app está instalada
  static isPWAInstalled(): boolean {
    return this.isInstalled ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
  }

  // Verificar si está online
  static isOnline(): boolean {
    return this._isOnline;
  }

  // Verificar soporte PWA
  static supportsPWA(): boolean {
    return 'serviceWorker' in navigator &&
      'Notification' in window &&
      'beforeinstallprompt' in window;
  }

  // Obtener información de instalación
  static getInstallInfo() {
    return {
      isInstalled: this.isInstalled,
      isOnline: this._isOnline,
      supportsPWA: this.supportsPWA(),
      hasInstallPrompt: !!this.deferredPrompt,
      canNotify: 'Notification' in window && Notification.permission === 'granted'
    };
  }

  // Registrar interacción del usuario (para mostrar prompt de instalación)
  static registerUserInteraction() {
    sessionStorage.setItem('nexdom-user-interacted', 'true');
  }
}

// Hook React para usar PWA
import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [pwaInfo, setPwaInfo] = useState(PWAUtils.getInstallInfo());

  useEffect(() => {
    const handleInstallStateChange = () => {
      setPwaInfo(PWAUtils.getInstallInfo());
    };

    window.addEventListener('pwa:installed', handleInstallStateChange);
    window.addEventListener('pwa:online', handleInstallStateChange);
    window.addEventListener('pwa:offline', handleInstallStateChange);

    return () => {
      window.removeEventListener('pwa:installed', handleInstallStateChange);
      window.removeEventListener('pwa:online', handleInstallStateChange);
      window.removeEventListener('pwa:offline', handleInstallStateChange);
    };
  }, []);

  return {
    ...pwaInfo,
    install: () => PWAUtils.showInstallPrompt(),
    share: PWAUtils.shareData.bind(PWAUtils),
    notify: PWAUtils.showNotification.bind(PWAUtils),
    requestPermission: PWAUtils.requestNotificationPermission.bind(PWAUtils),
    registerInteraction: PWAUtils.registerUserInteraction.bind(PWAUtils)
  };
};

export default PWAUtils;
