# Política de Versionado de Plugins en Atlas

## Introducción

Este documento explica cómo se gestiona el versionado de plugins en Atlas, definiendo la relación entre las versiones de plugins individuales y las versiones principales de la aplicación. Una comprensión clara de esta política ayuda a los desarrolladores de plugins a mantener la compatibilidad con las diferentes versiones de Atlas y a los usuarios a entender qué funcionalidades pueden esperar en cada versión.

## Esquema de Versionado

### Versionado de Atlas

Atlas sigue el esquema de versionado semántico (SemVer) con formato `MAYOR.MENOR.PARCHE`:

- **MAYOR (X.0.0)**: Cambios incompatibles con versiones anteriores
- **MENOR (0.X.0)**: Nuevas funcionalidades compatibles con versiones anteriores
- **PARCHE (0.0.X)**: Correcciones de errores compatibles con versiones anteriores

Durante el desarrollo inicial, las versiones principales siguen este esquema:
- 0.1.0 - Stage 1: Fundamentos
- 0.2.0 - Stage 2: Mejoras de Interacción y Persistencia
- 0.3.0 - Stage 3: Personalización y Primeros Plugins
- 0.4.0 - Stage 4: Robustez y Plugins Esenciales
- 0.5.0 - Stage 5: Análisis y Ecosistema Completo
- 1.0.0 - Stage 6: Pulido y Lanzamiento

### Versionado de Plugins

Los plugins siguen el mismo esquema semántico, pero con ciclos de actualización más frecuentes:

#### Significado de los números para plugins:

1. **MAYOR (X.0.0)**: 
   - Cambios incompatibles en la API del plugin
   - Cambios arquitectónicos significativos
   - Normalmente alineados con versiones principales de Atlas

2. **MENOR (0.X.0)**:
   - Nuevas características compatibles
   - Mejoras significativas de funcionalidad
   - Pueden ocurrir entre versiones MENORES de Atlas

3. **PARCHE (0.0.X)**:
   - Correcciones de errores
   - Mejoras de rendimiento
   - Pequeñas modificaciones de interfaz
   - Pueden ser lanzados con frecuencia entre versiones de Atlas

## Relación entre Versiones de Atlas y Plugins

### Modelo de Compatibilidad

Cada plugin declara su compatibilidad con Atlas mediante un rango de versiones en su manifiesto:

```json
{
  "name": "video-scheduler",
  "version": "0.5.5",
  "compatibility": {
    "atlas": {
      "minimum": "0.5.0",
      "recommended": "0.5.0",
      "maximum": "1.0.0"
    }
  }
}
```

### Ciclo de Versionado de Plugins

Los plugins pueden tener actualizaciones intermedias entre versiones principales de Atlas:

1. **Versiones Iniciales (X.0.0)**:
   - Corresponden a la introducción del plugin en una versión específica de Atlas
   - Ejemplo: Video Scheduler 0.5.0 se introdujo con Atlas 0.5.0

2. **Actualizaciones Intermedias (X.X.5)**:
   - Mejoras incrementales del plugin que no requieren una nueva versión principal de Atlas
   - Pueden incluirse en parches de Atlas (0.5.1, 0.5.2, etc.)
   - Ejemplo: Task Tracker 0.4.5 añadió sistema de subtareas, compatible con Atlas 0.4.x

3. **Actualizaciones Mayores (X+1.0.0)**:
   - Coinciden con actualizaciones principales de Atlas
   - Incluyen cambios significativos aprovechando nuevas capacidades del núcleo
   - Ejemplo: Todos los plugins llegan a versión 1.0.0 con Atlas 1.0.0

### Ejemplo de Línea Temporal

