# Task Tracker

## Visión General
El plugin Task Tracker implementa un sistema completo de gestión de tareas integrado con el calendario de Atlas. Permite crear tareas con fechas de vencimiento, prioridades y estados de progreso, visualizarlas en un tablero Kanban o lista, y sincronizarlas opcionalmente con el calendario principal como eventos.

## Arquitectura
El plugin se integra con el núcleo de Atlas a través de eventos y el registro de módulos, manteniendo su propio almacenamiento y lógica de negocio.

```
task-tracker/
├── index.js                 # Punto de entrada del plugin
├── components/              # (Componentes UI)
│   ├── task-board.jsx       # (Vista tablero Kanban)
│   ├── task-list.jsx        # (Vista de lista)
│   ├── task-item.jsx        # (Componente de tarea individual)
│   └── task-form.jsx        # (Formulario para crear/editar tareas)
├── contexts/                # (Contextos)
│   └── task-context.jsx     # (Contexto global de tareas)
├── utils/                   # (Utilidades)
│   ├── task-utils.js        # (Utilidades específicas)
│   └── task-to-event.js     # (Conversión entre tareas y eventos)
├── styles/                  # (Estilos)
│   └── tasks.css            # (Estilos específicos)
├── locales/                 # (Traducciones)
│   ├── es/                  # (Español)
│   │   └── tasks.json
│   └── en/                  # (Inglés)
│       └── tasks.json
└── README.md                # (Documentación)
```

## API y Interfaces
El plugin expone las siguientes funcionalidades a través de su API:

### Métodos Públicos
| Método | Parámetros | Retorno | Descripción |
|--------|------------|---------|-------------|
| `getAllTasks` | `filters?: FilterOptions` | `Array<Task>` | Obtiene todas las tareas, opcionalmente filtradas |
| `getTaskById` | `id: string` | `Task \| null` | Obtiene una tarea específica por ID |
| `createTask` | `taskData: TaskData` | `Task` | Crea una nueva tarea |
| `updateTask` | `id: string, taskData: Partial<TaskData>` | `Task` | Actualiza una tarea existente |
| `deleteTask` | `id: string` | `boolean` | Elimina una tarea |
| `moveTask` | `id: string, newStatus: string` | `Task` | Cambia el estado de una tarea (mover en Kanban) |
| `getTaskStatuses` | ninguno | `Array<Status>` | Obtiene todos los estados de tarea configurados |
| `getTasksByDate` | `date: Date` | `Array<Task>` | Obtiene tareas para una fecha específica |
| `convertToEvent` | `taskId: string` | `CalendarEvent` | Convierte una tarea en evento del calendario |
| `convertFromEvent` | `eventId: string` | `Task` | Convierte un evento del calendario en tarea |

### Eventos
| Nombre del Evento | Datos | Descripción |
|-------------------|------|-------------|
| `task-tracker.task_created` | `{ task: Task }` | Se dispara cuando se crea una nueva tarea |
| `task-tracker.task_updated` | `{ task: Task, previousData: Partial<Task> }` | Se dispara cuando se actualiza una tarea |
| `task-tracker.task_deleted` | `{ id: string }` | Se dispara cuando se elimina una tarea |
| `task-tracker.task_moved` | `{ task: Task, previousStatus: string }` | Se dispara cuando una tarea cambia de estado |
| `task-tracker.status_created` | `{ status: Status }` | Se dispara cuando se crea un nuevo estado |

## Integración con el Sistema Principal
El plugin se integra con el núcleo de Atlas de la siguiente manera:

### Registro del Módulo
```javascript
// Registro del módulo Task Tracker
registerModule('task-tracker', taskTrackerAPI);
```

### Suscripción a Eventos
```javascript
// Suscripción a eventos del calendario
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_CREATED, handleEventCreated);
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_UPDATED, handleEventUpdated);
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_DELETED, handleEventDeleted);
```

### Extensiones UI
- Añade una entrada "Tareas" en la navegación principal
- Extiende el menú contextual de eventos con opción "Convertir a tarea"
- Añade indicadores visuales en el calendario para días con tareas pendientes

## Estados y Ciclo de Vida
1. **Inicialización**: Carga de tareas desde almacenamiento y verificación de referencias
2. **Sincronización**: Comprobación de eventos vinculados a tareas
3. **Funcionamiento normal**: Gestión de tareas y estado Kanban
4. **Respaldo**: Guardado periódico del estado de las tareas
5. **Limpieza**: Al desactivar, se guardan las tareas y se eliminan listeners

## Estructura de Datos
```javascript
// Estructura de una tarea
const taskExample = {
  id: 'task-123456',
  title: 'Implementar nueva funcionalidad',
  description: 'Detalles sobre la implementación...',
  status: 'in-progress',
  priority: 2, // 1-3, donde 3 es la más alta
  dueDate: '2025-02-20T18:00:00Z',
  createdAt: '2025-02-15T10:30:00Z',
  updatedAt: '2025-02-16T14:45:00Z',
  tags: ['desarrollo', 'frontend'],
  color: '#26A69A',
  assignee: 'user1',
  eventId: 'event-789', // ID del evento vinculado (opcional)
  subtasks: [
    { id: 'subtask-1', title: 'Diseñar interfaz', completed: true },
    { id: 'subtask-2', title: 'Escribir tests', completed: false }
  ],
  completionPercentage: 50
};

// Estructura de un estado de tarea
const statusExample = {
  id: 'in-progress',
  name: 'En Progreso',
  order: 2,
  color: '#FFB300',
  isDefaultStatus: false
};
```

