import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Layers, Calendar, MapPin, Cpu, Zap, ShieldCheck, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMedia } from 'react-use';
import { useNexdomStore } from '../../store/nexdomStore';
import { MenuIcon } from '../Icon';

export const ModuleNav: React.FC = () => {
  const isMobile = useMedia('(max-width: 1024px)', false);
  const { isMobileMenuOpen, setMobileMenuOpen } = useNexdomStore();
  const location = useLocation();
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide on route change (mobile only)
  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [location, isMobile, setMobileMenuOpen]);

  // Auto-close timer
  const resetAutoCloseTimer = () => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    if (isMobile && isMobileMenuOpen) {
      autoCloseTimerRef.current = setTimeout(() => {
        setMobileMenuOpen(false);
      }, 5000); // Auto-close after 5 seconds of inactivity
    }
  };

  useEffect(() => {
    resetAutoCloseTimer();
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, [isMobileMenuOpen, isMobile]);

  // Swipe detection
  useEffect(() => {
    if (!isMobile) return;

    let touchStartX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      // Swipe right from left edge (0-50px)
      if (touchStartX < 50 && touchEndX > touchStartX + 50) {
        setMobileMenuOpen(true);
      }
      // Swipe left to close
      if (isMobileMenuOpen && touchStartX > touchEndX + 50) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isMobileMenuOpen, setMobileMenuOpen]);

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems = [
    { path: '/', iconType: 'lucide' as const, iconName: 'Home', label: 'Overview' },
    { path: '/zones', iconType: 'lucide' as const, iconName: 'MapPin', label: 'Zonas' },
    { path: '/gadgets', iconType: 'lucide' as const, iconName: 'Cpu', label: 'Gadgets' },
    { path: '/energy', iconType: 'lucide' as const, iconName: 'Zap', label: 'Energy' },
    { path: '/security', iconType: 'lucide' as const, iconName: 'ShieldCheck', label: 'Security' },
    { path: '/scenes', iconType: 'lucide' as const, iconName: 'Layers', label: 'Scenes' },
    { path: '/routines', iconType: 'lucide' as const, iconName: 'Calendar', label: 'Routines' },
    { path: '/battery', iconType: 'lucide' as const, iconName: 'Battery', label: 'Battery' },
    { path: '/voice', iconType: 'lucide' as const, iconName: 'Mic', label: 'Voice/AI' },
  ];

  const NavContent = () => (
    <div
      className="glass-panel rounded-3xl w-full h-full flex flex-col items-center py-8 gap-6 overflow-y-auto scrollbar-hide"
      onClick={(e) => e.stopPropagation()} // Prevent click through
      onTouchStart={resetAutoCloseTimer} // Reset timer on interaction
    >
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => isMobile && setMobileMenuOpen(false)}
          className={({ isActive }) => `
            relative group flex flex-col items-center justify-center w-12 h-12 shrink-0
          `}
          onMouseEnter={() => setHoveredItem(item.path)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {({ isActive }) => (
            <>
              <div className={`absolute inset-0 rounded-xl transition-all duration-500 ${isActive
                ? 'bg-nexdom-lime/10 shadow-[0_0_20px_rgba(0,255,136,0.2)]'
                : 'group-hover:bg-white/5'
                }`}></div>

              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute -left-3 w-1 h-8 bg-nexdom-lime rounded-full shadow-[0_0_10px_#00FF88]"
                />
              )}

              <MenuIcon
                type={item.iconType}
                name={item.iconName}
                isActive={isActive}
                isHovering={hoveredItem === item.path}
              />

              {/* Tooltip (Desktop only) */}
              {!isMobile && (
                <div className="absolute left-14 px-3 py-1 bg-nexdom-panel border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  <span className="text-xs font-medium text-white">{item.label}</span>
                </div>
              )}

              {/* Label (Mobile only) */}
              {isMobile && (
                <span className={`text-[10px] mt-1 ${isActive ? 'text-nexdom-lime' : 'text-gray-500'}`}>{item.label}</span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Edge Trigger Area */}
        <div className="fixed top-0 left-0 w-4 h-full z-30 pointer-events-none" />

        <AnimatePresence mode="wait">
          {isMobileMenuOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, pointerEvents: 'auto' as any }}
                exit={{ opacity: 0, pointerEvents: 'none' as any }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* Drawer */}
              <motion.nav
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300, duration: 0.2 }}
                className="fixed top-0 left-0 h-full w-24 z-50 p-4"
              >
                <NavContent />
                <div className="mt-auto pb-4 px-4">
                  <div className="text-xs text-gray-600 text-center">
                    v0.0.73
                  </div>      </div>
              </div>
            </motion.nav>
        </>
          )}
      </AnimatePresence >
      </>
    );
  }

// Desktop View
return (
  <nav className="w-24 h-[calc(100vh-120px)] fixed left-6 top-28 flex flex-col items-center z-40">
    <NavContent />
  </nav>
);
};
