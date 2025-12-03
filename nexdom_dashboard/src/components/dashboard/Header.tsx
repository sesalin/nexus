import React, { useState } from 'react';
import { Bell, Mic, Search } from 'lucide-react';
import { useNexdomStore } from '../../store/nexdomStore';
import { motion } from 'framer-motion';
import logoWhite from '../../assets/logo-white.svg';
import { AccountMenu } from './account/AccountMenu';
import { useAlerts } from './Alerts';
import { AlertsModal } from './modals/AlertsModal';

interface HeaderProps {
  pwaHeader?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ pwaHeader }) => {
  const toggleMobileMenu = useNexdomStore((state) => state.toggleMobileMenu);
  const alerts = useAlerts();
  const alertCount = alerts.length;
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-between px-4 lg:px-8 py-6 relative z-50 pointer-events-none"
    >
      {/* Logo Area */}
      <div
        className="flex items-center gap-3 pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => toggleMobileMenu()}
      >
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-nexdom-lime/20 rounded-full blur-md animate-pulse"></div>
          <img src={logoWhite} alt="Nexdom OS" className="relative w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-wider text-white">NEXDOM<span className="text-nexdom-lime font-light">OS</span></h1>
          <span className="text-[10px] text-gray-400 tracking-[0.2em] uppercase">System Online</span>
        </div>
      </div>

      {/* Search Bar - Floating Pill */}
      <div className="hidden md:flex items-center bg-nexdom-glass backdrop-blur-md border border-white/10 rounded-full px-4 py-2 w-96 pointer-events-auto shadow-lg">
        <Search className="w-4 h-4 text-gray-400 mr-3" />
        <input
          type="text"
          placeholder="Ask Nexdom..."
          className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-full"
        />
        <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-gray-400">/</div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pointer-events-auto">
        {/* Componentes PWA */}
        {pwaHeader}

        <motion.button
          onClick={() => setIsAlertsModalOpen(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 rounded-full bg-nexdom-glass backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-nexdom-lime/50 transition-all relative group"
        >
          <Bell className="w-5 h-5 text-gray-300 group-hover:text-nexdom-lime transition-colors" />
          {alertCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-nexdom-lime rounded-full shadow-[0_0_10px_#00FF88]"></span>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 rounded-full bg-nexdom-glass backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-nexdom-gold/50 transition-all group"
        >
          <Mic className="w-5 h-5 text-gray-300 group-hover:text-nexdom-gold transition-colors" />
        </motion.button>

        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-nexdom-gold">Pro Account</p>
          </div>

          {/* Account Menu Component */}
          <AccountMenu />
        </div>
      </div>

      {/* Alerts Modal */}
      <AlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
      />
    </motion.header>
  );
};
