# Reminder System

## Visión General
El plugin Reminder System proporciona un sistema avanzado de recordatorios y notificaciones para eventos del calendario de Atlas. Permite configurar alertas personalizadas con diferentes temporizaciones, métodos de notificación y opciones de repetición, mejorando significativamente la utilidad del calendario como herramienta de gestión del tiempo.

## Arquitectura
El plugin se estructura en torno a un sistema central de programación de recordatorios que se integra con los mecanismos de notificación nativos tanto para web como para escritorio.

```
reminder-system/
├── index.js                 # Punto de entrada del plugin 
├── components/              # Componentes UI
│   ├── reminder-settings.jsx # Configuración de recordatorios
│   ├── notification-panel.jsx # Panel de notificaciones
│   └── reminder-form.jsx    # Formulario para crear recordatorios
├── contexts/                # Contextos del plugin
│   └── reminder-context.jsx # Contexto para recordatorios
├── services/                # Servicios del plugin
│   ├── notification-service.js # Gestión de notificaciones
│   └── scheduler-service.js # Programación de recordatorios
├── utils/                   # Utilidades
│   └── reminder-utils.js    # Funciones de procesamiento y formateo
├── styles/                  # Estilos
│   └── reminders.css        # Estilos específicos del plugin
├── locales/                 # Traducciones
│   ├── es/                  # Español
│   │   └── reminders.json
│   └── en/                  # Inglés
│       └── reminders.json
└── README.md                # Documentación del plugin
```

## API y Interfaces
El plugin expone las siguientes funcionalidades a través de su API:

### Métodos Públicos
| Método | Parámetros | Retorno | Descripción |
|--------|------------|---------|-------------|
| `getAllReminders` | ninguno | `Array<Reminder>` | Obtiene todos los recordatorios configurados |
| `getRemindersByEvent` | `eventId: string` | `Array<Reminder>` | Obtiene recordatorios para un evento específico |
| `getActiveReminders` | ninguno | `Array<Reminder>` | Obtiene recordatorios activos no disparados |
| `createReminder` | `reminderData: ReminderData` | `Reminder` | Crea un nuevo recordatorio |
| `updateReminder` | `id: string, data: Partial<ReminderData>` | `Reminder` | Actualiza un recordatorio existente |
| `deleteReminder` | `id: string` | `boolean` | Elimina un recordatorio |
| `snoozeReminder` | `id: string, minutes: number` | `Reminder` | Pospone un recordatorio por X minutos |
| `dismissReminder` | `id: string` | `boolean` | Marca un recordatorio como visto/atendido |
| `getNotificationPreferences` | ninguno | `NotificationPreferences` | Obtiene preferencias de notificación |
| `updateNotificationPreferences` | `prefs: Partial<NotificationPreferences>` | `NotificationPreferences` | Actualiza preferencias |

### Eventos
| Nombre del Evento | Datos | Descripción |
|-------------------|------|-------------|
| `reminder-system.reminder_created` | `{ reminder: Reminder }` | Se dispara cuando se crea un recordatorio |
| `reminder-system.reminder_triggered` | `{ reminder: Reminder, event: CalendarEvent }` | Se dispara cuando se activa un recordatorio |
| `reminder-system.reminder_snoozed` | `{ reminder: Reminder, snoozeMinutes: number }` | Se dispara cuando se pospone un recordatorio |
| `reminder-system.reminder_dismissed` | `{ reminderId: string }` | Se dispara cuando se descarta un recordatorio |
| `reminder-system.preferences_updated` | `{ preferences: NotificationPreferences }` | Se dispara al actualizar preferencias |

## Integración con el Sistema Principal
El plugin se integra con el núcleo de Atlas de la siguiente manera:

### Registro del Módulo
```javascript
// Registro del módulo Reminder System
registerModule('reminder-system', reminderSystemAPI);
```

### Suscripción a Eventos
```javascript
// Suscripción a eventos del calendario
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_CREATED, handleEventCreated);
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_UPDATED, handleEventUpdated);
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_DELETED, handleEventDeleted);
```

### Extensiones UI
- Extiende el panel de detalles de eventos con opciones de recordatorio
- Añade un centro de notificaciones accesible desde la barra de herramientas
- Integra iconos de recordatorio en eventos del calendario
- Añade una sección en la configuración para preferencias de notificaciones

