# Antigravity Fix Instructions — Nexdom Dashboard

Este documento está pensado como **prompt estructurado** para Antigravity (o el agente de refactor que uses).
El objetivo es que aplique una serie de cambios concretos al proyecto **nexdom-dashboard** para llevarlo a un estado “production ready”.

Por favor, sigue las tareas en orden y respeta las secciones de archivos indicadas.

---

## Contexto del proyecto

- Proyecto: `nexdom-dashboard`
- Tipo: Frontend React (Vite) que se ejecuta como panel de un Add-on de Home Assistant vía ingress.
- Carpeta raíz del dashboard dentro del repo: `nexdom_dashboard` (ajustar ruta si es distinta).
- Archivos clave:
  - `package.json`
  - `vite.config.ts`
  - `src/main.tsx`
  - `src/App.tsx`
  - `src/components/dashboard/HomeAssistant.tsx`
  - `src/store/nexdomStore.ts` (para sincronización de entidades/zones)

Debes mantener el comportamiento funcional actual, mejorando estabilidad, performance y calidad del código.

---

## Tarea 1 — Estabilizar WebSocket y listeners en HomeAssistantClient

**Archivo:** `src/components/dashboard/HomeAssistant.tsx`

### Objetivo

Evitar desconexiones permanentes y fugas de memoria en el WebSocket, haciendo que la conexión sea robusta frente a reinicios de Home Assistant y cambios de red.

### Cambios requeridos

1. **Reconexión infinita con backoff exponencial**
   - Reemplazar `maxReconnectAttempts = 5` por lógica de reconexión ilimitada:
     - Usar backoff exponencial con un máximo (p. ej. 30–60 segundos).
     - Mantener un contador de intentos solo para logging/diagnóstico, pero no detener permanentemente las reconexiones.
     - Reiniciar el contador de reconexiones a 0 cuando la conexión haya estado estable durante cierto tiempo (por ejemplo, 60 segundos).

2. **Implementar `off(event, callback)` en `HomeAssistantClient`**
   - Añadir un método público:
     ```ts
     off(event: string, callback: Function) {
       const listeners = this.listeners.get(event);
       if (!listeners) return;
       this.listeners.set(event, listeners.filter(cb => cb !== callback));
     }
     ```
   - Asegúrate de que event listeners se gestionen por referencia para poder removerlos correctamente.

3. **Cleanup de listeners en `HomeAssistantProvider`**
   - En el `useEffect` donde se registran:
     ```ts
     haClient.on('connected', ...)
     haClient.on('states_loaded', ...)
     haClient.on('area_registry', ...)
     haClient.on('entity_registry', ...)
     haClient.on('device_registry', ...)
     haClient.on('state_changed', ...)
     ```
   - Guardar las referencias de las funciones callback en constantes.
   - En el retorno del `useEffect` (cleanup), llamar a `off` para cada evento:
     ```ts
     return () => {
       haClient.off('connected', onConnected);
       haClient.off('states_loaded', onStatesLoaded);
       haClient.off('area_registry', onAreaRegistry);
       haClient.off('entity_registry', onEntityRegistry);
       haClient.off('device_registry', onDeviceRegistry);
       haClient.off('state_changed', onStateChanged);
       haClient.disconnect();
     };
     ```

4. **Limpiar `pendingRequests` en desconexión**
   - En el handler de `onclose` del WebSocket:
     - Recorrer `pendingRequests`, rechazar las promesas con un error del tipo `"WebSocket closed"` y limpiar el mapa.
   - Esto evita que queden promesas colgadas.

### Criterios de aceptación

- El WebSocket reintenta reconectar indefinidamente mientras HA no esté disponible.
- No se observan callbacks duplicados al reconectar múltiples veces (validable con logs).
- No hay crecimiento indefinido del uso de memoria por listeners.

---

## Tarea 2 — Mejorar performance del zone builder

**Archivo:** `src/components/dashboard/HomeAssistant.tsx`

