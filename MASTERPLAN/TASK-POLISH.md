# 🎨 TASK-POLISH: Detalles Finos Pre-Producción

**Agent**: AI-POLISH  
**Priority**: 🔴 HIGH  
**Duration**: 6-8 horas  
**Dependencies**: TASK-1, 2, 3, 4 completos

---

## ⚠️ CRITICAL - DO NOT

**NEVER** work in:
- ❌ `node_modules/`
- ❌ `dist/` or `build/`

**ONLY** work in:
- ✅ `PWA/src/`
- ✅ `PWA/public/`

---

## 🎯 OBJETIVO

Pulir TODOS los detalles visuales y funcionales antes de producción.

---

## 📋 DETALLES A ARREGLAR

### 🎴 TARJETAS GENERALES (GadgetCard)

#### 1. Orilla con más brillo
```css
/* Aumentar brillo del border cuando está activo */
.card-active {
  border: 2px solid rgba(COLOR, 0.6); /* Era 0.3, ahora 0.6 */
  box-shadow: 
    0 0 30px rgba(COLOR, 0.5),  /* Más intenso */
    0 0 60px rgba(COLOR, 0.3);
}
```

#### 2. Iconos no se muestran
**Problema**: Probablemente faltan archivos SVG o rutas incorrectas.

**Archivo**: `PWA/src/components/GadgetCard.tsx`

```typescript
// VERIFICAR que existan los iconos
import { 
  Lightbulb,    // Luces
  ToggleRight,  // Switches
  Thermometer,  // Climate
  Camera,       // Cámaras
  Lock,         // Locks
  // ... etc
} from 'lucide-react';

// Usar iconos de lucide-react, NO archivos custom
function EntityIcon({ domain, isActive }) {
  const iconClass = `w-8 h-8 transition-colors`;
  const color = isActive ? getEntityColor(domain) : '#9ca3af';
  
  switch(domain) {
    case 'light': 
      return <Lightbulb className={iconClass} style={{ color }} />;
    case 'switch': 
      return <ToggleRight className={iconClass} style={{ color }} />;
    case 'climate': 
      return <Thermometer className={iconClass} style={{ color }} />;
    // ... etc
  }
}
```

#### 3. Botón ON/OFF

**Actual**: Solo texto "ON" o "OFF"  
**Debe ser**: Botón con estilos específicos

```typescript
<button
  onClick={handleToggle}
  className={`
    flex-1 py-3 px-4 rounded-xl 
    flex items-center justify-center gap-2 
    font-bold text-sm 
    transition-all duration-300
    ${isActive 
      ? 'bg-white text-black shadow-lg' 
      : 'bg-gray-700 text-white border border-white/20'
    }
  `}
>
  <Power className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />
  <span>{isActive ? 'ON' : 'OFF'}</span>
</button>
```

---

### 💡 TARJETAS DE LUCES

#### 1. ColorPicker de @hakit en modal

**Archivo**: `PWA/src/components/modals/LightControlsModal.tsx`

```typescript
import { ColorPicker } from '@hakit/components';

function LightControlsModal({ entityId }) {
  const entity = useEntity(entityId);
  
  return (
    <div className="modal-content">
      <h2>{entity.attributes.friendly_name}</h2>
      
      {/* Usar ColorPicker de @hakit en lugar de custom */}
      <ColorPicker
        entity={entityId}
        onChange={(color) => {
          entity.service.turnOn({ rgb_color: color });
        }}
        className="mb-4"
      />
      
      {/* Brightness slider */}
      {/* ... */}
    </div>
  );
}
```

---

### 🔌 TARJETAS DE SWITCHES

#### 1. Color gris + letras blancas (OFF)

```typescript
// GadgetCard para switches
const switchStyles = {
  off: {
    background: 'rgb(55, 65, 81)', // gray-700
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  on: {
    background: '#00FF88', // nexdom-lime
    color: 'black',
    boxShadow: '0 0 20px rgba(0,255,136,0.5)',
  }
};
```

---

### 📊 TARJETAS DE CONSUMOS (Energy)

#### 1. Mini gráfica en tarjetas

**Usar**: `<SensorCard />` de @hakit/components

**Archivo**: `PWA/src/pages/Energy.tsx`

```typescript
import { SensorCard } from '@hakit/components';

export function Energy() {
  const energySensors = useEntities({ domain: 'sensor' })
    .filter(id => id.includes('energy') || id.includes('power'));
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {energySensors.map(sensorId => (
        <SensorCard
          key={sensorId}
          entity={sensorId}
          graph="line"  // Mini gráfica
          lineColor="#E6C36A"
        />
      ))}
    </div>
  );
}
```

---

### 🎛️ PREPARAR CONTROLES AVANZADOS

#### 1. ClimateControl

