import { useEffect, useRef, useState, type FormEvent } from 'react';
import './LiquidLogin.css';

interface LiquidLoginProps {
    onLoginSuccess: () => void;
}

export function LiquidLogin({ onLoginSuccess }: LiquidLoginProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const effectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check if scripts are already loaded
        const scriptsLoaded = !!(window as any).LiquidEther;

        if (scriptsLoaded) {
            console.log('[Login] Scripts already loaded, initializing effect...');

            // Just initialize if scripts exist
            if (effectRef.current) {
                try {
                    (window as any).LiquidEther.init(effectRef.current, {
                        autoDemo: true,
                        colors: ['#1a8c2d', '#25fd44', '#5eed39']
                    });
                    console.log('[Login] Liquid Ether initialized!');
                } catch (e) {
                    console.error('[Login] Failed to init:', e);
                }
            }
            return; // Don't load scripts again
        }

        // Load scripts only if not already loaded
        const loadScripts = async () => {
            console.log('[Login] Starting script load...');

            const scripts = [
                { src: '/login/polyfills.js', id: 'login-polyfills' },
                { src: '/login/three.min.js', id: 'login-three' },
                { src: '/login/liquid-ether.js', id: 'login-liquid' }
            ];

            for (const { src, id } of scripts) {
                // Skip if already exists
                if (document.getElementById(id)) {
                    console.log('[Login] Skip (exists):', src);
                    continue;
                }

                console.log('[Login] Loading:', src);
                const script = document.createElement('script');
                script.id = id;
                script.src = src;
                script.async = false;
                document.body.appendChild(script);

                await new Promise((resolve, reject) => {
                    script.onload = () => {
                        console.log('[Login] Loaded:', src);
                        resolve(null);
                    };
                    script.onerror = (err) => {
                        console.error('[Login] Failed:', src, err);
                        reject(err);
                    };
                });
            }

            console.log('[Login] All scripts loaded');

            // Initialize after scripts load
            setTimeout(() => {
                if (effectRef.current && (window as any).LiquidEther) {
                    try {
                        console.log('[Login] Initializing Liquid Ether...');
                        (window as any).LiquidEther.init(effectRef.current, {
                            autoDemo: true,
                            colors: ['#1a8c2d', '#25fd44', '#5eed39']
                        });
                        console.log('[Login] Initialized!');
                    } catch (e) {
                        console.error('[Login] Init failed:', e);
                    }
                } else {
                    console.error('[Login] Missing LiquidEther or ref');
                }
            }, 100);
        };

        loadScripts().catch(err => {
            console.error('[Login] Load failed:', err);
        });

        // Load remember preference
        try {
            const savedPref = localStorage.getItem('nexdomRemember');
            if (savedPref !== null) {
                setRemember(savedPref === '1');
            }
        } catch (err) {
            // Ignore
        }
    }, []);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            setStatus('Falta usuario o contraseña');
            return;
        }

        setIsLoading(true);
        setStatus('Validando credenciales...');

        try {
            // Save remember preference
            localStorage.setItem('nexdomRemember', remember ? '1' : '0');

            // For now, just simulate login and go to dashboard
            // You'll implement actual HA auth later
            setTimeout(() => {
                setStatus('Autenticado! Redirigiendo...');
                setTimeout(onLoginSuccess, 500);
            }, 1000);

        } catch (err) {
            console.error(err);
            setStatus(err instanceof Error ? err.message : 'Error de conexión');
            setIsLoading(false);
        }
    };

    return (
        <div>
            {/* 3D Background Effect */}
            <div ref={effectRef} id="effect" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }} />

            {/* Login Container */}
            <div id="login-container">
                <img
                    src="/login/logo-white.svg"
                    alt="Nexdom"
                    style={{ width: '200px', height: 'auto', marginBottom: '20px' }}
                />

                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Usuario"
                        id="user"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        disabled={isLoading}
                    />

                    <input
                        type="password"
                        placeholder="Contraseña"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        disabled={isLoading}
                    />

                    <label className="login-remember">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                        />
                        Mantener la sesión iniciada
                    </label>

                    <button
                        type="submit"
                        id="login-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Ingresando...' : 'Ingresar'}
                    </button>

                    <p
                        id="status"
                        style={{
                            color: '#fff',
                            marginTop: '16px',
                            minHeight: '20px',
                            fontSize: '14px'
                        }}
                    >
                        {status}
                    </p>
                </form>
            </div>
        </div>
    );
}