### Objetivo

Evitar recalcular todas las zonas (areas) de Home Assistant al cambiar el estado de una sola entidad, y reducir el costo de filtrado de entidades.

### Cambios requeridos

1. **Extraer funciones puras para el builder**
   - Crear funciones puras fuera del componente:
     - `groupEntitiesByDevice(entities, entityRegistry, deviceRegistry)` (ya existe, solo asegúrate de que sea pura).
     - `buildZonesFromEntities(filteredStates, areas, entityRegistry, deviceRegistry)` que devuelva la lista completa de zonas.
   - Mantener estas funciones sin efectos secundarios (sin leer ni modificar estado React directamente).

2. **Memoizar filtros de entidades**
   - Usar `useMemo` dentro del provider para obtener `filteredStates`:
     ```ts
     const filteredStates = useMemo(
       () => client?.applyEntityFilters(entities, filterConfig) ?? entities,
       [client, entities, filterConfig]
     );
     ```
   - Asegurarse de que `applyEntityFilters` no genere nuevo arreglo si `config` no ha cambiado (si es posible, optimizar internamente para early return).

3. **Separar builder inicial vs. actualizaciones incrementales**
   - Mantener el builder inicial completo:
     - Cuando se cargan `states` + `areaRegistry` + `entityRegistry` + `deviceRegistry`, se llama a `buildZonesFromEntities` una vez para crear todas las zonas.
   - En el handler de `state_changed`:
     - Actualizar la entidad correspondiente en el arreglo de `entities` (ya se está haciendo).
     - Opcional (para optimización adicional): ajustar solamente la zona relacionada, en lugar de reconstruir todas.  
       - Si esto complica demasiado, al menos asegurarse de que el builder completo no se ejecute en cada render, sino solo en cambios clave (por ejemplo `states_loaded` o cambios masivos).

4. **Evitar recalcular zonas en `useEffect` sin necesidad**
   - Revisar el `useEffect` que depende de `[entities, areaRegistry, entityRegistry, filterConfig, client, deviceRegistry]`.
   - Reducir las dependencias a las mínimas necesarias o usar `useMemo` dentro de ese efecto para no reconstruir cuando no haya cambios reales.

### Criterios de aceptación

- Con 300+ entidades, los cambios de estado individuales no generan lag visible en la UI.
- El builder completo de zonas se ejecuta solo en momentos apropiados (carga inicial, cambios de registries) y no en cada `state_changed`.

---

## Tarea 3 — Tipos TypeScript para estructuras de Home Assistant

**Archivos:**  
- `src/components/dashboard/HomeAssistant.tsx`  
- (Opcional) `src/types/homeassistant.ts` (nuevo archivo para tipados)

### Objetivo

Reemplazar `any[]` por tipos bien definidos para mejorar robustez y facilitar mantenimiento.

### Cambios requeridos

1. Crear un archivo de tipos, por ejemplo `src/types/homeassistant.ts`, con interfaces aproximadas:
   ```ts
   export interface HAState {
     entity_id: string;
     state: string;
     attributes: Record<string, any>;
     last_changed?: string;
     last_updated?: string;
   }

   export interface HAAreaRegistryEntry {
     area_id: string;
     name: string;
     aliases?: string[];
   }

   export interface HAEntityRegistryEntry {
     entity_id: string;
     device_id?: string | null;
     area_id?: string | null;
     disabled_by?: string | null;
     original_name?: string | null;
   }

   export interface HADeviceRegistryEntry {
     id: string;
     area_id?: string | null;
     name?: string | null;
     name_by_user?: string | null;
   }
   ```
   (Los campos pueden ampliarse conforme se necesite).

2. Importar estos tipos en `HomeAssistant.tsx` y usarlos en el estado:
   - `const [entities, setEntities] = useState<HAState[]>([]);`
   - `const [areaRegistry, setAreaRegistry] = useState<HAAreaRegistryEntry[]>([]);`
   - `const [entityRegistry, setEntityRegistry] = useState<HAEntityRegistryEntry[]>([]);`
   - `const [deviceRegistry, setDeviceRegistry] = useState<HADeviceRegistryEntry[]>([]);`