**Archivo**: `PWA/src/components/modals/ClimateControlsModal.tsx`

```typescript
import { ClimateCard } from '@hakit/components';

function ClimateControlsModal({ entityId, secondaryEntities }) {
  return (
    <div className="modal-content">
      {/* Usar ClimateCard de @hakit */}
      <ClimateCard
        entity={entityId}
        className="glass-panel"
      />
      
      {/* Secondary info */}
      {secondaryEntities.map(secId => (
        <SecondaryEntityInfo key={secId} entityId={secId} />
      ))}
    </div>
  );
}
```

#### 2. CoverControls

**Archivo**: `PWA/src/components/modals/CoverControlsModal.tsx`

```typescript
import { CoverCard } from '@hakit/components';

function CoverControlsModal({ entityId }) {
  return (
    <div className="modal-content">
      <CoverCard
        entity={entityId}
        className="glass-panel"
      />
    </div>
  );
}
```

#### 3. VacuumControls

**Archivo**: `PWA/src/components/modals/VacuumControlsModal.tsx`

```typescript
import { VacuumCard } from '@hakit/components';

function VacuumControlsModal({ entityId }) {
  return (
    <div className="modal-content">
      <VacuumCard
        entity={entityId}
        className="glass-panel"
      />
    </div>
  );
}
```

---

### ✨ EFECTO RIPPLES

**Instalar**: Ya viene con @hakit/components

```typescript
import { Ripples } from '@hakit/components';

<Ripples borderRadius="12px">
  <button
    onClick={handleToggle}
    className="..."
  >
    {isActive ? 'ON' : 'OFF'}
  </button>
</Ripples>
```

**Aplicar en**:
- Botones ON/OFF de GadgetCard
- Botones de modales
- Items clicables

---

### 🚨 ALERTAS EN MAIN (Dashboard)

**Usar**: `<Alert />` de @hakit/components

**Archivo**: `PWA/src/pages/Dashboard.tsx`

```typescript
import { Alert } from '@hakit/components';

function Dashboard() {
  const alerts = useAlerts(); // Custom hook
  
  return (
    <div>
      {/* Alertas con componente @hakit */}
      <div className="space-y-3 mb-6">
        {alerts.map(alert => (
          <Alert
            key={alert.id}
            type={alert.type} // 'info' | 'warning' | 'error' | 'success'
            title={alert.title}
            message={alert.message}
            onDismiss={() => dismissAlert(alert.id)}
          />
        ))}
      </div>
      
      {/* Rest of dashboard */}
    </div>
  );
}
```

---

### 📹 SECURITY: Mostrar imagen de cámaras

**Archivo**: `PWA/src/pages/Security.tsx`

```typescript
import { CameraCard } from '@hakit/components';

export function Security() {
  const cameras = useEntities({ domain: 'camera' });
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Seguridad</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl mb-4">Cámaras ({cameras.length})</h2>
        <div className="grid grid-cols-2 gap-4">
          {cameras.map(camId => (
            <CameraCard
              key={camId}
              entity={camId}
              refreshInterval={5000}  // Refresh cada 5s
              className="rounded-xl overflow-hidden"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
```

---

### 🎬 SCENES: Ver escenas + activar con click

**Archivo**: `PWA/src/pages/Scenes.tsx`

```typescript
import { Ripples } from '@hakit/components';
import { motion } from 'framer-motion';

export function Scenes() {
  const scenes = useEntities({ domain: 'scene' });
  const callService = useService();
  
  const activateScene = (sceneId: string) => {
    callService({
      domain: 'scene',
      service: 'turn_on',
      serviceData: { entity_id: sceneId }
    });
  };
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Escenas</h1>
      
      <div className="grid grid-cols-4 gap-4">
        {scenes.map(sceneId => {
          const scene = useEntity(sceneId);
          return (
            <Ripples key={sceneId} borderRadius="16px">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => activateScene(sceneId)}
                className="glass-panel p-6 rounded-2xl text-center hover:bg-nexdom-gold/20 transition-all"
              >
                <div className="text-4xl mb-2">
                  {scene.attributes.icon || '🎬'}
                </div>
                <h3 className="font-bold">{scene.attributes.friendly_name}</h3>
              </motion.button>
            </Ripples>
          );
        })}
      </div>
    </div>
  );
}
```

---

### ⚙️ AUTOMATIONS: Lista con slide ON/OFF

**Archivo**: `PWA/src/pages/Routines.tsx`

