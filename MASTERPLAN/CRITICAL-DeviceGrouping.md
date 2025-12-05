# 🚨 CRITICAL: Device Grouping & Filter Policies

**PARA**: Agentes AI-2 y AI-3  
**PRIORIDAD**: 🔴 MÁXIMA  
**LEER ANTES DE**: TASK-2 y TASK-3

---

## ⚠️ CONCEPTO FUNDAMENTAL

**Los dashboards son DINÁMICOS**: Cada cliente tiene diferentes dispositivos.

**NO** puedes hardcodear entity_ids. **DEBES** mostrar lo que el cliente TIENE.

---

## 🎯 Device Grouping (Primary + Secondary Entities)

### Problema

Un **device físico** (ej: sensor de movimiento Zigbee) puede tener **múltiples entities** en Home Assistant:

```
Device: "Sensor Movimiento Salón"
├── binary_sensor.motion_salon       (PRIMARY - detección de movimiento)
├── sensor.motion_salon_battery      (SECONDARY - nivel batería)
├── sensor.motion_salon_linkquality  (SECONDARY - calidad Zigbee)
└── sensor.motion_salon_last_seen    (SECONDARY - última vez visto)
```

### Solución

**En la tarjeta (GadgetCard)**: Mostrar SOLO la entity PRIMARY  
**En el modal (DeviceDetailsModal)**: Mostrar PRIMARY + TODAS las SECONDARY

---

## 📋 Lógica de Device Grouping

### 1. Obtener device_id de cada entity

```typescript
import { useHass } from '@hakit/core';

const { entityRegistry } = useHass();

// Mapa: entity_id → device_id
const entityToDevice = new Map();
entityRegistry.forEach(entry => {
  if (entry.entity_id && entry.device_id) {
    entityToDevice.set(entry.entity_id, entry.device_id);
  }
});
```

### 2. Agrupar entities por device_id

```typescript
const deviceGroups = new Map();

entities.forEach(entityId => {
  const deviceId = entityToDevice.get(entityId);
  if (deviceId) {
    if (!deviceGroups.has(deviceId)) {
      deviceGroups.set(deviceId, []);
    }
    deviceGroups.get(deviceId).push(entityId);
  }
});
```

### 3. Identificar PRIMARY entity

**Criterios** (en orden de prioridad):

1. **NO** es entity auxiliar (battery, signal, linkquality, rssi, update, last_seen, device_temperature)
2. **Domain prioritario**: light, switch, lock, cover, climate, fan, media_player
3. Si empate: Primera non-auxiliary entity

```typescript
const auxiliaryPatterns = [
  '*_battery*',
  '*_signal*',
  '*_linkquality*',
  '*_rssi*',
  '*_update*',
  '*_last_seen*',
  '*_device_temperature*',
];

const isAuxiliary = (entityId: string) => {
  return auxiliaryPatterns.some(pattern => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
    return regex.test(entityId);
  });
};

const primaryDomains = ['light', 'switch', 'lock', 'cover', 'climate', 'fan', 'media_player'];

const getPrimaryEntity = (entityIds: string[]) => {
  // Filter out auxiliary
  const nonAux = entityIds.filter(id => !isAuxiliary(id));
  
  // Find by priority domain
  for (const domain of primaryDomains) {
    const found = nonAux.find(id => id.startsWith(domain + '.'));
    if (found) return found;
  }
  
  // Fallback: first non-auxiliary
  return nonAux[0] || entityIds[0];
};
```

### 4. Resultado

```typescript
// Para cada device:
{
  deviceId: "abc123",
  primary: "binary_sensor.motion_salon",
  secondary: [
    "sensor.motion_salon_battery",
    "sensor.motion_salon_linkquality",
    "sensor.motion_salon_last_seen"
  ]
}
```

---

## 🔧 Filter Policies (dashboard_filter.yaml)

### Ubicación

`/home/cheko/nexdom/addon/nexdom_dashboard/dashboard_filter.yaml`

**MIGRAR A**: `PWA/public/dashboard_filter.yaml`

### Políticas Principales

#### 1. Allowed Domains
```yaml
allowed_domains:
  - light
  - switch
  - lock
  - cover
  - climate
  - camera
  - media_player
  - fan
  - sensor
  - binary_sensor
  - automation
  - scene
  - alarm_control_panel
```

#### 2. Hide Patterns
```yaml
hide_patterns:
  - "*_signal_strength"
  - "*_linkquality"
  - "*_rssi"
  - "*_update_available"
  - "*_last_seen"
  - "update.*"
  - "*_device_temperature"
  - "*_cpu_*"
  - "*_memory_*"
  - "*_disk_*"
```

#### 3. Filter Options
```yaml
filter_options:
  show_main_entities_only: true
  require_area: true
  hide_disabled: true
  hide_hidden: true
  hide_unavailable: true
```

#### 4. Attribute Filters
```yaml
attribute_filters:
  hide_device_classes:
    - "timestamp"
    - "update"
```

---

## 💻 Implementación con @hakit/core

### Paso 1: Load Filter Config

