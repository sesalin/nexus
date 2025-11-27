export interface Device {
  id: string;
  name: string;
  type: 'light' | 'thermostat' | 'lock' | 'camera' | 'sensor' | 'outlet';
  room: string;
  status: 'on' | 'off' | 'online' | 'offline' | 'locked' | 'unlocked';
  value?: number | string; // e.g., temperature, brightness
  battery?: number;
  lastUpdated: string;
}

export interface Room {
  id: string;
  name: string;
  devices: string[]; // Device IDs
  temperature?: number;
  humidity?: number;
  activeDevices: number;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Scene {
  id: string;
  name: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export interface Routine {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  nextRun?: string;
}

export interface EnergyStats {
  currentUsage: number; // kW
  dailyTotal: number; // kWh
  solarGeneration?: number; // kW
  batteryLevel?: number; // %
}
