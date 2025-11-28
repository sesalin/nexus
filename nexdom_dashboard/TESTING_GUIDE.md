# Guías de Pruebas Automatizadas

## 🧪 Resumen de Testing Implementado

Se ha configurado un sistema completo de pruebas automatizadas para la aplicación Nexdom OS.

### 📋 Configuración

**Tecnologías instaladas:**
- ✅ **Jest** - Framework de testing principal
- ✅ **Testing Library React** - Testing de componentes React
- ✅ **Jest DOM** - Aserciones DOM adicionales
- ✅ **ts-jest** - Soporte para TypeScript
- ✅ **jest-css-modules-transform** - Soporte para CSS modules

### 🏗️ Estructura de Tests

```
src/__tests__/
├── components/
│   └── Header.test.tsx          # Tests del componente Header
├── pages/
│   └── Dashboard.test.tsx       # Tests del componente Dashboard
├── utils/
│   ├── store.test.ts            # Tests del store Zustand
│   └── helpers.test.ts          # Tests de utilidades
├── App.test.tsx                 # Tests del componente principal
└── jest.setup.js               # Configuración global
```

### 🎯 Tests Implementados

#### 1. **Componentes UI**
- ✅ **App.tsx**: Estructura principal, routing, PWA provider
- ✅ **Header.tsx**: Navegación, iconos, menú de cuenta
- ✅ **Dashboard.tsx**: Layout principal, componentes internos

#### 2. **Store y Estado**
- ✅ **Zustand Store**: Acciones CRUD para dispositivos y alertas
- ✅ **Estados UI**: Loading, conexión, menú móvil
- ✅ **Gestión de Estado**: Inmutabilidad y actualizaciones

#### 3. **Utilidades**
- ✅ **Formateo de tiempo**: `formatTimeAgo()`
- ✅ **Estados de dispositivos**: `formatDeviceStatus()`
- ✅ **Iconos de dispositivos**: `getDeviceIcon()`
- ✅ **Validaciones**: Email, URL, IDs únicos

### 🚀 Comandos de Testing

```bash
# Ejecutar tests una vez
npm test

# Ejecutar tests en modo watch (desarrollo)
npm run test:watch

# Generar reporte de cobertura
npm run test:coverage

# Tests para CI/CD
npm run test:ci
```

### 📊 Métricas de Cobertura

**Objetivo de cobertura configurado:**
- ✅ **Líneas**: 70%
- ✅ **Funciones**: 70%
- ✅ **Ramas**: 70%
- ✅ **Sentencias**: 70%

### 🔧 Configuración Avanzada

#### **jest.config.js**
- Entorno: `jsdom` (DOM virtual para React)
- Mapeo de paths: Alias `@/` apuntando a `/src/`
- Transformación: TypeScript + React JSX
- CSS: Soporte para CSS Modules

#### **jest.setup.js**
- Mocks para `matchMedia`, `ResizeObserver`, `IntersectionObserver`
- Configuración de Testing Library DOM
- Supresión de warnings en tests

### 🎭 Mocks Configurados

- ✅ **Framer Motion**: Componentes de animación mock
- ✅ **Lucide React**: Iconos mock con data-testid
- ✅ **Zustand Store**: Estado controlado para tests
- ✅ **PWA Utils**: Funciones PWA mock
- ✅ **Account Menu**: Componente de cuenta mock

### 🔄 Patrones de Testing

#### **Component Testing**
```typescript
describe('ComponentName', () => {
  const renderWithRouter = (component) => {
    return render(<HashRouter>{component}</HashRouter>);
  };

  it('should render main elements', () => {
    renderWithRouter(<Component />);
    expect(screen.getByTestId('element')).toBeInTheDocument();
  });
});
```

#### **Store Testing**
```typescript
describe('useStore', () => {
  beforeEach(() => {
    // Reset state
    useStore.getState().reset();
  });

  it('should handle actions', () => {
    const { result } = renderHook(() => useStore());
    act(() => result.current.addItem(item));
    expect(result.current.items).toHaveLength(1);
  });
});
```

### 📈 Próximos Pasos

#### **1. Tests de Integración E2E (Próxima fase)**
- **Playwright** - Testing end-to-end moderno
- **Cypress** - Alternativa popular para E2E
- Configuración de CI para tests automatizados

#### **2. Cobertura Avanzada**
- Tests de integración entre componentes
- Tests de API (mocking del backend)
- Tests de performance y accesibilidad

#### **3. CI/CD Integration**
```yaml
# .github/workflows/tests.yml
- name: Run Tests
  run: npm run test:ci
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### 🛠️ Solución de Problemas

**Problema**: CSS no se aplica en tests
**Solución**: ✅ `jest-css-modules-transform` configurado

**Problema**: Mocks de framer-motion
**Solución**: ✅ Componentes motion mockeados

**Problema**: Router warnings
**Solución**: ✅ `HashRouter` configurado en tests

**Problema**: CSS variables no definidas
**Solución**: ✅ Tailwind CSS configurado para tests

### ✅ Estado Final

**Tests implementados:** 5 suites principales
**Componentes testados:** App, Header, Dashboard, Store
**Utilidades testadas:** 8 funciones helper
**Cobertura objetivo:** 70% (líneas, funciones, ramas, sentencias)

La aplicación ahora tiene una base sólida de testing automatizado que garantiza la calidad del código y facilita el desarrollo continuo.