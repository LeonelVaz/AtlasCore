# Video Scheduler

## Visión General
El plugin Video Scheduler está diseñado para creadores de contenido que necesitan planificar, organizar y dar seguimiento a su producción de videos. Permite programar la creación, producción y publicación de videos en diferentes franjas horarias, gestionar estados de producción y hacer seguimiento de métricas e ingresos asociados.

## Arquitectura
El plugin se estructura en torno a un sistema de franjas horarias dedicadas a la producción de video, con integración directa al calendario principal.

```
Video Scheduler
│
├── Componentes UI
│   ├── VideoScheduler (Componente principal)
│   ├── VideoSlot (Franja individual de video)
│   ├── StatusSelector (Selector de estado de producción)
│   └── EarningsTracker (Seguimiento de ingresos)
│
├── Gestión de Estado
│   └── VideoContext (Contexto de producción de videos)
│
├── Utilidades
│   ├── videoUtils (Funciones de procesamiento y formateo)
│   └── eventConverter (Conversión entre eventos y videos)
│
├── Estilos
│   └── videoScheduler.css (Estilos específicos del plugin)
│
└── Traducciones
    ├── es/ (Español)
    │   └── video.json
    └── en/ (Inglés)
        └── video.json
```

## API y Interfaces
El plugin expone las siguientes funcionalidades a través de su API:

### Métodos Públicos
| Método | Parámetros | Retorno | Descripción |
|--------|------------|---------|-------------|
| `getAllVideos` | `filters?: FilterOptions` | `Array<Video>` | Obtiene todos los videos programados |
| `getVideoById` | `id: string` | `Video \| null` | Obtiene un video específico por ID |
| `getVideosByDate` | `date: Date` | `Array<Video>` | Obtiene videos programados para una fecha |
| `createVideo` | `videoData: VideoData` | `Video` | Crea un nuevo video en la programación |
| `updateVideo` | `id: string, videoData: Partial<VideoData>` | `Video` | Actualiza un video existente |
| `deleteVideo` | `id: string` | `boolean` | Elimina un video de la programación |
| `getProductionStatus` | `id: string` | `ProductionStatus` | Obtiene el estado de producción de un video |
| `updateProductionStatus` | `id: string, status: ProductionStatus` | `Video` | Actualiza el estado de producción |
| `trackEarnings` | `id: string, earnings: EarningsData` | `Video` | Registra ingresos para un video |
| `getMonthlySchedule` | `month: number, year: number` | `MonthlySchedule` | Obtiene programación mensual completa |
| `getEarningsReport` | `options: ReportOptions` | `EarningsReport` | Genera reporte de ingresos |
| `convertToEvent` | `videoId: string` | `CalendarEvent` | Convierte un video en evento del calendario |
| `convertFromEvent` | `eventId: string` | `Video` | Convierte un evento del calendario en video |

### Eventos
| Nombre del Evento | Datos | Descripción |
|-------------------|------|-------------|
| `video-scheduler.video_created` | `{ video: Video }` | Se dispara cuando se crea un nuevo video |
| `video-scheduler.video_updated` | `{ video: Video, previousData: Partial<Video> }` | Se dispara cuando se actualiza un video |
| `video-scheduler.video_deleted` | `{ id: string }` | Se dispara cuando se elimina un video |
| `video-scheduler.status_changed` | `{ videoId: string, newStatus: string, oldStatus: string }` | Se dispara cuando cambia el estado de producción |
| `video-scheduler.earnings_updated` | `{ videoId: string, earnings: EarningsData }` | Se dispara cuando se actualizan ingresos |

## Integración con el Sistema Principal
El plugin se integra con el núcleo de Atlas de la siguiente manera:

### Registro del Módulo
```javascript
// Registro del módulo Video Scheduler
registerModule('video-scheduler', videoSchedulerAPI);
```

### Suscripción a Eventos
```javascript
// Suscripción a eventos del calendario
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_CREATED, handleEventCreated);
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_UPDATED, handleEventUpdated);
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_DELETED, handleEventDeleted);
```

### Extensiones UI
- Añade una entrada "Programador de Videos" en la navegación principal
- Integra indicadores visuales para videos en el calendario principal
- Proporciona un panel completo para gestión de videos y producción
- Añade una sección en la configuración para preferencias del programador

