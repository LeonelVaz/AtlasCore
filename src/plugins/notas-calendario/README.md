# Administrador de Notas para Atlas

## Descripción

Plugin que permite añadir, organizar y visualizar notas detalladas asociadas con fechas y eventos específicos del calendario Atlas. Utiliza las nuevas capacidades de extensión del sistema de plugins para integrar notas directamente en la interfaz del calendario.

## Características

### 1. Notas en Celdas del Calendario
- Indicadores visuales en las celdas del día que muestran la cantidad de notas
- Vista rápida de notas al hacer clic en el indicador
- Indicador destacado para notas nuevas o importantes

### 2. Notas de Eventos
- Espacio dedicado para añadir notas a eventos específicos
- Editor de texto enriquecido para dar formato a las notas
- Posibilidad de añadir múltiples notas a un mismo evento

### 3. Dashboard de Notas
- Página centralizada para gestionar todas las notas
- Filtrado por eventos, días y próximas notas
- Vista detallada de todas las notas almacenadas

### 4. Texto Enriquecido
- Soporte para formato básico (negrita, cursiva, subrayado)
- Creación de listas ordenadas y con viñetas
- Inserción de enlaces e imágenes

## Uso

### Añadir Notas a un Evento
1. Haz clic en un evento en el calendario
2. En el panel de edición del evento, encuentra la sección "Notas"
3. Haz clic en el botón "+" para añadir una nueva nota
4. Escribe un título (opcional) y el contenido de la nota
5. Da formato al texto utilizando los controles del editor
6. Haz clic en "Guardar" para añadir la nota al evento

### Añadir Notas a un Día
1. Navega al Dashboard de Notas desde la barra lateral
2. Selecciona la pestaña "Días"
3. Haz clic en "Añadir Nota a Día"
4. Selecciona la fecha y escribe tu nota
5. Guarda la nota

### Acceder al Dashboard de Notas
1. Haz clic en "Notas" en la barra lateral de navegación
2. Explora las diferentes pestañas para ver:
   - Próximas: Notas para eventos y días futuros
   - Eventos: Todas las notas asociadas a eventos
   - Días: Todas las notas asociadas a días específicos

## API para Otros Plugins

El plugin expone una API pública que otros plugins pueden utilizar:

```javascript
// Obtener notas para un evento específico
const eventNotes = await core.plugins.getPluginAPI(miPluginId, 'notas-calendario').getNotesForEvent(eventId);

// Obtener notas para un día específico
const dayNotes = await core.plugins.getPluginAPI(miPluginId, 'notas-calendario').getNotesForDay(date);

// Añadir nota a un evento
await core.plugins.getPluginAPI(miPluginId, 'notas-calendario').addNoteToEvent(eventId, {
  title: 'Título de la nota',
  content: 'Contenido de la nota con <b>formato</b>'
});

// Añadir nota a un día
await core.plugins.getPluginAPI(miPluginId, 'notas-calendario').addNoteToDay(date, {
  title: 'Título de la nota',
  content: 'Contenido de la nota con <b>formato</b>'
});
```

## Requisitos

- Atlas versión 0.3.0 o superior
- Navegador moderno con soporte para ES6

## Licencia

Este plugin es parte del ecosistema Atlas y está disponible bajo la misma licencia que la aplicación principal.

---

© 2025 Equipo Atlas | Versión 1.0.0