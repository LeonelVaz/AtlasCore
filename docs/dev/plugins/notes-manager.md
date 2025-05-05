# Notes Manager

## Visión General
El plugin Notes Manager permite asociar notas a fechas específicas o eventos del calendario. Las notas pueden contener texto formateado, listas y contenido enriquecido, proporcionando una capa de documentación y contexto a la planificación del tiempo.

## Arquitectura
El plugin se integra con el calendario principal de Atlas, añadiendo una capa de notas que complementa los eventos existentes. Utiliza su propio almacenamiento para mantener las notas, pero establece referencias a los eventos y fechas del calendario.

```
Notes Manager
│
├── Componentes UI
│   ├── NotesList (Panel de lista de notas)
│   ├── NoteEditor (Editor de texto enriquecido)
│   └── NotesPanel (Contenedor principal)
│
├── Gestión de Estado
│   └── NotesContext (Estado global de notas)
│
├── Utilidades
│   └── notesUtils (Funciones de procesamiento y formateo)
│
├── Estilos
│   └── notes.css (Estilos específicos del plugin)
│
└── Traducciones
    ├── es/ (Español)
    │   └── notes.json
    └── en/ (Inglés)
        └── notes.json
```

## API y Interfaces
El plugin expone las siguientes funcionalidades a través de su API:

### Métodos Públicos
| Método | Parámetros | Retorno | Descripción |
|--------|------------|---------|-------------|
| `getAllNotes` | ninguno | `Array<Note>` | Devuelve todas las notas |
| `getNotesByDate` | `date: Date` | `Array<Note>` | Devuelve las notas para una fecha específica |
| `getNotesByEvent` | `eventId: string` | `Array<Note>` | Devuelve las notas asociadas a un evento específico |
| `createNote` | `noteData: NoteData` | `Note` | Crea una nueva nota |
| `updateNote` | `id: string, noteData: Partial<NoteData>` | `Note` | Actualiza una nota existente |
| `deleteNote` | `id: string` | `boolean` | Elimina una nota |
| `getCategories` | ninguno | `Array<Category>` | Devuelve todas las categorías de notas |

### Eventos
| Nombre del Evento | Datos | Descripción |
|-------------------|------|-------------|
| `notes-manager.note_created` | `{ note: Note }` | Se dispara cuando se crea una nueva nota |
| `notes-manager.note_updated` | `{ note: Note, previousData: Partial<Note> }` | Se dispara cuando se actualiza una nota |
| `notes-manager.note_deleted` | `{ id: string }` | Se dispara cuando se elimina una nota |
| `notes-manager.category_created` | `{ category: Category }` | Se dispara cuando se crea una nueva categoría |

## Integración con el Sistema Principal
El plugin se integra con el núcleo de Atlas a través de varios mecanismos:

### Registro del Módulo
```javascript
// Registro del módulo Notes Manager
registerModule('notes-manager', notesManagerAPI);
```

### Suscripción a Eventos
```javascript
// Suscripción a eventos del calendario
subscribeToEvent(EVENT_TYPES.CALENDAR.DATE_SELECTED, handleDateSelected);
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_CREATED, handleEventCreated);
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_DELETED, handleEventDeleted);
```

### Extensiones UI
- Añade un icono de notas en la barra de herramientas principal
- Extiende la UI de eventos con un contador de notas asociadas
- Muestra indicadores visuales en días con notas en el calendario

## Estados y Ciclo de Vida
1. **Inicialización**: Carga de notas desde almacenamiento local
2. **Sincronización**: Comprobación de referencias a eventos existentes
3. **Funcionamiento normal**: Creación, edición y eliminación de notas
4. **Limpieza**: Al desactivar el plugin, se guardan todos los cambios pendientes

## Estructura de Datos
```javascript
// Estructura de una nota
const noteExample = {
  id: 'note-123456',
  title: 'Título de la nota',
  content: '<p>Contenido formateado de la <strong>nota</strong></p>',
  createdAt: '2025-01-15T10:30:00Z',
  updatedAt: '2025-01-16T08:45:00Z',
  color: '#26A69A',
  categoryId: 'category-work',
  references: {
    type: 'event', // o 'date'
    id: 'event-789' // o fecha ISO para referencias de tipo 'date'
  },
  tags: ['importante', 'proyecto-atlas']
};

// Estructura de una categoría
const categoryExample = {
  id: 'category-work',
  name: 'Trabajo',
  color: '#2D4B94',
  icon: 'briefcase'
};
```