## Estados y Ciclo de Vida
1. **Inicialización**: Carga de videos programados y configuración
2. **Planificación**: Creación y asignación de videos a franjas horarias
3. **Producción**: Seguimiento del estado de producción de cada video
4. **Publicación**: Registro de publicación y configuración de seguimiento
5. **Análisis**: Seguimiento de métricas e ingresos por video
6. **Archivado**: Cierre de ciclo de vida de videos completados

## Estructura de Datos
```javascript
// Estructura de un video programado
const videoExample = {
  id: 'video-123456',
  title: 'Cómo usar Atlas efectivamente',
  description: 'Tutorial sobre las funcionalidades principales de Atlas',
  slot: {
    date: '2025-04-15',
    timeSlot: 'morning' // 'morning', 'afternoon', 'evening'
  },
  status: 'in-production', // 'planned', 'scripting', 'in-production', 'editing', 'published'
  platform: 'youtube',
  duration: 15, // duración planificada en minutos
  tags: ['tutorial', 'productividad', 'atlas'],
  thumbnail: 'thumbnail-url.jpg', // URL de la miniatura (opcional)
  eventId: 'event-789', // ID del evento vinculado (opcional)
  createdAt: '2025-04-01T10:30:00Z',
  updatedAt: '2025-04-10T14:45:00Z',
  publishedAt: null, // fecha de publicación (si está publicado)
  productionMetadata: {
    scriptComplete: true,
    recordingComplete: true,
    editingProgress: 50, // porcentaje completado
    thumbnailReady: false,
    notes: 'Necesita corrección de color en algunas escenas'
  },
  earnings: {
    currency: 'USD',
    total: 124.50,
    breakdown: {
      'adsense': 95.20,
      'sponsorships': 29.30
    },
    lastUpdated: '2025-04-20T08:15:00Z'
  }
};

// Estructura de una franja horaria
const slotExample = {
  id: 'slot-20250415-morning',
  date: '2025-04-15',
  timeSlot: 'morning',
  videoId: 'video-123456',
  isAvailable: false, // false si hay un video asignado
  timeRange: {
    start: '09:00',
    end: '12:00'
  }
};
```

## Guía de Uso para Desarrolladores
Para integrar con el plugin Video Scheduler:

1. Obtenga la API del módulo
   ```javascript
   const videoScheduler = getModule('video-scheduler');
   if (!videoScheduler) {
     console.warn('Plugin Video Scheduler no disponible');
     return;
   }
   ```

2. Acceda a los videos y franjas horarias
   ```javascript
   // Obtener videos para una fecha específica
   const date = new Date('2025-04-15');
   const videos = videoScheduler.getVideosByDate(date);
   
   // Crear un nuevo video
   const newVideo = videoScheduler.createVideo({
     title: 'Nuevo tutorial',
     description: 'Descripción del video',
     slot: {
       date: '2025-04-20',
       timeSlot: 'afternoon'
     },
     status: 'planned',
     platform: 'youtube',
     duration: 12
   });
   ```

3. Suscriba a eventos para reaccionar a cambios
   ```javascript
   subscribeToEvent('video-scheduler.status_changed', handleStatusChange);
   subscribeToEvent('video-scheduler.earnings_updated', handleEarningsUpdate);
   ```

## Ejemplos de Uso

### Ejemplo Básico: Crear video desde un evento
```javascript
function convertEventToVideo(eventId) {
  const calendar = getModule('calendar');
  const videoScheduler = getModule('video-scheduler');
  
  if (!calendar || !videoScheduler) return null;
  
  const event = calendar.getEvent(eventId);
  if (!event) return null;
  
  // Determinar la franja horaria basada en la hora del evento
  const date = new Date(event.start);
  const hour = date.getHours();
  let timeSlot = 'afternoon';
  
  if (hour < 12) {
    timeSlot = 'morning';
  } else if (hour >= 17) {
    timeSlot = 'evening';
  }
  
  // Crear el video en el programador
  const newVideo = videoScheduler.createVideo({
    title: event.title,
    description: event.description || '',
    slot: {
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      timeSlot
    },
    status: 'planned',
    platform: 'youtube',
    duration: 15, // duración predeterminada
    eventId: event.id
  });
  
  return newVideo;
}
```

