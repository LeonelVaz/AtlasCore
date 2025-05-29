# Plugin: Reminder System (Sistema de Recordatorios) - Visión Conceptual

## 1. Visión General

El plugin **Reminder System** para Atlas tiene como objetivo enriquecer la funcionalidad del calendario añadiendo un sistema avanzado y personalizable de recordatorios y notificaciones para los eventos. Esto permitiría a los usuarios recibir alertas oportunas sobre sus compromisos, mejorando la puntualidad y la preparación.

## 2. Funcionalidades Clave Propuestas

- **Recordatorios Múltiples por Evento:** Posibilidad de configurar varios recordatorios para un mismo evento (ej. 1 día antes, 1 hora antes, 15 minutos antes).
- **Tipos de Recordatorio:**
  - **Basados en Tiempo:** Recordatorios que se disparan un tiempo específico antes del inicio del evento.
  - **En el Momento del Evento:** Alerta justo cuando el evento comienza.
- **Métodos de Notificación:**
  - **Notificaciones Nativas del Sistema:** Utilizar las notificaciones de escritorio de Electron o las notificaciones web del navegador.
  - **(Potencial Futuro) Notificaciones In-App:** Un panel o centro de notificaciones dentro de Atlas.
  - **(Potencial Futuro) Sonidos de Alerta:** Sonidos personalizables para las notificaciones.
- **Opciones de Interacción con Notificaciones:**
  - **Posponer (Snooze):** Opción para posponer un recordatorio por un tiempo configurable.
  - **Descartar (Dismiss):** Marcar un recordatorio como visto o atendido.
  - **Abrir Evento:** Enlace directo desde la notificación al evento correspondiente en el calendario de Atlas.
- **Configuración de Recordatorios por Defecto:** Permitir al usuario establecer recordatorios predeterminados que se apliquen automáticamente a nuevos eventos.
- **Personalización por Evento:** Opción de anular los recordatorios por defecto y configurar alertas específicas para eventos individuales.
- **Gestión de Preferencias de Notificación:** Panel en la configuración de Atlas para controlar cómo y cuándo se reciben las notificaciones (ej. habilitar/deshabilitar sonidos, horas de no molestar).

## 3. Arquitectura Conceptual y Módulos

- **`index.js`:** Punto de entrada, registro y lógica principal del ciclo de vida del plugin.
- **Componentes UI (`components/`):**
  - `ReminderSettings.jsx`: Interfaz para que el usuario configure las preferencias generales de recordatorios y notificaciones (se integraría en el `SETTINGS_PANEL` de Atlas).
  - `ReminderForm.jsx` (o integrado en el formulario de eventos de Atlas): Sección dentro del formulario de creación/edición de eventos de Atlas para configurar recordatorios específicos para ese evento. Esto requeriría un punto de extensión en `EVENT_FORM`.
  - `(Potencial) NotificationPanel.jsx`: Si se implementa un centro de notificaciones in-app.
- **Servicios (`services/`):**
  - `SchedulerService.js`: Lógica central para programar cuándo deben dispararse los recordatorios. Interactuaría con temporizadores del sistema o mecanismos de programación de tareas en segundo plano (si Atlas lo permite).
  - `NotificationService.js`: Abstracción para manejar el envío de notificaciones a través de los diferentes mecanismos disponibles (Electron, Web Notifications API).
- **Utilidades (`utils/`):** Funciones para calcular tiempos de recordatorio, formatear mensajes, etc.
- **Estilos (`styles/`):** CSS para los componentes del plugin.
- **Localización (`locales/`):** Archivos de traducción.

## 4. Interacción con Atlas Core

- **Acceso a Eventos del Calendario:** Necesitaría leer los eventos del calendario (`coreAPI.getModule('calendar')`) para saber cuándo programar los recordatorios.
- **Suscripción a Eventos del Calendario:** Se suscribiría a `CalendarEvents.EVENT_CREATED`, `EVENT_UPDATED`, `EVENT_DELETED` para añadir, modificar o eliminar recordatorios asociados automáticamente.
- **Extensiones UI:**
  - Registraría una sección en el `SETTINGS_PANEL` de Atlas para `ReminderSettings.jsx`.
  - Extendería el `EVENT_FORM` de Atlas para permitir la configuración de recordatorios por evento.
  - Podría añadir pequeños indicadores visuales a los eventos en el calendario que tienen recordatorios configurados (usando `CALENDAR_DAY_HEADER` o `EVENT_DETAIL_VIEW`).
- **Almacenamiento:** Usaría `coreAPI.storage` para persistir la configuración de los recordatorios y las preferencias de notificación del usuario.
- **Notificaciones (Core API):** Si Atlas Core expone una API de notificaciones unificada (`coreAPI.notifications`), el plugin la utilizaría. De lo contrario, `NotificationService.js` manejaría la lógica de notificación específica de la plataforma.
- **Permisos:** Declararía la necesidad del permiso `notifications`.

## 5. API Pública y Eventos del Plugin (Conceptuales)

- **Métodos Públicos (ejemplos):**
  - `createReminderForEvent(eventId, reminderOptions)`
  - `getRemindersForEvent(eventId)`
  - `updateNotificationPreferences(preferences)`
- **Eventos Publicados (ejemplos):**
  - `reminder-system.reminderTriggered`: Cuando un recordatorio se activa.
  - `reminder-system.notificationPreferencesChanged`: Cuando el usuario cambia sus preferencias.

## 6. Consideraciones de Diseño y UX

- **No Intrusivo:** Las notificaciones deben ser útiles pero no abrumadoras. Las opciones de "no molestar" y la personalización de la frecuencia son importantes.
- **Claridad:** El usuario debe entender fácilmente cómo configurar recordatorios y qué esperar de ellos.
- **Fiabilidad:** El sistema de programación debe ser robusto para asegurar que los recordatorios se disparen en el momento correcto, incluso si la aplicación no está en primer plano (especialmente en la versión Electron).
- **Consistencia entre Plataformas:** La experiencia de notificación debería ser lo más similar posible entre la versión web y la de escritorio.

Este plugin añadiría una capa crucial de proactividad a Atlas, ayudando a los usuarios a no olvidar sus compromisos importantes.