```typescript
import { Switch } from '@hakit/components';

export function Routines() {
  const automations = useEntities({ domain: 'automation' });
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Automatizaciones</h1>
      
      <div className="space-y-3">
        {automations.map(autoId => {
          const automation = useEntity(autoId);
          const isOn = automation.state === 'on';
          
          return (
            <div key={autoId} className="glass-panel p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${isOn ? 'bg-nexdom-lime' : 'bg-gray-500'}`} />
                <div>
                  <h4 className="font-bold">{automation.attributes.friendly_name}</h4>
                  <p className="text-xs text-gray-400">
                    {automation.attributes.last_triggered 
                      ? `Última ejecución: ${formatDate(automation.attributes.last_triggered)}`
                      : 'Nunca ejecutada'
                    }
                  </p>
                </div>
              </div>
              
              {/* Switch toggle */}
              <Switch
                entity={autoId}
                onColor="#00FF88"
                offColor="#374151"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### 🔋 BATTERY: Colores + Alertas

**Archivo**: `PWA/src/pages/Battery.tsx`

```typescript
export function Battery() {
  const batteryEntities = useEntities()
    .filter(id => {
      const entity = useEntity(id);
      return entity.attributes?.device_class === 'battery' || id.includes('battery');
    });
  
  const getBatteryColor = (level: number) => {
    if (level >= 70) return '#51cf66'; // Verde
    if (level >= 30) return '#ffd43b'; // Amarillo
    return '#ff6b6b'; // Rojo
  };
  
  // Ordenar por nivel (más bajo primero)
  const sorted = batteryEntities.sort((a, b) => {
    const aLevel = parseFloat(useEntity(a).state) || 100;
    const bLevel = parseFloat(useEntity(b).state) || 100;
    return aLevel - bLevel;
  });
  
  // Alertas de batería baja
  const lowBatteries = sorted.filter(id => parseFloat(useEntity(id).state) < 20);
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Baterías</h1>
      
      {/* Alertas de batería baja */}
      {lowBatteries.length > 0 && (
        <Alert
          type="warning"
          title="⚠️ Baterías Bajas"
          message={`${lowBatteries.length} dispositivo(s) con batería baja`}
          className="mb-6"
        />
      )}
      
      <div className="grid grid-cols-3 gap-4">
        {sorted.map(entityId => {
          const entity = useEntity(entityId);
          const level = parseFloat(entity.state) || 0;
          const color = getBatteryColor(level);
          
          return (
            <div
              key={entityId}
              className="glass-panel p-4 rounded-xl border-2"
              style={{ borderColor: `${color}40` }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm">{entity.attributes.friendly_name}</h4>
                <div
                  className="text-2xl font-bold"
                  style={{ color }}
                >
                  {level}%
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${level}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### 🔐 TOKEN RENEWAL (Auth Fix)

**Problema**: Token expira y saca al usuario

**Archivo**: `PWA/src/auth/oauth.ts` o donde se maneje auth

```typescript
import { useHass } from '@hakit/core';

// Auto-refresh token antes de que expire
export function useTokenRefresh() {
  const { auth } = useHass();
  
  useEffect(() => {
    if (!auth?.access_token || !auth?.expires) return;
    
    // Refresh 5 minutos antes de expirar
    const expiresIn = auth.expires - Date.now() - (5 * 60 * 1000);
    
    const timeout = setTimeout(async () => {
      try {
        const newToken = await refreshToken(auth.refresh_token);
        // @hakit maneja esto automáticamente, pero verificar
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Redirect to login
        window.location.href = '/login';
      }
    }, expiresIn);
    
    return () => clearTimeout(timeout);
  }, [auth]);
}

// Usar en App.tsx
function App() {
  useTokenRefresh(); // Auto-refresh
  
  return (/* ... */);
}
```

**Alternativa**: @hakit/core probablemente ya maneja esto. Verificar documentación.

---

## ✅ ACCEPTANCE CRITERIA

- [ ] Tarjetas con border más brillante
- [ ] Iconos visibles y con colores dinámicos
- [ ] Botones ON/OFF con estilos correctos
- [ ] Switches: gris OFF, verde ON
- [ ] ColorPicker de @hakit en luces
- [ ] Mini gráficas en Energy (SensorCard)
- [ ] ClimateCard, CoverCard, VacuumCard implementados
- [ ] Ripples effect en todos los botones
- [ ] Alert component de @hakit en Dashboard
- [ ] Cámaras mostrando imagen/stream en Security
- [ ] Escenas clicables con efecto
- [ ] Automatizaciones con switch toggle
- [ ] Baterías con colores (verde/amarillo/rojo)
- [ ] Alertas de batería baja
- [ ] Token auto-refresh funcionando
- [ ] Build pasa (npm run build ✅)

---

## 📦 DELIVERABLES

- Todos los fixes implementados
- Screenshots ANTES/DESPUÉS de cada sección
- Video demo de Ripples effects
- Confirmación de token renewal (no logout después de X horas)

---

**ESTE ES EL ÚLTIMO PULIDO ANTES DE PRODUCCIÓN.** 🎨✨
