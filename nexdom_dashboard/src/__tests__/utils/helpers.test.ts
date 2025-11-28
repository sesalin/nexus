import { formatTimeAgo, formatDeviceStatus, getDeviceIcon } from '../../utils/helpers';

describe('Helpers', () => {
  describe('formatTimeAgo', () => {
    it('should format seconds ago', () => {
      const now = new Date();
      const fiveSecondsAgo = new Date(now.getTime() - 5 * 1000);
      expect(formatTimeAgo(fiveSecondsAgo)).toBe('hace 5 segundos');
    });

    it('should format minutes ago', () => {
      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
      expect(formatTimeAgo(twoMinutesAgo)).toBe('hace 2 minutos');
    });

    it('should format hours ago', () => {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      expect(formatTimeAgo(threeHoursAgo)).toBe('hace 3 horas');
    });

    it('should format days ago', () => {
      const now = new Date();
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      expect(formatTimeAgo(fiveDaysAgo)).toBe('hace 5 días');
    });
  });

  describe('formatDeviceStatus', () => {
    it('should return proper status text for online devices', () => {
      expect(formatDeviceStatus('online')).toBe('En línea');
    });

    it('should return proper status text for offline devices', () => {
      expect(formatDeviceStatus('offline')).toBe('Desconectado');
    });

    it('should return proper status text for error devices', () => {
      expect(formatDeviceStatus('error')).toBe('Error');
    });
  });

  describe('getDeviceIcon', () => {
    it('should return correct icon for light devices', () => {
      expect(getDeviceIcon('light')).toBeDefined();
    });

    it('should return correct icon for switch devices', () => {
      expect(getDeviceIcon('switch')).toBeDefined();
    });

    it('should return correct icon for sensor devices', () => {
      expect(getDeviceIcon('sensor')).toBeDefined();
    });

    it('should return correct icon for camera devices', () => {
      expect(getDeviceIcon('camera')).toBeDefined();
    });

    it('should return correct icon for thermostat devices', () => {
      expect(getDeviceIcon('thermostat')).toBeDefined();
    });

    it('should return correct icon for lock devices', () => {
      expect(getDeviceIcon('lock')).toBeDefined();
    });
  });
});