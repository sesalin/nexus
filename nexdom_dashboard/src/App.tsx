import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/dashboard/Header';
import { ModuleNav } from './components/dashboard/ModuleNav';
import { Dashboard } from './pages/Dashboard';
import { Zones } from './pages/Zones';
import { Gadgets } from './pages/Gadgets';
import { Energy } from './pages/Energy';
import { Security } from './pages/Security';
import { Scenes } from './pages/Scenes';
import { Routines } from './pages/Routines';
import { Battery } from './pages/Battery';
import { VoiceAI } from './pages/VoiceAI';
import { Debug } from './pages/Debug';
import { useNexdomStore } from './store/nexdomStore';

// Componentes PWA
import { PWAProvider } from './pwa/PWAProvider';
import { PWAInstallPrompt, ConnectionStatus, PWAStatus } from './pwa/PWAInstallPrompt';
import { PWAHeader } from './pwa/PWAHeader';
import { NotificationSettings } from './pwa/NotificationSettings';
import { usePWA } from './pwa/PWAUtils';

import './index.css';
import { useHomeAssistant } from './components/dashboard/HomeAssistant';
import { Device } from './store/nexdomStore';

function App() {
  const { entities, zones, isConnected } = useHomeAssistant();
  const { setDevices, setRooms, setConnected } = useNexdomStore();

  // Mapear entidades de HA al store interno
  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected, setConnected]);

  useEffect(() => {
    if (!entities || entities.length === 0) return;

    const devices = entities.map((entity) => {
      const [domain] = entity.entity_id.split('.');
      const areaId = entity.attributes?.area_id || 'unassigned';
      const typeMap: Record<string, Device['type']> = {
        light: 'light',
        switch: 'switch',
        sensor: 'sensor',
        camera: 'camera',
        climate: 'thermostat',
        lock: 'lock',
      };

      return {
        id: entity.entity_id,
        name: entity.attributes?.friendly_name || entity.entity_id,
        type: typeMap[domain] || 'sensor',
        status: entity.state === 'unavailable' ? 'offline' : 'online',
        room: areaId,
        lastUpdate: entity.last_changed || entity.last_updated,
      } as Device;
    });

    setDevices(devices);
  }, [entities, setDevices]);

  useEffect(() => {
    if (!zones || zones.length === 0) return;

    const rooms = zones.map((zone: any) => ({
      id: zone.id || zone.area_id,
      name: zone.name,
      activeDevices: Array.isArray(zone.entities) ? zone.entities.length : 0,
      temperature: zone.temperature,
    }));

    setRooms(rooms);
  }, [zones, setRooms]);

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
        <Header />
        <ModuleNav />

        <main className="transition-all duration-300">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/zones" element={<Zones />} />
            <Route path="/gadgets" element={<Gadgets />} />
            <Route path="/energy" element={<Energy />} />
            <Route path="/security" element={<Security />} />
            <Route path="/scenes" element={<Scenes />} />
            <Route path="/routines" element={<Routines />} />
            <Route path="/battery" element={<Battery />} />
            <Route path="/voice" element={<VoiceAI />} />
            <Route path="/debug" element={<Debug />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
