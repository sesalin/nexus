import { create } from 'zustand';
import { Device, Room, Alert, Scene, Routine, EnergyStats } from '../types/nexdom';

interface NexdomState {
  devices: Device[];
  rooms: Room[];
  alerts: Alert[];
  scenes: Scene[];
  routines: Routine[];
  energy: EnergyStats;
  
  // Mobile Menu State
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
}

// Mock Data
const MOCK_DEVICES: Device[] = [
  { id: 'd1', name: 'Living Room Light', type: 'light', room: 'Living Room', status: 'on', value: 80, lastUpdated: new Date().toISOString() },
  { id: 'd2', name: 'Kitchen Light', type: 'light', room: 'Kitchen', status: 'off', lastUpdated: new Date().toISOString() },
  { id: 'd3', name: 'Thermostat', type: 'thermostat', room: 'Hallway', status: 'online', value: 22, lastUpdated: new Date().toISOString() },
  { id: 'd4', name: 'Front Door Lock', type: 'lock', room: 'Entrance', status: 'locked', battery: 85, lastUpdated: new Date().toISOString() },
  { id: 'd5', name: 'Backyard Camera', type: 'camera', room: 'Outdoor', status: 'online', lastUpdated: new Date().toISOString() },
  { id: 'd6', name: 'Motion Sensor', type: 'sensor', room: 'Hallway', status: 'online', value: 'Clear', battery: 90, lastUpdated: new Date().toISOString() },
];

const MOCK_ROOMS: Room[] = [
  { id: 'r1', name: 'Living Room', devices: ['d1'], temperature: 22.5, activeDevices: 1 },
  { id: 'r2', name: 'Kitchen', devices: ['d2'], temperature: 23.0, activeDevices: 0 },
  { id: 'r3', name: 'Hallway', devices: ['d3', 'd6'], temperature: 22.0, activeDevices: 2 },
  { id: 'r4', name: 'Entrance', devices: ['d4'], activeDevices: 1 },
  { id: 'r5', name: 'Outdoor', devices: ['d5'], temperature: 18.0, activeDevices: 1 },
];

const MOCK_SCENES: Scene[] = [
  { id: 's1', name: 'Good Morning', icon: 'Sun', color: 'bg-orange-500', isActive: false },
  { id: 's2', name: 'Movie Night', icon: 'Film', color: 'bg-purple-600', isActive: false },
  { id: 's3', name: 'Away', icon: 'LogOut', color: 'bg-blue-500', isActive: true },
  { id: 's4', name: 'Good Night', icon: 'Moon', color: 'bg-indigo-900', isActive: false },
];

const MOCK_ROUTINES: Routine[] = [
  { id: 'rt1', name: 'Sunset Lights', trigger: 'Sunset', enabled: true, nextRun: '18:45' },
  { id: 'rt2', name: 'Morning Coffee', trigger: '07:00 AM', enabled: true, nextRun: '07:00' },
  { id: 'rt3', name: 'Security Check', trigger: '23:00 PM', enabled: true, nextRun: '23:00' },
];

const MOCK_ALERTS: Alert[] = [
  { id: 'a1', type: 'warning', message: 'Backyard motion detected', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), read: false },
  { id: 'a2', type: 'info', message: 'System update available', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), read: true },
];

export const useNexdomStore = create<NexdomState>((set) => ({
  devices: MOCK_DEVICES,
  rooms: MOCK_ROOMS,
  alerts: MOCK_ALERTS,
  scenes: MOCK_SCENES,
  routines: MOCK_ROUTINES,
  energy: {
    currentUsage: 2.4,
    dailyTotal: 14.5,
    solarGeneration: 3.2,
    batteryLevel: 88,
  },

  toggleDevice: (id) => set((state) => ({
    devices: state.devices.map((d) => 
      d.id === id 
        ? { ...d, status: d.status === 'on' ? 'off' : d.status === 'off' ? 'on' : d.status === 'locked' ? 'unlocked' : d.status === 'unlocked' ? 'locked' : d.status } 
        : d
    )
  })),

  setDeviceValue: (id, value) => set((state) => ({
    devices: state.devices.map((d) => d.id === id ? { ...d, value } : d)
  })),

  activateScene: (id) => set((state) => ({
    scenes: state.scenes.map((s) => ({ ...s, isActive: s.id === id }))
  })),

  toggleRoutine: (id) => set((state) => ({
    routines: state.routines.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r)
  })),

  markAlertRead: (id) => set((state) => ({
    alerts: state.alerts.map((a) => a.id === id ? { ...a, read: true } : a)
  })),

  addAlert: (alert) => set((state) => ({
    alerts: [{ ...alert, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString(), read: false }, ...state.alerts]
  })),

  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
}));
