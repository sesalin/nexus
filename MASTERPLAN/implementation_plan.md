# Plan de Implementación: Migración a @hakit/core

## User Review Required

> [!WARNING]
> **Decisión Crítica de Arquitectura**
> 
> Este plan propone **eliminar** 1,936 líneas de código custom y migrar a @hakit/core. Esto implica:
> - Eliminar completamente el backend Node.js proxy
> - Reemplazar HomeAssistant.tsx (970 líneas) con hooks de @hakit/core
> - Mantener solo UI/UX components únicos
> 
> **Impacto**: Cambio arquitectónico fundamental. No es reversible sin esfuerzo significativo.

> [!IMPORTANT]
> **Dependencia Externa**
> 
> Estaremos dependiendo de `@hakit/core` (v6.0.0) mantenido por la comunidad.
> - **Riesgo**: Breaking changes en futuras versiones
> - **Mitigación**: Lock version, monitoring de releases
> - **Backup**: Código actual en branch `legacy-custom-integration`

---

## Estrategia de Migración

### Enfoque: Incremental & Paralelo

**NO** vamos a reescribir todo desde cero. En su lugar:

1. ✅ **Fase 1**: Setup @hakit/core en paralelo (sin romper nada)
2. ✅ **Fase 2**: Migrar página por página
3. ✅ **Fase 3**: Eliminar código legacy cuando TODO funcione
4. ✅ **Fase 4**: Optimización y polish

**Ventaja**: En cualquier momento podemos rollback a la versión anterior.

---

## Proposed Changes

### Componente 1: Core Infrastructure

#### [DELETE] [backend/src/server.js](file:///home/cheko/nexdom/addon/nexdom_dashboard/backend/src/server.js)

**Razón**: @hakit/core maneja WebSocket directamente desde el navegador, no necesitamos proxy.

**Contenido a eliminar**:
- 567 líneas de Express REST API
- WebSocket proxy bidireccional
- ID translation layer
- Rate limiting
- Todo el directorio `backend/`

**Impacto**: Container Docker será ~100MB más pequeño, deployment más simple.

---

#### [DELETE] [src/components/dashboard/HomeAssistant.tsx](file:///home/cheko/nexdom/addon/nexdom_dashboard/src/components/dashboard/HomeAssistant.tsx)

**Razón**: @hakit/core provee toda esta funcionalidad via hooks.

**Contenido a eliminar**:
- 970 líneas de custom WebSocket client
- Entity filtering manual
- Zone creation logic
- Device grouping
- Favorites (migrar a Zustand store)
- Mock data (usar @hakit/core mock mode)

**Mantener** (extraer a archivos separados):
- `toggleFavorite` logic → `src/store/favoritesStore.ts`
- Mock entities → Solo para desarrollo sin HA

---

#### [MODIFY] [src/App.tsx](file:///home/cheko/nexdom/addon/nexdom_dashboard/src/App.tsx)

**Cambios**:

```diff
- import { useHomeAssistant } from './components/dashboard/HomeAssistant';
+ import { HassConnect } from '@hakit/core';

  function App() {
-   const { entities, zones, isConnected } = useHomeAssistant();
-   const { setDevices, setRooms, setConnected } = useNexdomStore();

    return (
+     <HassConnect hassUrl={getHAUrl()}>
        <PWAProvider>
          <Router>
            {/* ... existing routes ... */}
          </Router>
        </PWAProvider>
+     </HassConnect>
    );
  }
```

**Simplificación**: -80 líneas de mapeo manual de entidades.

---

### Componente 2: Page Migrations

#### [MODIFY] [src/pages/Dashboard.tsx](file:///home/cheko/nexdom/addon/nexdom_dashboard/src/pages/Dashboard.tsx)

**Antes**:
```typescript
const { entities, zones } = useHomeAssistant();
const devices = entities.map(e => /* manual mapping */);
```

**Después**:
```typescript
import { useAreas, useEntities } from '@hakit/core';

function Dashboard() {
  const areas = useAreas();
  const livingRoom = useArea('living_room');
  const devices = useEntities({ area: 'living_room' });
  
  // Mantener nuestra UI custom
  return <NuestroGlassmorphicLayout areas={areas} />;
}
```

**Beneficio**: Eliminamos zona creation logic, usamos hooks optimizados.

---

#### [MODIFY] [src/pages/Zones.tsx](file:///home/cheko/nexdom/addon/nexdom_dashboard/src/pages/Zones.tsx)

**Antes**:
```typescript
const { zones, toggleEntity } = useHomeAssistant();
```

**Después**:
```typescript
import { useAreas, useEntity } from '@hakit/core';

function Zones() {
  const areas = useAreas();
  
  return areas.map(area => (
    <ZoneCard
      key={area.area_id}
      area={area}
      entities={useEntities({ area: area.area_id })}
    />
  ));
}
```

