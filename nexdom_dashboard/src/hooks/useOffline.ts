import { useState, useEffect } from 'react';

export const useOffline = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [lastOnline, setLastOnline] = useState<Date | null>(null);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setLastOnline(null);
        };

        const handleOffline = () => {
            setIsOffline(true);
            setLastOnline(new Date());
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOffline, lastOnline };
};
