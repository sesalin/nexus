# 🐛 DEBUG: Por qué no se muestran todos los devices

**Priority**: 🔴 CRITICAL  
**Duration**: 1 hora

---

## ❌ PROBLEMA

Fix anterior NO funcionó. Sigue mostrando pocos devices por zona.

---

## 🔍 DEBUGGING STEP-BY-STEP

### PASO 1: Verificar cuántas entities HAY

**Archivo**: `PWA/src/pages/Zones.tsx`

Agregar console.logs al inicio:

```typescript
import { useEntities, useAreas, useHass } from '@hakit/core';

export function Zones() {
  const areas = useAreas();
  const allEntities = useEntities(); // TODAS las entities
  const { entityRegistry } = useHass();
  
  // 🐛 DEBUG: Contar entities totales
  console.log('═══════════════════════════════════');
  console.log('🔍 DEBUG ZONES PAGE');
  console.log('═══════════════════════════════════');
  console.log('📊 Total entities in HA:', allEntities.length);
  console.log('📍 Total areas:', areas.length);
  console.log('🗂️ Entity registry entries:', entityRegistry.length);
  
  // 🐛 DEBUG: Entities por área
  areas.forEach(area => {
    const entitiesInArea = allEntities.filter(entityId => {
      const entity = useEntity(entityId);
      return entity.attributes?.area_id === area.area_id;
    });
    console.log(`📍 Area "${area.name}":`, entitiesInArea.length, 'entities');
  });
  
  // Rest of component...
}
```

### PASO 2: Verificar device grouping

**Archivo**: `PWA/src/utils/entityFilter.ts` o donde esté `groupByDevice()`

```typescript
export function groupByDevice(entityIds: string[]) {
  // 🐛 DEBUG: Input
  console.log('🔧 groupByDevice() called with', entityIds.length, 'entities');
  
  const { entityRegistry } = useHass();
  
  // Build device map
  const entityToDevice = new Map();
  entityRegistry.forEach(entry => {
    if (entry.entity_id && entry.device_id) {
      entityToDevice.set(entry.entity_id, entry.device_id);
    }
  });
  
  // 🐛 DEBUG: Cuántas entities tienen device_id
  const withDevice = entityIds.filter(id => entityToDevice.has(id));
  console.log('📱 Entities with device_id:', withDevice.length);
  console.log('🔌 Entities WITHOUT device_id:', entityIds.length - withDevice.length);
  
  // Group by device
  const deviceGroups = new Map();
  entityIds.forEach(entityId => {
    const deviceId = entityToDevice.get(entityId);
    if (deviceId) {
      if (!deviceGroups.has(deviceId)) {
        deviceGroups.set(deviceId, []);
      }
      deviceGroups.get(deviceId).push(entityId);
    } else {
      // Sin device → tratarlo como device individual
      deviceGroups.set(`no_device_${entityId}`, [entityId]);
    }
  });
  
  // 🐛 DEBUG: Cuántos devices únicos
  console.log('🎯 Unique devices found:', deviceGroups.size);
  
  // 🐛 DEBUG: Listar devices
  deviceGroups.forEach((entities, deviceId) => {
    console.log(`  📱 Device ${deviceId}:`, entities.length, 'entities');
  });
  
  // Identificar primary/secondary para cada device
  const result = Array.from(deviceGroups.entries()).map(([deviceId, entityIds]) => {
    const primary = getPrimaryEntity(entityIds);
    const secondary = entityIds.filter(id => id !== primary);
    
    return {
      deviceId,
      primary,
      secondary,
    };
  });
  
  // 🐛 DEBUG: Output
  console.log('✅ Returning', result.length, 'devices');
  console.log('═══════════════════════════════════');
  
  return result;
}
```

### PASO 3: Verificar filtrado

**Archivo**: Donde se apliquen filtros (probablemente `useFilteredEntities.ts`)