**Simplificación**: -100 líneas de manual entity grouping.

---

#### [MODIFY] [src/pages/Gadgets.tsx](file:///home/cheko/nexdom/addon/nexdom_dashboard/src/pages/Gadgets.tsx)

**Antes**:
```typescript
const { entities } = useHomeAssistant();
const devices = entities.filter(/* manual filtering */);
```

**Después**:
```typescript
import { useEntities } from '@hakit/core';

function Gadgets() {
  const lights = useEntities({ domain: 'light' });
  const switches = useEntities({ domain: 'switch' });
  const climates = useEntities({ domain: 'climate' });
  
  // Mantener nuestro GadgetGrid custom
  return (
    <>
      <GadgetGrid title="Luces" devices={lights} />
      <GadgetGrid title="Interruptores" devices={switches} />
      <GadgetGrid title="Clima" devices={climates} />
    </>
  );
}
```

**Beneficio**: Filtering automático, type-safe entities.

---

### Componente 3: UI Components (PRESERVAR)

#### [KEEP] Nuestros componentes diferenciadores

Estos **NO** se modifican, solo cambian cómo reciben datos:

- [src/components/dashboard/ModuleNav.tsx](file:///home/cheko/nexdom/addon/nexdom_dashboard/src/components/dashboard/ModuleNav.tsx) ✅
- [src/components/dashboard/Header.tsx](file:///home/cheko/nexdom/addon/nexdom_dashboard/src/components/dashboard/Header.tsx) ✅
- [src/components/dashboard/templates/GadgetCard.tsx](file:///home/cheko/nexdom/addon/nexdom_dashboard/src/components/dashboard/templates/GadgetCard.tsx) ✅
- [src/components/dashboard/templates/GadgetGrid.tsx](file:///home/cheko/nexdom/addon/nexdom_dashboard/src/components/dashboard/templates/GadgetGrid.tsx) ✅
- [src/pwa/*](file:///home/cheko/nexdom/addon/nexdom_dashboard/src/pwa) ✅ Todo PWA se mantiene

**Solo cambio**: Props de `entity` shape (pero @hakit/core usa el mismo schema que HA).

---

#### [NEW] [src/components/EntityCard.tsx](file:///home/cheko/nexdom/addon/nexdom_dashboard/src/components/EntityCard.tsx)

Wrapper para usar @hakit/components solo cuando sea más rápido:

```typescript
import { ButtonCard, ClimateCard, CameraCard } from '@hakit/components';

export function EntityCard({ entity }: { entity: EntityName }) {
  const domain = entity.split('.')[0];
  
  // Para dominios complejos, usar @hakit/components
  if (domain === 'climate') return <ClimateCard entity={entity} />;
  if (domain === 'camera') return <CameraCard entity={entity} />;
  
  // Para el resto, nuestra UI custom
  return <NuestroGadgetCard entity={entity} />;
}
```

**Estrategia**: Best of both worlds.

---

### Componente 4: State Management

#### [NEW] [src/store/favoritesStore.ts](file:///home/cheko/nexdom/addon/nexdom_dashboard/src/store/favoritesStore.ts)

Migrar favorites logic fuera de HomeAssistant.tsx:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesStore {
  favorites: string[];
  toggleFavorite: (entityId: string) => void;
  isFavorite: (entityId: string) => boolean;
}

export const useFavorites = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (entityId) => {
        set((state) => ({
          favorites: state.favorites.includes(entityId)
            ? state.favorites.filter(id => id !== entityId)
            : [...state.favorites, entityId]
        }));
      },
      isFavorite: (entityId) => get().favorites.includes(entityId),
    }),
    { name: 'nexdom-favorites' }
  )
);
```

**Beneficio**: Separación de concerns, testeable.

---

#### [MODIFY] [src/store/nexdomStore.ts](file:///home/cheko/nexdom/addon/nexdom_dashboard/src/store/nexdomStore.ts)

Simplificar, ya no necesitamos mapear HA entities a nuestro formato:

```diff
  interface NexdomStore {
-   devices: Device[];
-   rooms: Room[];
-   setDevices: (devices: Device[]) => void;
-   setRooms: (rooms: Room[]) => void;
+   // Solo UI state ahora
    activeModule: string;
    setActiveModule: (module: string) => void;
+   // ... otros UI states
  }
```

**Simplificación**: -50% del código del store.

---

### Componente 5: Configuration

#### [MODIFY] [package.json](file:///home/cheko/nexdom/addon/nexdom_dashboard/package.json)

```diff
  "dependencies": {
-   "@ai-sdk/openai": "^1.3.22",
-   "adm-zip": "^0.5.16",
-   "ai": "^4.3.16",
-   "cannon-es": "^0.20.0",
+   "@hakit/core": "^6.0.0",
+   "@hakit/components": "^6.0.0",
    "framer-motion": "^11.0.8",
    // ... resto igual
  }
```

**Remover dependencias** del backend:
- express, cors, helmet, morgan, ws, axios, rate-limiter-flexible

**Resultado**: ~30MB menos en `node_modules`.

---

#### [MODIFY] [Dockerfile](file:///home/cheko/nexdom/addon/nexdom_dashboard/Dockerfile)

Simplificar, ya no necesitamos Node.js backend:

```diff
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build

  FROM nginx:alpine
  COPY --from=builder /app/dist /usr/share/nginx/html
- COPY --from=builder /app/backend /app/backend
- RUN apk add --no-cache nodejs npm
  COPY nginx.conf /etc/nginx/nginx.conf
  EXPOSE 8123
- EXPOSE 3000
  CMD ["nginx", "-g", "daemon off;"]
```

**Beneficio**: Imagen Docker ~200MB más pequeña, solo sirve estáticos.

---

#### [MODIFY] [run.sh](file:///home/cheko/nexdom/addon/nexdom_dashboard/run.sh)

```diff
  #!/bin/bash
- # Start backend
- cd /app/backend
- npm start &
- BACKEND_PID=$!
  
  # Start nginx
  nginx -g "daemon off;"
- 
- # Cleanup
- kill $BACKEND_PID
```

**Simplificación**: Solo nginx, no multi-process management.

---

## Verification Plan

### Automated Tests

#### Test 1: Build Verification
```bash
# Command
cd /home/cheko/nexdom/addon/PWA
npm run build

# Expected Result
✓ No TypeScript errors
✓ Build completes successfully
✓ dist/ folder contains index.html and assets
```

#### Test 2: Dev Server Smoke Test
```bash
# Command  
npm run dev

# Expected Result
✓ Server starts on http://localhost:5173
✓ No console errors in browser
✓ @hakit/core connects to HA (check Network tab for WebSocket)
```

#### Test 3: Package Size Check
```bash
# Command
du -sh node_modules/
ls -lh dist/

# Expected Result (comparado con actual)
Before: node_modules/ ~400MB, dist/ ~2MB
After: node_modules/ ~350MB, dist/ ~1.5MB
```

---

### Manual Verification

#### ✅ Manual Test 1: HA Connection
**Prerequisite**: Home Assistant instance running

**Steps**:
1. Open app in browser
2. Check browser console for `[HassConnect] Connected`
3. Open DevTools → Network → WS tab
4. Verify WebSocket connection to HA is established
5. Toggle a light entity
6. Verify service call succeeds and state updates in real-time

**Expected Result**: 
- ✅ WebSocket connects directly to HA (no backend proxy)
- ✅ Entity states load
- ✅ Service calls work
- ✅ Real-time updates visible

---

#### ✅ Manual Test 2: Areas & Zones
**Steps**:
1. Navigate to `/zones` page
2. Verify all HA areas are displayed
3. Click on an area card
4. Verify entities in that area are shown
5. Toggle multiple entities in different areas
6. Verify UI updates correctly

**Expected Result**:
- ✅ Areas match HA configuration
- ✅ Entities grouped correctly
- ✅ No missing devices
- ✅ State changes reflect immediately

---

#### ✅ Manual Test 3: Favorites Persistence
**Steps**:
1. Toggle favorite on 3 entities
2. Refresh browser
3. Verify favorites persist
4. Clear localStorage
5. Verify favorites reset

**Expected Result**:
- ✅ Favorites save to localStorage
- ✅ Favorites load on refresh
- ✅ No console errors

---

#### ✅ Manual Test 4: PWA Functionality
**Steps**:
1. Run Lighthouse audit (PWA category)
2. Verify install prompt appears
3. Install PWA
4. Test offline mode
5. Verify service worker caches assets

**Expected Result**:
- ✅ PWA score \u003e 90
- ✅ Installable
- ✅ Works offline (static assets)
- ✅ Service worker active

---

### Browser Testing

We will test on:
- ✅ Chrome/Edge (Desktop)
- ✅ Firefox (Desktop)
- ✅ Safari (if available)
- ✅ Chrome Mobile (Android)
- ✅ Safari Mobile (iOS if available)

**Critical flows**:
1. Login flow (OAuth2)
2. Dashboard load
3. Entity control (lights, switches, climate)
4. Area navigation
5. Favorites management

---

## Migration Timeline

### Week 1: Setup & Infrastructure (3-4 days)

**Day 1-2**: Environment Setup
- [ ] Create `migration-hakit` branch
- [ ] Install @hakit/core, @hakit/components
- [ ] Setup HassConnect wrapper
- [ ] Test connection to HA
- [ ] Document HA URL configuration for different envs

**Day 3-4**: API Compatibility Layer
- [ ] Create adapter hooks if needed (unlikely)
- [ ] Setup favorites store
- [ ] Verify WebSocket connection
- [ ] Test basic entity operations

**Deliverable**: App boots with @hakit/core, connects to HA, no features migrated yet.

---

### Week 2: Feature Migration (5 days)

**Day 1**: Dashboard Page
- [ ] Migrate to useAreas(), useEntities()
- [ ] Keep existing UI components
- [ ] Verify real-time updates
- [ ] Test toggles and service calls

**Day 2**: Zones Page  
- [ ] Migrate zone logic to @hakit hooks
- [ ] Keep ZonesPanel UI component
- [ ] Test area filtering
- [ ] Verify device grouping

**Day 3**: Gadgets + Other Pages
- [ ] Migrate Gadgets page
- [ ] Migrate Energy, Security pages  
- [ ] Update any remaining pages
- [ ] Fix TypeScript errors

**Day 4**: Component Updates
- [ ] Update GadgetCard to use @hakit entities
- [ ] Update DeviceDetailsModal
- [ ] Test climate, media_player, camera controls
- [ ] Verify all domain types work

**Day 5**: Testing & Bug Fixes
- [ ] Run all manual tests
- [ ] Fix bugs discovered
- [ ] Performance testing
- [ ] Memory leak check

**Deliverable**: Fully functional app on @hakit/core, feature parity with current version.

---

### Week 3: Cleanup & Optimization (2-3 days)

**Day 1**: Code Cleanup
- [ ] Remove backend/ directory
- [ ] Remove HomeAssistant.tsx
- [ ] Remove unused dependencies
- [ ] Update Dockerfile
- [ ] Update run.sh

**Day 2**: Build Optimization
- [ ] Optimize bundle size
- [ ] Update Docker image
- [ ] Test production build
- [ ] Verify PWA still works

**Day 3**: Documentation & Handoff
- [ ] Update README.md
- [ ] Document new architecture
- [ ] Create migration notes
- [ ] Tag release v0.1.0-hakit

**Deliverable**: Production-ready migration, documentation complete.

---

## Rollback Plan

### If Migration Fails

**Trigger**: Critical bug found in production that can't be fixed quickly.

**Steps**:
1. Merge `main` branch (current version)
2. Deploy previous Docker image
3. Revert DNS/routing changes
4. Investigate issue in `migration-hakit` branch
5. Fix and re-test before re-deploying

**Time to Rollback**: ~5 minutes (just deployment)

**Data Loss**: None (no DB changes, only code changes)

---

### Branch Strategy

```
main (production)
  └─ migration-hakit (dev)
       ├─ feature/hakit-setup
       ├─ feature/dashboard-migration
       ├─ feature/zones-migration
       └─ feature/cleanup
```

**Merge to main**: Only after Week 3 complete + all tests passing.

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| @hakit/core breaking change | Low | High | Lock to v6.0.0, monitor releases |
| Custom features incompatible | Medium | Medium | Adapter layer, fallback to custom code |
| Performance regression | Low | Medium | Benchmark before/after, optimize |
| HA API changes | Low | High | @hakit team handles this |
| Team skill gap | Medium | Low | Pair programming, code reviews |

---

## Success Metrics

### Technical Metrics
- ✅ Code reduction: \u003e 80% (target: 1,500+ lines removed)
- ✅ Bundle size: \u003c 1.5MB (vs current ~2MB)
- ✅ Build time: \u003c 30s (vs current ~45s)
- ✅ Docker image: \u003c 50MB (vs current ~250MB)
- ✅ Test coverage: \u003e 70% (vs current ~20%)

### Functional Metrics
- ✅ Feature parity: 100% (all current features work)
- ✅ Performance: No regressions (Lighthouse score maintained)
- ✅ Bugs: \u003c 5 critical bugs in first month
- ✅ Uptime: \u003e 99.5% (same as current)

### Business Metrics
- ✅ Time to market: 2-3 weeks (vs 6 months for custom features)
- ✅ Development velocity: +200% (measured in features/week)
- ✅ Maintenance cost: -80% (measured in hours/month)

---

## Questions for User

Before proceeding, please confirm:

1. ✅ **Architecture Change**: Are you comfortable eliminating the Node.js backend completely?

2. ✅ **Dependency Risk**: Are you okay depending on @hakit/core (well-maintained but external)?

3. ✅ **Timeline**: Is 2-3 weeks acceptable, or do you need faster/slower?

4. ✅ **Testing**: Can you provide a Home Assistant instance for testing, or should we use a local setup?

5. ✅ **Deployment**: Should we deploy to staging first, or can we test locally before production?

6. ⚠️ **Custom Features**: Are there any custom features NOT mentioned in ARCHITECTURE.md that we must preserve?

---

**Ready to proceed?** → Let's start with Week 1, Day 1. 🚀
