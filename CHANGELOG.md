# Registro de Cambios (Changelog)

## [0.2.0] - 2025-05-11

### Añadido

- Interacciones avanzadas con eventos del calendario
  - Arrastrar y soltar eventos entre horas y días
  - Redimensionamiento de eventos para modificar duración
  - Sistema de imán (snap) para alineación automática
- Vista diaria del calendario
  - Implementación de vista detallada por día
  - Gestión avanzada de eventos continuos entre días
  - Navegación fluida entre vista diaria y semanal
- Sistema de almacenamiento mejorado
  - Capa de abstracción completa (storageService)
  - Integración con Electron Store para la versión de escritorio
  - Manejo mejorado de errores en operaciones de datos
- Registro de módulos funcional
  - Sistema completo window.\_\_appModules
  - Utilidades para interoperabilidad entre módulos
  - Conversión automática de datos entre formatos
- Componentes UI básicos
  - Implementación de componentes Button y Dialog
  - Sistema de mensajes modales

### Mejorado

- Experiencia de usuario con interacciones intuitivas
- Rendimiento en operaciones de arrastrar y redimensionar
- Gestión de errores y validación de datos
- Soporte para la aplicación de escritorio (Electron)
- Estructuración del código para mayor mantenibilidad

## [0.1.0] - 2025-05-08

### Añadido

- Estructura modular base
- Sistema de Bus de Eventos
- Calendario básico funcional
- Almacenamiento simple con localStorage
- Visualización de eventos en formato semanal
- Creación, edición y eliminación de eventos básicos
- Navegación entre semanas

### Mejoras Técnicas

- Implementación de la clase `EventBus` para el patrón publicador/suscriptor
- Sistema básico de registro de módulos
- Hooks personalizados para manejo de eventos del calendario
- Utilidades para gestión de fechas y eventos
