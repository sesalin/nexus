import { HassConnect } from '@hakit/core';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';

interface HAProviderProps {
    children: ReactNode;
}

/**
 * HAKit Provider - Wraps entire app with Home Assistant connection
 * 
 * Features:
 * - Reads authentication token from localStorage
 * - Validates token expiration
 * - Redirects to login if no valid token
 * - Establishes WebSocket connection with token
 */
export function HAProvider({ children }: HAProviderProps) {
    const [token, setToken] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('ha_access_token');
        const expiresStr = localStorage.getItem('ha_token_expires_at');
        const refreshToken = localStorage.getItem('ha_refresh_token');

        if (savedToken && expiresStr) {
            const expiresAt = parseInt(expiresStr);
            const now = Date.now();

            if (now < expiresAt) {
                setToken(savedToken);
                setIsChecking(false);
                return;
            }
        }

        async function tryRefresh() {
            if (!refreshToken) {
                window.location.href = '/login/index.html';
                return;
            }
            try {
                const body = new URLSearchParams();
                body.set('grant_type', 'refresh_token');
                body.set('refresh_token', refreshToken);
                body.set('client_id', window.location.origin);
                const res = await fetch('/auth/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    credentials: 'include',
                    body
                });
                if (!res.ok) throw new Error('refresh_failed');
                const data = await res.json();
                const expiresAt = Date.now() + (data.expires_in * 1000);
                localStorage.setItem('ha_access_token', data.access_token);
                localStorage.setItem('ha_token_expires_at', String(expiresAt));
                setToken(data.access_token);
                setIsChecking(false);
            } catch {
                localStorage.removeItem('ha_access_token');
                localStorage.removeItem('ha_token_expires_at');
                localStorage.removeItem('ha_refresh_token');
                window.location.href = '/login/index.html';
            }
        }

        tryRefresh();
    }, []);

    if (isChecking || !token) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#000',
                color: '#fff',
            }}>
                <div>Verificando sesión...</div>
            </div>
        );
    }

    const hassUrl = window.location.origin;

    return (
        <HassConnect
            hassUrl={hassUrl}
            hassToken={token}
        >
            {children}
        </HassConnect>
    );
}