## Guía de Uso para Desarrolladores
Para integrar con el plugin Notes Manager:

1. Obtenga la API del módulo
   ```javascript
   const notesManager = getModule('notes-manager');
   if (!notesManager) {
     console.warn('Plugin Notes Manager no disponible');
     return;
   }
   ```

2. Acceda a las notas relacionadas con su contexto
   ```javascript
   // Para un evento específico
   const notesForEvent = notesManager.getNotesByEvent(eventId);
   
   // Para una fecha específica
   const notesForDate = notesManager.getNotesByDate(new Date());
   ```

3. Suscriba a eventos para reaccionar a cambios
   ```javascript
   subscribeToEvent('notes-manager.note_created', handleNoteCreated);
   ```

## Ejemplos de Uso

### Ejemplo Básico: Crear una nota para un evento
```javascript
const notesManager = getModule('notes-manager');
if (notesManager) {
  const newNote = notesManager.createNote({
    title: 'Preparación para reunión',
    content: '<p>Puntos a discutir:</p><ul><li>Presupuesto</li><li>Cronograma</li></ul>',
    references: {
      type: 'event',
      id: 'event-123'
    }
  });
  console.log('Nota creada:', newNote);
}
```

### Ejemplo Avanzado: Panel personalizado de notas para un módulo
```javascript
function CustomNotesPanel({ moduleId, itemId }) {
  const [notes, setNotes] = useState([]);
  const notesManager = getModule('notes-manager');
  
  useEffect(() => {
    if (notesManager) {
      // Obtener notas iniciales
      const moduleNotes = notesManager.getNotesByReference(moduleId, itemId);
      setNotes(moduleNotes);
      
      // Suscribirse a cambios
      const unsubscribe = subscribeToEvent('notes-manager.note_updated', 
        (data) => {
          if (data.note.references.type === moduleId && 
              data.note.references.id === itemId) {
            setNotes(prevNotes => 
              prevNotes.map(note => 
                note.id === data.note.id ? data.note : note
              )
            );
          }
        }
      );
      
      return unsubscribe;
    }
  }, [moduleId, itemId]);
  
  // Renderizar panel personalizado de notas
  return (
    <div className="custom-notes-panel">
      {notes.length > 0 ? (
        notes.map(note => (
          <div key={note.id} className="note-card">
            <h3>{note.title}</h3>
            <div dangerouslySetInnerHTML={{ __html: note.content }} />
          </div>
        ))
      ) : (
        <p>No hay notas asociadas.</p>
      )}
    </div>
  );
}
```

## Dependencias
- **Editor de texto enriquecido**: Utiliza un componente personalizado basado en `contenteditable`
- **Almacenamiento**: Depende del `storageService` de Atlas
- **UI**: Comparte componentes de UI reutilizables del núcleo de Atlas
- **Internacionalización**: Utiliza el servicio de i18n para traducciones

## Consideraciones de Rendimiento
- Las notas se cargan bajo demanda para evitar sobrecargar la aplicación
- El contenido HTML se sanitiza antes de renderizarse para prevenir vulnerabilidades XSS
- Las operaciones de búsqueda están optimizadas con índices para mejorar el rendimiento
- Las notas de más de 10KB utilizan renderizado virtual para mejorar la velocidad

## Solución de Problemas Comunes
| Problema | Causa | Solución |
|----------|-------|----------|
| Las notas no aparecen en el calendario | Indicadores visuales desactivados | Verificar configuración "Mostrar indicadores de notas" |
| Editor muestra HTML en lugar de texto formateado | Error en la inicialización del editor | Recargar la aplicación o reinstalar el plugin |
| Notas huérfanas tras eliminar eventos | Referencias a eventos eliminados | Usar la función "Limpiar referencias" en configuración |
| Conflictos al editar la misma nota desde dos lugares | Edición concurrente | El plugin utiliza la estrategia "último en guardar" |

## Historial de Versiones
| Versión | Cambios |
|---------|---------|
| 0.3.0   | Versión inicial con funcionalidades básicas |
| 0.3.5   | Añadido soporte para categorías y etiquetas |
| 0.4.0   | Mejorado editor de texto con soporte para imágenes |
| 0.5.0   | Integración con búsqueda global y filtros avanzados |
| 1.0.0   | Soporte completo para internacionalización y nuevos temas |