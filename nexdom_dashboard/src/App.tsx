import React, { useState } from 'react';
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
import { VoiceAI } from './pages/VoiceAI';
import { useNexdomStore } from './store/nexdomStore';

// Componentes PWA
import { PWAProvider } from './pwa/PWAProvider';
import { PWAInstallPrompt, ConnectionStatus, PWAStatus } from './pwa/PWAInstallPrompt';
import { PWAHeader } from './pwa/PWAHeader';
import { NotificationSettings } from './pwa/NotificationSettings';
import { usePWA } from './pwa/PWAUtils';

import './index.css';

function App() {
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
              <Route path="/voice" element={<VoiceAI />} />
            </Routes>
          </main>
        </div>
      </Router>
  );
}

export default App;
