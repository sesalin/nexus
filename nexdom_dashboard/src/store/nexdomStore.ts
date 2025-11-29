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

export interface EnergyState {
  currentUsage: number;
  solarGeneration: number;
  batteryLevel: number;
}

export interface Scene {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
}

export interface Routine {
  id: string;
  name: string;
  trigger: string;
  nextRun?: string;
  enabled: boolean;
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

  // Scenes
  scenes: Scene[];
  activateScene: (id: string) => void;

  // Routines
  routines: Routine[];
  toggleRoutine: (id: string) => void;

  // Energy
  energy: EnergyState;
  setEnergy: (energy: EnergyState) => void;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void;
  markAlertAsRead: (id: string) => void;
  clearAlert: (id: string) => void;

  // UI State
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Connection Status
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
}

export const useNexdomStore = create<NexdomState>((set, get) => ({
  // Initial state
  devices: [],
  rooms: [],
  scenes: [
    { id: '1', name: 'Movie Night', icon: 'Film', isActive: false },
    { id: '2', name: 'Good Morning', icon: 'Sun', isActive: true },
    { id: '3', name: 'Away', icon: 'LogOut', isActive: false },
  ],
  routines: [
    { id: '1', name: 'Turn on porch lights', trigger: 'Sunset', nextRun: '18:45', enabled: true },
    { id: '2', name: 'Vacuum living room', trigger: 'Mon, Wed, Fri at 10:00', nextRun: 'Wed 10:00', enabled: false },
  ],
  alerts: [],
  energy: {
    currentUsage: 0,
    solarGeneration: 0,
    batteryLevel: 0,
  },
  isLoading: false,
  isConnected: true,

  // Scene actions
  activateScene: (id) => set((state) => ({
    scenes: state.scenes.map(scene => ({
      ...scene,
      isActive: scene.id === id
    }))
  })),

  // Routine actions
  toggleRoutine: (id) => set((state) => ({
    routines: state.routines.map(routine =>
      routine.id === id ? { ...routine, enabled: !routine.enabled } : routine
    )
  })),

  // Energy actions
  setEnergy: (energy) => set({ energy }),

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

  // Mobile Menu
  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  // Connection actions
  setConnected: (connected) => set({ isConnected: connected }),
}));
