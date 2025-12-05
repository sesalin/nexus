# 🔧 FIX: Device Grouping - Show ALL Devices per Zone

**Priority**: 🔴 CRITICAL  
**Duration**: 1-2 horas

---

## ❌ PROBLEMA ACTUAL

**Zona "Sala"** → Solo muestra **1 dispositivo**  
**Debe mostrar** → **TODOS los dispositivos** de esa zona

---

## ✅ COMPORTAMIENTO CORRECTO

### Ejemplo: Zona con 5 devices

```
Zona: Sala
├── Device 1: Sensor movimiento
│   ├── binary_sensor.motion_sala (PRIMARY) → CARD #1
│   ├── sensor.motion_sala_battery (SECONDARY) → Modal de CARD #1
│   └── sensor.motion_sala_linkquality (SECONDARY) → Modal de CARD #1
│
├── Device 2: Luz RGB
│   ├── light.luz_sala (PRIMARY) → CARD #2
│   └── sensor.luz_sala_power (SECONDARY) → Modal de CARD #2
│
├── Device 3: Switch TV
│   └── switch.tv_sala (PRIMARY) → CARD #3
│
├── Device 4: Termostato
│   ├── climate.ac_sala (PRIMARY) → CARD #4
│   ├── sensor.ac_sala_temperature (SECONDARY) → Modal de CARD #4
│   └── sensor.ac_sala_power (SECONDARY) → Modal de CARD #4
│
└── Device 5: Cámara
    ├── camera.sala (PRIMARY) → CARD #5
    └── sensor.camera_sala_motion (SECONDARY) → Modal de CARD #5

RESULTADO: 5 CARDS visibles en zona "Sala"
```

---

## 🔍 DÓNDE ESTÁ EL BUG

Revisar estos archivos:

### 1. `PWA/src/hooks/useFilteredEntities.ts`

Probablemente tiene algo como:

```typescript
// ❌ MAL - Solo retorna 1 device por area
const devicesByArea = groupedDevices.filter(device => 
  device.area === areaId
).slice(0, 1); // ← ESTE ES EL PROBLEMA
```

**Debe ser**:

```typescript
// ✅ BIEN - Retorna TODOS los devices del area
const devicesByArea = groupedDevices.filter(device => 
  device.area === areaId
); // Sin límite
```

### 2. `PWA/src/utils/entityFilter.ts`

Verificar que `groupByDevice()` retorne TODOS los devices, no solo uno por zona.

### 3. Componente `Zones.tsx`

```typescript
// ❌ MAL
const devices = useFilteredEntities(area.area_id).slice(0, 1);

// ✅ BIEN
const devices = useFilteredEntities(area.area_id); // Todos
```

---

## 📋 LÓGICA CORRECTA

### Paso 1: Get ALL entities del área

```typescript
const entitiesInArea = useEntities().filter(entityId => {
  const entity = useEntity(entityId);
  return entity.attributes?.area_id === areaId;
});
```

### Paso 2: Agrupar por device_id

```typescript
import { useHass } from '@hakit/core';

const { entityRegistry } = useHass();

// Map: entity_id → device_id
const entityToDevice = new Map();
entityRegistry.forEach(entry => {
  if (entry.entity_id && entry.device_id) {
    entityToDevice.set(entry.entity_id, entry.device_id);
  }
});

// Group: device_id → [entity_ids]
const deviceGroups = new Map();
entitiesInArea.forEach(entityId => {
  const deviceId = entityToDevice.get(entityId);
  if (deviceId) {
    if (!deviceGroups.has(deviceId)) {
      deviceGroups.set(deviceId, []);
    }
    deviceGroups.get(deviceId).push(entityId);
  } else {
    // Entity sin device → tratarlo como device individual
    deviceGroups.set(`no_device_${entityId}`, [entityId]);
  }
});
```

### Paso 3: Identificar primary/secondary por device

```typescript
const devices = Array.from(deviceGroups.entries()).map(([deviceId, entityIds]) => {
  // Filtrar auxiliares
  const nonAux = entityIds.filter(id => !isAuxiliary(id));
  
  // Priorizar por domain
  const primaryDomains = ['light', 'switch', 'lock', 'cover', 'climate', 'fan', 'media_player'];
  let primary = null;
  
  for (const domain of primaryDomains) {
    primary = nonAux.find(id => id.startsWith(domain + '.'));
    if (primary) break;
  }
  
  if (!primary) primary = nonAux[0] || entityIds[0];
  
  const secondary = entityIds.filter(id => id !== primary);
  
  return {
    deviceId,
    primary,
    secondary,
  };
});
```

### Paso 4: Renderizar TODAS las cards

```tsx
<div className="grid grid-cols-3 gap-4">
  {devices.map(device => (
    <GadgetCard
      key={device.deviceId}
      entityId={device.primary}
      secondaryEntityIds={device.secondary}
      onSettingsClick={() => openModal(device)}
    />
  ))}
</div>
```

---

## ✅ ACCEPTANCE CRITERIA

**Test**: Zona "Sala" con 5 dispositivos físicos

- [ ] Se muestran **5 cards** (no solo 1)
- [ ] Cada card muestra la entity PRIMARY del device
- [ ] Click en settings abre modal
- [ ] Modal muestra primary + todas las secondary del device
- [ ] Zona vacía muestra mensaje "Sin dispositivos"
- [ ] Zona con 20 devices muestra 20 cards

---

## 🧪 TESTING

```bash
npm run dev
```

**Verificar**:
1. Ir a página "Zonas"
2. Seleccionar zona con MÚLTIPLES dispositivos
3. Contar cuántas cards se muestran
4. Debe coincidir con número de devices reales

**Ejemplo**:
- Zona "Sala" tiene: Luz, Switch, Sensor, Cámara, Termostato = **5 devices**
- Debe mostrar: **5 cards**

---

## 📦 FILES TO FIX

Probablemente estos:
- `PWA/src/hooks/useFilteredEntities.ts` - Remover límite
- `PWA/src/utils/entityFilter.ts` - Verificar grouping
- `PWA/src/pages/Zones.tsx` - No limitar resultados
- `PWA/src/components/dashboard/zones/ZonesPanel.tsx` - Mostrar todos

---

**CRITICAL**: Un dashboard que solo muestra 1 device por zona es INUSABLE. Esto debe arreglarse YA. 🚨