3. Actualizar las firmas de funciones (`groupEntitiesByDevice`, `createZonesFromEntities`, etc.) para usar estos tipos.

### Criterios de aceptación

- El proyecto compila sin errores de tipos.
- No se utilizan `any[]` para colecciones principales de HA.

---

## Tarea 4 — Error Boundary global y estados de error en UI

**Archivos:**  
- `src/main.tsx` o `src/App.tsx` (donde se decida montar el Error Boundary)
- Nuevo archivo: `src/components/common/ErrorBoundary.tsx` (sugerido)

### Objetivo

Evitar que errores inesperados dejen la pantalla en blanco, mostrando mensajes controlados y útiles.

### Cambios requeridos

1. Crear un componente `ErrorBoundary` estándar de React (class component) que:
   - Implemente `componentDidCatch` y `getDerivedStateFromError`.
   - Muestre un mensaje amigable al usuario y un botón para recargar la página.
2. Envolver `<HomeAssistantProvider><App /></HomeAssistantProvider>` dentro de este `ErrorBoundary` en `main.tsx`.

### Criterios de aceptación

- Si se lanza una excepción no controlada en algún componente hijo, se muestra la UI de ErrorBoundary en lugar de una pantalla vacía.

---

## Tarea 5 — Limpieza de dependencias y build

**Archivo:** `package.json`

### Objetivo

Reducir el tamaño del bundle y evitar comportamientos impredecibles por cambios de versiones automáticos.

### Cambios requeridos

1. Revisar dependencias en `dependencies` y `devDependencies` y:
   - Identificar paquetes que no se usan en el código actual del dashboard (por ejemplo, SDKs de AI, utilidades de ZIP/YAML que solo se usarían en backend).
   - Proponer su eliminación o moverlas a otra parte del monorepo si se usan fuera de este paquete.
2. Congelar versiones clave:
   - Reemplazar `"^x.y.z"` por `"x.y.z"` al menos en:
     - `react`, `react-dom`, `react-router-dom`
     - `vite`, `typescript`
     - librerías críticas de UI (framer-motion, three, etc.)

### Criterios de aceptación

- `npm install` / `pnpm install` produce builds reproducibles.
- El bundle final del dashboard no incluye librerías innecesarias.

---

## Tarea 6 — Integrar refactor propuesto

**Archivo de referencia:** `refactor_homeassistant.tsx` (adjunto en este paquete)

### Objetivo

Usar el archivo `refactor_homeassistant.tsx` como referencia para aplicar un refactor estructurado del `HomeAssistantClient` y del `HomeAssistantProvider`.

### Cambios requeridos

- Comparar el archivo actual `src/components/dashboard/HomeAssistant.tsx` con el archivo `refactor_homeassistant.tsx` proporcionado.
- Integrar las mejoras propuestas (estructura de clase, manejo de WS, tipado, separación de responsabilidades) **sin perder** las funcionalidades actuales específicas de NexDom (filtros, builder de zonas, favoritos, etc.).

### Criterios de aceptación

- El nuevo `HomeAssistant.tsx` mantiene todas las features actuales.
- El código es más legible, modular y fácil de testear.

---

## Notas finales

- Mantén la compatibilidad con el comportamiento actual del dashboard NexDom: rutas, navegación, componentes PWA, store interno.
- Evita introducir cambios funcionales que alteren la experiencia de usuario sin necesidad.
- Puedes agregar comentarios TODO donde creas que se pueden hacer mejoras adicionales, pero **prioriza primero** los puntos descritos arriba.

Al completar estas tareas, el proyecto `nexdom-dashboard` estará en una posición mucho más sólida para ser utilizado en producción en múltiples instalaciones de Home Assistant.