## Estados y Ciclo de Vida
1. **Inicialización**: Carga de recordatorios y preferencias, verificación de permisos de notificación
2. **Programación**: Cálculo de próximos recordatorios basado en eventos del calendario
3. **Monitorización**: Verificación periódica de recordatorios que deben activarse
4. **Notificación**: Entrega de alertas a través del canal apropiado según plataforma
5. **Interacción**: Manejo de acciones del usuario (posponer, descartar, abrir evento)
6. **Sincronización**: Guardado de estado y re-programación cuando sea necesario

## Estructura de Datos
```javascript
// Estructura de un recordatorio
const reminderExample = {
  id: 'reminder-123456',
  eventId: 'event-789',
  type: 'time-based', // 'time-based' o 'location-based'
  triggerTime: '2025-03-15T13:45:00Z', // Momento exacto de activación
  advance: {
    value: 15,
    unit: 'minutes' // 'minutes', 'hours', 'days'
  },
  status: 'pending', // 'pending', 'triggered', 'dismissed', 'snoozed'
  snoozeUntil: null, // Si está pospuesto, hora hasta la que se pospone
  createdAt: '2025-03-10T09:30:00Z',
  updatedAt: '2025-03-10T09:30:00Z',
  sound: 'chime', // Sonido a reproducir
  message: 'Personalizado', // Mensaje personalizado (opcional)
  repeats: false // Si el recordatorio se repite con el evento
};

// Preferencias de notificación
const preferencesExample = {
  enabled: true,
  defaultReminders: [
    { value: 10, unit: 'minutes' },
    { value: 1, unit: 'days' }
  ],
  sounds: {
    enabled: true,
    volume: 80, // 0-100
    selectedSound: 'chime'
  },
  desktop: {
    enabled: true,
    position: 'top-right'
  },
  browser: {
    enabled: true,
    requestPermissionOnStartup: true
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  }
};
```

## Guía de Uso para Desarrolladores
Para integrar con el plugin Reminder System:

1. Obtenga la API del módulo
   ```javascript
   const reminderSystem = getModule('reminder-system');
   if (!reminderSystem) {
     console.warn('Plugin Reminder System no disponible');
     return;
   }
   ```

2. Cree recordatorios para eventos
   ```javascript
   // Crear un recordatorio para un evento
   const newReminder = reminderSystem.createReminder({
     eventId: 'event-123',
     advance: {
       value: 30,
       unit: 'minutes'
     },
     sound: 'bell'
   });
   ```

3. Suscriba a eventos para reaccionar a activaciones
   ```javascript
   // Reaccionar a recordatorios activados
   subscribeToEvent('reminder-system.reminder_triggered', handleReminderTriggered);
   ```

4. Verifique y solicite permisos (para navegador web)
   ```javascript
   async function checkNotificationPermissions() {
     const prefs = reminderSystem.getNotificationPreferences();
     
     if (prefs.browser.enabled && 
         Notification.permission !== 'granted' && 
         Notification.permission !== 'denied') {
       try {
         await Notification.requestPermission();
       } catch (err) {
         console.error('Error al solicitar permisos de notificación:', err);
       }
     }
   }
   ```

## Ejemplos de Uso

### Ejemplo Básico: Añadir recordatorios predeterminados a un evento nuevo
```javascript
function addDefaultRemindersToEvent(eventId) {
  const reminderSystem = getModule('reminder-system');
  if (!reminderSystem) return;
  
  const preferences = reminderSystem.getNotificationPreferences();
  
  // Añadir cada recordatorio predeterminado
  preferences.defaultReminders.forEach(reminder => {
    reminderSystem.createReminder({
      eventId,
      advance: {
        value: reminder.value,
        unit: reminder.unit
      },
      sound: preferences.sounds.selectedSound
    });
  });
}
```