```typescript
export function useFilteredEntities(areaId?: string) {
  const allEntities = useEntities();
  const filterConfig = useFilterConfig();
  
  // 🐛 DEBUG
  console.log('🔍 useFilteredEntities called for area:', areaId);
  console.log('📊 Total entities before filter:', allEntities.length);
  
  // Apply filters
  let filtered = applyFilters(allEntities, filterConfig);
  
  console.log('📊 After filter config:', filtered.length);
  
  // Filter by area if specified
  if (areaId) {
    filtered = filtered.filter(entityId => {
      const entity = useEntity(entityId);
      return entity.attributes?.area_id === areaId;
    });
    console.log(`📊 After area filter (${areaId}):`, filtered.length);
  }
  
  // Group by device
  const devices = groupByDevice(filtered);
  
  console.log('📊 Final devices:', devices.length);
  
  return devices;
}
```

### PASO 4: Verificar render

**Archivo**: Componente que renderiza las cards

```typescript
function ZonesPanel({ areaId }: { areaId: string }) {
  const devices = useFilteredEntities(areaId);
  
  // 🐛 DEBUG: Verificar antes de render
  console.log(`🎨 RENDERING ${devices.length} cards for area ${areaId}`);
  devices.forEach((device, idx) => {
    console.log(`  Card ${idx + 1}: ${device.primary} (+ ${device.secondary.length} secondary)`);
  });
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {devices.map((device, idx) => {
        console.log(`🎴 Rendering card ${idx + 1}:`, device.primary);
        return (
          <GadgetCard
            key={device.deviceId}
            entityId={device.primary}
            secondaryEntityIds={device.secondary}
          />
        );
      })}
    </div>
  );
}
```

---

## 📊 ESPERADO EN CONSOLE

Para zona "Sala" con 10 dispositivos reales:

```
═══════════════════════════════════
🔍 DEBUG ZONES PAGE
═══════════════════════════════════
📊 Total entities in HA: 302
📍 Total areas: 8
🗂️ Entity registry entries: 302
📍 Area "Studio": 45 entities
📍 Area "Main": 38 entities
📍 Area "Patio": 12 entities
📍 Area "Sala": 52 entities  ← IMPORTANTE
...
═══════════════════════════════════
🔍 useFilteredEntities called for area: sala
📊 Total entities before filter: 302
📊 After filter config: 180  ← Filtró sensores auxiliares
📊 After area filter (sala): 52
🔧 groupByDevice() called with 52 entities
📱 Entities with device_id: 48
🔌 Entities WITHOUT device_id: 4
🎯 Unique devices found: 12  ← 12 devices físicos
  📱 Device abc123: 5 entities
  📱 Device def456: 3 entities
  📱 Device ghi789: 2 entities
  ...
✅ Returning 12 devices
═══════════════════════════════════
📊 Final devices: 12
🎨 RENDERING 12 cards for area sala
  Card 1: light.luz_sala (+ 1 secondary)
  Card 2: switch.tv_sala (+ 0 secondary)
  Card 3: binary_sensor.motion_sala (+ 2 secondary)
  ...
  Card 12: climate.ac_sala (+ 3 secondary)
🎴 Rendering card 1: light.luz_sala
🎴 Rendering card 2: switch.tv_sala
...
🎴 Rendering card 12: climate.ac_sala
```

---

## 🎯 OBJETIVO

Identificar **EXACTAMENTE** dónde se pierden los dispositivos:

1. ¿Se obtienen todas las entities? (302 total)
2. ¿El filtro está muy agresivo? (de 302 → 50)
3. ¿El grouping funciona? (de 50 entities → 10 devices)
4. ¿Se renderizan todas las cards? (10 devices → 10 cards visibles)

---

## ✅ DELIVERABLES

1. **Console logs completos** de una zona con múltiples devices
2. **Screenshot** de console logs
3. **Identificación exacta** del problema:
   - "Se pierden en el filtro" → Ajustar `dashboard_filter.yaml`
   - "Se pierden en grouping" → Fix `groupByDevice()`
   - "Se pierden en render" → Fix componente
4. **Fix aplicado** y verificado

---

## 🚨 CRITICAL

SIN debugging real, NO podremos arreglar esto. Necesitamos VER los números reales.

**Agregar console.logs AHORA y compartir el output completo** 📊
