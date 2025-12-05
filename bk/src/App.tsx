import { HAProvider } from './providers/HAProvider';
import './App.css';
import { useEntities, useHass } from '@hakit/core';

function EntityList() {
  const hass = useHass();
  const all = useEntities();
  const lights = all.filter((e) => e.entity_id.startsWith('light.'));
  const sensors = all.filter((e) => e.entity_id.startsWith('sensor.'));
  const switches = all.filter((e) => e.entity_id.startsWith('switch.'));

  return (
    <div style={{ marginTop: '1rem' }}>
      <h3>Luces</h3>
      <ul>
        {lights.map((l) => (
          <li key={l.entity_id}>
            {l.attributes.friendly_name || l.entity_id} — {l.state}
            <button
              style={{ marginLeft: 8 }}
              onClick={() => hass.callService('light', l.state === 'on' ? 'turn_off' : 'turn_on', { entity_id: l.entity_id })}
            >
              {l.state === 'on' ? 'Apagar' : 'Encender'}
            </button>
          </li>
        ))}
      </ul>

      <h3 style={{ marginTop: 16 }}>Switches</h3>
      <ul>
        {switches.map((s) => (
          <li key={s.entity_id}>
            {s.attributes.friendly_name || s.entity_id} — {s.state}
            <button
              style={{ marginLeft: 8 }}
              onClick={() => hass.callService('switch', s.state === 'on' ? 'turn_off' : 'turn_on', { entity_id: s.entity_id })}
            >
              {s.state === 'on' ? 'Apagar' : 'Encender'}
            </button>
          </li>
        ))}
      </ul>

      <h3 style={{ marginTop: 16 }}>Sensores</h3>
      <ul>
        {sensors.map((s) => (
          <li key={s.entity_id}>
            {s.attributes.friendly_name || s.entity_id} — {s.state}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Dashboard() {
  const handleLogout = () => {
    console.log('[Dashboard] Logging out...');
    localStorage.removeItem('ha_access_token');
    localStorage.removeItem('ha_refresh_token');
    localStorage.removeItem('ha_token_expires_at');
    window.location.href = '/login/index.html';
  };

  return (
    <div className="dashboard">
      <h1>🎉 Nexdom Dashboard</h1>
      <p>HAKit + React 19 + Home Assistant</p>

      <div className="entity-test">
        <h2>✅ Conexión Establecida</h2>
        <p>Login funcionó correctamente!</p>
        <p>HAKit está conectado a Home Assistant</p>
        <EntityList />

        <button
          onClick={handleLogout}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <HAProvider>
      <Dashboard />
    </HAProvider>
  );
}

export default App;
