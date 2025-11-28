import React, { useState } from 'react';

export const Debug: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [states, setStates] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [entities, setEntities] = useState<any[]>([]);
    const [wsConnected, setWsConnected] = useState(false);

    const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        console.log(logMessage);
        setLogs(prev => [...prev, logMessage]);
    };

    const testBackendHealth = async () => {
        addLog('Testing backend health...');
        try {
            const response = await fetch('/health');
            const data = await response.json();
            addLog(`✓ Backend health: ${JSON.stringify(data)}`, 'success');
        } catch (error: any) {
            addLog(`✗ Backend health failed: ${error.message}`, 'error');
        }
    };

    const testStates = async () => {
        addLog('Testing GET /api/states...');
        try {
            const response = await fetch('/api/states');
            addLog(`Response status: ${response.status}`);

            if (!response.ok) {
                const text = await response.text();
                addLog(`✗ Error response: ${text}`, 'error');
                return;
            }

            const data = await response.json();
            addLog(`✓ Received ${data.length} states`, 'success');
            setStates(data.slice(0, 10)); // Solo primeros 10 para no saturar
        } catch (error: any) {
            addLog(`✗ States request failed: ${error.message}`, 'error');
        }
    };

    const testAreas = async () => {
        addLog('Testing GET /api/config/area_registry...');
        try {
            const response = await fetch('/api/config/area_registry');
            addLog(`Response status: ${response.status}`);

            if (!response.ok) {
                const text = await response.text();
                addLog(`✗ Error response: ${text}`, 'error');
                return;
            }

            const data = await response.json();
            addLog(`✓ Received ${data.length} areas`, 'success');
            setAreas(data);
        } catch (error: any) {
            addLog(`✗ Areas request failed: ${error.message}`, 'error');
        }
    };

    const testEntityRegistry = async () => {
        addLog('Testing GET /api/config/entity_registry...');
        try {
            const response = await fetch('/api/config/entity_registry');
            addLog(`Response status: ${response.status}`);

            if (!response.ok) {
                const text = await response.text();
                addLog(`✗ Error response: ${text}`, 'error');
                return;
            }

            const data = await response.json();
            addLog(`✓ Received ${data.length} entity registry entries`, 'success');
            setEntities(data.slice(0, 10)); // Solo primeros 10
        } catch (error: any) {
            addLog(`✗ Entity registry request failed: ${error.message}`, 'error');
        }
    };

    const testWebSocket = () => {
        addLog('Testing WebSocket connection...');

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

        addLog(`WebSocket URL: ${wsUrl}`);

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            addLog('✓ WebSocket connected!', 'success');
            setWsConnected(true);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            addLog(`WS Message: ${data.type}`, 'info');

            if (data.type === 'auth_ok') {
                addLog('✓ WebSocket authenticated!', 'success');
            }
        };

        ws.onerror = (error) => {
            addLog(`✗ WebSocket error`, 'error');
        };

        ws.onclose = () => {
            addLog('WebSocket closed');
            setWsConnected(false);
        };
    };

    const testAll = async () => {
        setLogs([]);
        addLog('=== Starting all tests ===');
        addLog(`Current URL: ${window.location.href}`);
        addLog(`Protocol: ${window.location.protocol}`);
        addLog(`Host: ${window.location.host}`);
        addLog(`Pathname: ${window.location.pathname}`);

        await testBackendHealth();
        await new Promise(r => setTimeout(r, 500));

        await testStates();
        await new Promise(r => setTimeout(r, 500));

        await testAreas();
        await new Promise(r => setTimeout(r, 500));

        await testEntityRegistry();
        await new Promise(r => setTimeout(r, 500));

        testWebSocket();
    };

    const clearLogs = () => {
        setLogs([]);
        setStates([]);
        setAreas([]);
        setEntities([]);
    };

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-nexdom-lime">
                    🔧 Nexdom Dashboard - Debug Mode
                </h1>

                {/* Control Panel */}
                <div className="glass-panel rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={testAll}
                            className="px-4 py-2 bg-nexdom-lime text-black rounded-lg font-medium hover:bg-nexdom-lime/80 transition"
                        >
                            🚀 Run All Tests
                        </button>
                        <button
                            onClick={testBackendHealth}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition"
                        >
                            Health Check
                        </button>
                        <button
                            onClick={testStates}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-500 transition"
                        >
                            Test States
                        </button>
                        <button
                            onClick={testAreas}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 transition"
                        >
                            Test Areas
                        </button>
                        <button
                            onClick={testEntityRegistry}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-500 transition"
                        >
                            Test Entity Registry
                        </button>
                        <button
                            onClick={testWebSocket}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-500 transition"
                        >
                            Test WebSocket
                        </button>
                        <button
                            onClick={clearLogs}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-500 transition"
                        >
                            Clear Logs
                        </button>
                    </div>

                    <div className="mt-4 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full ${wsConnected ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            WebSocket: {wsConnected ? '✓ Connected' : '○ Disconnected'}
                        </span>
                    </div>
                </div>

                {/* Logs */}
                <div className="glass-panel rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Console Logs</h2>
                    <div className="bg-black/50 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                        {logs.length === 0 ? (
                            <div className="text-gray-500">No logs yet. Click "Run All Tests" to start.</div>
                        ) : (
                            logs.map((log, i) => (
                                <div
                                    key={i}
                                    className={`mb-1 ${log.includes('ERROR') ? 'text-red-400' :
                                            log.includes('SUCCESS') ? 'text-green-400' :
                                                'text-gray-300'
                                        }`}
                                >
                                    {log}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Data Display */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* States */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-xl font-semibold mb-4">States ({states.length})</h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {states.map((state, i) => (
                                <div key={i} className="bg-black/50 rounded p-2 text-xs">
                                    <div className="text-nexdom-lime font-semibold">{state.entity_id}</div>
                                    <div className="text-gray-400">State: {state.state}</div>
                                    {state.attributes?.friendly_name && (
                                        <div className="text-gray-500">{state.attributes.friendly_name}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Areas */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-xl font-semibold mb-4">Areas ({areas.length})</h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {areas.map((area, i) => (
                                <div key={i} className="bg-black/50 rounded p-2 text-xs">
                                    <div className="text-nexdom-lime font-semibold">{area.name}</div>
                                    <div className="text-gray-400">ID: {area.area_id}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Entity Registry */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-xl font-semibold mb-4">Entity Registry ({entities.length})</h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {entities.map((entity, i) => (
                                <div key={i} className="bg-black/50 rounded p-2 text-xs">
                                    <div className="text-nexdom-lime font-semibold">{entity.entity_id}</div>
                                    <div className="text-gray-400">Area: {entity.area_id || 'none'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