```typescript
// PWA/src/utils/filterConfig.ts
export async function loadFilterConfig() {
  try {
    const response = await fetch('/dashboard_filter.yaml');
    const yaml = await response.text();
    // Parse YAML (necesitarás librería js-yaml)
    return parseYaml(yaml);
  } catch (error) {
    console.error('Error loading filter config:', error);
    // Return default config
    return {
      allowed_domains: ['light', 'switch', 'lock', 'cover', 'climate', 'camera'],
      hide_patterns: ['*_battery', '*_signal*', '*_linkquality', 'update.*'],
      filter_options: {
        show_main_entities_only: true,
        require_area: true,
        hide_unavailable: true,
      }
    };
  }
}
```

### Paso 2: Apply Filters

```typescript
// PWA/src/utils/entityFilters.ts
export function applyFilters(entities: EntityName[], config: any) {
  let filtered = [...entities];
  
  // 1. Allowed domains
  if (config.allowed_domains) {
    filtered = filtered.filter(id => {
      const domain = id.split('.')[0];
      return config.allowed_domains.includes(domain);
    });
  }
  
  // 2. Hide patterns
  if (config.hide_patterns) {
    filtered = filtered.filter(id => {
      return !config.hide_patterns.some((pattern: string) => {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
        return regex.test(id);
      });
    });
  }
  
  // 3. Hide unavailable
  if (config.filter_options?.hide_unavailable) {
    filtered = filtered.filter(id => {
      const entity = useEntity(id);
      return entity.state !== 'unavailable' && entity.state !== 'unknown';
    });
  }
  
  // 4. Require area
  if (config.filter_options?.require_area) {
    filtered = filtered.filter(id => {
      const entity = useEntity(id);
      return entity.attributes?.area_id;
    });
  }
  
  return filtered;
}
```

### Paso 3: Group by Device

```typescript
// PWA/src/utils/deviceGrouping.ts
export function groupByDevice(entityIds: EntityName[]) {
  const { entityRegistry, deviceRegistry } = useHass();
  
  // Build maps
  const entityToDevice = new Map();
  entityRegistry.forEach(entry => {
    if (entry.entity_id && entry.device_id) {
      entityToDevice.set(entry.entity_id, entry.device_id);
    }
  });
  
  // Group
  const groups = new Map();
  entityIds.forEach(entityId => {
    const deviceId = entityToDevice.get(entityId);
    if (deviceId) {
      if (!groups.has(deviceId)) {
        groups.set(deviceId, []);
      }
      groups.get(deviceId).push(entityId);
    } else {
      // Entity sin device
      groups.set(`no_device_${entityId}`, [entityId]);
    }
  });
  
  // Identify primary + secondary
  const result = [];
  groups.forEach((entityIds, deviceId) => {
    const primary = getPrimaryEntity(entityIds);
    const secondary = entityIds.filter(id => id !== primary);
    
    result.push({
      deviceId,
      primary,
      secondary,
    });
  });
  
  return result;
}
```

---

## 🎨 Uso en Componentes

### En GadgetCard (mostrar solo PRIMARY)

```typescript
import { groupByDevice, applyFilters } from '@/utils';

function ZonePage() {
  const entities = useEntities({ area: 'living_room' });
  const filtered = applyFilters(entities, filterConfig);
  const devices = groupByDevice(filtered);
  
  return (
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
  );
}
```

### En DeviceDetailsModal (mostrar PRIMARY + SECONDARY)

```typescript
function DeviceDetailsModal({ device, isOpen, onClose }) {
  const primaryEntity = useEntity(device.primary);
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>{primaryEntity.attributes.friendly_name}</h2>
      
      {/* Primary controls */}
      <PrimaryControls entity={primaryEntity} />
      
      {/* Secondary entities */}
      {device.secondary.length > 0 && (
        <section className="mt-4">
          <h3>Información Adicional</h3>
          {device.secondary.map(secId => {
            const secEntity = useEntity(secId);
            return (
              <div key={secId} className="flex justify-between">
                <span>{secEntity.attributes.friendly_name}</span>
                <span>{secEntity.state} {secEntity.attributes.unit_of_measurement}</span>
              </div>
            );
          })}
        </section>
      )}
    </Modal>
  );
}
```

---

## ✅ Acceptance Criteria

Para que TASK-2 y TASK-3 estén completos, DEBEN:

1. ✅ **Cargar dashboard_filter.yaml** al inicio
2. ✅ **Aplicar filtros** a todas las entities antes de mostrar
3. ✅ **Agrupar por device_id** (primary + secondary)
4. ✅ **Mostrar SOLO primary** en las tarjetas
5. ✅ **Mostrar primary + secondary** en modales
6. ✅ **Funcionar con CUALQUIER cliente** (dinámico, no hardcoded)

---

## 🚨 ERRORES COMUNES A EVITAR

❌ **NO** hardcodear entity_ids:
```typescript
const lights = ['light.sala', 'light.cocina']; // MAL!
```

✅ **SÍ** usar filtros dinámicos:
```typescript
const lights = useEntities({ domain: 'light' }); // BIEN!
```

❌ **NO** mostrar battery/signal en tarjetas:
```typescript
<GadgetCard entityId="sensor.motion_salon_battery" /> // MAL!
```

✅ **SÍ** mostrar solo primary:
```typescript
<GadgetCard entityId={device.primary} /> // BIEN!
```

---

**Leer este documento ANTES de empezar TASK-2 o TASK-3.**

**¿Dudas?** Preguntar antes de avanzar.
