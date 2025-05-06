# Diseño Visual de Atlas v1.0.0

## Índice
1. [Visión General](#visión-general)
2. [Sistema de Diseño](#sistema-de-diseño)
3. [Interfaz Básica](#interfaz-básica)
4. [Vistas Principales](#vistas-principales)
5. [Interacciones Avanzadas](#interacciones-avanzadas)
6. [Panel de Administración](#panel-de-administración)
7. [Sistema de Plugins](#sistema-de-plugins)
8. [Configuración y Personalización](#configuración-y-personalización)
9. [Versión Móvil](#versión-móvil)
10. [Accesibilidad y Optimización](#accesibilidad-y-optimización)

---

## Visión General

Atlas es una aplicación modular para la gestión del tiempo que permite a los usuarios construir su propio sistema organizativo. El diseño visual sigue los valores fundamentales de la marca: **modularidad**, **sostenibilidad**, **adaptabilidad**, **potencia con simplicidad**, y **privacidad y control**.

La interfaz se basa en un tema oscuro por defecto, con alternativas de tema claro y púrpura nocturno, manteniendo una estética profesional pero accesible. El sistema de firma personalizada en la parte superior añade un toque personal y distintivo.

## Sistema de Diseño

### Paleta de Colores

#### Tema Oscuro (Predeterminado)
- **Fondo Principal**: #141B2D (Azul oscuro profundo)
- **Fondo Secundario**: #1C2538 (Azul oscuro medio)
- **Elementos UI**: #2D4B94 (Azul Atlas)
- **Acentos**: #26A69A (Verde Modular)
- **Texto Principal**: #FFFFFF
- **Texto Secundario**: #A0AEC0

#### Tema Claro
- **Fondo Principal**: #F7FAFC
- **Fondo Secundario**: #FFFFFF
- **Elementos UI**: #2D4B94 (Azul Atlas)
- **Acentos**: #26A69A (Verde Modular)
- **Texto Principal**: #2C3E50
- **Texto Secundario**: #718096

#### Tema Púrpura Nocturno
- **Fondo Principal**: #17132A
- **Fondo Secundario**: #221C3E
- **Elementos UI**: #7E57C2 (Púrpura Personalización)
- **Acentos**: #26A69A (Verde Modular)
- **Texto Principal**: #FFFFFF
- **Texto Secundario**: #B39DDB

### Tipografía

- **Títulos y Encabezados**: Montserrat
  - Pesos: Regular (400), Medium (500), Semi-Bold (600)
  - Tamaños: H1: 28px, H2: 24px, H3: 20px, H4: 16px
- **Texto de Interfaz**: Inter
  - Pesos: Light (300), Regular (400), Medium (500)
  - Tamaños: Normal: 16px, Pequeño: 14px, Etiquetas: 12px
- **Texto Monoespaciado**: Fira Mono (para elementos técnicos)
- **Firma Personalizada**: Estilo caligráfico suave (fuente personalizada)

### Iconografía

- Iconos lineales con un grosor consistente (2px)
- Esquinas ligeramente redondeadas
- Colores que contrastan con el fondo actual
- Estados: normal, hover, activo, desactivado

### Espaciado y Dimensiones

- Sistema de espaciado basado en múltiplos de 4px
- Alturas estándar de componentes:
  - Botones: 40px
  - Campos de entrada: 40px
  - Barras de herramientas: 60px
  - Celdas de tiempo: 50px/hora (configurable)

## Interfaz Básica

### Estructura General

La interfaz de Atlas se divide en:

1. **Barra de Título Superior**
   - Controles de ventana (minimizar, maximizar, cerrar)
   - Nombre de la aplicación
   
2. **Firma Personalizada**
   - Estilo caligráfico personalizable
   - Ubicada centralmente en la parte superior
   - Configurable y ocultable

3. **Barra Lateral de Navegación (Izquierda)**
   - Acceso al Calendario principal
   - Acceso a Plugins activados (Ej: Programador de Videos, Notas, Tareas, Estadísticas, Clima)
   - Configuración
   - Iconos visuales para cada sección

4. **Área Principal de Contenido**
   - Cambia según la sección seleccionada
   - Ocupa la mayor parte de la pantalla
   - Diseño adaptable según el contexto

5. **Controles Contextuales**
   - Botones de navegación temporal (anterior, hoy, siguiente)
   - Selector de vista (día, semana, mes)
   - Controles específicos del contexto (imán, escala de tiempo)

6. **Panel de Utilidades (Inferior Derecha)**
   - Acceso al panel de logs y diagnóstico
   - Indicador de estado del sistema
   - Botón de ayuda rápida

## Vistas Principales

### Vista de Calendario Semanal

- **Encabezado**: Mes actual con controles de navegación
- **Selector de Vista**: Botones para cambiar entre vista de semana y día
- **Rejilla Temporal**: 
  - Eje vertical: Horas del día (configurable: 00:00-23:59)
  - Eje horizontal: Días de la semana
  - Celdas de tiempo con bordes sutiles
  - Franjas horarias personalizables (hora en hora o intervalos específicos)
- **Eventos**:
  - Representados como bloques de color
  - Duración visual proporcional a la duración real
  - Texto conciso con título y detalles esenciales
  - Códigos de color por categoría o tipo
- **Navegación**:
  - Botones para semana anterior/siguiente
  - Botón "Hoy" para volver a la fecha actual
  - Indicación clara del rango de fechas mostrado

### Vista de Día

- Vista detallada de un solo día
- Mayor granularidad en la escala temporal
- Más espacio para mostrar detalles de eventos
- Panel lateral opcional para detalles de eventos seleccionados
- Visualización de franjas horarias personalizadas

### Vista de Mes (Calendario)

- Representación tradicional de calendario mensual
- Indicadores visuales de eventos (puntos o barras de color)
- Vista previa al pasar el cursor sobre días con eventos
- Números de día con distinción para días actuales, pasados y futuros

### Panel de Detalles de Evento

- Aparece al seleccionar un evento
- Muestra todos los detalles del evento:
  - Título
  - Horario (inicio-fin)
  - Ubicación
  - Descripción
  - Categoría/color
  - Recordatorios configurados
- Opciones para editar, eliminar o configurar recordatorios
- Integración con plugins relacionados

## Interacciones Avanzadas

### Arrastrar y Soltar

- Eventos arrastrables a diferentes horas y días
- Indicación visual durante el arrastre (sombra y transparencia)
- Feedback visual al soltar (animación sutil)
- Validación para evitar conflictos con otros eventos

### Redimensionado de Eventos

- Puntos de control en bordes superior e inferior
- Cursor específico para indicar redimensionado
- Información de tiempo actualizada en tiempo real
- Limitación automática según escala temporal

### Sistema de Imán (Snap)

- **Panel de Control de Imán**: Ubicado en la barra de herramientas superior junto a controles de vista
- **Botón de Imán**: Botón toggle con ícono representativo
- **Niveles de Imán**:
  - Desactivado: Sin ajuste automático
  - Básico: Ajuste a horas completas
  - Medio: Ajuste a intervalos de 30 minutos
  - Preciso: Ajuste a intervalos de 15 minutos
  - Personalizado: Ajuste configurable por el usuario
- **Indicador Visual**: Muestra el nivel actual de imán con una etiqueta numérica (15m, 30m, 1h)
- **Menú Desplegable**: Al hacer clic en el indicador, muestra opciones para cambiar la precisión

### Sistema de Escalas de Tiempo

- **Escala Global vs. Semana Independiente**:
  - Control en la barra de herramientas para activar escala independiente
  - Indicador visual cuando se usa escala personalizada en una semana
  - Botón para restaurar escala global
  
- **Control de Densidad Visual**:
  - Deslizador para ajustar píxeles por minuto
  - Opciones predefinidas (compacto, normal, expandido)
  - Vista previa en tiempo real de los cambios
  
- **Franjas Horarias Personalizadas**:
  - Botón "+" entre franjas para añadir tiempos intermedios
  - Menú contextual para editar/eliminar franjas
  - Visualización diferenciada por tipo (normal vs. personalizada)

## Panel de Administración

Accesible desde el ícono en la esquina inferior derecha:

### Visor de Logs

- **Pestaña de Logs**:
  - Tabla de registros con columnas: Timestamp, Nivel, Tipo, Mensaje, Datos
  - Opciones de filtrado por nivel (debug, info, warning, error)
  - Filtrado por tipo de evento (UI, datos, validación, etc.)
  - Buscador para filtrar por texto
  - Opciones para exportar logs seleccionados o completos

### Monitor de Rendimiento

- **Pestaña de Rendimiento**:
  - Gráfico de uso de CPU/memoria
  - Tiempos de carga y respuesta
  - Estadísticas de almacenamiento
  - Opciones para limpiar caché y optimizar

### Gestor de Errores

- **Pestaña de Errores**:
  - Lista de errores detectados con detalles completos
  - Estado de cada error (nuevo, revisado, resuelto)
  - Opciones para copiar detalles o reportar
  - Sugerencias automáticas de solución cuando disponibles

### Controles del Panel de Administración

- Botón de auto-refresco (actualización automática)
- Botón para descargar (exportar a archivo)
- Botón para limpiar (borrar registros)
- Opción para cerrar el panel

## Sistema de Plugins

### Integración Visual de Plugins

Cada plugin mantiene la coherencia visual con el sistema principal, pero tiene elementos distintivos:

1. **Notes Manager**
   - **Vistas principales**:
     - Lista de notas con vista previa
     - Editor de texto enriquecido
     - Vista calendario con indicadores
   - **Elementos visuales clave**:
     - Editor WYSIWYG con controles de formato
     - Íconos de notas en el calendario principal
     - Sistema de etiquetas por color
   - **Interacciones especiales**:
     - Vinculación de notas a eventos
     - Búsqueda rápida por contenido
     - Opciones de exportación (PDF, texto)

2. **Task Tracker**
   - **Vistas principales**:
     - Tablero Kanban con columnas personalizables
     - Vista de lista con opciones de filtrado
     - Integración en calendario como eventos
   - **Elementos visuales clave**:
     - Tarjetas de tareas con indicadores de prioridad
     - Códigos de color por categoría
     - Barras de progreso para tareas con subtareas
   - **Interacciones especiales**:
     - Arrastrar tareas entre columnas
     - Convertir eventos en tareas y viceversa
     - Checklist de subtareas

3. **Reminder System**
   - **Vistas principales**:
     - Panel de configuración de recordatorios
     - Centro de notificaciones
     - Integración con detalles de eventos
   - **Elementos visuales clave**:
     - Íconos de alarma en eventos con recordatorios
     - Notificaciones emergentes con opciones
     - Panel de recordatorios pendientes
   - **Interacciones especiales**:
     - Opciones de postponer (snooze)
     - Ajustes rápidos de tiempo
     - Configuración de sonidos personalizados

4. **Calendar Analytics**
   - **Vistas principales**:
     - Dashboard con widgets configurables
     - Informes detallados por periodo
     - Análisis de distribución de tiempo
   - **Elementos visuales clave**:
     - Gráficos circulares para distribución de categorías
     - Gráficos de barras para comparativa temporal
     - Mapas de calor para patrones de actividad
   - **Interacciones especiales**:
     - Filtros por rango de fechas
     - Drill-down para análisis detallado
     - Exportación de informes

5. **Video Scheduler**
   - **Vistas principales**:
     - Vista de franjas horarias (mañana, tarde, noche)
     - Calendario de producción mensual
     - Panel de seguimiento de ingresos
   - **Elementos visuales clave**:
     - Códigos de color para estados (pendiente, desarrollo, producción, publicado)
     - Tarjetas de video con miniatura y metadatos
     - Gráficos de rendimiento e ingresos
   - **Interacciones especiales**:
     - Arrastrar videos entre franjas horarias
     - Actualización rápida de estado con menú contextual
     - Filtrado por estado o categoría

6. **Weather Integration**
   - **Vistas principales**:
     - Widget de clima en encabezados de día
     - Previsión extendida en panel lateral
     - Configurador de ubicación y unidades
   - **Elementos visuales clave**:
     - Íconos de condiciones meteorológicas
     - Indicadores de temperatura
     - Alertas para condiciones adversas
   - **Interacciones especiales**:
     - Cambio rápido de ubicación
     - Integración con eventos al aire libre
     - Vista detallada al hacer clic en widget

## Configuración y Personalización

### Panel de Configuración

El panel de configuración se divide en secciones claramente definidas:

1. **Configuración General**
   - **Firma personalizada**:
     - Campo de texto para el contenido
     - Vista previa en tiempo real
     - Checkbox para mostrar/ocultar
   - **Información de la aplicación**:
     - Versión actual
     - Desarrollador
     - Enlaces a documentación

2. **Configuración de Apariencia**
   - **Selección de tema**:
     - Claro, Oscuro, Púrpura Nocturno
     - Previsualizaciones en miniatura
     - Opción para seguir tema del sistema
   - **Estilo de encabezados de días**:
     - Predeterminado: Nombre completo y número
     - Minimalista: Abreviatura y separador
     - Dashboard: Número en contenedor decorativo
   - **Visualización de horas en eventos**:
     - Posición (arriba, dentro, oculto)
     - Formato (12h/24h)
     - Detalles visibles (ubicación, descripción)

3. **Configuración del Calendario**
   - **Horario visible**:
     - Selectores para hora de inicio y fin
     - Vista previa de rango seleccionado
   - **Días visibles**:
     - Opción para mostrar/ocultar fines de semana
     - Configuración de semana laboral
   - **Escala de tiempo**:
     - Deslizador para píxeles por minuto
     - Campo numérico con validación
     - Indicador de división mínima (30 min)
     - Previsualización del efecto

4. **Respaldo y Restauración**
   - **Configuración visual**:
     - Exportación/importación en formato JSON
     - Restauración a valores predeterminados
   - **Datos del calendario**:
     - Exportación completa o por rango de fechas
     - Importación con validación de conflictos
     - Opciones de borrado selectivo o completo
   - **Copias de seguridad**:
     - Configuración de respaldo automático
     - Programación (diaria, semanal, mensual)
     - Ubicación de almacenamiento
     - Historial de respaldos con restauración

5. **Configuración de Plugins**
   - Secciones específicas para cada plugin activado
   - Opciones de integración entre plugins
   - Activación/desactivación de plugins

6. **Internacionalización**
   - Selección de idioma (español o inglés)
   - Formatos de fecha y hora según región
   - Previsualización de traducciones

## Versión Móvil

La versión móvil de Atlas mantiene la estética y funcionalidad, adaptada a pantallas pequeñas:

### Estructura Móvil

1. **Encabezado Simplificado**
   - Nombre de la aplicación
   - Botón de menú hamburguesa
   - Acceso rápido a la fecha actual

2. **Navegación Inferior**
   - Pestaña Inicio (dashboard)
   - Pestaña Calendario (vista principal)
   - Botón central para añadir eventos (FAB)
   - Pestaña Plugins (acceso a plugins)
   - Pestaña Perfil (configuraciones)

3. **Vista Principal**
   - Enfoque en la vista diaria como predeterminada
   - Deslizamiento horizontal para cambiar de día
   - Vista de semana simplificada con eventos resumidos
   - Indicadores visuales para días con múltiples eventos

4. **Panel de Detalles Expandible**
   - Aparece desde la parte inferior
   - Ocupa pantalla completa para edición de eventos
   - Controles grandes optimizados para tacto

5. **Menú Lateral**
   - Acceso a todas las funciones
   - Configuración y personalización
   - Lista de plugins disponibles
   - Opción para sincronización y backup

### Adaptaciones para Móvil

- **Interacciones táctiles**:
  - Gestos de pellizco para zoom (escala de tiempo)
  - Mantener pulsado para crear eventos
  - Deslizar eventos para ajustar duración
  - Tocar dos veces para edición rápida

- **Presentación de información**:
  - Mostrar solo información esencial en vistas resumidas
  - Acceso a detalles completos mediante toque
  - Uso eficiente del espacio en pantalla

## Accesibilidad y Optimización

### Funciones de Accesibilidad

- **Contraste y color**:
  - Relaciones de contraste AA/AAA para todo el texto
  - Modo de alto contraste disponible
  - Indicadores no basados solo en color

- **Tamaño y legibilidad**:
  - Tamaños ajustables para texto e interfaz
  - Respeto de configuración de accesibilidad del sistema
  - Fuentes legibles en todas las resoluciones

- **Navegación por teclado**:
  - Enfoque visible y distintivo
  - Atajos de teclado para acciones comunes
  - Orden de tabulación lógico

- **Asistencia tecnológica**:
  - Etiquetas ARIA para componentes interactivos
  - Mensajes descriptivos para lectores de pantalla
  - Texto alternativo para elementos visuales

### Optimización de Rendimiento

- **Eficiencia en renderizado**:
  - Carga progresiva para grandes cantidades de eventos
  - Virtualización de listas largas
  - Caché inteligente para datos frecuentes

- **Opciones de rendimiento**:
  - Modo de ahorro de recursos
  - Reducción opcional de animaciones
  - Optimización para dispositivos de bajas especificaciones

### Adaptabilidad

- **Soporte multiplataforma**:
  - Interfaces optimizadas para escritorio, tablet y móvil
  - Adaptación a diferentes densidades de píxeles
  - Soporte para modos horizontal y vertical en dispositivos móviles

- **Personalización avanzada**:
  - Atajos de teclado configurables
  - Disposiciones de panel personalizables
  - Modo táctil mejorado para dispositivos híbridos

---

Este diseño visual para Atlas v1.0.0 representa una implementación completa de todas las características descritas en la documentación, con especial atención a las funcionalidades avanzadas como el sistema de imán (snap), escalas de tiempo independientes y la integración detallada de todos los plugins. La interfaz está diseñada para ser modular, adaptable y potente sin sacrificar la simplicidad, alineándose perfectamente con los valores fundamentales de la marca Atlas.

**Nota sobre las fechas**: Los ejemplos y referencias a fechas en esta documentación son ilustrativos.