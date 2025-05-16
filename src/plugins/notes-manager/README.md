# Notes Manager for Atlas

> Plugin para asociar notas a eventos y fechas del calendario en Atlas Core.

## Descripción

El plugin Notes Manager permite asociar notas a fechas específicas o eventos del calendario en Atlas. Las notas pueden contener texto formateado, listas y contenido enriquecido, proporcionando una capa de documentación y contexto a la planificación del tiempo.

## Características

- ✨ Crear, editar y eliminar notas vinculadas a eventos
- 📝 Editor de texto enriquecido con soporte para formato básico
- 🔍 Búsqueda y filtrado de notas por texto, categoría y etiquetas
- 🏷️ Organización mediante categorías personalizables y etiquetas
- 🔄 Sincronización automática con el calendario
- 🌍 Soporte completo para internacionalización (español e inglés)
- 🎨 Interfaz integrada con los temas de Atlas

## Arquitectura

El plugin se integra con el calendario principal de Atlas, añadiendo una capa de notas que complementa los eventos existentes. Utiliza su propio almacenamiento para mantener las notas, pero establece referencias a los eventos y fechas del calendario.

```
notes-manager/
├── index.js                 # Punto de entrada del plugin
├── components/              # Componentes UI
├── contexts/                # Contextos
├── utils/                   # Utilidades
├── styles/                  # Estilos
├── locales/                 # Traducciones
└── README.md                # Esta documentación
```

## Instalación

1. El plugin viene preinstalado en Atlas Core v0.3.0 y superior
2. Para habilitarlo, ve a **Configuración > Plugins** y activa "Notes Manager"

## Uso

### Acceder al gestor de notas

1. Haz clic en el icono de notas en la barra lateral
2. Se abrirá el panel de notas donde puedes ver, crear, editar y eliminar notas

### Crear una nota desde un evento

1. Al crear o editar un evento, verás una sección de "Notas" 
2. Escribe tu nota en el área de texto
3. La nota se guardará automáticamente cuando guardes el evento

### Ver notas asociadas a un evento

1. Los eventos con notas asociadas mostrarán un pequeño icono de nota
2. Al editar el evento, podrás ver y editar las notas asociadas

## API para Desarrolladores

El plugin expone las siguientes funcionalidades a través de su API:

```javascript
// Obtener la API del módulo
const notesManager = window.__appModules['notes-manager'];

// Obtener todas las notas
const allNotes = await notesManager.getAllNotes();

// Obtener notas para un evento específico
const eventNotes = await notesManager.getNotesByEvent('event-123');

// Obtener notas para una fecha específica
const dateNotes = await notesManager.getNotesByDate(new Date());

// Crear una nueva nota
const newNote = await notesManager.createNote({
  title: 'Título de la nota',
  content: 'Contenido de la nota',
  references: {
    type: 'event',
    id: 'event-123'
  }
});

// Actualizar una nota existente
await notesManager.updateNote('note-123', {
  title: 'Nuevo título',
  content: 'Nuevo contenido'
});

// Eliminar una nota
await notesManager.deleteNote('note-123');
```

## Limitaciones y Consideraciones

- El editor de texto soporta formato básico, pero no imágenes o incrustaciones complejas
- Las notas están almacenadas localmente (no hay sincronización en la nube)
- El rendimiento puede verse afectado con un gran número de notas (500+)

## Solución de Problemas

### Las notas no aparecen asociadas a eventos

1. Verifica que el plugin esté habilitado en Configuración > Plugins
2. Comprueba que hayas guardado correctamente el evento después de añadir la nota
3. Asegúrate de que no se ha eliminado el evento al que estaba asociada la nota

### Pérdida de formato en el editor

1. El editor puede tener problemas con formato complejo pegado desde otras aplicaciones
2. Usa la opción "Limpiar formato" antes de pegar texto de otras fuentes

## Licencia

Este plugin es parte de Atlas Core y está sujeto a las mismas condiciones de licencia.

## Atribuciones

- Utiliza Material Icons para los iconos en la interfaz
- El editor de texto enriquecido está basado en tecnología contenteditable

---

© 2025 Atlas Core Team