# Stage 1 - Fundamentos (Versión 0.1.0)

**Enfoque**: Arquitectura base y calendario funcional mínimo viable

**Componentes a desarrollar:**
1. **Estructura modular base**
   - Implementación del sistema de directorios organizado
   - Configuración del entorno de desarrollo (web y Electron)
   - Estructura básica de componentes reutilizables

2. **Sistema de Bus de Eventos**
   - Implementación de la clase `EventBus`
   - Configuración del patrón publicador/suscriptor
   - Sistema básico de categorización de eventos

3. **Calendario básico funcional**
   - Vista semanal simple con navegación básica
   - Implementación de la rejilla temporal estándar (hora en hora)
   - Creación y visualización básica de eventos

4. **Almacenamiento simple**
   - Integración con localStorage para la versión web
   - Implementación básica de operaciones CRUD para eventos

**Criterios de finalización:**
- Aplicación capaz de mostrar, crear, editar y eliminar eventos básicos en una vista semanal
- Arquitectura modular básica funcionando
- Interfaz de usuario minimalista pero funcional
- Capacidad de almacenar y recuperar eventos

## Estructura de archivos al finalizar la Stage 1

```
atlas-core/
├── package.json
├── vite.config.js
├── index.html
├── public/
│   └── favicon.ico
│
├── src/
│   ├── index.jsx                 # Punto de entrada principal
│   ├── app.jsx                   # Componente raíz con header básico
│   │
│   ├── core/                     # Núcleo de la aplicación
│   │   ├── bus/                  # Sistema de bus de eventos
│   │   │   └── event-bus.js      # Implementación del bus de eventos
│   │   │
│   │   └── module/               # Sistema de registro de módulos básico
│   │       └── module-registry.js # Registro básico de módulos
│   │
│   ├── components/               # Componentes de la aplicación
│   │   └── calendar/             # Componentes del calendario
│   │       └── calendar-main.jsx # Componente principal del calendario
│   │
│   └── styles/                   # Estilos
│       ├── index.css             # Estilos globales
│       ├── app.css               # Estilos para app.jsx
│       └── calendar/             # Estilos específicos del calendario
│           └── calendar-main.css # Estilos para calendar-main.jsx
│
└── docs/                         # Documentación del proyecto
    ├── dev/                      # Documentación para desarrolladores
    │   ├── atlas-overview.md     # Visión general de Atlas
    │   ├── atlas-stages.md       # Stages de desarrollo
    │   ├── comandos.md           # Comandos útiles
    │   └── stages/               # Documentación detallada por Stages
    │       └── stage-1.md        # Documentación de la Stage 1
    │
    └── brand-assets/             # Recursos de marca
        ├── logos/                # Logos de la aplicación
        │   └── atlas-logo.svg    # Logo SVG principal
        │
        └── documentation/        # Documentación de marca
            └── atlas-brand-guide.md # Guía de identidad de marca
```