## Guía de Uso para Desarrolladores
Para integrar con el plugin Task Tracker:

1. Obtenga la API del módulo
   ```javascript
   const taskTracker = getModule('task-tracker');
   if (!taskTracker) {
     console.warn('Plugin Task Tracker no disponible');
     return;
   }
   ```

2. Acceda a las tareas y utilice la API
   ```javascript
   // Obtener todas las tareas
   const allTasks = taskTracker.getAllTasks();
   
   // Crear una nueva tarea
   const newTask = taskTracker.createTask({
     title: 'Nueva tarea',
     status: 'pending',
     priority: 2,
     dueDate: new Date().toISOString()
   });
   ```

3. Suscriba a eventos para reaccionar a cambios
   ```javascript
   subscribeToEvent('task-tracker.task_created', handleTaskCreated);
   subscribeToEvent('task-tracker.task_moved', handleTaskMoved);
   ```

## Ejemplos de Uso

### Ejemplo Básico: Crear una tarea desde un evento
```javascript
function convertEventToTask(eventId) {
  const calendar = getModule('calendar');
  const taskTracker = getModule('task-tracker');
  
  if (!calendar || !taskTracker) return null;
  
  const event = calendar.getEvent(eventId);
  if (!event) return null;
  
  const newTask = taskTracker.createTask({
    title: event.title,
    description: event.description || '',
    dueDate: event.end,
    status: 'pending',
    priority: 2,
    eventId: event.id
  });
  
  return newTask;
}
```

### Ejemplo Avanzado: Componente de resumen de tareas
```javascript
function TaskSummaryWidget() {
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    overdue: 0,
    upcoming: 0
  });
  
  const taskTracker = getModule('task-tracker');
  
  useEffect(() => {
    if (!taskTracker) return;
    
    // Función para calcular estadísticas
    const calculateStats = () => {
      const allTasks = taskTracker.getAllTasks();
      const now = new Date();
      
      const stats = {
        total: allTasks.length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        overdue: allTasks.filter(t => {
          return t.status !== 'completed' && 
                 new Date(t.dueDate) < now;
        }).length,
        upcoming: allTasks.filter(t => {
          const dueDate = new Date(t.dueDate);
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return t.status !== 'completed' && 
                 dueDate >= now && 
                 dueDate <= tomorrow;
        }).length
      };
      
      setTaskStats(stats);
    };
    
    // Calcular estadísticas iniciales
    calculateStats();
    
    // Suscribirse a cambios de tareas
    const events = [
      'task-tracker.task_created',
      'task-tracker.task_updated',
      'task-tracker.task_deleted',
      'task-tracker.task_moved'
    ];
    
    const unsubscribes = events.map(event => 
      subscribeToEvent(event, calculateStats)
    );
    
    // Limpieza
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, []);
  
  // Renderizar widget
  return (
    <div className="task-summary-widget">
      <h3>Resumen de Tareas</h3>
      <div className="stats-grid">
        <div className="stat-box total">
          <span className="value">{taskStats.total}</span>
          <span className="label">Total</span>
        </div>
        <div className="stat-box completed">
          <span className="value">{taskStats.completed}</span>
          <span className="label">Completadas</span>
        </div>
        <div className="stat-box overdue">
          <span className="value">{taskStats.overdue}</span>
          <span className="label">Vencidas</span>
        </div>
        <div className="stat-box upcoming">
          <span className="value">{taskStats.upcoming}</span>
          <span className="label">Próximas</span>
        </div>
      </div>
    </div>
  );
}
```

## Dependencias
- **Drag and Drop**: Utiliza un sistema personalizado para manipular el tablero Kanban
- **Almacenamiento**: Depende del `storageService` de Atlas
- **Calendario**: Integración opcional con el módulo de calendario
- **Internacionalización**: Utiliza el servicio de i18n para traducciones

## Consideraciones de Rendimiento
- Renderizado virtual para listas largas de tareas (>100 items)
- Implementación de memoización para componentes que muestran tareas
- Carga diferida de subtareas para mejorar el tiempo de carga inicial
- Optimización de filtrado y búsqueda con índices en memoria
- Sincronización inteligente con eventos del calendario (solo cuando es necesario)

## Solución de Problemas Comunes
| Problema | Causa | Solución |
|----------|-------|----------|
| Tareas no aparecen en el calendario | Sincronización desactivada | Activar "Mostrar tareas en calendario" en configuración |
| Errores de sincronización con eventos | Modificación simultánea de tarea y evento | La tarea prevalece sobre el evento en caso de conflicto |
| Tareas duplicadas | Conversión múltiple del mismo evento | Verificación automática de duplicados por `eventId` |
| Pérdida de subtareas | Conversión de tarea a evento y viceversa | Las subtareas se preservan en metadatos del evento |

## Historial de Versiones
| Versión | Cambios |
|---------|---------|
| 0.4.0   | Versión inicial con tablero Kanban y vista de lista |
| 0.4.5   | Añadido sistema de subtareas y porcentaje de completitud |
| 0.5.0   | Mejoras en integración con calendario y sincronización bidireccional |
| 0.6.0   | Soporte para múltiples tableros Kanban y categorización |
| 1.0.0   | Soporte completo para internacionalización y accesibilidad |