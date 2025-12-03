import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOffline } from '../hooks/useOffline';

export const OfflineBanner: React.FC = () => {
    const { isOffline, lastOnline } = useOffline();

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white py-2 px-4 flex items-center justify-center gap-2 shadow-md">
            <WifiOff className="w-5 h-5" />
            <span className="font-medium text-sm">
                Sin conexión - Mostrando último estado conocido
            </span>
            {lastOnline && (
                <span className="text-xs opacity-80 hidden sm:inline">
                    (desde {lastOnline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
            )}
        </div>
    );
};
