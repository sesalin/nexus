import { create } from 'zustand';

export interface Device {
  id: string;
  name: string;
  type: 'light' | 'switch' | 'sensor' | 'camera' | 'thermostat' | 'lock';
  status: 'online' | 'offline' | 'error';
  room?: string;
  lastUpdate?: string;
}

export interface Room {
  id: string;
  name: string;
  activeDevices: number;
  temperature?: number;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface NexdomState {
  // Devices
  devices: Device[];
  addDevice: (device: Device) => void;
  setDevices: (devices: Device[]) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  removeDevice: (id: string) => void;
  
  // Rooms
  rooms: Room[];
  addRoom: (room: Room) => void;
  setRooms: (rooms: Room[]) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  removeRoom: (id: string) => void;
  
  // Alerts
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void;
  markAlertAsRead: (id: string) => void;
  clearAlert: (id: string) => void;
  
  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Connection Status
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
}

export const useNexdomStore = create<NexdomState>((set, get) => ({
  // Initial state
  devices: [],
  rooms: [],
  alerts: [],
  isLoading: false,
  isConnected: true,
  
  // Device actions
  addDevice: (device) => set((state) => ({
    devices: [...state.devices, device]
  })),

  setDevices: (devices) => set(() => ({
    devices
  })),
  
  updateDevice: (id, updates) => set((state) => ({
    devices: state.devices.map(device => 
      device.id === id ? { ...device, ...updates } : device
    )
  })),
  
  removeDevice: (id) => set((state) => ({
    devices: state.devices.filter(device => device.id !== id)
  })),
  
  // Room actions
  addRoom: (room) => set((state) => ({
    rooms: [...state.rooms, room]
  })),

  setRooms: (rooms) => set(() => ({
    rooms
  })),
  
  updateRoom: (id, updates) => set((state) => ({
    rooms: state.rooms.map(room => 
      room.id === id ? { ...room, ...updates } : room
    )
  })),
  
  removeRoom: (id) => set((state) => ({
    rooms: state.rooms.filter(room => room.id !== id)
  })),
  
  // Alert actions
  addAlert: (alertData) => set((state) => {
    const newAlert: Alert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    return {
      alerts: [newAlert, ...state.alerts]
    };
  }),
  
  markAlertAsRead: (id) => set((state) => ({
    alerts: state.alerts.map(alert =>
      alert.id === id ? { ...alert, read: true } : alert
    )
  })),
  
  clearAlert: (id) => set((state) => ({
    alerts: state.alerts.filter(alert => alert.id !== id)
  })),
  
  // UI actions
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Connection actions
  setConnected: (connected) => set({ isConnected: connected }),
}));
