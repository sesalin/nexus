import React, { useState, useEffect } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { IOSInstructions } from './IOSInstructions';

export const PWAInstallButton: React.FC = () => {
    const { canInstall, installed, isInStandalone, install, isIOS } = usePWAInstall();
    const [isInIframe, setIsInIframe] = useState(false);
    const [showIOSHelp, setShowIOSHelp] = useState(false);

    useEffect(() => {
        setIsInIframe(window.self !== window.top);
    }, []);

    // No mostrar si ya está instalado o en modo standalone
    if (installed || isInStandalone) return null;

    // No mostrar si no es instalable, no es iOS y no está en iframe
    if (!canInstall && !isIOS && !isInIframe) return null;

    const handleClick = async () => {
        if (isInIframe) {
            // Logic for iframe breakout
            try {
                if (window.top && window.top !== window.self) {
                    window.top.location.href = window.location.href;
                    return;
                }
            } catch (e) {
                // ignore
            }
            window.open(window.location.href, '_blank');
            return;
        }

        if (isIOS) {
            setShowIOSHelp(true);
            return;
        }

        if (canInstall) {
            await install();
        }
    };

    return (
        <>
            <motion.button
                onClick={handleClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-nexdom-lime/10 border border-nexdom-lime/20 text-nexdom-lime hover:bg-nexdom-lime/20 transition-colors group"
            >
                {isInIframe ? (
                    <ExternalLink className="w-4 h-4" />
                ) : (
                    <Download className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                    {isInIframe ? 'Abrir App' : 'Instalar App'}
                </span>
            </motion.button>

            {showIOSHelp && <IOSInstructions onClose={() => setShowIOSHelp(false)} />}
        </>
    );
};
