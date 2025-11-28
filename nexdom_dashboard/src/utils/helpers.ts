// Time formatting utility
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `hace ${diffInSeconds} segundos`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
};

// Device status formatting
export const formatDeviceStatus = (status: 'online' | 'offline' | 'error'): string => {
  switch (status) {
    case 'online':
      return 'En línea';
    case 'offline':
      return 'Desconectado';
    case 'error':
      return 'Error';
    default:
      return 'Desconocido';
  }
};

// Device type formatting
export const formatDeviceType = (type: string): string => {
  switch (type) {
    case 'light':
      return 'Luz';
    case 'switch':
      return 'Interruptor';
    case 'sensor':
      return 'Sensor';
    case 'camera':
      return 'Cámara';
    case 'thermostat':
      return 'Termostato';
    case 'lock':
      return 'Cerradura';
    default:
      return 'Dispositivo';
  }
};

// Get device icon name (for UI components)
export const getDeviceIcon = (type: string): string => {
  switch (type) {
    case 'light':
      return 'Lightbulb';
    case 'switch':
      return 'ToggleLeft';
    case 'sensor':
      return 'Activity';
    case 'camera':
      return 'Camera';
    case 'thermostat':
      return 'Thermometer';
    case 'lock':
      return 'Lock';
    default:
      return 'Smartphone';
  }
};

// Get device status color
export const getDeviceStatusColor = (status: 'online' | 'offline' | 'error'): string => {
  switch (status) {
    case 'online':
      return 'text-green-500';
    case 'offline':
      return 'text-gray-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-gray-400';
  }
};

// Format alert type for display
export const formatAlertType = (type: 'info' | 'warning' | 'error'): string => {
  switch (type) {
    case 'info':
      return 'Información';
    case 'warning':
      return 'Advertencia';
    case 'error':
      return 'Error';
    default:
      return 'Alerta';
  }
};

// Get alert type color
export const getAlertTypeColor = (type: 'info' | 'warning' | 'error'): string => {
  switch (type) {
    case 'info':
      return 'text-blue-500';
    case 'warning':
      return 'text-yellow-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

// Generate unique IDs
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate URL format
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};