### Ejemplo Avanzado: Centro de notificaciones personalizado
```javascript
function NotificationCenter() {
  const [activeReminders, setActiveReminders] = useState([]);
  const reminderSystem = getModule('reminder-system');
  const calendar = getModule('calendar');
  
  useEffect(() => {
    if (!reminderSystem || !calendar) return;
    
    // Función para actualizar recordatorios activos
    const updateActiveReminders = () => {
      const reminders = reminderSystem.getActiveReminders();
      
      // Enriquecer con datos de evento
      const enhancedReminders = reminders.map(reminder => {
        const event = calendar.getEvent(reminder.eventId);
        return {
          ...reminder,
          event: event || { title: 'Evento no disponible' }
        };
      });
      
      setActiveReminders(enhancedReminders);
    };
    
    // Actualizar inicialmente
    updateActiveReminders();
    
    // Suscribirse a eventos relevantes
    const unsubscribes = [
      subscribeToEvent('reminder-system.reminder_triggered', updateActiveReminders),
      subscribeToEvent('reminder-system.reminder_snoozed', updateActiveReminders),
      subscribeToEvent('reminder-system.reminder_dismissed', updateActiveReminders),
      subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_UPDATED, updateActiveReminders)
    ];
    
    // Actualizar periódicamente (cada minuto)
    const interval = setInterval(updateActiveReminders, 60000);
    
    // Limpieza
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
      clearInterval(interval);
    };
  }, []);
  
  // Manejadores
  const handleSnooze = (reminderId, minutes) => {
    reminderSystem.snoozeReminder(reminderId, minutes);
  };
  
  const handleDismiss = (reminderId) => {
    reminderSystem.dismissReminder(reminderId);
  };
  
  const handleOpenEvent = (eventId) => {
    // Código para abrir el evento en el calendario
  };
  
  // Renderizar centro de notificaciones
  return (
    <div className="notification-center">
      <h3>Recordatorios ({activeReminders.length})</h3>
      
      {activeReminders.length === 0 ? (
        <p className="no-reminders">No hay recordatorios activos</p>
      ) : (
        <ul className="reminder-list">
          {activeReminders.map(reminder => (
            <li key={reminder.id} className="reminder-item">
              <div className="reminder-content">
                <h4>{reminder.event.title}</h4>
                <p className="reminder-time">
                  {formatDateTime(new Date(reminder.event.start))}
                </p>
                {reminder.message && (
                  <p className="reminder-message">{reminder.message}</p>
                )}
              </div>
              
              <div className="reminder-actions">
                <button onClick={() => handleOpenEvent(reminder.eventId)}>
                  Ver evento
                </button>
                <div className="snooze-actions">
                  <button onClick={() => handleSnooze(reminder.id, 5)}>
                    5m
                  </button>
                  <button onClick={() => handleSnooze(reminder.id, 15)}>
                    15m
                  </button>
                  <button onClick={() => handleSnooze(reminder.id, 60)}>
                    1h
                  </button>
                </div>
                <button onClick={() => handleDismiss(reminder.id)}>
                  Descartar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Dependencias
- **Notificaciones Web**: Usa la API de Notificaciones del navegador para la versión web
- **Notificaciones Nativas**: Usa las API de notificación de Electron para la versión de escritorio
- **Temporizadores**: Sistema personalizado de programación basado en tiempos
- **Calendario**: Integración profunda con el módulo de calendario para eventos
- **Almacenamiento**: Depende del `storage-service` de Atlas
- **Internacionalización**: Utiliza el servicio de i18n para traducciones

## Consideraciones de Rendimiento
- Uso del Servicio de Trabajadores (Worker) para verificación de recordatorios en segundo plano
- Algoritmo de verificación optimizado para evitar despertar innecesario
- Cálculo eficiente de próximos recordatorios durante tiempo de inactividad
- Agrupación de notificaciones para evitar sobrecargar al usuario
- Manejo inteligente de periodos sin conexión y recuperación

## Solución de Problemas Comunes
| Problema | Causa | Solución |
|----------|-------|----------|
| No se muestran notificaciones en navegador | Permisos no concedidos | Verificar permisos en configuración del navegador |
| Recordatorios retrasados | Suspensión del sistema o navegador | Usar "Modo de alta prioridad" en configuración |
| Sonidos no funcionan | Navegador silenciado o configuración | Verificar configuración de sonido del sistema |
| Recordatorios duplicados | Múltiples pestañas abiertas | Activar "Sincronización entre pestañas" |
| Notificaciones no aparecen en móvil | Limitaciones del navegador móvil | Instalar PWA para mejor experiencia |

## Historial de Versiones
| Versión | Cambios |
|---------|---------|
| 0.4.0   | Versión inicial con recordatorios básicos |
| 0.4.5   | Añadido soporte para navegadores móviles |
| 0.5.0   | Implementado sistema de sonidos personalizados |
| 0.6.0   | Añadidas notificaciones push para PWA (**disponibles cuando Atlas implemente PWA completo en v1.0.0**) |
| 1.0.0   | Soporte completo para internacionalización y accesibilidad |

**Nota sobre las fechas**: Los ejemplos y referencias a fechas en esta documentación son ilustrativos.