| Versión de Atlas | Versiones de Plugins |
|------------------|----------------------|
| 0.3.0 | Notes Manager 0.3.0 |
| *parche interno* | Notes Manager 0.3.5 (añadido soporte para categorías) |
| 0.4.0 | Notes Manager 0.4.0, Task Tracker 0.4.0, Reminder System 0.4.0 |
| *parche interno* | Reminder System 0.4.5 (añadido soporte para navegadores móviles) |
| 0.5.0 | Todos los plugins anteriores actualizados a 0.5.0, Calendar Analytics 0.5.0, Video Scheduler 0.5.0, Weather Integration 0.5.0 |
| *parche interno* | Video Scheduler 0.5.5 (añadido sistema de seguimiento de ingresos) |
| 1.0.0 | Todos los plugins actualizados a 1.0.0 con soporte completo para internacionalización y accesibilidad |

## Política de Actualización de Plugins

### Actualizaciones Dentro de Versiones de Atlas

Las actualizaciones de plugins con versiones intermedias (x.x.5) siguen estas directrices:

1. **No Romper Compatibilidad**: Nunca introducen cambios incompatibles con la versión actual de Atlas
2. **Actualización Transparente**: Pueden instalarse sin actualizar Atlas
3. **APIs Estables**: Mantienen compatibilidad con otros plugins existentes
4. **Mejora Incremental**: Añaden funcionalidades secundarias o mejoras de rendimiento

### Canales de Distribución

1. **Canal Estable**: Plugins con versiones completas (x.0.0) incluidos con versiones oficiales de Atlas
2. **Canal Beta**: Actualizaciones intermedias disponibles para usuarios que opten por ellas
3. **Canal Dev**: Versiones en desarrollo para pruebas internas

## Ciclo de Desarrollo de Actualizaciones Intermedias

1. **Identificación de Mejoras**: Basado en feedback de usuarios o mejoras planificadas
2. **Desarrollo**: Implementación de nuevas características o correcciones
3. **Pruebas de Compatibilidad**: Verificación exhaustiva con la versión actual de Atlas
4. **Distribución Controlada**: Lanzamiento a usuarios del canal beta
5. **Retroalimentación**: Recopilación de feedback de usuarios beta
6. **Refinamiento**: Correcciones basadas en retroalimentación
7. **Lanzamiento**: Disponibilidad general para todos los usuarios

## Documentación de Versiones Intermedias

Cada actualización intermedia de un plugin debe documentar:

1. **Cambios Principales**: Lista detallada de nuevas características, mejoras y correcciones
2. **Requisitos**: Versión mínima de Atlas requerida
3. **Posibles Conflictos**: Advertencias sobre interacciones con otros plugins
4. **Instrucciones de Instalación**: Proceso paso a paso para actualizar el plugin
5. **Cambios de API**: Documentación de cualquier cambio en la API pública

## Consideraciones para Desarrolladores

### Al desarrollar actualizaciones intermedias

1. **Mantén la compatibilidad hacia atrás**: Evita cambios que rompan funcionalidades existentes
2. **Documenta claramente los cambios**: Especialmente si añades nuevos métodos a la API
3. **Limita el alcance**: Enfócate en mejoras incrementales, no en rediseños completos
4. **Prueba exhaustivamente**: Verifica la integración con todos los plugins estándar
5. **Considera el rendimiento**: Evalúa el impacto de tus cambios en sistemas con recursos limitados

## Conclusión

El enfoque de versionado de plugins de Atlas permite una evolución continua del ecosistema mientras mantiene la estabilidad general de la aplicación. Las actualizaciones intermedias (x.x.5) proporcionan mejoras significativas sin requerir actualizaciones principales, mientras que las versiones completas (x.0.0) aprovechan las nuevas capacidades introducidas en cada versión principal de Atlas.

Esta estrategia equilibra la necesidad de mejora continua con los requisitos de estabilidad de una aplicación de productividad, ofreciendo a los usuarios características nuevas sin comprometer la fiabilidad.

**Nota sobre las fechas**: Los ejemplos y referencias a fechas en esta documentación son ilustrativos.