# Estrategia de Testing para Atlas

## Índice

1. [Introducción](#introducción)
2. [Principios de Testing](#principios-de-testing)
3. [Tipos de Pruebas](#tipos-de-pruebas)
   - [Pruebas Unitarias](#pruebas-unitarias)
   - [Pruebas de Integración](#pruebas-de-integración)
   - [Pruebas End-to-End (E2E)](#pruebas-end-to-end-e2e)
   - [Pruebas de Rendimiento](#pruebas-de-rendimiento)
4. [Herramientas de Testing](#herramientas-de-testing)
5. [Estructura de Directorios](#estructura-de-directorios)
6. [Implementación por Stages](#implementación-por-stages)
7. [Estándares de Código para Tests](#estándares-de-código-para-tests)
8. [CI/CD y Automatización](#cicd-y-automatización)
9. [Métricas y Reportes](#métricas-y-reportes)
10. [Troubleshooting y FAQ](#troubleshooting-y-faq)

## Introducción

Este documento define la estrategia de testing para el proyecto Atlas, especificando cómo las pruebas deben implementarse a través de todos los stages de desarrollo. El objetivo es asegurar que el código sea robusto, mantenible y cumpla con los requisitos funcionales y no funcionales establecidos.

La estrategia de testing de Atlas sigue un enfoque piramidal:
- Base amplia de pruebas unitarias
- Capa intermedia de pruebas de integración
- Capa superior más pequeña de pruebas end-to-end
- Pruebas de rendimiento complementarias

## Principios de Testing

1. **Integración continua**: Las pruebas deben ejecutarse automáticamente con cada cambio en el código.
2. **Priorización de pruebas**: Enfocarse primero en las funcionalidades críticas y la lógica de negocio.
3. **Independencia**: Las pruebas deben ser independientes entre sí y ejecutables en cualquier orden.
4. **Repetibilidad**: Las pruebas deben producir el mismo resultado en ejecuciones sucesivas.
5. **Mantenibilidad**: Las pruebas deben ser claras, legibles y fáciles de mantener.
6. **Cobertura**: Objetivo del 80% de cobertura para código nuevo, con enfoque en calidad sobre cantidad.
7. **Automatización**: Priorizar pruebas automatizadas sobre pruebas manuales.

## Tipos de Pruebas

### Pruebas Unitarias

**Objetivo**: Verificar que cada unidad de código funciona correctamente de manera aislada.

**Alcance**:
- Funciones y métodos individuales
- Componentes React aislados
- Hooks personalizados
- Utilidades y helpers

**Metodología**:
- Utilizar mocks para aislar la unidad a probar
- Probar todos los caminos posibles (happy path, edge cases, error handling)
- Enfoque en comportamiento, no en implementación
- Para componentes React: renderizado, props, eventos, estados

**Ejemplo**:

```javascript
// Ejemplo con Jest y React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import EventForm from '../../../src/components/calendar/event-form';

describe('EventForm', () => {
  test('llama onSubmit con datos correctos al enviar formulario', () => {
    const mockSubmit = jest.fn();
    render(<EventForm onSubmit={mockSubmit} />);
    
    // Rellenar formulario
    fireEvent.change(screen.getByLabelText(/título/i), {
      target: { value: 'Reunión de equipo' }
    });
    
    // Enviar formulario
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    
    // Verificar que onSubmit se llamó con los datos correctos
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Reunión de equipo'
      })
    );
  });
});
```

### Pruebas de Integración

**Objetivo**: Verificar que diferentes módulos o servicios funcionan correctamente juntos.

**Alcance**:
- Interacción entre componentes
- Comunicación con servicios
- Flujo de datos entre módulos
- Integración entre plugins y core

**Metodología**:
- Probar la comunicación entre módulos reales
- Minimizar los mocks, utilizar implementaciones reales cuando sea posible
- Verificar el comportamiento completo de un feature
- Simular API externas o servicios de terceros

**Ejemplo**:

```javascript
// Ejemplo de prueba de integración
import { render, screen, act, waitFor } from '@testing-library/react';
import CalendarMain from '../../../src/components/calendar/calendar-main';
import { registerModule } from '../../../src/core/module/module-registry';
import eventBus from '../../../src/core/bus/event-bus';

// Mock parcial del LocalStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('CalendarMain integration', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
      { id: '123', title: 'Evento de prueba', start: '2025-04-15T10:00:00Z', end: '2025-04-15T11:00:00Z' }
    ]));
  });

  test('carga eventos y los muestra en la interfaz', async () => {
    render(<CalendarMain />);
    
    // Verificar que el evento se muestra
    await waitFor(() => {
      expect(screen.getByText('Evento de prueba')).toBeInTheDocument();
    });
    
    // Verificar que el módulo calendar se registró correctamente
    expect(window.__appModules).toHaveProperty('calendar');
  });

  test('crea un nuevo evento y lo publica en el bus de eventos', async () => {
    const eventBusSpy = jest.spyOn(eventBus, 'publish');
    
    render(<CalendarMain />);
    
    // Simular creación de evento
    act(() => {
      window.__appModules.calendar.createEvent({
        title: 'Nuevo evento',
        start: '2025-04-16T14:00:00Z',
        end: '2025-04-16T15:00:00Z'
      });
    });
    
    // Verificar que se publicó el evento en el bus
    expect(eventBusSpy).toHaveBeenCalledWith(
      expect.stringContaining('eventsUpdated'),
      expect.arrayContaining([
        expect.objectContaining({ title: 'Nuevo evento' })
      ])
    );
    
    // Verificar que se guardó en localStorage
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });
});
```

### Pruebas End-to-End (E2E)

**Objetivo**: Validar el flujo completo de la aplicación desde la perspectiva del usuario.

**Alcance**:
- Flujos de trabajo completos
- Interacción con la interfaz de usuario
- Comportamiento en diferentes navegadores/dispositivos
- Integración con sistemas externos reales

**Metodología**:
- Simular acciones de usuario reales
- Probar flujos críticos de negocio completos
- Minimizar pruebas E2E (más lentas y frágiles)
- Centrarse en happy paths y escenarios críticos

**Ejemplo**:

```javascript
// Ejemplo con Cypress
describe('Flujo de trabajo de eventos', () => {
  beforeEach(() => {
    cy.visit('/');
    // Limpiar datos previos
    cy.window().then((win) => {
      win.localStorage.clear();
    });
  });

  it('permite crear, editar y eliminar un evento', () => {
    // Crear evento
    cy.get('.calendar-time-slot').first().click();
    cy.get('input[name="title"]').type('Evento de prueba E2E');
    cy.get('button').contains('Guardar').click();
    
    // Verificar que se creó
    cy.contains('Evento de prueba E2E').should('be.visible');
    
    // Editar evento
    cy.contains('Evento de prueba E2E').click();
    cy.get('input[name="title"]').clear().type('Evento modificado');
    cy.get('button').contains('Guardar').click();
    
    // Verificar que se actualizó
    cy.contains('Evento modificado').should('be.visible');
    cy.contains('Evento de prueba E2E').should('not.exist');
    
    // Eliminar evento
    cy.contains('Evento modificado').click();
    cy.get('button').contains('Eliminar').click();
    
    // Verificar que se eliminó
    cy.contains('Evento modificado').should('not.exist');
  });
});
```

### Pruebas de Rendimiento

**Objetivo**: Asegurar que la aplicación responde dentro de los límites de tiempo aceptables y maneja adecuadamente cargas elevadas.

**Alcance**:
- Tiempo de carga inicial
- Renderizado de componentes con muchos datos
- Manipulación de grandes conjuntos de datos
- Comportamiento con muchos plugins activos

**Metodología**:
- Establecer benchmarks para operaciones críticas
- Pruebas automatizadas para comparar con benchmarks
- Monitoreo de memoria y CPU
- Simular cargas elevadas (muchos eventos, plugins, etc.)

**Ejemplo**:

```javascript
// Ejemplo de prueba de rendimiento con Jest
import { render } from '@testing-library/react';
import { createEvent } from '../../../src/utils/event-utils';

describe('Rendimiento del calendario', () => {
  test('renderiza 1000 eventos en menos de 500ms', () => {
    // Generar 1000 eventos de prueba
    const events = Array.from({ length: 1000 }, (_, i) => 
      createEvent({
        id: `event-${i}`,
        title: `Evento ${i}`,
        start: new Date(2025, 3, 15, 8 + Math.floor(i / 100), 0, 0).toISOString(),
        end: new Date(2025, 3, 15, 9 + Math.floor(i / 100), 0, 0).toISOString()
      })
    );
    
    // Medir tiempo de renderizado
    const start = performance.now();
    render(<WeekView events={events} />);
    const end = performance.now();
    
    // Verificar que el tiempo de renderizado es aceptable
    expect(end - start).toBeLessThan(500);
  });
});
```

## Herramientas de Testing

### Framework Principal

- **Jest**: Framework de testing para JavaScript/React
  - Ejecución de pruebas
  - Mocks, spies, y timers
  - Aserciones
  - Cobertura de código

### Testing de Componentes

- **React Testing Library**: Para pruebas de componentes React
  - Filosofía centrada en el comportamiento del usuario
  - Selección de elementos basada en accesibilidad
  - API simple e intuitiva

### Testing End-to-End

- **Cypress**: Para pruebas end-to-end
  - API intuitiva
  - Debugging visual
  - Buena integración con React
  - Soporte para pruebas de CI/CD

### Herramientas de Rendimiento

- **React Profiler**: Para analizar rendimiento de componentes
- **Lighthouse**: Para auditoría de rendimiento web
- **Performance API del navegador**: Para mediciones precisas en tests

### Herramientas de Mocking

- **Mock Service Worker (MSW)**: Para simular APIs
- **Jest Mock Functions**: Para funciones y módulos
- **Testing Library User Event**: Para simular interacciones de usuario

## Estructura de Directorios

La estructura de directorios para tests debe reflejar la estructura del código fuente para facilitar la navegación:

```
test/
├── unit/                        # Pruebas unitarias
│   ├── core/                    # Tests del núcleo
│   │   ├── bus/                 # Tests del bus de eventos
│   │   │   ├── event-bus.test.js
│   │   │   └── events.test.js
│   │   └── module/              # Tests del registro de módulos
│   │       ├── module-registry.test.js
│   │       └── module-utils.test.js
│   ├── services/                # Tests de servicios
│   │   ├── storage-service.test.js
│   │   └── theme-service.test.js
│   └── components/              # Tests de componentes
│       ├── calendar/
│       │   ├── calendar-main.test.js
│       │   └── event-form.test.js
│       └── ui/
│           ├── button.test.js
│           └── dialog.test.js
│
├── integration/                 # Pruebas de integración
│   ├── calendar/                # Tests del calendario
│   │   ├── calendar-storage.test.js
│   │   └── calendar-events.test.js
│   └── plugins/                 # Tests de plugins
│       ├── notes-manager.test.js
│       └── task-tracker.test.js
│
├── e2e/                         # Pruebas end-to-end
│   ├── scenarios/               # Escenarios de prueba
│   │   ├── event-management.spec.js
│   │   └── plugin-interaction.spec.js
│   └── fixtures/                # Datos de prueba
│       └── events.json
│
└── performance/                 # Pruebas de rendimiento
    ├── calendar-rendering.test.js
    └── plugins-load.test.js
```

Estas rutas coinciden con la estructura definida para Stage 6 del proyecto.

## Implementación por Stages

La estrategia de testing se implementará de forma incremental a través de los stages de desarrollo:

### Stage 1: Fundamentos (v0.1.0)

**Enfoque**:
- Configuración inicial del entorno de testing (Jest + RTL)
- Pruebas unitarias para componentes core (especialmente Calendar)
- Pruebas para utilidades de fecha/tiempo
- Cobertura mínima del 60% para módulo core

**Entregables**:
- Configuración base de Jest
- Tests para EventBus y ModuleRegistry
- Tests para componentes básicos del calendario
- Tests para utilidades fundamentales

### Stage 2: Mejoras de Interacción y Persistencia (v0.2.0)

**Enfoque**:
- Añadir pruebas para interacciones avanzadas
- Pruebas de integración para almacenamiento
- Testing de los eventos de drag & drop
- Testing unitario del sistema de escalas de tiempo

**Entregables**:
- Tests para interacciones (drag & drop, resize)
- Tests de integración para StorageService
- Tests para vistas de día/semana
- Tests para eventos de bus avanzados

### Stage 3: Personalización y Primeros Plugins (v0.3.0)

**Enfoque**:
- Establecer patrón de testing para plugins
- Pruebas del sistema de temas
- Pruebas para el primer plugin (Notes Manager)
- Pruebas de integración entre plugins y core

**Entregables**:
- Template de tests para plugins
- Tests para sistema de temas
- Tests completos para Notes Manager
- Tests de integración entre calendario y notas

### Stage 4: Robustez y Plugins Esenciales (v0.4.0)

**Enfoque**:
- Implementar primeras pruebas E2E
- Testing de módulos de administración
- Tests para nuevos plugins (Task Tracker, Reminder System)
- Testing de exportación/importación de datos

**Entregables**:
- Configuración de Cypress para E2E
- Tests E2E para flujos principales
- Tests unitarios/integración para nuevos plugins
- Tests para sistema de importación/exportación

### Stage 5: Análisis y Ecosistema Completo (v0.5.0)

**Enfoque**:
- Añadir pruebas de rendimiento
- Testing exhaustivo de todo el ecosistema de plugins
- Pruebas E2E para escenarios complejos
- Testing completo del sistema de backup

**Entregables**:
- Framework de pruebas de rendimiento
- Tests para todos los plugins restantes
- Tests E2E para interacciones complejas
- Tests para el sistema de copias de seguridad

### Stage 6: Pulido y Lanzamiento (v1.0.0)

**Enfoque**:
- Testing de internacionalización (i18n)
- Pruebas exhaustivas de accesibilidad
- Optimización del rendimiento basada en tests
- Completar suite de tests para 80% de cobertura global

**Entregables**:
- Tests para sistema i18n
- Auditorías de accesibilidad automatizadas
- Suite completa de tests de rendimiento
- Documentación detallada de tests

## Estándares de Código para Tests

### Nombrado de Tests

Utilizar formato descriptivo que indique claramente:
- Componente/función que se prueba
- Comportamiento esperado
- Condiciones específicas (si aplica)

**Patrón recomendado**:
- `describe('ComponentName', () => {...})` - Para agrupar tests de un componente
- `describe('methodName', () => {...})` - Para agrupar tests de un método
- `test('should [expected behavior] when [conditions]', () => {...})` - Para casos individuales

**Ejemplo**:

```javascript
describe('EventForm', () => {
  describe('submit handling', () => {
    test('should call onSubmit with correct data when form is valid', () => {
      // Test implementation
    });
    
    test('should show error message when required fields are empty', () => {
      // Test implementation
    });
  });
});
```

### Estructura de los Tests

Seguir el patrón AAA (Arrange-Act-Assert):

```javascript
test('should update event when edit form is submitted', () => {
  // Arrange (Preparar)
  const mockUpdateEvent = jest.fn();
  const initialEvent = { id: '123', title: 'Original title' };
  render(<EventForm event={initialEvent} onUpdateEvent={mockUpdateEvent} />);
  
  // Act (Actuar)
  fireEvent.change(screen.getByLabelText(/título/i), {
    target: { value: 'Updated title' }
  });
  fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
  
  // Assert (Verificar)
  expect(mockUpdateEvent).toHaveBeenCalledWith('123', {
    ...initialEvent,
    title: 'Updated title'
  });
});
```

### Mocks y Fixtures

- Colocar mocks reutilizables en archivos separados
- Usar fixtures para datos de prueba complejos
- Restablecer todos los mocks después de cada prueba
- Minimizar el uso de mocks cuando sea posible

```javascript
// En __mocks__/event-data.js
export const mockEvents = [
  {
    id: 'event-1',
    title: 'Reunión de equipo',
    start: '2025-04-15T10:00:00Z',
    end: '2025-04-15T11:30:00Z',
    color: '#2D4B94'
  },
  // Más eventos...
];

// En test
import { mockEvents } from '../__mocks__/event-data';

test('should render all events', () => {
  render(<Calendar events={mockEvents} />);
  // Verificaciones...
});
```

### Accesibilidad en Tests

- Favorecer queries basadas en accesibilidad (getByRole, getByLabelText, etc.)
- Añadir tests específicos para verificar cumplimiento de WCAG
- Utilizar herramientas como jest-axe para testing automático de accesibilidad

```javascript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import EventForm from '../components/EventForm';

expect.extend(toHaveNoViolations);

test('should have no accessibility violations', async () => {
  const { container } = render(<EventForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## CI/CD y Automatización

### Pipeline de CI

Integrar los tests en el pipeline de CI con las siguientes etapas:

1. **Linting**: Verificación de estilo de código
2. **Unit Tests**: Ejecución de pruebas unitarias
3. **Integration Tests**: Ejecución de pruebas de integración
4. **E2E Tests**: Ejecución de pruebas end-to-end
5. **Performance Tests**: Ejecución de pruebas de rendimiento (solo en PR a main)
6. **Coverage Report**: Generación de reporte de cobertura
7. **Build**: Generación del build de producción

**Configuración recomendada**:

```yaml
# Ejemplo para GitHub Actions
name: Atlas CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests
        run: npm test
      
      - name: Integration tests
        run: npm run test:integration
      
      - name: E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

Configurar pre-commit hooks para ejecutar automáticamente:
- Linting
- Pruebas unitarias afectadas por los cambios
- Verificación de tipos (si se usa TypeScript)

```json
// En package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run test:affected"
    }
  },
  "lint-staged": {
    "*.js": ["eslint --fix", "prettier --write"],
    "*.jsx": ["eslint --fix", "prettier --write"]
  }
}
```

### Automatización de Pruebas

- Configurar scripts de npm para diferentes tipos de pruebas
- Habilitar modo watch durante desarrollo
- Permitir ejecución selectiva de tests

```json
// En package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest test/unit",
    "test:integration": "jest test/integration",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:performance": "jest test/performance",
    "test:affected": "jest --findRelatedTests $(git diff --staged --name-only)"
  }
}
```

## Métricas y Reportes

### Métricas de Cobertura

- **Objetivo global**: 80% de cobertura para código nuevo
- **Mínimos por categoría**:
  - Núcleo (core): 90%
  - Servicios: 85%
  - Componentes: 75%
  - Plugins: 70%
  - Utilidades: 90%

### Reportes de Cobertura

Configurar Jest para generar reportes de cobertura detallados:

```javascript
// En jest.config.js
module.exports = {
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    'src/core/': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90
    },
    'src/services/': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85
    }
  }
};
```

### Informes de Testing

Para cada pull request y build de CI:
- Generar reporte de cobertura
- Generar reporte de pruebas fallidas
- Incluir tiempo de ejecución de tests
- Destacar cambios en la cobertura

### Métricas de Rendimiento

- Establecer benchmarks para operaciones críticas
- Monitorear tendencias de rendimiento a lo largo del tiempo
- Alertar cuando el rendimiento se degrade significativamente
- Documentar límites aceptables para métricas clave

```javascript
// Ejemplo de test de rendimiento con benchmark
test('debe renderizar lista de eventos en menos de 100ms', async () => {
  const events = generateEvents(100); // Generar datos de prueba
  
  const start = performance.now();
  render(<EventList events={events} />);
  const end = performance.now();
  
  // Guarda el resultado para comparaciones históricas
  saveBenchmark('event-list-render-100', end - start);
  
  expect(end - start).toBeLessThan(100);
});
```

## Troubleshooting y FAQ

### Problemas Comunes

#### Tests Lentos
- Reducir uso de beforeEach/afterEach globales
- Usar mocks en lugar de implementaciones reales cuando sea apropiado
- Verificar memory leaks con --detectLeaks
- Ajustar timeouts para tests específicos

#### Tests Flaky (Intermitentes)
- Identificar y aislar tests problemáticos
- Verificar asincronía y timers
- Evitar dependencias entre tests
- Usar waitFor y findBy* para elementos asincrónicos

#### Dificultad para Probar Componentes
- Extraer lógica compleja a hooks o funciones puras
- Utilizar props injection para inyectar dependencias
- Simplificar componentes siguiendo el principio de responsabilidad única
- Documentar patrones para testear casos complejos

### Preguntas Frecuentes

**P: ¿Cuándo usar pruebas unitarias vs. integración?**

R: Usa pruebas unitarias para verificar comportamientos aislados y lógica pura. Usa pruebas de integración cuando necesites verificar la interacción entre varios componentes o servicios.

**P: ¿Qué strategy seguir para mockear servicios externos?**

R: Utiliza MSW (Mock Service Worker) para interceptar y mockear peticiones HTTP en un nivel más alto. Para servicios locales, utiliza jest.mock() para reemplazar módulos enteros.

**P: ¿Cómo manejar pruebas que implican localStorage o IndexedDB?**

R: Crea mocks para estas APIs y colócalos en archivos de setup de Jest. Asegúrate de limpiar estos mocks entre tests para evitar contaminación.

**P: ¿Cómo probar plugins de manera consistente?**

R: Crea un helper de test que simule el entorno de carga de plugins, proporcionando las APIs necesarias del core. Utiliza este helper en todas las pruebas de plugins para mantener la consistencia.

---

Este documento debe revisarse y actualizarse periódicamente para reflejar la evolución de las prácticas de testing en el proyecto Atlas.

**Nota sobre las fechas**: Los ejemplos y referencias a fechas en esta documentación son ilustrativos.