### Ejemplo Avanzado: Panel de seguimiento de producción
```javascript
function ProductionTrackingPanel() {
  const [videos, setVideos] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const videoScheduler = getModule('video-scheduler');
  
  // Estados de producción disponibles
  const productionStatuses = [
    { id: 'all', name: 'Todos' },
    { id: 'planned', name: 'Planificado' },
    { id: 'scripting', name: 'Guionización' },
    { id: 'in-production', name: 'En Producción' },
    { id: 'editing', name: 'Edición' },
    { id: 'published', name: 'Publicado' }
  ];
  
  // Opciones de ordenación
  const sortOptions = [
    { id: 'date', name: 'Fecha' },
    { id: 'title', name: 'Título' },
    { id: 'status', name: 'Estado' },
    { id: 'earnings', name: 'Ingresos' }
  ];
  
  useEffect(() => {
    if (!videoScheduler) return;
    
    // Obtener y filtrar videos
    const fetchVideos = () => {
      try {
        let allVideos = videoScheduler.getAllVideos();
        
        // Filtrar por estado si no es 'all'
        if (selectedStatus !== 'all') {
          allVideos = allVideos.filter(
            video => video.status === selectedStatus
          );
        }
        
        // Ordenar videos
        const sortedVideos = sortVideos(allVideos, sortBy);
        setVideos(sortedVideos);
      } catch (err) {
        console.error('Error al obtener videos:', err);
      }
    };
    
    // Cargar videos inicialmente
    fetchVideos();
    
    // Suscribirse a cambios relevantes
    const events = [
      'video-scheduler.video_created',
      'video-scheduler.video_updated',
      'video-scheduler.video_deleted',
      'video-scheduler.status_changed'
    ];
    
    const unsubscribes = events.map(event => 
      subscribeToEvent(event, fetchVideos)
    );
    
    // Limpieza
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [selectedStatus, sortBy]);
  
  // Función para ordenar videos
  const sortVideos = (videosToSort, sortCriteria) => {
    return [...videosToSort].sort((a, b) => {
      switch (sortCriteria) {
        case 'date':
          return new Date(a.slot.date) - new Date(b.slot.date);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'earnings':
          return (b.earnings?.total || 0) - (a.earnings?.total || 0);
        default:
          return 0;
      }
    });
  };
  
  // Manejador de cambio de estado
  const handleStatusChange = (videoId, newStatus) => {
    if (!videoScheduler) return;
    
    try {
      videoScheduler.updateProductionStatus(videoId, newStatus);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };
  
  // Manejador para actualizar ingresos
  const handleEarningsUpdate = (videoId, amount, source) => {
    if (!videoScheduler) return;
    
    try {
      // Obtener datos de ingresos actuales
      const video = videoScheduler.getVideoById(videoId);
      if (!video) return;
      
      const currentEarnings = video.earnings || {
        currency: 'USD',
        total: 0,
        breakdown: {}
      };
      
      // Actualizar con nuevos datos
      const breakdown = { ...currentEarnings.breakdown };
      breakdown[source] = (breakdown[source] || 0) + amount;
      
      const newTotal = Object.values(breakdown).reduce(
        (sum, val) => sum + val, 0
      );
      
      // Guardar actualización
      videoScheduler.trackEarnings(videoId, {
        currency: currentEarnings.currency,
        total: newTotal,
        breakdown,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error al actualizar ingresos:', err);
    }
  };
  
  // Si el plugin no está disponible
  if (!videoScheduler) {
    return (
      <div className="plugin-not-available">
        El programador de videos no está disponible
      </div>
    );
  }
  
  // Renderizar panel de seguimiento
  return (
    <div className="production-tracking-panel">
      <div className="panel-header">
        <h2>Seguimiento de Producción</h2>
        
        <div className="controls">
          <div className="filter-control">
            <label>Estado:</label>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {productionStatuses.map(status => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="sort-control">
            <label>Ordenar por:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {sortOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {videos.length === 0 ? (
        <div className="no-videos">
          No hay videos que coincidan con los filtros seleccionados
        </div>
      ) : (
        <div className="videos-table">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Fecha</th>
                <th>Franja</th>
                <th>Estado</th>
                <th>Progreso</th>
                <th>Ingresos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {videos.map(video => (
                <tr key={video.id} className={`status-${video.status}`}>
                  <td>{video.title}</td>
                  <td>{formatDate(video.slot.date)}</td>
                  <td>{formatTimeSlot(video.slot.timeSlot)}</td>
                  <td>
                    <select 
                      value={video.status}
                      onChange={(e) => handleStatusChange(video.id, e.target.value)}
                      className="status-selector"
                    >
                      {productionStatuses
                        .filter(status => status.id !== 'all')
                        .map(status => (
                          <option key={status.id} value={status.id}>
                            {status.name}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${calculateProgress(video)}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {calculateProgress(video)}%
                    </span>
                  </td>
                  <td className="earnings-cell">
                    {video.earnings ? (
                      <>
                        <span className="amount">
                          {formatCurrency(video.earnings.total, video.earnings.currency)}
                        </span>
                        <button 
                          className="update-earnings"
                          onClick={() => openEarningsDialog(video)}
                        >
                          +
                        </button>
                      </>
                    ) : (
                      <button 
                        className="add-earnings"
                        onClick={() => openEarningsDialog(video)}
                      >
                        Añadir
                      </button>
                    )}
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="edit-btn"
                      onClick={() => openEditDialog(video)}
                    >
                      Editar
                    </button>
                    <button 
                      className="calendar-btn"
                      onClick={() => navigateToCalendarEvent(video)}
                    >
                      Ver en Calendario
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Funciones auxiliares
function calculateProgress(video) {
  if (video.status === 'published') return 100;
  
  const progressMap = {
    'planned': 10,
    'scripting': 30,
    'in-production': 50,
    'editing': 80
  };
  
  const baseProgress = progressMap[video.status] || 0;
  
  // Ajustar según metadatos de producción
  if (video.productionMetadata) {
    if (video.status === 'scripting' && video.productionMetadata.scriptComplete) {
      return baseProgress + 10;
    }
    
    if (video.status === 'in-production' && video.productionMetadata.recordingComplete) {
      return baseProgress + 20;
    }
    
    if (video.status === 'editing') {
      return baseProgress + Math.floor(video.productionMetadata.editingProgress / 5);
    }
  }
  
  return baseProgress;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function formatTimeSlot(slot) {
  const slotNames = {
    'morning': 'Mañana',
    'afternoon': 'Tarde',
    'evening': 'Noche'
  };
  return slotNames[slot] || slot;
}

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);
}

// Estas funciones serían implementadas según la UI específica
function openEarningsDialog(video) {
  // Implementación del diálogo para actualizar ingresos
}

function openEditDialog(video) {
  // Implementación del diálogo para editar video
}

function navigateToCalendarEvent(video) {
  // Navegación al evento en el calendario
}
```

