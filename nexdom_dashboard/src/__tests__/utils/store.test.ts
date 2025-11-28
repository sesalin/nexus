import { renderHook, act } from '@testing-library/react';
import { useNexdomStore } from '../../store/nexdomStore';

describe('useNexdomStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useNexdomStore.getState();
    store.devices = [];
    store.alerts = [];
    store.isLoading = false;
    store.isConnected = true;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useNexdomStore());
    
    expect(result.current.devices).toEqual([]);
    expect(result.current.alerts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isConnected).toBe(true);
  });

  describe('devices', () => {
    it('should add a device', () => {
      const { result } = renderHook(() => useNexdomStore());
      
      const device = {
        id: 'device-1',
        name: 'Test Device',
        type: 'light' as const,
        status: 'online' as const,
        room: 'Living Room'
      };
      
      act(() => {
        result.current.addDevice(device);
      });
      
      expect(result.current.devices).toHaveLength(1);
      expect(result.current.devices[0]).toEqual(device);
    });

    it('should update a device', () => {
      const { result } = renderHook(() => useNexdomStore());
      
      // First add a device
      const device = {
        id: 'device-1',
        name: 'Test Device',
        type: 'light' as const,
        status: 'online' as const,
        room: 'Living Room'
      };
      
      act(() => {
        result.current.addDevice(device);
      });
      
      // Then update it
      act(() => {
        result.current.updateDevice('device-1', { name: 'Updated Device' });
      });
      
      expect(result.current.devices[0].name).toBe('Updated Device');
      expect(result.current.devices[0].type).toBe('light');
    });

    it('should remove a device', () => {
      const { result } = renderHook(() => useNexdomStore());
      
      const device = {
        id: 'device-1',
        name: 'Test Device',
        type: 'light' as const,
        status: 'online' as const,
        room: 'Living Room'
      };
      
      act(() => {
        result.current.addDevice(device);
      });
      
      expect(result.current.devices).toHaveLength(1);
      
      act(() => {
        result.current.removeDevice('device-1');
      });
      
      expect(result.current.devices).toHaveLength(0);
    });
  });

  describe('alerts', () => {
    it('should add an alert', () => {
      const { result } = renderHook(() => useNexdomStore());
      
      const alertData = {
        type: 'info' as const,
        title: 'Test Alert',
        message: 'This is a test message'
      };
      
      act(() => {
        result.current.addAlert(alertData);
      });
      
      expect(result.current.alerts).toHaveLength(1);
      expect(result.current.alerts[0].title).toBe('Test Alert');
      expect(result.current.alerts[0].read).toBe(false);
      expect(result.current.alerts[0]).toHaveProperty('id');
      expect(result.current.alerts[0]).toHaveProperty('timestamp');
    });

    it('should mark alert as read', () => {
      const { result } = renderHook(() => useNexdomStore());
      
      const alertData = {
        type: 'info' as const,
        title: 'Test Alert',
        message: 'This is a test message'
      };
      
      act(() => {
        result.current.addAlert(alertData);
      });
      
      const alertId = result.current.alerts[0].id;
      
      act(() => {
        result.current.markAlertAsRead(alertId);
      });
      
      expect(result.current.alerts[0].read).toBe(true);
    });

    it('should clear an alert', () => {
      const { result } = renderHook(() => useNexdomStore());
      
      const alertData = {
        type: 'info' as const,
        title: 'Test Alert',
        message: 'This is a test message'
      };
      
      act(() => {
        result.current.addAlert(alertData);
      });
      
      const alertId = result.current.alerts[0].id;
      
      act(() => {
        result.current.clearAlert(alertId);
      });
      
      expect(result.current.alerts).toHaveLength(0);
    });
  });

  describe('UI state', () => {
    it('should handle loading state', () => {
      const { result } = renderHook(() => useNexdomStore());
      
      expect(result.current.isLoading).toBe(false);
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      
      act(() => {
        result.current.setLoading(false);
      });
      
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle connection state', () => {
      const { result } = renderHook(() => useNexdomStore());
      
      expect(result.current.isConnected).toBe(true);
      
      act(() => {
        result.current.setConnected(false);
      });
      
      expect(result.current.isConnected).toBe(false);
      
      act(() => {
        result.current.setConnected(true);
      });
      
      expect(result.current.isConnected).toBe(true);
    });
  });
});