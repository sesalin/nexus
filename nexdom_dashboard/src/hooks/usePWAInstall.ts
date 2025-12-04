import { useEffect, useRef, useState } from "react";

type DeferredPromptEvent = Event & {
    prompt: () => void;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function usePWAInstall() {
    const [canInstall, setCanInstall] = useState(false);
    const [installed, setInstalled] = useState(false);
    const deferredPrompt = useRef<DeferredPromptEvent | null>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            // Muy importante: evitar que Chrome muestre su mini-infobar
            e.preventDefault();
            deferredPrompt.current = e as DeferredPromptEvent;
            setCanInstall(true);
            console.log("[PWA] Evento beforeinstallprompt capturado");
        };

        const handleAppInstalled = () => {
            setInstalled(true);
            setCanInstall(false);
            deferredPrompt.current = null;
            console.log("[PWA] NexdomOS instalado");
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const install = async () => {
        if (!deferredPrompt.current) {
            console.warn("[PWA] No hay deferredPrompt disponible");
            return false;
        }

        deferredPrompt.current.prompt();
        const { outcome } = await deferredPrompt.current.userChoice;

        if (outcome === "accepted") {
            console.log("[PWA] Usuario aceptó instalar NexdomOS");
            setCanInstall(false);
            deferredPrompt.current = null;
            return true;
        } else {
            console.log("[PWA] Usuario canceló la instalación");
            return false;
        }
    };

    const isInStandalone =
        (typeof window !== 'undefined' && window.matchMedia?.("(display-mode: standalone)").matches) ||
        // iOS viejo
        (typeof window !== 'undefined' && (window.navigator as any).standalone === true);

    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    return { canInstall, installed, isInStandalone, install, isIOS };
}