## Dependencias
- **Calendario**: Integración con el módulo de calendario para visualización y sincronización
- **Almacenamiento**: Persiste datos de videos y configuración
- **UI**: Componentes específicos para gestión de videos y producción
- **Gráficos**: Para visualización de ingresos y estadísticas
- **Internacionalización**: Utiliza el servicio de i18n para traducciones

## Consideraciones de Rendimiento
- Optimización de vista mensual para carga rápida y navegación fluida
- Renderizado eficiente de listas de videos para grandes catálogos
- Recálculo inteligente de estadísticas de ingresos solo cuando es necesario
- Sincronización selectiva con el calendario para evitar sobrecarga
- Caché de resultados frecuentes para mejorar la experiencia de usuario

## Solución de Problemas Comunes
| Problema | Causa | Solución |
|----------|-------|----------|
| Videos no aparecen en calendario | Sincronización desactivada | Activar "Mostrar videos en calendario" en configuración |
| Conflictos de franja horaria | Múltiples videos en misma franja | Usar función "Resolver conflictos" en panel de gestión |
| Ingresos no actualizados | Datos no sincronizados | Actualizar manualmente o recargar datos |
| Estados de producción incorrectos | Desincronización con sistema externo | Usar la función "Sincronizar estados" en configuración |
| Visualización incorrecta en móvil | Pantalla pequeña para tabla completa | Activar "Vista compacta para móvil" en preferencias |

## Historial de Versiones
| Versión | Cambios |
|---------|---------|
| 0.5.0   | Versión inicial con programación básica y estados de producción |
| 0.5.5   | Añadido sistema de seguimiento de ingresos |
| 0.6.0   | Mejorada integración con calendario y sincronización |
| 0.8.0   | Implementadas visualizaciones de análisis e ingresos |
| 1.0.0   | Soporte completo para internacionalización y accesibilidad |