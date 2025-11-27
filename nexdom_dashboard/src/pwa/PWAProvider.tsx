import React, { useEffect, useState } from 'react';
import PWAUtils from './PWAUtils';

interface PWAProviderProps {
  children: React.ReactNode;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializePWA = async () => {
      try {
        await PWAUtils.init();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing PWA:', error);
        setIsInitialized(true); // No bloquear la app si PWA falla
      }
    };

    initializePWA();
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Inicializando Nexdom OS...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PWAProvider;
